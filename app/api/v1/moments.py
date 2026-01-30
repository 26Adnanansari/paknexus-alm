from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.api.v1.deps import get_current_school_user, get_tenant_db_pool
from app.models.moments import Moment, MomentCreate, MomentUpdate
import asyncpg

router = APIRouter()

@router.post("/", response_model=Moment)
async def create_moment(
    moment: MomentCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """
    Create a new social moment.
    """
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant context required")

    async with pool.acquire() as conn:
        # Smart Init: Ensure table exists
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS order_moments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                order_id UUID NOT NULL,
                image_url TEXT NOT NULL,
                caption TEXT,
                status VARCHAR(20) DEFAULT 'published',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # Check if one already exists for this order if order_id is provided
        if moment.order_id:
            existing = await conn.fetchval(
                "SELECT id FROM order_moments WHERE tenant_id = $1 AND order_id = $2",
                tenant_id, moment.order_id
            )
            if existing:
                raise HTTPException(status_code=400, detail="Moment already exists for this order")

        row = await conn.fetchrow(
            """
            INSERT INTO order_moments (tenant_id, order_id, image_url, caption, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            """,
            tenant_id, moment.order_id, moment.image_url, moment.caption, moment.status
        )
        return Moment(**dict(row))

@router.get("/by-order/{order_id}", response_model=Optional[Moment])
async def get_moment_by_order(
    order_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Get the moment associated with a specific order."""
    tenant_id = current_user.get("tenant_id")
    
    async with pool.acquire() as conn:
        # Check/Create table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS order_moments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                order_id UUID NOT NULL,
                image_url TEXT NOT NULL,
                caption TEXT,
                status VARCHAR(20) DEFAULT 'published',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        row = await conn.fetchrow(
            "SELECT * FROM order_moments WHERE tenant_id = $1 AND order_id = $2",
            tenant_id, order_id
        )
        
        if not row:
            return None
            
        return Moment(**dict(row))

@router.get("/", response_model=List[Moment])
async def list_moments(
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """List most recent moments."""
    tenant_id = current_user.get("tenant_id")
    
    async with pool.acquire() as conn:
        # Check/Create table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS order_moments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                order_id UUID NOT NULL,
                image_url TEXT NOT NULL,
                caption TEXT,
                status VARCHAR(20) DEFAULT 'published',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        rows = await conn.fetch(
            """
            SELECT * FROM order_moments 
            WHERE tenant_id = $1 
            ORDER BY created_at DESC 
            OFFSET $2 LIMIT $3
            """,
            tenant_id, skip, limit
        )
        
        return [Moment(**dict(r)) for r in rows]
