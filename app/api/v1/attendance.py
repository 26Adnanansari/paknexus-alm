from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from datetime import date
from pydantic import BaseModel
import asyncpg
from uuid import UUID

from app.core.database import get_master_db_pool
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

class AttendanceMark(BaseModel):
    student_id: UUID
    status: str
    remarks: Optional[str] = None

class AttendanceBatch(BaseModel):
    date: date
    class_id: Optional[UUID] = None # Optional for basic filtering
    records: List[AttendanceMark]

@router.get("/", response_model=List[dict])
async def get_attendance(
    date: date,
    class_name: Optional[str] = None, # Simplified filtering by name
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        # Join with students to get names
        query = """
            SELECT a.*, s.full_name, s.admission_number, s.current_class 
            FROM students s
            LEFT JOIN attendance a ON s.student_id = a.student_id AND a.date = $1
            WHERE s.status = 'active'
        """
        params = [date]
        
        if class_name:
            query += " AND s.current_class = $2"
            params.append(class_name)
            
        query += " ORDER BY s.full_name"
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

@router.post("/batch", response_model=dict)
async def mark_attendance_batch(
    data: AttendanceBatch,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        async with conn.transaction():
            for record in data.records:
                await conn.execute("""
                    INSERT INTO attendance (student_id, date, status, remarks)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (student_id, date, period_number) 
                    DO UPDATE SET status = $3, remarks = $4, marked_at = NOW()
                """, record.student_id, data.date, record.status, record.remarks)
                
        return {"message": "Attendance marked successfully"}
