from datetime import timedelta, datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.core.rate_limit import limiter
from uuid import UUID
import asyncpg
import secrets

from app.core.database import get_master_db_pool
from app.core.security import SecurityService
from app.core.config import settings
from app.services.email_service import send_password_recovery_otp
from pydantic import BaseModel, EmailStr

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: str
    user_id: UUID
    tenant_id: str | None = None

@router.post("/login/access-token", response_model=Token)
@limiter.limit("5/minute")
async def login_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
) -> Any:
    """
    OAuth2 compatible token login, get an access_token for future requests.
    Checks admin_users first, then tenant_users.
    """
    async with pool.acquire() as conn:
        await conn.execute("SET search_path TO public")
        # 1. Check Super Admin (admin_users)
        admin = await conn.fetchrow(
            """
            SELECT user_id, password_hash, role
            FROM admin_users
            WHERE email = $1
            """,
            form_data.username
        )

        user_id = None
        role = None
        tenant_id = None

        if admin:
            if not SecurityService.verify_password(form_data.password, admin['password_hash']):
                raise HTTPException(status_code=400, detail="Incorrect email or password")
            user_id = admin['user_id']
            role = admin['role']
        else:
            # 2. Check Tenant User (tenant_users)
            # form_data.username must be unique enough. 
            # If same email exists in multiple schools, this simple login flow is ambiguous.
            # But our schema says UNIQUE(email, tenant_id). So email CAN represent multiple users.
            # Solution: User must provide tenant_id? Or we fail if multiple found?
            # For now, let's assume unique email across system OR pick the first one?
            # Better: Login requires tenant info? 
            # Or just check if exactly one match.
            
            users = await conn.fetch(
                """
                SELECT user_id, password_hash, role, tenant_id
                FROM tenant_users
                WHERE email = $1 AND is_active = TRUE
                """,
                form_data.username
            )

            if not users:
                raise HTTPException(status_code=400, detail="Incorrect email or password")
            
            if len(users) > 1:
                 raise HTTPException(status_code=400, detail="Email associated with multiple schools. Use school-specific login.")
            
            user = users[0]
            if not SecurityService.verify_password(form_data.password, user['password_hash']):
                raise HTTPException(status_code=400, detail="Incorrect email or password")
            
            user_id = user['user_id']
            role = user['role']
            tenant_id = user['tenant_id']

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Subject is user_id. We might want to encode role too.
    # SecurityService.create_access_token expects subject as string.
    # We can put a JSON string as subject if we want more info, OR use the `sub` claim for ID only.
    # Let's use ID only for standard `sub`, but we might need a custom dependency to fetch user.
    access_token = SecurityService.create_access_token(
        subject=user_id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_role": role,
        "user_id": user_id,
        "tenant_id": str(tenant_id) if tenant_id else None
    }

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    request_data: ForgotPasswordRequest,
    pool: asyncpg.Pool = Depends(get_master_db_pool)
) -> Any:
    """
    Generate 6-digit OTP and send recovery email.
    """
    otp = f"{secrets.randbelow(1000000):06d}"
    expiry = datetime.now() + timedelta(minutes=15)
    
    async with pool.acquire() as conn:
        await conn.execute("SET search_path TO public")
        # Check admin first
        user = await conn.fetchrow("SELECT user_id, full_name, 'admin' as type FROM admin_users WHERE email = $1", request_data.email)
        table = "admin_users"
        
        if not user:
            # Check tenant user
            user = await conn.fetchrow("SELECT user_id, full_name, 'tenant' as type FROM tenant_users WHERE email = $1", request_data.email)
            table = "tenant_users"
        
        if not user:
            # For security, don't reveal if user exists. 
            # But the user specifically asked for this, so we'll just say email sent if found.
            return {"message": "If this email is registered, you will receive a 6-digit code."}
        
        # Update OTP and expiry
        await conn.execute(
            f"UPDATE {table} SET reset_token = $1, reset_token_expiry = $2 WHERE user_id = $3",
            otp, expiry, user['user_id']
        )
        
        # Send email
        await send_password_recovery_otp(
            email_to=request_data.email,
            user_name=user['full_name'] or "User",
            otp=otp
        )
        
    return {"message": "Verification code sent to your email."}

@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    request_data: ResetPasswordRequest,
    pool: asyncpg.Pool = Depends(get_master_db_pool)
) -> Any:
    """
    Verify OTP and update password.
    """
    async with pool.acquire() as conn:
        # Check admin first
        user = await conn.fetchrow(
            "SELECT user_id, reset_token, reset_token_expiry, 'admin' as type FROM admin_users WHERE email = $1", 
            request_data.email
        )
        table = "admin_users"
        
        if not user:
            user = await conn.fetchrow(
                "SELECT user_id, reset_token, reset_token_expiry, 'tenant' as type FROM tenant_users WHERE email = $1", 
                request_data.email
            )
            table = "tenant_users"
            
        if not user or user['reset_token'] != request_data.otp:
            raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
            
        if user['reset_token_expiry'] < datetime.now():
            raise HTTPException(status_code=400, detail="Verification code has expired.")
            
        # Update password and clear token
        new_hash = SecurityService.get_password_hash(request_data.new_password)
        await conn.execute(
            f"UPDATE {table} SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2",
            new_hash, user['user_id']
        )
        
    return {"message": "Password updated successfully."}
