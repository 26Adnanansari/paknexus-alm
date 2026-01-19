from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import asyncpg

from app.core.database import get_master_db_pool
from app.services.provisioning import TenantProvisioningService
from app.services.subscription import SubscriptionStateMachine
from app.services.payment import PaymentService
from app.models.tenant import TenantCreate, TenantResponse, TenantUpdate
from app.models.payment import PaymentRecordRequest, SubscriptionExtensionRequest
from app.api.v1.deps import get_current_admin
import json

router = APIRouter()

# ============================================================================
# TENANT MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/tenants", response_model=dict)
async def list_tenants(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|name|subscription_expiry)$"),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    List all tenants with pagination, filtering, and sorting.
    """
    offset = (page - 1) * per_page
    
    # Build query
    where_clauses = []
    params = []
    param_count = 1
    
    if status:
        where_clauses.append(f"status = ${param_count}")
        params.append(status)
        param_count += 1
    
    if search:
        where_clauses.append(f"(name ILIKE ${param_count} OR contact_email ILIKE ${param_count})")
        params.append(f"%{search}%")
        param_count += 1
    
    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    
    async with pool.acquire() as conn:
        # Get total count
        total = await conn.fetchval(
            f"SELECT COUNT(*) FROM tenants {where_sql}",
            *params
        )
        
        # Get paginated results
        rows = await conn.fetch(
            f"""
            SELECT 
                tenant_id, name, subdomain, contact_email, status, 
                subscription_expiry, created_at,
                EXTRACT(DAY FROM (subscription_expiry - NOW())) AS days_remaining
            FROM tenants
            {where_sql}
            ORDER BY {sort_by} DESC
            LIMIT ${param_count} OFFSET ${param_count + 1}
            """,
            *params, per_page, offset
        )
        
        # Get aggregate stats
        stats = await conn.fetchrow(
            """
            SELECT 
                COUNT(*) FILTER (WHERE status = 'active') AS total_active,
                COUNT(*) FILTER (WHERE status = 'trial') AS total_trial,
                COUNT(*) FILTER (WHERE status = 'locked') AS total_locked,
                COUNT(*) FILTER (WHERE status = 'grace') AS total_grace
            FROM tenants
            """
        )
    
    return {
        "tenants": [dict(row) for row in rows],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page
        },
        "stats": dict(stats)
    }

@router.get("/tenants/{tenant_id}", response_model=dict)
async def get_tenant_details(
    tenant_id: UUID,
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Get detailed information about a specific tenant.
    """
    async with pool.acquire() as conn:
        # Get tenant info
        tenant = await conn.fetchrow(
            """
            SELECT 
                tenant_id, name, subdomain, contact_email, contact_phone,
                status, trial_start, subscription_expiry,
                last_payment_date, payment_method, created_at, updated_at
            FROM tenants
            WHERE tenant_id = $1
            """,
            tenant_id
        )
        
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Get subscription history (audit logs)
        history = await conn.fetch(
            """
            SELECT action, details, created_at, actor_id
            FROM audit_logs
            WHERE tenant_id = $1
            ORDER BY created_at DESC
            LIMIT 50
            """,
            tenant_id
        )
        
        return {
            "tenant": dict(tenant),
            "subscription_history": [dict(row) for row in history]
        }

@router.post("/tenants", response_model=TenantResponse)
async def create_tenant(
    tenant_data: TenantCreate,
    auto_create_db: bool = Query(False),
    admin_id: UUID = Depends(get_current_admin),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Provision a new tenant using shared database.
    All tenants share the same database, isolated by tenant_id.
    """
    # For shared database model, we use a placeholder URL
    if not tenant_data.supabase_url_raw or tenant_data.supabase_url_raw == 'shared_database':
        # Use the master database URL for shared tenants
        tenant_data.supabase_url_raw = 'shared_database'
    
    provisioning_service = TenantProvisioningService(pool)
    return await provisioning_service.provision_tenant(tenant_data, admin_id, auto_create_db)

@router.put("/tenants/{tenant_id}/extend", response_model=dict)
async def extend_subscription(
    tenant_id: UUID,
    extension_data: SubscriptionExtensionRequest,
    admin_id: UUID = Depends(get_current_admin),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Manually extend a tenant's subscription.
    """
    state_machine = SubscriptionStateMachine(pool)
    return await state_machine.extend_subscription(
        tenant_id,
        admin_id,
        extension_data.extension_days,
        extension_data.payment_reference,
        extension_data.amount,
        extension_data.notes
    )

@router.put("/tenants/{tenant_id}/status", response_model=dict)
async def change_tenant_status(
    tenant_id: UUID,
    action: str = Query(..., regex="^(suspend|unsuspend|lock|unlock|churn)$"),
    reason: Optional[str] = None,
    admin_id: UUID = Depends(get_current_admin),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Change tenant status (suspend/unsuspend/lock/unlock/churn).
    """
    state_machine = SubscriptionStateMachine(pool)
    
    if action == "suspend":
        if not reason:
            raise HTTPException(status_code=400, detail="Reason required for suspension")
        return await state_machine.suspend_tenant(tenant_id, admin_id, reason)
    
    elif action == "churn":
        return await state_machine.churn_tenant(tenant_id, admin_id, reason)
    
    else:
        raise HTTPException(status_code=400, detail=f"Action {action} not implemented")

@router.put("/tenants/{tenant_id}/activate", response_model=dict)
async def activate_tenant(
    tenant_id: UUID,
    payment_ref: str = Query(..., description="Manual payment reference"),
    notes: Optional[str] = None,
    admin_id: UUID = Depends(get_current_admin),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Activate a trial tenant manually.
    """
    state_machine = SubscriptionStateMachine(pool)
    return await state_machine.transition_to_active(
        tenant_id, admin_id, payment_ref, notes
    )

@router.patch("/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: UUID,
    tenant_update: TenantUpdate,
    admin_id: UUID = Depends(get_current_admin),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Update tenant details (Branding, Name, Contact).
    """
    async with pool.acquire() as conn:
        # Check if tenant exists
        tenant = await conn.fetchrow("SELECT tenant_id FROM tenants WHERE tenant_id = $1", tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Build update query dynamically
        update_fields = []
        values = []
        param_count = 1
        
        update_data = tenant_update.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            update_fields.append(f"{key} = ${param_count}")
            values.append(value)
            param_count += 1
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        # Add updated_at
        update_fields.append(f"updated_at = NOW()")
        values.append(tenant_id) # Add tenant_id as the last parameter
        
        query = f"""
            UPDATE tenants 
            SET {", ".join(update_fields)}
            WHERE tenant_id = ${param_count}
            RETURNING *
        """
        
        updated_tenant = await conn.fetchrow(query, *values)
        
        # Log action
        await conn.execute(
            """
            INSERT INTO audit_logs (tenant_id, actor_id, action, details)
            VALUES ($1, $2, 'UPDATE_TENANT', $3)
            """,
            tenant_id, admin_id, json.dumps(update_data, default=str)
        )
        
        # Fetch subscription history to satisfy response model (if needed, or clean up response model)
        # Actually TenantResponse extends TenantBase and includes other fields. 
        # The RETURNING * gives us the updated fields.
        
        return dict(updated_tenant)

# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/analytics/revenue", response_model=dict)
async def get_revenue_analytics(
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Get revenue analytics and projections.
    """
    async with pool.acquire() as conn:
        # Monthly recurring revenue (simplified calculation)
        mrr = await conn.fetchval(
            """
            SELECT COUNT(*) * 100 
            FROM tenants 
            WHERE status IN ('active', 'grace')
            """
        )
        
        # Churn rate (last 30 days)
        churn_count = await conn.fetchval(
            """
            SELECT COUNT(*) 
            FROM tenants 
            WHERE status = 'churned' 
            AND updated_at > NOW() - INTERVAL '30 days'
            """
        )
        
        total_tenants = await conn.fetchval("SELECT COUNT(*) FROM tenants")
        churn_rate = (churn_count / total_tenants * 100) if total_tenants > 0 else 0
        
        return {
            "mrr": mrr,
            "churn_rate": round(churn_rate, 2),
            "total_tenants": total_tenants,
            "active_tenants": await conn.fetchval(
                "SELECT COUNT(*) FROM tenants WHERE status = 'active'"
            )
        }

@router.get("/analytics/usage", response_model=dict)
async def get_usage_analytics(
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Get tenant usage and engagement metrics.
    """
    # TODO: Implement actual usage tracking
    return {
        "message": "Usage analytics not yet implemented"
    }

# ============================================================================
# BULK OPERATIONS
# ============================================================================

@router.post("/bulk/extend", response_model=dict)
async def bulk_extend_subscriptions(
    tenant_ids: List[UUID],
    extension_days: int,
    admin_id: UUID = Depends(get_current_admin),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """
    Bulk extend subscriptions for multiple tenants.
    """
    state_machine = SubscriptionStateMachine(pool)
    results = {"success": [], "failed": []}
    
    for tenant_id in tenant_ids:
        try:
            await state_machine.extend_subscription(
                tenant_id,
                admin_id,
                extension_days,
                f"BULK_EXTEND_{datetime.now().isoformat()}",
                0.0,  # Amount not tracked for bulk operations
                "Bulk extension"
            )
            results["success"].append(str(tenant_id))
        except Exception as e:
            results["failed"].append({"tenant_id": str(tenant_id), "error": str(e)})
    
    return results
@router.get("/settings", response_model=dict)
async def get_system_settings(
    admin_id: UUID = Depends(get_current_admin)
):
    """
    Get global system configuration settings.
    Only accessible to super admins.
    """
    from app.core.config import settings
    return {
        "app_name": settings.PROJECT_NAME,
        "app_domain": settings.APP_DOMAIN,
        "cors_origins": settings.CORS_ORIGINS,
        "api_v1_str": settings.API_V1_STR,
        "smtp": {
            "host": settings.SMTP_HOST,
            "port": settings.SMTP_PORT,
            "sender": settings.EMAILS_FROM_EMAIL
        }
    }
