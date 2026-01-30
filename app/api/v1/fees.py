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

class FeeHeadResponse(BaseModel):
    head_id: UUID
    head_name: str

@router.get("/heads", response_model=List[FeeHeadResponse])
async def list_fee_heads(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """List all created fee heads"""
    async with pool.acquire() as conn:
        # Ensure table exists first (just in case)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS fee_heads (
                head_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                head_name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        rows = await conn.fetch("SELECT head_id, head_name FROM fee_heads ORDER BY head_name")
        return [dict(r) for r in rows]

class ClassFeeCreate(BaseModel):
    class_name: str
    fee_head_id: UUID
    amount: float
    currency: str = "PKR"

class ScholarshipAssign(BaseModel):
    student_id: UUID
    discount_percent: float
    type: str # 'merit', 'financial_aid'

class GenerateInvoices(BaseModel):
    class_name: Optional[str] = None
    month_year: str # e.g. "Sep-2025"
    due_date: date

class PaymentRecord(BaseModel):
    invoice_id: UUID
    amount: float
    method: str # 'cash', 'bank', 'online'
    remarks: Optional[str] = None

# ... (Previous code) ...

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
                    currency VARCHAR(10) DEFAULT 'PKR',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(class_name, fee_head_id)
                );
            """)

            # Migration for currency
            try:
                await conn.execute("ALTER TABLE class_fee_structure ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'PKR'")
            except Exception:
                pass
            
            await conn.execute("""
                INSERT INTO class_fee_structure (class_name, fee_head_id, amount, frequency, currency)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (class_name, fee_head_id) DO UPDATE 
                SET amount = $3, frequency = $4, currency = $5
            """, data.class_name, data.fee_head_id, data.amount, data.frequency, data.currency)
            return {"message": "Class fee updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set class fee: {str(e)}")

@router.get("/structure")
async def list_all_structures(
    class_name: Optional[str] = None,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """List all fee structures, optionally filtered by class."""
    try:
        async with pool.acquire() as conn:
            # Ensure tables with columns
            try:
                await conn.execute("ALTER TABLE class_fee_structure ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'PKR'")
            except:
                pass
            
            query = """
                SELECT s.*, h.head_name 
                FROM class_fee_structure s
                JOIN fee_heads h ON s.fee_head_id = h.head_id
            """
            params = []
            if class_name:
                query += " WHERE s.class_name = $1"
                params.append(class_name)
                
            query += " ORDER BY s.class_name, h.head_name"
            
            rows = await conn.fetch(query, *params)
            return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch fee structures: {str(e)}")

@router.get("/structure/{class_name}")
async def get_class_structure(
    class_name: str,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    try:
        async with pool.acquire() as conn:
            # Ensure tables with columns
            try:
                await conn.execute("ALTER TABLE class_fee_structure ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'PKR'")
            except:
                pass
            
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
            payment_id = await conn.fetchval("""
                INSERT INTO fee_payments (
                    student_id, amount_paid, payment_date, payment_method, 
                    created_at, invoice_id, collected_by, remarks
                )
                VALUES ($1, $2, CURRENT_DATE, $3, NOW(), $4, $5, $6)
                RETURNING payment_id
            """, invoice['student_id'], payment.amount, payment.method, payment.invoice_id, current_user['user_id'], payment.remarks)
            
            return {
                "message": "Payment recorded successfully", 
                "new_status": status,
                "payment_id": str(payment_id)
            }

@router.get("/receipt/{payment_id}")
async def get_payment_receipt(
    payment_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT 
                p.payment_id, p.payment_date, p.amount_paid, p.payment_method, p.remarks,
                s.full_name as student_name, s.admission_number, s.current_class, s.father_name,
                i.month_year, i.invoice_id
            FROM fee_payments p
            JOIN students s ON p.student_id = s.student_id
            JOIN fee_invoices i ON p.invoice_id = i.invoice_id
            WHERE p.payment_id = $1
        """, payment_id)
        
        if not row:
            raise HTTPException(status_code=404, detail="Receipt not found")
            
        return dict(row)

# --- Status & Reports ---

async def ensure_fee_tables(conn):
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
            currency VARCHAR(10) DEFAULT 'PKR',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(class_name, fee_head_id)
        );

        CREATE TABLE IF NOT EXISTS fee_invoices (
            invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL, -- soft link to students table
            month_year VARCHAR(50) NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            scholarship_amount DECIMAL(10,2) DEFAULT 0,
            payable_amount DECIMAL(10,2) NOT NULL,
            paid_amount DECIMAL(10,2) DEFAULT 0,
            due_date DATE,
            status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(student_id, month_year)
        );

        CREATE TABLE IF NOT EXISTS fee_payments (
            payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_id UUID REFERENCES fee_invoices(invoice_id),
            student_id UUID NOT NULL,
            amount_paid DECIMAL(10,2) NOT NULL,
            payment_date DATE DEFAULT CURRENT_DATE,
            payment_method VARCHAR(50),
            remarks TEXT,
            collected_by UUID, -- user_id
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS student_scholarships (
            student_id UUID PRIMARY KEY, -- One scholarship policy per student for simplicity
            discount_percent DECIMAL(5,2) NOT NULL,
            type VARCHAR(50), -- merit, need_based
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

@router.get("/status/{student_id}")
async def get_student_fee_status(
    student_id: UUID, 
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        await ensure_fee_tables(conn)
        
        # Get Student Details
        student = await conn.fetchrow("SELECT full_name, admission_number, current_class FROM students WHERE student_id = $1", student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Get Fee Aggregates
        stats = await conn.fetchrow("""
            SELECT 
                COALESCE(SUM(payable_amount), 0) as total_fee,
                COALESCE(SUM(paid_amount), 0) as total_paid
            FROM fee_invoices 
            WHERE student_id = $1
        """, student_id)
        
        total_fee = float(stats['total_fee'])
        total_paid = float(stats['total_paid'])
        outstanding = total_fee - total_paid
        
        # Get Last Payment
        last_payment = await conn.fetchval("""
            SELECT payment_date FROM fee_payments 
            WHERE student_id = $1 
            ORDER BY payment_date DESC, created_at DESC LIMIT 1
        """, student_id)
        
        return {
            "student_id": str(student_id),
            "student_name": student['full_name'],
            "admission_number": student['admission_number'],
            "current_class": student['current_class'],
            "total_fee": total_fee,
            "total_paid": total_paid,
            "outstanding": outstanding,
            "last_payment_date": last_payment.isoformat() if last_payment else None,
            "is_defaulter": outstanding > 0
        }

@router.get("/outstanding", response_model=dict)
async def get_outstanding_fees(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Get list of students with outstanding fees"""
    async with pool.acquire() as conn:
        await ensure_fee_tables(conn) # Ensure tables exist
        query = """
            SELECT 
                s.student_id,
                s.full_name,
                s.admission_number,
                s.current_class,
                COALESCE(SUM(fi.paid_amount), 0) as total_paid,
                COALESCE(SUM(fi.payable_amount), 0) as total_due,
                COALESCE(SUM(fi.payable_amount - fi.paid_amount), 0) as outstanding
            FROM students s
            JOIN fee_invoices fi ON s.student_id = fi.student_id
            WHERE fi.status != 'paid'
            GROUP BY s.student_id, s.full_name, s.admission_number, s.current_class
            HAVING SUM(fi.payable_amount - fi.paid_amount) > 0
        """
        rows = await conn.fetch(query)
        outstanding = [dict(row) for row in rows]
        
        return {
            "total_defaulters": len(outstanding),
            "total_outstanding": sum(float(x['outstanding']) for x in outstanding),
            "students": outstanding
        }

@router.get("/reports/outstanding", response_model=dict)
async def get_outstanding_report(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Get outstanding fees report with statistics"""
    async with pool.acquire() as conn:
        await ensure_fee_tables(conn) # Ensure tables exist
        query = """
            SELECT 
                COUNT(DISTINCT student_id) as total_defaulters,
                SUM(payable_amount - paid_amount) as total_outstanding
            FROM fee_invoices
            WHERE status != 'paid'
        """
        row = await conn.fetchrow(query)
        
        totals = await conn.fetchrow("SELECT SUM(payable_amount) as total_invoiced, SUM(paid_amount) as total_collected FROM fee_invoices")
        
        total_invoiced = totals['total_invoiced'] or 0
        total_collected = totals['total_collected'] or 0
        collection_rate = (total_collected / total_invoiced * 100) if total_invoiced > 0 else 0
        
        total_defaulters = row['total_defaulters'] or 0
        total_out = float(row['total_outstanding'] or 0)
        
        return {
            "total_defaulters": total_defaulters,
            "total_outstanding": total_out,
            "collection_rate": float(collection_rate),
            "average_per_student": (total_out / total_defaulters) if total_defaulters > 0 else 0
        }
