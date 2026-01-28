"""
Results & Report Card Generation API
Protocol Phase 4 Compliant
"""
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel
import asyncpg
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---
class GradeScale(BaseModel):
    label: str
    min_score: float
    max_score: float
    gpa: float

class SubjectResult(BaseModel):
    subject_name: str
    total_marks: float
    passing_marks: float
    obtained_marks: float
    percentage: float
    grade: str
    status: str # Pass/Fail
    remarks: Optional[str]

class ReportCard(BaseModel):
    student_id: UUID
    full_name: str
    admission_number: str
    class_name: str
    section: str
    exam_name: str
    subjects: List[SubjectResult]
    grand_total: float
    total_obtained: float
    overall_percentage: float
    overall_grade: str
    rank: Optional[int] = None
    attendance_percentage: Optional[float] = None

# --- Helpers ---
def calculate_grade(percentage: float) -> str:
    if percentage >= 90: return 'A+'
    if percentage >= 80: return 'A'
    if percentage >= 70: return 'B'
    if percentage >= 60: return 'C'
    if percentage >= 50: return 'D'
    return 'F'

# --- Endpoints ---

@router.get("/card/student/{student_id}/exam/{exam_id}")
async def get_student_report_card(
    student_id: UUID, 
    exam_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Generate a detailed report card for a single student"""
    async with pool.acquire() as conn:
        # 1. Student Details
        student = await conn.fetchrow("""
            SELECT full_name, admission_number, current_class as class_name, section 
            FROM students WHERE student_id = $1
        """, student_id)
        if not student:
            raise HTTPException(404, "Student not found")

        # 2. Exam Details
        exam = await conn.fetchrow("SELECT name FROM exams WHERE exam_id = $1", exam_id)
        if not exam:
            raise HTTPException(404, "Exam not found")
            
        # 3. Results
        # Join results -> papers -> subjects
        rows = await conn.fetch("""
            SELECT 
                s.subject_name,
                ep.total_marks,
                ep.passing_marks,
                COALESCE(er.marks_obtained, 0) as obtained_marks,
                er.remarks
            FROM exam_papers ep
            JOIN subjects s ON ep.subject_id = s.subject_id
            LEFT JOIN exam_results er ON ep.paper_id = er.paper_id AND er.student_id = $1
            WHERE ep.exam_id = $2
              -- AND ep.class_id = (SELECT class_id FROM classes WHERE class_name = $3) -- Optional strict check
        """, student_id, exam_id)
        
        subject_results = []
        grand_total = 0.0
        total_obtained = 0.0
        
        for row in rows:
            obtained = float(row['obtained_marks'] or 0)
            total = float(row['total_marks'])
            passing = float(row['passing_marks'])
            
            percentage = (obtained / total * 100) if total > 0 else 0
            grade = calculate_grade(percentage)
            status = 'Pass' if obtained >= passing else 'Fail'
            
            subject_results.append({
                "subject_name": row['subject_name'],
                "total_marks": total,
                "passing_marks": passing,
                "obtained_marks": obtained,
                "percentage": round(percentage, 2),
                "grade": grade,
                "status": status,
                "remarks": row['remarks']
            })
            
            grand_total += total
            total_obtained += obtained

        overall_percent = (total_obtained / grand_total * 100) if grand_total > 0 else 0
        overall_grade = calculate_grade(overall_percent)
        
        # 4. Rank Calculation (Expensive, maybe cache later)
        # Count how many students in same class have higher total marks for this exam
        # Need class_id. Assuming student has it or we query by class_name logic again.
        # Check if student table has class_id? 
        # For result accuracy, finding rank via 'class_name' and 'section' matches is acceptable for MVP
        
        rank = await conn.fetchval("""
            WITH StudentTotals AS (
                SELECT 
                    er.student_id, 
                    SUM(er.marks_obtained) as total
                FROM exam_results er
                JOIN exam_papers ep ON er.paper_id = ep.paper_id
                JOIN students s ON er.student_id = s.student_id
                WHERE ep.exam_id = $1 
                  AND s.current_class = $2 
                  AND s.section = $3
                GROUP BY er.student_id
            )
            SELECT COUNT(*) + 1 
            FROM StudentTotals 
            WHERE total > $4
        """, exam_id, student['class_name'], student['section'], total_obtained)

        return {
            "student_id": str(student_id),
            "full_name": student['full_name'],
            "admission_number": student['admission_number'],
            "class_name": student['class_name'],
            "section": student['section'] or "",
            "exam_name": exam['name'],
            "subjects": subject_results,
            "grand_total": grand_total,
            "total_obtained": total_obtained,
            "overall_percentage": round(overall_percent, 2),
            "overall_grade": overall_grade,
            "rank": rank,
            "attendance_percentage": 95.0 # Placeholder or integrate with Attendance API
        }

@router.get("/class-summary/{exam_id}")
async def get_class_result_summary(
    exam_id: UUID,
    class_name: str,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Get list of all students formatted for result broadsheet"""
    async with pool.acquire() as conn:
        # Get all students in class
        students = await conn.fetch("""
             SELECT student_id, full_name, admission_number 
             FROM students 
             WHERE current_class = $1 AND status='active'
             ORDER BY full_name
        """, class_name)
        
        results = []
        for s in students:
             # Reuse logic or simplified query?
             # Simplified sum query
             stats = await conn.fetchrow("""
                SELECT 
                    SUM(ep.total_marks) as grand,
                    SUM(COALESCE(er.marks_obtained, 0)) as obtained,
                    COUNT(ep.paper_id) as papers_count,
                    COUNT(CASE WHEN COALESCE(er.marks_obtained,0) < ep.passing_marks THEN 1 END) as fail_count
                FROM exam_papers ep
                LEFT JOIN exam_results er ON ep.paper_id = er.paper_id AND er.student_id = $1
                WHERE ep.exam_id = $2
             """, s['student_id'], exam_id)
             
             grand = float(stats['grand'] or 0)
             obtained = float(stats['obtained'] or 0)
             percent = (obtained / grand * 100) if grand > 0 else 0
             
             results.append({
                 "student_id": str(s['student_id']),
                 "full_name": s['full_name'],
                 "grand_total": grand,
                 "total_obtained": obtained,
                 "percentage": round(percent, 2),
                 "papers_count": stats['papers_count'],
                 "fail_count": stats['fail_count']
             })
             
        # Sort by rank
        results.sort(key=lambda x: x['total_obtained'], reverse=True)
        return results
