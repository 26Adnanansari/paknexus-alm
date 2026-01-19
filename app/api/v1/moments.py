from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.moments import Moment, MomentCreate, MomentUpdate

router = APIRouter()

@router.post("/", response_model=Moment)
async def create_moment(
    moment: MomentCreate,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Create a new social moment.
    """
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant context required")

    async with db.acquire() as conn:
        # Check if one already exists for this order if order_id is provided
        if moment.order_id:
            existing = await conn.fetchval(
                "SELECT id FROM order_moments WHERE tenant_id = $1 AND order_id = $2",
                UUID(tenant_id), moment.order_id
            )
            if existing:
                raise HTTPException(status_code=400, detail="Moment already exists for this order")

        row = await conn.fetchrow(
            """
            INSERT INTO order_moments (tenant_id, order_id, image_url, caption, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            """,
            UUID(tenant_id), moment.order_id, moment.image_url, moment.caption, moment.status
        )
        return Moment(**dict(row))

@router.get("/by-order/{order_id}", response_model=Optional[Moment])
async def get_moment_by_order(
    order_id: UUID,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get the moment associated with a specific order."""
    tenant_id = current_user.get("tenant_id")
    
    row = await db.fetchrow(
        "SELECT * FROM order_moments WHERE tenant_id = $1 AND order_id = $2",
        UUID(tenant_id), order_id
    )
    
    if not row:
        return None
        
    return Moment(**dict(row))

@router.get("/", response_model=List[Moment])
async def list_moments(
    skip: int = 0,
    limit: int = 20,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """List most recent moments."""
    tenant_id = current_user.get("tenant_id")
    
    rows = await db.fetch(
        """
        SELECT * FROM order_moments 
        WHERE tenant_id = $1 
        ORDER BY created_at DESC 
        OFFSET $2 LIMIT $3
        """,
        UUID(tenant_id), skip, limit
    )
    
    return [Moment(**dict(r)) for r in rows]
