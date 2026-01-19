from typing import Optional
import asyncpg
from contextlib import asynccontextmanager
from fastapi import Request, HTTPException
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Master database connection pool
_master_pool: Optional[asyncpg.Pool] = None

async def get_master_db_pool() -> asyncpg.Pool:
    """Get or create the master database connection pool."""
    global _master_pool
    if _master_pool is None:
        _master_pool = await asyncpg.create_pool(
            settings.DATABASE_URL,  # Uses smart fallback
            min_size=5,
            max_size=20,
            command_timeout=60
        )
        logger.info(f"Master database pool created: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'local'}")
    return _master_pool

async def close_master_db_pool():
    """Close the master database connection pool."""
    global _master_pool
    if _master_pool:
        await _master_pool.close()
        _master_pool = None
        logger.info("Master database pool closed")

class TenantDatabaseFactory:
    """
    Factory for creating per-tenant database connections.
    Each tenant gets an isolated Supabase client instance.
    """
    
    # In-memory connection pool per tenant (in production, use a more sophisticated approach)
    _tenant_pools = {}

    @classmethod
    async def get_tenant_db(cls, request: Request):
        """
        FastAPI dependency to get tenant-specific database client.
        Usage: db = Depends(TenantDatabaseFactory.get_tenant_db)
        """
        if not hasattr(request.state, "tenant_config"):
            raise HTTPException(
                status_code=500,
                detail="Tenant context not set. Ensure TenantMiddleware is active."
            )

        tenant_config = request.state.tenant_config
        tenant_id = str(tenant_config.tenant_id)

        # Get or create connection pool for this tenant
        if tenant_id not in cls._tenant_pools:
            logger.info(f"Creating new database pool for tenant {tenant_id}")
            
            url = tenant_config.supabase_url
            
            # SCHEMA-BASED ISOLATION: Check for special schema URL
            if url.startswith("shared_database_schema:"):
                schema_name = url.split(":")[1]
                logger.info(f"Using shared database schema: {schema_name}")
                
                # For schema-based isolation, we use the master pool
                # but we need a way to set the search path.
                # Since pools are shared, we'll create a new pool with init set to search_path
                # OR we just reuse the master pool and set search_path on connection (better)
                
                try:
                    pool = await asyncpg.create_pool(
                        settings.DATABASE_URL,
                        min_size=2,
                        max_size=10,
                        command_timeout=30,
                        init=lambda conn: conn.execute(f"SET search_path TO {schema_name}, public")
                    )
                    cls._tenant_pools[tenant_id] = pool
                except Exception as e:
                    logger.error(f"Failed to create schema pool for tenant {tenant_id}: {str(e)}")
                    raise HTTPException(status_code=503, detail="Database connection failed")
            else:
                try:
                    pool = await asyncpg.create_pool(
                        url,
                        min_size=2,
                        max_size=10,
                        command_timeout=30
                    )
                    cls._tenant_pools[tenant_id] = pool
                except Exception as e:
                    logger.error(f"Failed to create pool for tenant {tenant_id}: {str(e)}")
                    raise HTTPException(status_code=503, detail="Database connection failed")

        return cls._tenant_pools[tenant_id]

    @classmethod
    async def close_all_tenant_pools(cls):
        """Close all tenant database pools."""
        for tenant_id, pool in cls._tenant_pools.items():
            await pool.close()
            logger.info(f"Closed pool for tenant {tenant_id}")
        cls._tenant_pools.clear()

@asynccontextmanager
async def get_tenant_connection(request: Request):
    """
    Context manager for explicit connection lifecycle control.
    
    Usage:
        async with get_tenant_connection(request) as conn:
            result = await conn.fetch("SELECT * FROM students")
    """
    pool = await TenantDatabaseFactory.get_tenant_db(request)
    async with pool.acquire() as connection:
        yield connection
