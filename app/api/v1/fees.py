from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel
import asyncpg

from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---

class FeeHeadCreate(BaseModel):
    head_name: str

class ClassFeeCreate(BaseModel):
    class_name: str
    fee_head_id: UUID
    amount: float
    frequency: str = "monthly"

class ScholarshipAssign(BaseModel):
    student_id: UUID
    discount_percent: float
    type: str = "merit"

class GenerateInvoices(BaseModel):
    month_year: str # e.g. "2025-09"
    due_date: date
    class_name: Optional[str] = None # Generate for specific class or all

class PaymentRecord(BaseModel):
    invoice_id: UUID
    amount: float
    method: str = "cash"
    remarks: Optional[str] = None

# --- Tables Init Helper ---
@router.post("/system/init-tables")
async def init_fee_tables(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """One-time setup to create Fee Management tables if they don't exist."""
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS fee_heads (
                head_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                head_name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS class_fee_structure (
                structure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                class_name VARCHAR(50) NOT NULL, 
                fee_head_id UUID REFERENCES fee_heads(head_id) ON DELETE CASCADE,
                amount DECIMAL(10,2) NOT NULL,
                frequency VARCHAR(20) DEFAULT 'monthly',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(class_name, fee_head_id)
            );

            CREATE TABLE IF NOT EXISTS student_scholarships (
                scholarship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID REFERENCES students(student_id),
                discount_percent DECIMAL(5,2) NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
                type VARCHAR(50) DEFAULT 'merit',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(student_id)
            );

            CREATE TABLE IF NOT EXISTS fee_invoices (
                invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID REFERENCES students(student_id),
                month_year VARCHAR(20), 
                total_amount DECIMAL(10,2) NOT NULL,
                scholarship_amount DECIMAL(10,2) DEFAULT 0,
                payable_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'unpaid',
                paid_amount DECIMAL(10,2) DEFAULT 0,
                due_date DATE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(student_id, month_year)
            );
            
            -- Also link payments to invoice
            ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES fee_invoices(invoice_id);
        """)
        return {"message": "Fee tables initialized successfully"}

# --- Fee Head Management ---

@router.post("/heads")
async def create_fee_head(
    head: FeeHeadCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    try:
        async with pool.acquire() as conn:
            # First, ensure table exists
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS fee_heads (
                    head_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    head_name VARCHAR(100) NOT NULL UNIQUE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)
            
            id = await conn.fetchval(
                "INSERT INTO fee_heads (head_name) VALUES ($1) ON CONFLICT (head_name) DO NOTHING RETURNING head_id",
                head.head_name
            )
            if not id:
                id = await conn.fetchval("SELECT head_id FROM fee_heads WHERE head_name = $1", head.head_name)
            return {"head_id": str(id), "head_name": head.head_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create fee head: {str(e)}")

@router.get("/heads")
async def list_fee_heads(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    try:
        async with pool.acquire() as conn:
            # First, ensure table exists
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS fee_heads (
                    head_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    head_name VARCHAR(100) NOT NULL UNIQUE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)
            
            rows = await conn.fetch("SELECT * FROM fee_heads ORDER BY head_name")
            return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch fee heads: {str(e)}")

@router.delete("/heads/{head_id}")
async def delete_fee_head(
    head_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Delete a fee head. Note: This will also delete all associated fee structures due to CASCADE."""
    try:
        async with pool.acquire() as conn:
            # Check if fee head is used in any structures
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM class_fee_structure WHERE fee_head_id = $1",
                head_id
            )
            
            if count > 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot delete fee head. It is used in {count} fee structure(s). Please delete those structures first."
                )
            
            # Delete the fee head
            deleted = await conn.fetchval(
                "DELETE FROM fee_heads WHERE head_id = $1 RETURNING head_id",
                head_id
            )
            
            if not deleted:
                raise HTTPException(status_code=404, detail="Fee head not found")
            
            return {"message": "Fee head deleted successfully", "head_id": str(deleted)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete fee head: {str(e)}")

# --- Class Fee Structure ---

@router.post("/structure")
async def set_class_fee(
    data: ClassFeeCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    try:
        async with pool.acquire() as conn:
            # Ensure tables exist
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS fee_heads (
                    head_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    head_name VARCHAR(100) NOT NULL UNIQUE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS class_fee_structure (
                    structure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    class_name VARCHAR(50) NOT NULL, 
                    fee_head_id UUID REFERENCES fee_heads(head_id) ON DELETE CASCADE,
                    amount DECIMAL(10,2) NOT NULL,
                    frequency VARCHAR(20) DEFAULT 'monthly',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(class_name, fee_head_id)
                );
            """)
            
            await conn.execute("""
                INSERT INTO class_fee_structure (class_name, fee_head_id, amount, frequency)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (class_name, fee_head_id) DO UPDATE 
                SET amount = $3, frequency = $4
            """, data.class_name, data.fee_head_id, data.amount, data.frequency)
            return {"message": "Class fee updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set class fee: {str(e)}")

@router.get("/structure/{class_name}")
async def get_class_structure(
    class_name: str,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    try:
        async with pool.acquire() as conn:
            # Ensure tables exist
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS fee_heads (
                    head_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    head_name VARCHAR(100) NOT NULL UNIQUE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS class_fee_structure (
                    structure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    class_name VARCHAR(50) NOT NULL, 
                    fee_head_id UUID REFERENCES fee_heads(head_id) ON DELETE CASCADE,
                    amount DECIMAL(10,2) NOT NULL,
                    frequency VARCHAR(20) DEFAULT 'monthly',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(class_name, fee_head_id)
                );
            """)
            
            rows = await conn.fetch("""
                SELECT s.*, h.head_name 
                FROM class_fee_structure s
                JOIN fee_heads h ON s.fee_head_id = h.head_id
                WHERE s.class_name = $1
            """, class_name)
            return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch class structure: {str(e)}")

# --- Scholarship ---

@router.post("/scholarship")
async def assign_scholarship(
    data: ScholarshipAssign,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO student_scholarships (student_id, discount_percent, type)
            VALUES ($1, $2, $3)
            ON CONFLICT (student_id) DO UPDATE 
            SET discount_percent = $2, type = $3
        """, data.student_id, data.discount_percent, data.type)
        return {"message": "Scholarship assigned"}

# --- Invoice Generation ---

@router.post("/generate")
async def generate_invoices(
    data: GenerateInvoices,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """
    Generate monthly invoices for students based on their class fees and scholarships.
    """
    async with pool.acquire() as conn:
        # Get target students
        query = "SELECT student_id, current_class FROM students WHERE status = 'active'"
        params = []
        if data.class_name:
            query += " AND current_class = $1"
            params.append(data.class_name)
            
        students = await conn.fetch(query, *params)
        
        generated_count = 0
        
        for student in students:
            stu_id = student['student_id']
            cls = student['current_class']
            
            # 1. Calculate Base Fee for Class
            # Only consider 'monthly' fees for this generation
            # TODO: Improve logic for one-time fees
            fees = await conn.fetchval("""
                SELECT COALESCE(SUM(amount), 0) 
                FROM class_fee_structure 
                WHERE class_name = $1 AND frequency = 'monthly'
            """, cls) or 0
            
            if fees <= 0: continue
            
            # 2. Get Scholarship
            scholarship_pct = await conn.fetchval("""
                SELECT discount_percent FROM student_scholarships WHERE student_id = $1
            """, stu_id) or 0
            
            scholarship_amt = fees * (float(scholarship_pct) / 100.0)
            payable = fees - scholarship_amt
            
            # 3. Create Invoice
            try:
                await conn.execute("""
                    INSERT INTO fee_invoices 
                    (student_id, month_year, total_amount, scholarship_amount, payable_amount, due_date)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (student_id, month_year) DO NOTHING 
                """, stu_id, data.month_year, fees, scholarship_amt, payable, data.due_date)
                generated_count += 1
            except:
                pass # Already exists or error
                
        return {"message": f"Generated {generated_count} invoices for {data.month_year}"}

class AssignAdHocFee(BaseModel):
    target_type: str # 'student' or 'class'
    target_id: str # student_id or class_name
    fee_head_id: UUID
    amount: float
    due_date: date
    remarks: Optional[str] = None

@router.post("/assign-adhoc")
async def assign_adhoc_fee(
    data: AssignAdHocFee,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """
    Assign a one-time fee (Picnic, Admission, Fine) to a Student or whole Class.
    """
    async with pool.acquire() as conn:
        students = []
        
        if data.target_type == 'student':
            students = [{'student_id': data.target_id}]
        elif data.target_type == 'class':
            rows = await conn.fetch("SELECT student_id FROM students WHERE current_class = $1 AND status = 'active'", data.target_id)
            students = [dict(r) for r in rows]
            
        count = 0
        for stu in students:
            # Create Invoice for this specific fee
            # We treat ad-hoc fees as individual invoices for tracking? 
            # Or append to monthly? 
            # Better to create separate invoice for clarity: "Picnic Fee - Sep 2025"
            
            # Get Head Name
            head_name = await conn.fetchval("SELECT head_name FROM fee_heads WHERE head_id = $1", data.fee_head_id)
            inv_title = f"{head_name}"
            if data.remarks: inv_title += f" - {data.remarks}"
            
            await conn.execute("""
                INSERT INTO fee_invoices 
                (student_id, month_year, total_amount, scholarship_amount, payable_amount, due_date, status)
                VALUES ($1, $2, $3, 0, $3, $4, 'unpaid')
            """, stu['student_id'], inv_title, data.amount, data.due_date)
            count += 1
            
        return {"message": f"Assigned fee to {count} students"}

# --- Collection ---

@router.get("/invoices/{student_id}")
async def get_student_invoices(
    student_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM fee_invoices 
            WHERE student_id = $1 
            ORDER BY month_year DESC
        """, student_id)
        return [dict(r) for r in rows]

@router.post("/collect")
async def collect_fee(
    payment: PaymentRecord,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1. Update Invoice
            invoice = await conn.fetchrow("SELECT * FROM fee_invoices WHERE invoice_id = $1 FOR UPDATE", payment.invoice_id)
            if not invoice:
                raise HTTPException(status_code=404, detail="Invoice not found")
                
            new_paid = float(invoice['paid_amount']) + payment.amount
            payable = float(invoice['payable_amount'])
            
            status = 'partial'
            if new_paid >= payable:
                status = 'paid'
            elif new_paid > 0:
                status = 'partial'
            else:
                status = 'unpaid' # Shouldn't happen on payment
                
            await conn.execute("""
                UPDATE fee_invoices 
                SET paid_amount = $1, status = $2
                WHERE invoice_id = $3
            """, new_paid, status, payment.invoice_id)
            
            # 2. Record Payment Log
            await conn.execute("""
                INSERT INTO fee_payments (
                    student_id, amount_paid, payment_date, payment_method, 
                    created_at, invoice_id, collected_by, remarks
                )
                VALUES ($1, $2, CURRENT_DATE, $3, NOW(), $4, $5, $6)
            """, invoice['student_id'], payment.amount, payment.method, payment.invoice_id, current_user['user_id'], payment.remarks)
            
            return {"message": "Payment recorded successfully", "new_status": status}
