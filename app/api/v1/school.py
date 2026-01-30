from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional
from uuid import UUID
import asyncpg
import json

from app.core.database import get_master_db_pool
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool
from app.core.security import SecurityService

router = APIRouter()

@router.get("/profile", response_model=dict)
async def get_school_profile(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """Get the current school's profile and branding settings."""
    tenant_id = current_user["tenant_id"]
    
    async with pool.acquire() as conn:
        await conn.execute("SET search_path TO public")
        tenant = await conn.fetchrow(
            """
            SELECT 
                tenant_id, name, contact_email, contact_phone,
                logo_url, primary_color, secondary_color, 
                website, address
            FROM tenants
            WHERE tenant_id = $1
            """,
            tenant_id
        )
        
        if not tenant:
            raise HTTPException(status_code=404, detail="School not found")
            
        return dict(tenant)

@router.get("/stats", response_model=dict)
async def get_school_stats(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)  # Use Tenant DB Pool
):
    """Get dashboard statistics (Student count, Teacher count, Storage usage)."""
    try:
        async with pool.acquire() as conn:
            # Check if students table exists
            exists = await conn.fetchval("SELECT to_regclass('students')")
            if not exists:
                return {
                    "students": 0,
                    "teachers": 0,
                    "storage_mb": 0,
                    "student_limit": 500,
                    "teacher_limit": 50,
                    "storage_limit_mb": 1024
                }

            # Count Students (from tenant 'students' table)
            student_count = await conn.fetchval(
                "SELECT COUNT(*) FROM students WHERE status = 'active'"
            )
            
            # Count Teachers (from tenant 'staff' table)
            teacher_count = await conn.fetchval(
                "SELECT COUNT(*) FROM staff WHERE role = 'teacher' AND is_active = TRUE"
            )
            
            # Storage usage (Mock for now or calculate from uploads if we track them)
            storage_used_mb = 120 # Mock
            
        return {
            "students": student_count,
            "teachers": teacher_count,
            "storage_mb": storage_used_mb,
            "student_limit": 500, 
            "teacher_limit": 50,
            "storage_limit_mb": 1024
        }
    except Exception as e:
        print(f"School Stats Error: {e}")
        # Return fallback stats instead of 500 to prevent frontend crash
        return {
            "students": 0,
            "teachers": 0,
            "storage_mb": 0,
            "student_limit": 500,
            "teacher_limit": 50,
            "storage_limit_mb": 1024,
            "error": str(e)
        }

@router.patch("/branding", response_model=dict)
async def update_branding(
    update_data: dict,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """Update school branding (logo URL, colors, website, etc)."""
    tenant_id = current_user["tenant_id"]
    
    # Allowed fields for branding update
    allowed_fields = [
        "logo_url", "primary_color", "secondary_color", 
        "website", "address", "name"
    ]
    
    update_fields = []
    values = []
    param_count = 1
    
    for key, value in update_data.items():
        if key in allowed_fields:
            update_fields.append(f"{key} = ${param_count}")
            values.append(value)
            param_count += 1
            
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields provided")
        
    values.append(tenant_id)
    
    async with pool.acquire() as conn:
        await conn.execute("SET search_path TO public")
        query = f"""
            UPDATE tenants 
            SET {", ".join(update_fields)}, updated_at = NOW()
            WHERE tenant_id = ${param_count}
            RETURNING *
        """
        updated_tenant = await conn.fetchrow(query, *values)
        return dict(updated_tenant)

@router.post("/id-card/template", response_model=dict)
async def upload_id_card_template(
    template_data: dict,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Save ID card template configuration (background images and field positions).
    Expects: { "front_bg_url": "...", "back_bg_url": "...", "field_positions": {...} }
    """
    tenant_id = current_user["tenant_id"]
    
    async with pool.acquire() as conn:
        await conn.execute("SET search_path TO public")
        # Check if table exists (it's in master_schema)
        # Actually, let's store it in a JSONB column in tenants or a specialized table.
        # Based on my plan, I wanted an id_card_templates table.
        
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS id_card_templates (
                template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
                front_bg_url TEXT,
                back_bg_url TEXT,
                field_positions JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(tenant_id)
            )
            """
        )
        
        res = await conn.execute(
            """
            INSERT INTO id_card_templates (tenant_id, front_bg_url, back_bg_url, field_positions)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (tenant_id) DO UPDATE SET
                front_bg_url = $2,
                back_bg_url = $3,
                field_positions = $4
            """,
            tenant_id,
            template_data.get("front_bg_url"),
            template_data.get("back_bg_url"),
            json.dumps(template_data.get("field_positions", {}))
        )
        
        return {"message": "ID card template updated successfully"}

@router.get("/id-card/template", response_model=dict)
async def get_id_card_template(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """Fetch the school's ID card template."""
    tenant_id = current_user["tenant_id"]
    
    async with pool.acquire() as conn:
        await conn.execute("SET search_path TO public")
        template = await conn.fetchrow(
            "SELECT * FROM id_card_templates WHERE tenant_id = $1",
            tenant_id
        )
        if not template:
            return {"message": "No template found", "front_bg_url": None, "back_bg_url": None, "field_positions": {}}
        return dict(template)
