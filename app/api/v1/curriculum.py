from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel
import asyncpg

from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---

class ClassCreate(BaseModel):
    class_name: str # e.g. "Grade 10"
    section: Optional[str] = None # e.g. "A"
    academic_year: Optional[str] = None # e.g. "2024-2025"
    class_teacher_id: Optional[UUID] = None
    room_number: Optional[str] = None
    capacity: Optional[int] = 30

class SubjectCreate(BaseModel):
    subject_name: str
    code: Optional[str] = None
    department: Optional[str] = None
    credits: Optional[float] = 1.0 
    is_optional: bool = False
    description: Optional[str] = None

class SubjectAllocation(BaseModel):
    class_id: UUID
    subject_id: UUID
    teacher_id: Optional[UUID] = None

# --- Endpoints: Classes ---

@router.get("/classes", response_model=List[dict])
async def list_classes(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """List all classes, including those only found in student records."""
    async with pool.acquire() as conn:
        # Schema evolution (same as before)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS classes (
                class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                class_name VARCHAR(50) NOT NULL,
                section VARCHAR(10),
                academic_year VARCHAR(20),
                class_teacher_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
                room_number VARCHAR(20),
                capacity INTEGER DEFAULT 30,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(class_name, section, academic_year)
            );
        """)
        
        try:
             await conn.execute("ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_teacher_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL")
             await conn.execute("ALTER TABLE classes ADD COLUMN IF NOT EXISTS room_number VARCHAR(20)")
             await conn.execute("ALTER TABLE classes ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 30")
        except Exception:
            pass

        # 1. Fetch Defined Classes
        state_query = """
            SELECT c.*, s.full_name as class_teacher_name, true as is_defined
            FROM classes c 
            LEFT JOIN staff s ON c.class_teacher_id = s.staff_id 
        """
        defined_rows = await conn.fetch(state_query)
        defined_classes = [dict(row) for row in defined_rows]
        defined_names = {r['class_name'] for r in defined_classes}

        # 2. Fetch Student-Only Classes (Legacy/Ad-hoc)
        try:
            student_query = "SELECT DISTINCT current_class FROM students WHERE current_class IS NOT NULL AND current_class != ''"
            student_rows = await conn.fetch(student_query)
            
            for row in student_rows:
                cname = row['current_class']
                if cname not in defined_names:
                    defined_classes.append({
                        "class_id": None, # Ad-hoc
                        "class_name": cname,
                        "section": "-",
                        "is_defined": False,
                        "room_number": None,
                        "capacity": 0
                    })
                    defined_names.add(cname) # prevent dupes
        except Exception:
            pass # Students table might not exist yet if fresh install

        # Sort by name
        defined_classes.sort(key=lambda x: x['class_name'])
        
        return defined_classes

@router.post("/classes", response_model=dict)
async def create_class(
    cls: ClassCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Create a new class."""
    try:
        async with pool.acquire() as conn:
            # Table init logic (duplicated for safety in case GET wasn't called)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS classes (
                    class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    class_name VARCHAR(50) NOT NULL,
                    section VARCHAR(10),
                    academic_year VARCHAR(20),
                    class_teacher_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
                    room_number VARCHAR(20),
                    capacity INTEGER DEFAULT 30,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(class_name, section, academic_year)
                );
            """)

            # Check unique
            exists = await conn.fetchval(
                """SELECT 1 FROM classes 
                   WHERE class_name = $1 
                   AND (($2::text IS NULL AND section IS NULL) OR section = $2)
                   AND (($3::text IS NULL AND academic_year IS NULL) OR academic_year = $3)
                """, 
                cls.class_name, cls.section, cls.academic_year
            )
            if exists:
                raise HTTPException(status_code=400, detail="Class already exists")

            row = await conn.fetchrow(
                """
                INSERT INTO classes (class_name, section, academic_year, class_teacher_id, room_number, capacity)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
                """,
                cls.class_name, cls.section, cls.academic_year, cls.class_teacher_id, cls.room_number, cls.capacity
            )
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create class: {str(e)}")

@router.put("/classes/{class_id}", response_model=dict)
async def update_class(
    class_id: UUID,
    cls: ClassCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    try:
        async with pool.acquire() as conn:
             row = await conn.fetchrow(
                """
                UPDATE classes 
                SET class_name = $1, section = $2, academic_year = $3, 
                    class_teacher_id = $4, room_number = $5, capacity = $6
                WHERE class_id = $7
                RETURNING *
                """,
                cls.class_name, cls.section, cls.academic_year, 
                cls.class_teacher_id, cls.room_number, cls.capacity, class_id
            )
             if not row:
                 raise HTTPException(status_code=404, detail="Class not found")
             return dict(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update class: {str(e)}")

@router.delete("/classes/{class_id}")
async def delete_class(
    class_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM classes WHERE class_id = $1", class_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Class not found")
        return {"message": "Class deleted"}

# --- Endpoints: Subjects ---

@router.get("/subjects", response_model=List[dict])
async def list_subjects(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                subject_name VARCHAR(100) NOT NULL,
                code VARCHAR(20),
                department VARCHAR(50),
                credits NUMERIC(3, 1) DEFAULT 1.0,
                is_optional BOOLEAN DEFAULT FALSE,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(code, subject_name)
            );
        """)
        rows = await conn.fetch("SELECT * FROM subjects ORDER BY subject_name")
        return [dict(row) for row in rows]

@router.post("/subjects", response_model=dict)
async def create_subject(
    sub: SubjectCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    try:
        async with pool.acquire() as conn:
            # Ensure table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS subjects (
                    subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    subject_name VARCHAR(100) NOT NULL,
                    code VARCHAR(20),
                    department VARCHAR(50),
                    credits NUMERIC(3, 1) DEFAULT 1.0,
                    is_optional BOOLEAN DEFAULT FALSE,
                    description TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(code, subject_name)
                );
            """)

            row = await conn.fetchrow(
                """
                INSERT INTO subjects (subject_name, code, department, credits, is_optional, description)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
                """,
                sub.subject_name, sub.code, sub.department, sub.credits, sub.is_optional, sub.description
            )
            return dict(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create subject: {str(e)}")

@router.put("/subjects/{subject_id}", response_model=dict)
async def update_subject(
    subject_id: UUID,
    sub: SubjectCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE subjects 
                SET subject_name = $1, code = $2, department = $3, 
                    credits = $4, is_optional = $5, description = $6
                WHERE subject_id = $7
                RETURNING *
                """,
                sub.subject_name, sub.code, sub.department, sub.credits, sub.is_optional, sub.description, subject_id
            )
            if not row:
                raise HTTPException(status_code=404, detail="Subject not found")
            return dict(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update subject: {str(e)}")

@router.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM subjects WHERE subject_id = $1", subject_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Subject not found")
        return {"message": "Subject deleted"}

# --- Endpoints: Allocations ---

@router.get("/classes/{class_id}/subjects", response_model=List[dict])
async def list_class_subjects(
    class_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS class_subjects (
                allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                class_id UUID REFERENCES classes(class_id) ON DELETE CASCADE,
                subject_id UUID REFERENCES subjects(subject_id) ON DELETE CASCADE,
                teacher_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
                UNIQUE(class_id, subject_id)
            );
        """)
        
        rows = await conn.fetch("""
            SELECT cs.*, s.subject_name, s.code, st.full_name as teacher_name, st.staff_id
            FROM class_subjects cs
            JOIN subjects s ON cs.subject_id = s.subject_id
            LEFT JOIN staff st ON cs.teacher_id = st.staff_id
            WHERE cs.class_id = $1
            ORDER BY s.subject_name
        """, class_id)
        return [dict(row) for row in rows]

@router.post("/classes/{class_id}/subjects")
async def assign_subject_to_class(
    class_id: UUID,
    allocation: SubjectAllocation,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    try:
        async with pool.acquire() as conn:
            # Ensure table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS class_subjects (
                    allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    class_id UUID REFERENCES classes(class_id) ON DELETE CASCADE,
                    subject_id UUID REFERENCES subjects(subject_id) ON DELETE CASCADE,
                    teacher_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
                    UNIQUE(class_id, subject_id)
                );
            """)
            
            # Upsert not supported easily in pure ANSI SQL safely for duplicates, but we have UNIQUE constraint
            try:
                row = await conn.fetchrow(
                    """
                    INSERT INTO class_subjects (class_id, subject_id, teacher_id)
                    VALUES ($1, $2, $3)
                    RETURNING *
                    """,
                    allocation.class_id, allocation.subject_id, allocation.teacher_id
                )
                return dict(row)
            except asyncpg.UniqueViolationError:
                 raise HTTPException(status_code=400, detail="Subject already assigned to this class")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign subject: {str(e)}")

@router.delete("/allocations/{allocation_id}")
async def remove_class_subject(
    allocation_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM class_subjects WHERE allocation_id = $1", allocation_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Allocation not found")
        return {"message": "Allocation removed"}
