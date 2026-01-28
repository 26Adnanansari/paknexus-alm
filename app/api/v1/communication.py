"""
Communication Hub API
Protocol Phase 4 Compliant
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
import asyncpg
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---
class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=2)
    content: str = Field(..., min_length=5)
    target_audiences: List[str] = Field(..., description="Array of roles: student, teacher, parent, all")
    send_email: bool = False
    send_sms: bool = False
    is_urgent: bool = False

class AnnouncementResponse(BaseModel):
    announcement_id: UUID
    title: str
    content: str
    target_audiences: List[str]
    created_by_name: Optional[str]
    created_at: datetime
    views: int

# --- DB Init ---
@router.post("/system/init")
async def init_communication_tables(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    try:
        async with pool.acquire() as conn:
            await conn.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
            
            # 1. Announcements (Public/Role-based notices)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS announcements (
                    announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title VARCHAR(200) NOT NULL,
                    content TEXT NOT NULL,
                    target_audiences TEXT[] NOT NULL, -- Array of roles
                    send_email BOOLEAN DEFAULT FALSE,
                    send_sms BOOLEAN DEFAULT FALSE,
                    is_urgent BOOLEAN DEFAULT FALSE,
                    created_by UUID, -- User ID
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    views INT DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_ann_created ON announcements(created_at DESC);
            """)

            # 2. Messages (Direct messages between users - simple version)
            # Keeping it simple: Broadcasts only for Phase 4 MVP. 
            # Direct messaging is Phase 5 (Chatbot/Communication).
            
            return {"message": "Communication tables initialized"}
    except Exception as e:
        raise HTTPException(500, f"Init Failed: {e}")

# --- Endpoints ---

@router.get("/announcements", response_model=List[dict])
async def list_announcements(
    limit: int = 20,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """List recent announcements."""
    async with pool.acquire() as conn:
        # Check table
        exists = await conn.fetchval("SELECT to_regclass('announcements')")
        if not exists:
            return []
            
        # Get creator name logic could be complex (join with users/teacher/student).
        # For now, just return raw or join with generic Users table if exists?
        # We don't have a unified 'users' table in Tenant Schema easily accessible via ID usually, 
        # unless we store 'created_by_name' in the table. 
        # For MVP, we'll strip creator or use 'Admin'.
        
        rows = await conn.fetch("""
            SELECT * FROM announcements 
            ORDER BY created_at DESC 
            LIMIT $1
        """, limit)
        return [dict(row) for row in rows]

@router.post("/announcements")
async def create_announcement(
    data: AnnouncementCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        # Init if needed
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS announcements (
                announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(200) NOT NULL, content TEXT NOT NULL, target_audiences TEXT[] NOT NULL,
                send_email BOOLEAN DEFAULT FALSE, send_sms BOOLEAN DEFAULT FALSE, is_urgent BOOLEAN DEFAULT FALSE,
                created_by UUID, created_at TIMESTAMPTZ DEFAULT NOW(), views INT DEFAULT 0
            );
        """)
        
        row = await conn.fetchrow("""
            INSERT INTO announcements (title, content, target_audiences, send_email, send_sms, is_urgent, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        """, data.title, data.content, data.target_audiences, data.send_email, data.send_sms, data.is_urgent, current_user['user_id'])
        
        # Mock Sending (In production, trigger Background Task)
        if data.send_email:
            print(f"Mock: Sending Email to {data.target_audiences}: {data.title}")
            
        return dict(row)

@router.delete("/announcements/{ann_id}")
async def delete_announcement(
    ann_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM announcements WHERE announcement_id = $1", ann_id)
        return {"success": True}
