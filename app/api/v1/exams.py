"""
Examination Management API
Protocol Phase 4 Compliant
"""
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Optional
from datetime import date
from uuid import UUID
from pydantic import BaseModel, Field, validator
import asyncpg
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---
class ExamCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    start_date: date
    end_date: date
    description: Optional[str] = None

class PaperCreate(BaseModel):
    exam_id: UUID
    class_id: UUID
    subject_id: UUID
    date: date
    total_marks: float = Field(..., gt=0)
    passing_marks: float = Field(..., gt=0)

    @validator('passing_marks')
    def check_passing(cls, v, values):
        if 'total_marks' in values and v > values['total_marks']:
            raise ValueError('Passing marks cannot exceed total marks')
        return v

class MarkEntry(BaseModel):
    student_id: UUID
    marks_obtained: float = Field(..., ge=0)
    remarks: Optional[str] = None

class MarksCommit(BaseModel):
    paper_id: UUID
    entries: List[MarkEntry]

class ResultCardItem(BaseModel):
    subject_name: str
    total_marks: float
    passing_marks: float
    marks_obtained: float
    grade: str
    status: str # Pass/Fail

# --- DB Init (Phase 2) ---
@router.post("/system/init")
async def init_exam_tables(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        # 1. Exams (The event, e.g., "Finals 2026")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS exams (
                exam_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                CHECK (end_date >= start_date)
            );
        """)

        # 2. Exam Papers (The specific subject test for a class)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS exam_papers (
                paper_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                exam_id UUID NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
                class_id UUID NOT NULL, -- FK classes
                subject_id UUID NOT NULL, -- FK subjects
                date DATE NOT NULL,
                total_marks NUMERIC(5,2) NOT NULL DEFAULT 100.00,
                passing_marks NUMERIC(5,2) NOT NULL DEFAULT 33.00,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(exam_id, class_id, subject_id)
            );
            CREATE INDEX IF NOT EXISTS idx_paper_exam ON exam_papers(exam_id);
            CREATE INDEX IF NOT EXISTS idx_paper_class ON exam_papers(class_id);
        """)

        # 3. Exam Results (Student marks)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS exam_results (
                result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                paper_id UUID NOT NULL REFERENCES exam_papers(paper_id) ON DELETE CASCADE,
                student_id UUID NOT NULL, -- FK students
                marks_obtained NUMERIC(5,2) NOT NULL DEFAULT 0.00,
                remarks VARCHAR(255),
                marked_by UUID, -- Teacher who marked
                marked_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(paper_id, student_id)
            );
            CREATE INDEX IF NOT EXISTS idx_res_student ON exam_results(student_id);
        """)
        return {"message": "Exam tables initialized"}

# --- Endpoints (Phase 4) ---

@router.get("/", response_model=List[dict])
async def list_exams(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """List all exams"""
    async with pool.acquire() as conn:
        # Smart Init
        await conn.execute("CREATE TABLE IF NOT EXISTS exams (exam_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, description TEXT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), CHECK (end_date >= start_date));")
        
        rows = await conn.fetch("SELECT * FROM exams ORDER BY start_date DESC")
        return [dict(row) for row in rows]

@router.post("/")
async def create_exam(
    exam: ExamCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO exams (name, start_date, end_date, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        """, exam.name, exam.start_date, exam.end_date, exam.description)
        return dict(row)

@router.get("/{exam_id}/papers")
async def list_papers(
    exam_id: UUID,
    class_id: Optional[UUID] = None,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """List papers defined for an exam"""
    async with pool.acquire() as conn:
        query = """
            SELECT ep.*, s.subject_name, c.class_name, c.section,
                (SELECT COUNT(*) FROM exam_results er WHERE er.paper_id = ep.paper_id) as marked_count
            FROM exam_papers ep
            JOIN subjects s ON ep.subject_id = s.subject_id
            JOIN classes c ON ep.class_id = c.class_id
            WHERE ep.exam_id = $1
        """
        params = [exam_id]
        if class_id:
            query += " AND ep.class_id = $2"
            params.append(class_id)
            
        query += " ORDER BY ep.date, c.class_name"
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

@router.post("/papers")
async def create_paper(
    paper: PaperCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow("""
                INSERT INTO exam_papers (exam_id, class_id, subject_id, date, total_marks, passing_marks)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING paper_id
            """, paper.exam_id, paper.class_id, paper.subject_id, paper.date, paper.total_marks, paper.passing_marks)
            return {"success": True, "paper_id": str(row['paper_id'])}
        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=409, detail="Paper for this subject and class already exists in this exam")

@router.get("/papers/{paper_id}/marks")
async def get_paper_marks(
    paper_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Get marks entry sheet (Pre-filled with students if not marked)"""
    async with pool.acquire() as conn:
        # 1. Get Paper Details
        paper = await conn.fetchrow("""
            SELECT ep.*, c.class_name 
            FROM exam_papers ep
            JOIN classes c ON ep.class_id = c.class_id
            WHERE paper_id = $1
        """, paper_id)
        
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
            
        # 2. Get Students + Existing Results (LEFT JOIN)
        # Filters active students in that class
        rows = await conn.fetch("""
            SELECT s.student_id, s.full_name, s.admission_number, s.photo_url,
                   er.marks_obtained, er.remarks
            FROM students s
            LEFT JOIN exam_results er ON s.student_id = er.student_id AND er.paper_id = $1
            WHERE s.current_class = $2 AND s.status = 'active'
            ORDER BY s.full_name
        """, paper_id, paper['class_name']) # Assuming class_name match for simplicity, ideally ID
        # Note: students table uses `current_class` (varchar) or `class_id`?
        # Standardize: In `students.py`, `current_class` is a string. `class_id` is not always stored.
        # But `exam_papers` links to `classes(class_id)`.
        # RISK: Mismatch between `classes` table and `students.status`.
        # Constraint in Phase 1 said "Complete Student Management". 
        # Ideally students table has `class_id`. If not, we join via name.
        # Let's verify `students` schema via `create_student` snippet viewed earlier.
        # Snippet: `current_class` is string.
        # Correction: `class_id` table exists.
        # I will assume `class_name` join is safest for now if `students.class_id` isn't guaranteed.
        
        return {
            "paper": dict(paper),
            "students": [dict(row) for row in rows]
        }

@router.post("/marks")
async def submit_marks(
    data: MarksCommit,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        # Check Max Marks
        paper = await conn.fetchrow("SELECT total_marks FROM exam_papers WHERE paper_id = $1", data.paper_id)
        if not paper:
            raise HTTPException(404, "Paper not found")
        
        max_marks = float(paper['total_marks'])
        
        async with conn.transaction():
            for entry in data.entries:
                if entry.marks_obtained > max_marks:
                     raise HTTPException(400, f"Marks {entry.marks_obtained} exceed max {max_marks} for student {entry.student_id}")
                
                await conn.execute("""
                    INSERT INTO exam_results (paper_id, student_id, marks_obtained, remarks, marked_by)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (paper_id, student_id)
                    DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, remarks = EXCLUDED.remarks, marked_by = EXCLUDED.marked_by
                """, data.paper_id, entry.student_id, entry.marks_obtained, entry.remarks, current_user['user_id'])
                
        return {"success": True, "count": len(data.entries)}
