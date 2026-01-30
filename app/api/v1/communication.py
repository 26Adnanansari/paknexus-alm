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

class MessageCreate(BaseModel):
    receiver_id: UUID
    receiver_type: str = "student" # student, staff
    content: str
    
class EmailSend(BaseModel):
    to_email: str
    subject: str
    body: str

# --- Endpoints ---

@router.post("/chat/send")
async def send_message(
    msg: MessageCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        # Determine sender info from current_user
        # Assuming current_user is always 'staff' for now in this dashboard
        sender_id = current_user['user_id']
        sender_type = current_user.get('role', 'staff') # staff, admin

        await conn.execute("""
            INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content)
            VALUES ($1, $2, $3, $4, $5)
        """, sender_id, sender_type, msg.receiver_id, msg.receiver_type, msg.content)
        
        return {"success": True}

@router.get("/chat/conversations")
async def get_conversations(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """
    Get list of latest conversations for the current user.
    Since this is the Staff Dashboard, we basically want list of Students we've talked to.
    """
    user_id = current_user['user_id']
    
    async with pool.acquire() as conn:
        # Complex query to get latest message per participant
        # We'll fetch students who have messages exchanges with current user
        query = """
            SELECT DISTINCT ON (other_id)
                m.message_id,
                m.content,
                m.created_at,
                m.is_read,
                CASE 
                    WHEN m.sender_id = $1 THEN m.receiver_id 
                    ELSE m.sender_id 
                END as other_id,
                CASE 
                    WHEN m.sender_id = $1 THEN m.receiver_type 
                    ELSE m.sender_type 
                END as other_type,
                s.full_name as other_name,
                s.photo_url as other_photo
            FROM messages m
            LEFT JOIN students s ON (
                (m.sender_id = s.student_id AND m.sender_type = 'student') OR 
                (m.receiver_id = s.student_id AND m.receiver_type = 'student')
            )
            WHERE m.sender_id = $1 OR m.receiver_id = $1
            ORDER BY other_id, m.created_at DESC
        """
        rows = await conn.fetch(query, user_id)
        
        # Sort by latest
        results = [dict(r) for r in rows]
        results.sort(key=lambda x: x['created_at'], reverse=True)
        return results

@router.get("/chat/history/{other_id}")
async def get_chat_history(
    other_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    user_id = current_user['user_id']
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
             SELECT * FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC
        """, user_id, other_id)
        return [dict(r) for r in rows]

@router.post("/email/send")
async def send_email_api(
    email: EmailSend,
    current_user: dict = Depends(get_current_school_user)
):
    # Mock Email Service
    # In real app, import aiosmtplib or use SendGrid/AWS SES
    print(f"--- EMAIL SENT ---")
    print(f"To: {email.to_email}")
    print(f"Subject: {email.subject}")
    print(f"Body: {email.body}")
    print(f"------------------")
    return {"message": "Email queued successfully"}

@router.post("/system/init")
async def init_communication_tables(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    try:
        async with pool.acquire() as conn:
            await conn.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
            
            # 1. Announcements
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS announcements (
                    announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title VARCHAR(200) NOT NULL,
                    content TEXT NOT NULL,
                    target_audiences TEXT[] NOT NULL,
                    send_email BOOLEAN DEFAULT FALSE,
                    send_sms BOOLEAN DEFAULT FALSE,
                    is_urgent BOOLEAN DEFAULT FALSE,
                    created_by UUID,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    views INT DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_ann_created ON announcements(created_at DESC);
            """)

            # 2. Messages
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    sender_id UUID NOT NULL,
                    sender_type VARCHAR(20) DEFAULT 'staff', -- staff, student
                    receiver_id UUID NOT NULL,
                    receiver_type VARCHAR(20) DEFAULT 'student',
                    content TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_msg_participants ON messages(sender_id, receiver_id);
            """)
            
            return {"message": "Communication tables initialized"}
    except Exception as e:
        raise HTTPException(500, f"Init Failed: {e}")

# --- Existing Endpoints (Announcements) ---
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
