from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from uuid import UUID
import asyncpg
from decimal import Decimal

from app.core.database import get_master_db_pool
from app.api.v1.deps import get_current_admin
from app.models.module import ModuleResponse, TenantModuleResponse, TenantModuleUpdate

router = APIRouter()

@router.get("/modules", response_model=List[ModuleResponse])
async def list_available_modules(
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """List all available system modules."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM modules WHERE is_active = TRUE ORDER BY base_price ASC"
        )
        return [dict(row) for row in rows]

@router.get("/tenants/{tenant_id}/modules", response_model=List[TenantModuleResponse])
async def list_tenant_modules(
    tenant_id: UUID,
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """List modules active for a specific tenant."""
    async with pool.acquire() as conn:
        # Get ALL modules and join with tenant_modules to see status
        query = """
        SELECT 
            tm.id, tm.tenant_id, tm.status, tm.price_override, tm.enabled_at,
            m.module_id, m.code, m.name, m.description, m.base_price, m.is_active, m.created_at
        FROM modules m
        LEFT JOIN tenant_modules tm ON m.module_id = tm.module_id AND tm.tenant_id = $1
        WHERE m.is_active = TRUE
        ORDER BY m.base_price ASC
        """
        rows = await conn.fetch(query, tenant_id)
        
        # Transform flat result into nested response
        results = []
        for row in rows:
            module_data = {
                "module_id": row["module_id"],
                "code": row["code"],
                "name": row["name"],
                "description": row["description"],
                "base_price": row["base_price"],
                "is_active": row["is_active"],
                "created_at": row["created_at"]
            }
            results.append({
                "id": row["id"] or row["module_id"], # Use module_id as fallback ID if not enabled
                "tenant_id": row["tenant_id"] or tenant_id,
                "status": row["status"] or 'disabled',
                "price_override": row["price_override"],
                "enabled_at": row["enabled_at"],
                "module": module_data
            })
            
        return results

@router.post("/tenants/{tenant_id}/modules", response_model=dict)
async def toggle_tenant_module(
    tenant_id: UUID,
    update_data: TenantModuleUpdate,
    admin_id: UUID = Depends(get_current_admin),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """Enable or disable a module for a tenant."""
    async with pool.acquire() as conn:
        if update_data.is_enabled:
            # Upsert logic to enable module
            query = """
            INSERT INTO tenant_modules (tenant_id, module_id, status, price_override)
            VALUES ($1, $2, 'active', $3)
            ON CONFLICT (tenant_id, module_id) 
            DO UPDATE SET status = 'active', price_override = COALESCE($3, tenant_modules.price_override);
            """
            await conn.execute(query, tenant_id, update_data.module_id, update_data.price_override)
            message = "Module enabled"
        else:
            # Soft disable
            query = """
            UPDATE tenant_modules 
            SET status = 'disabled'
            WHERE tenant_id = $1 AND module_id = $2
            """
            await conn.execute(query, tenant_id, update_data.module_id)
            message = "Module disabled"
            
    return {"message": message, "tenant_id": tenant_id, "module_id": update_data.module_id}
