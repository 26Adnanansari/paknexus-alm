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

@router.get("/stats")
async def get_attendance_stats(
    range: str = "week",
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        # Get constant denominator
        total_students = await conn.fetchval("SELECT COUNT(*) FROM students WHERE status='active'")
        if not total_students or total_students == 0:
            return {"labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "data": [0,0,0,0,0,0,0]}
            
        days = 7 if range == 'week' else 30
        
        rows = await conn.fetch(f"""
            SELECT date, COUNT(*) as present_count 
            FROM attendance 
            WHERE status = 'present' AND date >= CURRENT_DATE - INTERVAL '{days} days'
            GROUP BY date 
            ORDER BY date ASC
        """)
        
        # Fill missing dates? For now just return found dates
        labels = [r['date'].strftime('%a') for r in rows] 
        data = [round((r['present_count'] / total_students) * 100, 1) for r in rows]
        
        return {
            "labels": labels, 
            "data": data, 
            "avg_present": round(sum(data)/len(data) if data else 0, 1)
        }
