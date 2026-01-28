"""
Attendance Management API
Protocol Phase 4 Compliant
Supports Timetable-based Session Attendance
"""
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, Field
import asyncpg
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---
class AttendanceSessionCreate(BaseModel):
    class_id: UUID
    period_id: UUID
    date: date
    teacher_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None

class AttendanceRecordInput(BaseModel):
    student_id: UUID
    status: str = Field(..., pattern="^(present|absent|late|excused)$")
    remarks: Optional[str] = None

class AttendanceSubmit(BaseModel):
    session_id: UUID
    records: List[AttendanceRecordInput]

class SessionResponse(BaseModel):
    session_id: UUID
    class_name: str
    period_name: str
    subject_name: Optional[str]
    teacher_name: Optional[str]
    status: str # 'pending', 'submitted'
    total_present: int = 0
    total_absent: int = 0
    total_students: int = 0

# --- DB Init (Phase 2) ---
@router.post("/system/init")
async def init_attendance_tables(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    try:
        async with pool.acquire() as conn:
            # Ensure UUID generation is available
            await conn.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
            
            # 1. Sessions: A specific class, period, and date instance
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS attendance_sessions (
                    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    class_id UUID NOT NULL, -- FK classes
                    period_id UUID NOT NULL, -- FK school_periods
                    date DATE NOT NULL,
                    subject_id UUID,
                    teacher_id UUID,
                    marked_by UUID, -- User ID
                    status VARCHAR(20) DEFAULT 'submitted', -- submitted, draft
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(class_id, period_id, date)
                );
                
                CREATE INDEX IF NOT EXISTS idx_sess_date ON attendance_sessions(date);
                CREATE INDEX IF NOT EXISTS idx_sess_class ON attendance_sessions(class_id);
            """)

            # 2. Records: Individual student status for a session
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS attendance_records (
                    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    session_id UUID NOT NULL REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
                    student_id UUID NOT NULL, -- FK students
                    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
                    remarks TEXT,
                    marked_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(session_id, student_id)
                );
                
                CREATE INDEX IF NOT EXISTS idx_rec_student ON attendance_records(student_id);
            """)
            return {"message": "Attendance tables initialized"}
    except Exception as e:
        print(f"Attendance Init Error: {e}")
        # Return 500 but with detail
        raise HTTPException(status_code=500, detail=f"Failed to init attendance tables: {str(e)}")

@router.post("/system/init-tables")
async def init_attendance_tables_alias(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Alias for init tables to match frontend expectation"""
    return await init_attendance_tables(pool)

@router.get("/stats")
async def get_attendance_stats(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Get attendance statistics for the dashboard"""
    async with pool.acquire() as conn:
        try:
            # Check if tables exist first
            tables_exist = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = current_schema() 
                    AND table_name = 'attendance_sessions'
                )
            """)
            
            if not tables_exist:
                return {
                    "today_present": 0,
                    "today_absent": 0,
                    "today_late": 0,
                    "weekly_attendance": []
                }

            today = date.today()
            
            # Get today's stats
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(ar.record_id) filter (where ar.status = 'present') as present,
                    COUNT(ar.record_id) filter (where ar.status = 'absent') as absent,
                    COUNT(ar.record_id) filter (where ar.status = 'late') as late
                FROM attendance_sessions s
                JOIN attendance_records ar ON s.session_id = ar.session_id
                WHERE s.date = $1
            """, today)
            
            return {
                "today_present": stats['present'] or 0,
                "today_absent": stats['absent'] or 0,
                "today_late": stats['late'] or 0,
                "weekly_attendance": [] # Placeholder for chart data
            }
        except Exception as e:
            # Fallback if query fails
            print(f"Stats error: {e}")
            return {
                "today_present": 0,
                "today_absent": 0,
                "today_late": 0,
                "error": str(e)
            }

# --- Endpoints (Phase 4) ---

@router.get("/sessions", response_model=List[dict])
async def list_daily_sessions(
    date: date,
    class_id: Optional[UUID] = None,
    teacher_id: Optional[UUID] = None,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """List attendance sessions (classes that happened or are scheduled) for a day"""
    async with pool.acquire() as conn:
        # Ensure tables
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS attendance_sessions (
                session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                class_id UUID NOT NULL, period_id UUID NOT NULL, date DATE NOT NULL,
                subject_id UUID, teacher_id UUID, marked_by UUID,
                status VARCHAR(20) DEFAULT 'submitted', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(class_id, period_id, date)
            );
            CREATE TABLE IF NOT EXISTS attendance_records (
                record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID NOT NULL REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
                student_id UUID NOT NULL, status VARCHAR(20) NOT NULL, remarks TEXT, marked_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(session_id, student_id)
            );
        """)

        # We need to merge "Scheduled (Timetable)" with "Actual (Sessions)"
        # 1. Get Timetable Allocations for the day of week
        day_name = date.strftime("%A")
        
        # This query joins Timetable Allocations with Actual Sessions to show status
        query = """
            SELECT 
                ta.allocation_id,
                ta.class_id, c.class_name, c.section,
                ta.period_id, sp.name as period_name, sp.start_time, sp.end_time, sp.order_index,
                ta.subject_id, s.subject_name,
                ta.teacher_id, st.full_name as teacher_name,
                asess.session_id, asess.status as session_status,
                (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = asess.session_id AND ar.status = 'present') as present_count,
                (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = asess.session_id AND ar.status = 'absent') as absent_count
            FROM timetable_allocations ta
            JOIN school_periods sp ON ta.period_id = sp.period_id
            JOIN classes c ON ta.class_id = c.class_id
            LEFT JOIN subjects s ON ta.subject_id = s.subject_id
            LEFT JOIN staff st ON ta.teacher_id = st.teacher_id -- Typo in staff table col? It is staff_id. Fixed below.
            LEFT JOIN attendance_sessions asess 
                ON ta.class_id = asess.class_id 
                AND ta.period_id = asess.period_id 
                AND asess.date = $1
            WHERE ta.day_of_week = $2
        """
        # staff table PK is staff_id.
        query = query.replace("st.teacher_id", "st.staff_id")
        
        params = [date, day_name]
        arg_idx = 3

        if class_id:
            query += f" AND ta.class_id = ${arg_idx}"
            params.append(class_id)
            arg_idx += 1
            
        if teacher_id:
            query += f" AND ta.teacher_id = ${arg_idx}"
            params.append(teacher_id)
            arg_idx += 1
            
        query += " ORDER BY sp.order_index, c.class_name"
        
        rows = await conn.fetch(query, *params)
        
        # Convert times to string for JSON compatibility
        results = []
        for row in rows:
            d = dict(row)
            d['start_time'] = str(d['start_time'])
            d['end_time'] = str(d['end_time'])
            results.append(d)
            
        return results

@router.post("/sessions", response_model=dict)
async def submit_attendance(
    data: AttendanceSessionCreate,
    records: List[AttendanceRecordInput], # Body param separate? No, typically one body.
    # Pydantic doesn't support mixing body and fields easily like this if not wrapped.
    # Let's use a Wrapper Model.
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Use Wrapper Model approach below"""
    pass # Replaced by correct endpoint signature below

class AttendanceSubmissionWrapper(BaseModel):
    session_details: AttendanceSessionCreate
    records: List[AttendanceRecordInput]

@router.post("/submit")
async def submit_attendance_full(
    data: AttendanceSubmissionWrapper,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Submit attendance for a session (Create or Update)"""
    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1. Upsert Session
            session_id = await conn.fetchval("""
                INSERT INTO attendance_sessions (class_id, period_id, date, subject_id, teacher_id, marked_by, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'submitted')
                ON CONFLICT (class_id, period_id, date) 
                DO UPDATE SET 
                    subject_id = EXCLUDED.subject_id,
                    teacher_id = EXCLUDED.teacher_id,
                    marked_by = EXCLUDED.marked_by,
                    updated_at = NOW()
                RETURNING session_id
            """, data.session_details.class_id, data.session_details.period_id, data.session_details.date,
               data.session_details.subject_id, data.session_details.teacher_id, current_user['user_id'])
            
            # 2. Upsert Records
            # Process in batch if possible, or loop
            for rec in data.records:
                await conn.execute("""
                    INSERT INTO attendance_records (session_id, student_id, status, remarks)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (session_id, student_id)
                    DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, marked_at = NOW()
                """, session_id, rec.student_id, rec.status, rec.remarks)
                
            return {"success": True, "session_id": str(session_id), "count": len(data.records)}

@router.get("/records/{session_id}")
async def get_session_records(
    session_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Get records for a specific session"""
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT ar.*, s.full_name, s.admission_number, s.photo_url
            FROM attendance_records ar
            JOIN students s ON ar.student_id = s.student_id
            WHERE ar.session_id = $1
            ORDER BY s.full_name
        """, session_id)
        return [dict(row) for row in rows]
