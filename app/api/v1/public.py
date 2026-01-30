from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_master_db_pool
from app.core.security import SecurityService
import asyncpg
from pydantic import BaseModel, EmailStr, Field
import re

router = APIRouter()

class TenantRegistrationRequest(BaseModel):
    school_name: str
    subdomain: str = Field(..., min_length=3, max_length=63)
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8)
    contact_phone: str | None = None

    def validate_subdomain(self):
        if not re.match("^[a-z0-9-]+$", self.subdomain):
            raise ValueError("Subdomain must contain only lowercase letters, numbers, and hyphens")
        return self.subdomain

@router.post("/register", status_code=201)
async def register_tenant(
    data: TenantRegistrationRequest,
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Public endpoint for Schools to register for a trial.
    Creates a tenant record (Trial) and a Tenant Admin user.
    """
    # Validate subdomain format
    if not re.match("^[a-z0-9-]+$", data.subdomain):
        raise HTTPException(status_code=400, detail="Subdomain must contain only lowercase letters, numbers, and hyphens")

    async with pool.acquire() as conn:
        await conn.execute("SET search_path TO public")
        # Check if subdomain exists
        exists = await conn.fetchval("SELECT 1 FROM tenants WHERE subdomain = $1", data.subdomain)
        if exists:
            raise HTTPException(status_code=400, detail="Subdomain already taken")
        
        # Check if email exists (globally unique for simplicity, though schema allows per-tenant)
        # For a new signup, we generally want fresh emails or explicit linking.
        # Let's check if this email is already a 'tenant_users' admin for ANY tenant.
        exists_email = await conn.fetchval("SELECT 1 FROM tenant_users WHERE email = $1", data.admin_email)
        if exists_email:
             # In a real app we might allow multi-tenant users, but for now simplify.
             # Or just allow it? If we allow it, they will have multiple entries in tenant_users.
             # Let's allow it but warn or handle. For now, strict:
             pass 
             # Actually, let's NOT block email reuse across tenants, but for the *same* tenant it's blocked by DB constraint.
        
        try:
            async with conn.transaction():
                # 1. Create Tenant (Trial)
                # We use a placeholder for supabase credentials since we are in a shared DB or unprovisioned state
                tenant_id = await conn.fetchval("""
                    INSERT INTO tenants (
                        name, subdomain, contact_email, contact_phone, 
                        status, subscription_expiry, 
                        supabase_project_url, supabase_service_key
                    )
                    VALUES ($1, $2, $3, $4, 'trial', NOW() + INTERVAL '14 days', 'pending_provision', 'pending_key')
                    RETURNING tenant_id
                """, data.school_name, data.subdomain, data.admin_email, data.contact_phone)

                # 2. Create Admin User for this Tenant
                password_hash = SecurityService.get_password_hash(data.admin_password)
                await conn.execute("""
                    INSERT INTO tenant_users (tenant_id, email, password_hash, full_name, role, is_active)
                    VALUES ($1, $2, $3, $4, 'admin', TRUE)
                """, tenant_id, data.admin_email, password_hash, "School Admin")

                return {
                    "message": "Registration successful. Welcome to PakAi Nexus!",
                    "tenant_id": str(tenant_id),
                    "subdomain": data.subdomain,
                    "status": "trial"
                }

        except Exception as e:
            # unique constraint violations etc
            raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")
@router.get("/branding", response_model=dict)
async def get_public_branding(
    domain: str,
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Fetch public branding info (logo, colors, name) by domain/subdomain.
    Used by landing pages and login screens.
    """
    # Simple logic: if domain ends with configured base domain, extract subdomain
    # For now, let's assume 'subdomain' is passed or we assume it's the full domain if custom.
    # Actually, let's just lookup by subdomain OR custom domain.
    
    # Extract subdomain for standard tenants: school.paknexus-alm.vercel.app -> school
    # For localhost, we might need a header or assume a default for dev?
    
    # Let's try to find exact match on 'subdomain' column first (assuming 'domain' param IS the subdomain)
    # OR match 'website' or custom domain logic.
    
    subdomain = domain
    if "." in domain:
         # simplistic extraction: school.pakai... -> school
         # But if it's localhost, it's just 'localhost'.
         subdomain = domain.split(".")[0]

    async with pool.acquire() as conn:
        await conn.execute("SET search_path TO public")
        # Try finding by subdomain first
        tenant = await conn.fetchrow(
            """
            SELECT name, logo_url, primary_color, secondary_color, website, address 
            FROM tenants 
            WHERE subdomain = $1
            """, 
            subdomain
        )
        
        # If not found, maybe they passed the full host?
        if not tenant:
             tenant = await conn.fetchrow(
                """
                SELECT name, logo_url, primary_color, secondary_color, website, address 
                FROM tenants 
                WHERE subdomain = $1
                """, 
                domain # try exact match just in case
            )
            
        if not tenant:
            # Fallback for localhost dev if not found - return default/mock?
            # Or 404. Let's return 404 so frontend can handle or show default.
            raise HTTPException(status_code=404, detail="School not found")

        return dict(tenant)

@router.get("/sys-repair-master-999")
async def trigger_manual_repair(
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Emergency endpoint to trigger schema repair if system is broken.
    """
    from app.db.repair import fix_master_schema
    await fix_master_schema(pool)
    return {"status": "Repair executed"}

