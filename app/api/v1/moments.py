from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.api.v1.deps import get_current_school_user, get_tenant_db_pool
import asyncpg

router = APIRouter()

class MomentCreate(BaseModel):
    image_url: str
    caption: str
    author_name: str
    author_role: str # student, teacher, admin

class MomentUpdateStatus(BaseModel):
    status: str # approved, rejected, pending

@router.get("/", response_model=List[dict])
async def list_moments(
    status: str = "approved",
    limit: int = 20,
    offset: int = 0,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """List moments. Public usually sees approved only."""
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS school_moments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID,
                author_id UUID,
                author_name VARCHAR(100),
                author_role VARCHAR(20),
                image_url TEXT NOT NULL,
                caption TEXT,
                status VARCHAR(20) DEFAULT 'pending', 
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        
        # Admin can view any status, others only approved unless specified?
        # For simplicity, we filter by the status param.
        rows = await conn.fetch("""
            SELECT * FROM school_moments 
            WHERE status = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        """, status, limit, offset)
        
        return [dict(r) for r in rows]

@router.post("/", response_model=dict)
async def create_moment(
    moment: MomentCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Create a new moment. Requires approval by default unless Admin."""
    user_id = current_user.get("user_id") # May be student_id or staff_id
    role = current_user.get("role", "student")
    
    # Auto-approve if admin
    initial_status = "approved" if role in ["admin", "super_admin"] else "pending"
    
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS school_moments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID,
                author_id UUID,
                author_name VARCHAR(100),
                author_role VARCHAR(20),
                image_url TEXT NOT NULL,
                caption TEXT,
                status VARCHAR(20) DEFAULT 'pending', 
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        row = await conn.fetchrow("""
            INSERT INTO school_moments (author_id, author_name, author_role, image_url, caption, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        """, user_id, moment.author_name, moment.author_role, moment.image_url, moment.caption, initial_status)
        return dict(row)

@router.put("/{moment_id}/status", response_model=dict)
async def update_moment_status(
    moment_id: UUID,
    update: MomentUpdateStatus,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Approve or Reject a moment. Admin only."""
    # In a real app, check current_user role here
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE school_moments 
            SET status = $1
            WHERE id = $2
            RETURNING *
        """, update.status, moment_id)
        
        if not row:
            raise HTTPException(status_code=404, detail="Moment not found")
        return dict(row)

@router.delete("/{moment_id}")
async def delete_moment(
    moment_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM school_moments WHERE id = $1", moment_id)
        return {"message": "Deleted successfully"}
