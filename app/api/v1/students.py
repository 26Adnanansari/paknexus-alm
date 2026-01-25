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
    father_phone: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class StudentResponse(StudentCreate):
    student_id: UUID
    status: str

# --- Endpoints ---

@router.get("/next-id")
async def get_next_admission_number(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """
    Suggest next admission number.
    Simple logic: Count + 1. 
    Ideally, this should parse the max number, but that requires consistent formatting.
    """
    async with pool.acquire() as conn:
        count = await conn.fetchval("SELECT COUNT(*) FROM students")
        # Generate ID like S-{YEAR}-{Count+1}
        year = date.today().year
        next_num = count + 1
        return {"next_id": f"S-{year}-{next_num:03d}"}

@router.get("/", response_model=List[dict])
async def list_students(
    class_name: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
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
            
        query += f" ORDER BY created_at DESC LIMIT {limit}"
        
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
            # If auto-generated, maybe try next? For now, just error.
            raise HTTPException(status_code=400, detail="Admission number already exists")

        row = await conn.fetchrow(
            """
            INSERT INTO students (full_name, admission_number, admission_date, date_of_birth, gender, current_class, father_name, father_phone, photo_url, email, address)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
            """,
            student.full_name, student.admission_number, student.admission_date, student.date_of_birth, 
            student.gender, student.current_class, student.father_name, student.father_phone, student.photo_url,
            student.email, student.address
        )
        return dict(row)
