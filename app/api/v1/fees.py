from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from uuid import UUID
from datetime import date
from pydantic import BaseModel
import asyncpg

from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# ---/ Models /---
class FeeStructureBase(BaseModel):
    student_id: UUID
    academic_year: str
    fee_type: str
    amount: float
    due_date: date

class FeeStructureCreate(FeeStructureBase):
    pass

class FeeStructureResponse(FeeStructureBase):
    fee_structure_id: UUID
    created_at: date

class FeePaymentBase(BaseModel):
    student_id: UUID
    fee_structure_id: UUID
    payment_date: date
    amount_paid: float
    payment_method: str
    remarks: Optional[str] = None

class FeePaymentCreate(FeePaymentBase):
    pass

class FeePaymentResponse(FeePaymentBase):
    payment_id: UUID
    receipt_number: Optional[str] = None
    created_at: date

# ---/ Endpoints /---

@router.get("/outstanding", response_model=List[dict])
async def get_outstanding_fees(
    class_name: Optional[str] = None,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """
    Get list of students with outstanding fees.
    Utilizes the 'v_outstanding_fees' view created in schema template.
    """
    async with pool.acquire() as conn:
        query = """
            SELECT s.full_name, s.admission_number, s.current_class, v.*
            FROM v_outstanding_fees v
            JOIN students s ON v.student_id = s.student_id
            WHERE 1=1
        """
        params = []
        if class_name:
            query += " AND s.current_class = $1"
            params.append(class_name)
        
        query += " ORDER BY v.due_date ASC"
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

@router.post("/structure", response_model=dict)
async def create_fee_structure(
    fee: FeeStructureCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Assign a fee (Tuition, Transport, etc.) to a student."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO fee_structure (student_id, academic_year, fee_type, amount, due_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING fee_structure_id
            """,
            fee.student_id, fee.academic_year, fee.fee_type, fee.amount, fee.due_date
        )
        return {"fee_structure_id": row['fee_structure_id'], "message": "Fee structure assigned"}

@router.post("/payment", response_model=dict)
async def record_payment(
    payment: FeePaymentCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Record a payment against a fee structure."""
    async with pool.acquire() as conn:
        # Generate receipt number (Simple Logic for MVP: REC-{TIMESTAMP})
        import time
        receipt_no = f"REC-{int(time.time())}"
        
        row = await conn.fetchrow(
            """
            INSERT INTO fee_payments (student_id, fee_structure_id, payment_date, amount_paid, payment_method, receipt_number, remarks, collected_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING payment_id
            """,
            payment.student_id, payment.fee_structure_id, payment.payment_date, 
            payment.amount_paid, payment.payment_method, receipt_no, payment.remarks,
            current_user['user_id'] # Assuming staff_id matches user_id roughly or we need look up
        )
        return {"payment_id": row['payment_id'], "receipt_number": receipt_no, "message": "Payment recorded"}

@router.get("/history/{student_id}", response_model=List[dict])
async def get_student_fee_history(
    student_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Get fee history for a specific student."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT fs.fee_type, fs.amount as total_amount, fs.due_date, 
                   fp.amount_paid, fp.payment_date, fp.receipt_number, fp.payment_method
            FROM fee_structure fs
            LEFT JOIN fee_payments fp ON fs.fee_structure_id = fp.fee_structure_id
            WHERE fs.student_id = $1
            ORDER BY fs.due_date DESC
            """,
            student_id
        )
        return [dict(row) for row in rows]
