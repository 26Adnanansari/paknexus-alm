from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from uuid import UUID
import asyncpg

from app.core.config import settings
from app.core.security import SecurityService
from app.core.database import get_master_db_pool

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token"
)

async def get_current_user_id(
    token: str = Depends(oauth2_scheme)
) -> UUID:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return UUID(user_id)
    except (JWTError, ValidationError, ValueError) as e:
        import logging
        logging.getLogger("app.deps").warning(f"Token validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_admin(
    user_id: UUID = Depends(get_current_user_id),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
) -> UUID:
    async with pool.acquire() as conn:
        admin = await conn.fetchrow(
            "SELECT user_id, email, role FROM admin_users WHERE user_id = $1 AND is_active = TRUE",
            user_id
        )
        if not admin:
            import logging
            logging.getLogger("app.deps").error(f"Admin user not found for ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin user not found",
            )
        if admin["role"] not in ["admin", "super_admin"]:
            import logging
            logging.getLogger("app.deps").error(f"User {user_id} ({admin['email']}) has insufficient role: {admin['role']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user does not have enough privileges",
            )
        return admin["user_id"]

from datetime import datetime, timezone

async def get_current_school_user(
    user_id: UUID = Depends(get_current_user_id),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
) -> dict:
    async with pool.acquire() as conn:
        # CRITICAL: Ensure we're querying the public schema for master tables
        await conn.execute("SET search_path TO public")
        
        # Fetch user AND tenant status
        user = await conn.fetchrow("""
            SELECT 
                u.user_id, u.tenant_id, u.email, u.role,
                t.status as tenant_status, t.subscription_expiry
            FROM tenant_users u
            JOIN tenants t ON u.tenant_id = t.tenant_id
            WHERE u.user_id = $1 AND u.is_active = TRUE
        """, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School user not found",
            )
            
        # Security Check: Tenant Status
        tenant_status = user['tenant_status']
        expiry = user['subscription_expiry']
        
        if tenant_status in ['suspended', 'churned', 'locked']:
             raise HTTPException(
                 status_code=status.HTTP_403_FORBIDDEN,
                 detail=f"School account is {tenant_status}. Please contact support."
             )
             
        # Security Check: Trial Expiry
        # We allow 'active' users even if expiry is past (grace period logic usually handles this, 
        # but for strict trial enforcement we check trial specifically)
        if tenant_status == 'trial' and expiry:
            now = datetime.now(timezone.utc)
            if now > expiry:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED, # 402 is appropriate for payment
                    detail="Trial period has expired. Please upgrade your plan to continue."
                )

        return dict(user)

from app.core.database import TenantDatabaseFactory

async def get_tenant_db_pool(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
) -> asyncpg.Pool:
    """
    Get connection pool for the authenticated tenant.
    """
    tenant_id = str(current_user["tenant_id"])
    
    # Return existing pool if available
    if tenant_id in TenantDatabaseFactory._tenant_pools:
        return TenantDatabaseFactory._tenant_pools[tenant_id]

    # Fetch tenant DB config
    async with pool.acquire() as conn:
        tenant = await conn.fetchrow(
            "SELECT supabase_url FROM tenants WHERE tenant_id = $1",
            current_user["tenant_id"]
        )
        if not tenant or not tenant["supabase_url"]:
             raise HTTPException(
                 status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                 detail="Tenant database configuration missing"
             )
        
        db_url = tenant["supabase_url"]
        
        try:
             # Define setup callback to enforce schema isolation on every new connection in the pool
             async def init_tenant_connection(conn):
                 # Derive schema name from tenant_id: tenant_UUIDNODASHES
                 schema_name = f"tenant_{tenant_id.replace('-', '')}"
                 # We assume the schema exists (created by init script/migration)
                 await conn.execute(f'SET search_path TO "{schema_name}";')

             # Basic pool creation - assuming full connection string is stored
             new_pool = await asyncpg.create_pool(
                 db_url, 
                 min_size=2, 
                 max_size=10, 
                 command_timeout=30,
                 setup=init_tenant_connection
             )
             TenantDatabaseFactory._tenant_pools[tenant_id] = new_pool
             return new_pool
        except Exception as e:
             import logging
             logging.getLogger("app.deps").error(f"Failed to connect to tenant DB {tenant_id}: {e}")
             raise HTTPException(
                 status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                 detail="Could not connect to tenant database"
             )
