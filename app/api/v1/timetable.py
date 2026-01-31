"""
Timetable Management API
Protocol Phase 4 Compliant
"""
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import time
from pydantic import BaseModel, validator, Field
import asyncpg
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models (Phase 3) ---

class SchoolPeriodCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    start_time: str # "HH:MM"
    end_time: str   # "HH:MM"
    is_break: bool = False
    order_index: int = Field(..., ge=0)

class SchoolPeriodResponse(BaseModel):
    period_id: UUID
    name: str
    start_time: time
    end_time: time
    is_break: bool
    order_index: int

class AllocationCreate(BaseModel):
    class_id: UUID
    period_id: UUID
    day_of_week: str
    subject_id: Optional[UUID] = None
    teacher_id: Optional[UUID] = None
    room_number: Optional[str] = None

class AllocationBatch(BaseModel):
    class_id: UUID
    allocations: List[AllocationCreate]

# --- Endpoints (Phase 4) ---

@router.post("/system/init")
async def init_timetable(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Initialize Timetable tables (Phase 2)"""
    async with pool.acquire() as conn:
        # 1. Periods (Master Slots)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS school_periods (
                period_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(50) NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                is_break BOOLEAN DEFAULT FALSE,
                order_index INTEGER NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(start_time, end_time),
                CHECK (end_time > start_time)
            );
        """)
        
        # 2. Allocations
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS timetable_allocations (
                allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                class_id UUID NOT NULL, -- FK to classes usually checked at app level or lazily
                period_id UUID NOT NULL REFERENCES school_periods(period_id) ON DELETE CASCADE,
                day_of_week VARCHAR(15) NOT NULL,
                subject_id UUID, 
                teacher_id UUID,
                room_number VARCHAR(20),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(class_id, period_id, day_of_week),
                CONSTRAINT valid_day CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_alloc_teacher ON timetable_allocations(teacher_id);
            CREATE INDEX IF NOT EXISTS idx_alloc_class ON timetable_allocations(class_id);
            CREATE INDEX IF NOT EXISTS idx_alloc_period ON timetable_allocations(period_id);
        """)
        return {"message": "Timetable initialized"}

@router.get("/periods", response_model=List[dict]) 
async def list_periods(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """List all school periods ordered by index"""
    async with pool.acquire() as conn:
        # Ensure exists (Auto-init for dev speed)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS school_periods (
                period_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(50) NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                is_break BOOLEAN DEFAULT FALSE,
                order_index INTEGER NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(start_time, end_time),
                CHECK (end_time > start_time)
            );
        """)
        
        rows = await conn.fetch("SELECT * FROM school_periods ORDER BY order_index ASC")
        return [dict(row) for row in rows]

@router.post("/periods")
async def create_period(
    period: SchoolPeriodCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Create a school period"""
    async with pool.acquire() as conn:
        try:
             row = await conn.fetchrow("""
                INSERT INTO school_periods (name, start_time, end_time, is_break, order_index)
                VALUES ($1, $2::time, $3::time, $4, $5)
                RETURNING *
             """, period.name, period.start_time, period.end_time, period.is_break, period.order_index)
             return dict(row)
        except asyncpg.UniqueViolationError:
             raise HTTPException(status_code=409, detail="Period with these exact times already exists")
        except Exception as e:
             raise HTTPException(status_code=400, detail=str(e))

@router.delete("/periods/{period_id}")
async def delete_period(
    period_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM school_periods WHERE period_id = $1", period_id)
        return {"success": True}

@router.get("/allocations/class/{class_id}")
async def get_class_timetable(
    class_id: UUID, 
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Get timetable for a class"""
    async with pool.acquire() as conn:
        # Ensure allocations table (Smart Init)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS timetable_allocations (
                allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                class_id UUID NOT NULL, 
                period_id UUID NOT NULL REFERENCES school_periods(period_id) ON DELETE CASCADE,
                day_of_week VARCHAR(15) NOT NULL,
                subject_id UUID, 
                teacher_id UUID,
                room_number VARCHAR(20),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(class_id, period_id, day_of_week),
                CONSTRAINT valid_day CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
            );
        """)

        allocs = await conn.fetch("""
             SELECT t.*, s.subject_name, st.full_name as teacher_name
             FROM timetable_allocations t
             LEFT JOIN subjects s ON t.subject_id = s.subject_id
             LEFT JOIN staff st ON t.teacher_id = st.staff_id
             WHERE t.class_id = $1
        """, class_id)
        
        periods = await conn.fetch("SELECT * FROM school_periods ORDER BY order_index")
        
        return {
            "periods": [dict(r) for r in periods],
            "allocations": [dict(r) for r in allocs]
        }

@router.get("/allocations/teacher/{teacher_id}")
async def get_teacher_timetable(
    teacher_id: UUID, 
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Get timetable for a specific teacher"""
    async with pool.acquire() as conn:
        # Fetch allocations where teacher_id matches
        allocs = await conn.fetch("""
             SELECT t.*, s.subject_name, c.class_name
             FROM timetable_allocations t
             LEFT JOIN subjects s ON t.subject_id = s.subject_id
             LEFT JOIN classes c ON t.class_id = c.class_id
             WHERE t.teacher_id = $1
        """, teacher_id)
        
        periods = await conn.fetch("SELECT * FROM school_periods ORDER BY order_index")
        
        return {
            "periods": [dict(r) for r in periods],
            "allocations": [dict(r) for r in allocs]
        }

@router.post("/allocations")
async def save_allocation(
    data: AllocationCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Save a single allocation cell"""
    async with pool.acquire() as conn:
        # Teacher Conflict Check
        if data.teacher_id:
            # We must verify if teacher is allocated to ANOTHER class at same time/day
            # Join required
            conflict = await conn.fetchrow("""
                SELECT t.class_id, t.day_of_week, sp.name as period_name, c.class_name
                FROM timetable_allocations t
                JOIN school_periods sp ON t.period_id = sp.period_id
                LEFT JOIN classes c ON t.class_id = c.class_id
                WHERE t.teacher_id = $1 
                  AND t.period_id = $2 
                  AND t.day_of_week = $3
                  AND t.class_id != $4
            """, data.teacher_id, data.period_id, data.day_of_week, data.class_id)
            
            if conflict:
                raise HTTPException(
                    status_code=409, 
                    detail=f"Teacher is already teaching {conflict['class_name'] or 'another class'} during {conflict['period_name']}"
                )

        await conn.execute("""
            INSERT INTO timetable_allocations (class_id, period_id, day_of_week, subject_id, teacher_id, room_number)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (class_id, period_id, day_of_week) 
            DO UPDATE SET 
                subject_id = EXCLUDED.subject_id,
                teacher_id = EXCLUDED.teacher_id,
                room_number = EXCLUDED.room_number
        """, data.class_id, data.period_id, data.day_of_week, data.subject_id, data.teacher_id, data.room_number)
        
        return {"success": True}
