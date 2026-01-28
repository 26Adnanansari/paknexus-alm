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
    admission_number: Optional[str] = None
    admission_date: date
    date_of_birth: date
    gender: str
    current_class: Optional[str] = None
    father_name: Optional[str] = None
    father_phone: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = 'active'

class StudentResponse(StudentCreate):
    student_id: UUID
    status: str

class StudentDocument(BaseModel):
    title: str
    url: str
    doc_type: str = 'other' # academic, medical, legal, other

# --- Endpoints ---

@router.get("/{student_id}", response_model=dict)
async def get_student(
    student_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Get a single student details."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM students WHERE student_id = $1", student_id)
        if not row:
            raise HTTPException(status_code=404, detail="Student not found")
        return dict(row)

@router.get("/{student_id}/documents", response_model=List[dict])
async def list_student_documents(
    student_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """List documents for a student."""
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS student_documents (
                document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
                title VARCHAR(100) NOT NULL,
                url TEXT NOT NULL,
                doc_type VARCHAR(50) DEFAULT 'other',
                uploaded_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        rows = await conn.fetch("SELECT * FROM student_documents WHERE student_id = $1 ORDER BY uploaded_at DESC", student_id)
        return [dict(row) for row in rows]

@router.post("/{student_id}/documents")
async def add_student_document(
    student_id: UUID,
    document: StudentDocument,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Add a document to a student profile."""
    try:
        async with pool.acquire() as conn:
            # Ensure table exists
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS student_documents (
                    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
                    title VARCHAR(100) NOT NULL,
                    url TEXT NOT NULL,
                    doc_type VARCHAR(50) DEFAULT 'other',
                    uploaded_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)
            
            row = await conn.fetchrow(
                """
                INSERT INTO student_documents (student_id, title, url, doc_type)
                VALUES ($1, $2, $3, $4)
                RETURNING *
                """,
                student_id, document.title, document.url, document.doc_type
            )
            return dict(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add document: {str(e)}")

@router.delete("/{student_id}/documents/{document_id}")
async def delete_student_document(
    student_id: UUID,
    document_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Delete a student document."""
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM student_documents WHERE document_id = $1 AND student_id = $2", document_id, student_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Document not found")
        return {"message": "Document deleted"}

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
    try:
        async with pool.acquire() as conn:
            # First, ensure table exists
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS students (
                    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    full_name VARCHAR(100) NOT NULL,
                    admission_number VARCHAR(50) UNIQUE NOT NULL,
                    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
                    date_of_birth DATE,
                    gender VARCHAR(10),
                    current_class VARCHAR(50),
                    father_name VARCHAR(100),
                    father_phone VARCHAR(20),
                    photo_url TEXT,
                    email VARCHAR(100),
                    address TEXT,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # Quick Migration for Dev (Ensure columns exist if table was created in earlier version)
            try:
                await conn.execute("ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(100)")
                await conn.execute("ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT")
                await conn.execute("ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'")
            except Exception:
                pass

            # Check admission number uniqueness
            exists = await conn.fetchval("SELECT 1 FROM students WHERE admission_number = $1", student.admission_number)
            if exists:
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
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create student: {str(e)}")

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: UUID,
    student: StudentCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Update an existing student."""
    try:
        async with pool.acquire() as conn:
            # Check if student exists
            exists = await conn.fetchval("SELECT 1 FROM students WHERE student_id = $1", student_id)
            if not exists:
                raise HTTPException(status_code=404, detail="Student not found")

            # Update student
            row = await conn.fetchrow(
                """
                UPDATE students 
                SET full_name = $1, 
                    admission_date = $2, 
                    date_of_birth = $3, 
                    gender = $4, 
                    current_class = $5, 
                    father_name = $6, 
                    father_phone = $7, 
                    photo_url = $8, 
                    email = $9, 
                    address = $10
                WHERE student_id = $11
                RETURNING *
                """,
                student.full_name, student.admission_date, student.date_of_birth, 
                student.gender, student.current_class, student.father_name, student.father_phone, 
                student.photo_url, student.email, student.address, student_id
            )
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update student: {str(e)}")

@router.delete("/{student_id}")
async def delete_student(
    student_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Soft delete a student (set status to inactive)."""
    try:
        async with pool.acquire() as conn:
            # Check if student exists
            exists = await conn.fetchval("SELECT 1 FROM students WHERE student_id = $1", student_id)
            if not exists:
                raise HTTPException(status_code=404, detail="Student not found")

            # Soft delete
            await conn.execute("UPDATE students SET status = 'inactive' WHERE student_id = $1", student_id)
            return {"message": "Student deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete student: {str(e)}")
