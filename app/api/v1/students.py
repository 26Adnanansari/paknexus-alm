from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from uuid import UUID
from datetime import date
from pydantic import BaseModel
import asyncpg

from app.core.database import get_master_db_pool
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---
class StudentCreate(BaseModel):
    full_name: str
    admission_number: str
    admission_date: date  # REQUIRED by schema
    date_of_birth: date
    gender: str
    current_class: Optional[str] = None
    father_name: Optional[str] = None
    father_phone: Optional[str] = None  # Fixed to match schema column name

class StudentResponse(StudentCreate):
    student_id: UUID
    status: str

# --- Endpoints ---

@router.get("/", response_model=List[dict])
async def list_students(
    class_name: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool) # Uses Tenant DB!
):
    """List students from the tenant's isolated database."""
    async with pool.acquire() as conn:
        query = "SELECT * FROM students WHERE status = 'active'"
        params = []
        param_count = 1
        
        if class_name:
            query += f" AND current_class = ${param_count}"
            params.append(class_name)
            param_count += 1
            
        if search:
            query += f" AND (full_name ILIKE ${param_count} OR admission_number ILIKE ${param_count})"
            params.append(f"%{search}%")
            param_count += 1
            
        query += " ORDER BY full_name LIMIT 100"
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

@router.post("/", response_model=StudentResponse)
async def create_student(
    student: StudentCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Create a new student in the tenant's database."""
    async with pool.acquire() as conn:
        # Check admission number uniqueness?
        exists = await conn.fetchval("SELECT 1 FROM students WHERE admission_number = $1", student.admission_number)
        if exists:
            raise HTTPException(status_code=400, detail="Admission number already exists")

        row = await conn.fetchrow(
            """
            INSERT INTO students (full_name, admission_number, admission_date, date_of_birth, gender, current_class, father_name, father_phone)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            """,
            student.full_name, student.admission_number, student.admission_date, student.date_of_birth, 
            student.gender, student.current_class, student.father_name, student.father_phone
        )
        return dict(row)
