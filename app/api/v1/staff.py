from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from uuid import UUID
from datetime import date
from pydantic import BaseModel
import asyncpg

from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---
class StaffCreate(BaseModel):
    full_name: str
    employee_id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    designation: str
    department: Optional[str] = None
    role: str = 'teacher'
    address: Optional[str] = None
    qualifications: Optional[str] = None
    salary_amount: Optional[float] = 0.0
    join_date: date
    photo_url: Optional[str] = None
    status: Optional[str] = 'active'
    
class StaffResponse(StaffCreate):
    staff_id: UUID
    created_at: Optional[str] = None # date to string in response usually handled by custom encoder or Pydantic v2

# --- Endpoints ---

@router.get("/next-id")
async def get_next_employee_id(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """
    Suggest next employee ID.
    Simple logic: Count + 1. 
    """
    async with pool.acquire() as conn:
        try:
            # Check if table exists
            exists = await conn.fetchval("SELECT to_regclass('staff')")
            if not exists:
                 year = date.today().year
                 return {"next_id": f"EMP-{year}-001"}

            count = await conn.fetchval("SELECT COUNT(*) FROM staff")
            # Generate ID like EMP-{YEAR}-{Count+1}
            year = date.today().year
            next_num = count + 1
            return {"next_id": f"EMP-{year}-{next_num:03d}"}
        except Exception as e:
            # Fallback
            import datetime
            return {"next_id": f"EMP-{datetime.date.today().year}-001"}

@router.get("/{staff_id}/id-card-data")
async def get_staff_id_card_data(
    staff_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """
    Get staff data formatted for ID Card generation.
    Maps staff fields to the generic ID card structure.
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM staff WHERE staff_id = $1", staff_id)
        if not row:
            raise HTTPException(status_code=404, detail="Staff not found")
            
        data = dict(row)
        
        # Return mapped structure compatible with ID Card Generator
        return {
            "student_id": data['staff_id'], # reusing field name for compatibility
            "full_name": data['full_name'],
            "admission_number": data['employee_id'],
            "current_class": data['designation'], # Map Designation to Class slot
            "father_name": data['department'] or "", # Map Department to Father Name slot
            "father_phone": data['phone'] or "",
            "date_of_birth": str(data['join_date']), # Map Join Date to DOB slot usually
            "photo_url": data.get('photo_url'),
            "gender": "Staff", # Placeholder
            "address": data.get('address'),
            "type": "staff"  # Marker for frontend
        }

@router.get("/", response_model=List[dict])
async def list_staff(
    search: Optional[str] = None,
    role: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """List staff members from the tenant's isolated database."""
    async with pool.acquire() as conn:
        # Ensure table exists first (auto-migration)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS staff (
                staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                full_name VARCHAR(100) NOT NULL,
                employee_id VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100),
                phone VARCHAR(20),
                designation VARCHAR(50),
                department VARCHAR(50),
                role VARCHAR(20) DEFAULT 'teacher',
                address TEXT,
                qualifications TEXT,
                join_date DATE NOT NULL DEFAULT CURRENT_DATE,
                salary_amount NUMERIC(10, 2) DEFAULT 0.00,
                photo_url TEXT,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # Smart Migration to ensure columns exist (Fix for 500 Error on old schemas)
        try:
             await conn.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
             await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS address TEXT")
             await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS qualifications TEXT")
             await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'teacher'")
             await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary_amount NUMERIC(10, 2) DEFAULT 0.00")
             await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo_url TEXT")
             await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'")
        except Exception:
             pass

        query = "SELECT * FROM staff WHERE status != 'deleted'"
        params = []
        param_count = 1
        
        if search:
            query += f" AND (full_name ILIKE ${param_count} OR employee_id ILIKE ${param_count} OR email ILIKE ${param_count})"
            params.append(f"%{search}%")
            param_count += 1
            
        if role and role != 'all':
            query += f" AND role = ${param_count}"
            params.append(role)
            param_count += 1
        
        query += f" ORDER BY created_at DESC LIMIT ${param_count}"
        params.append(limit)
        
        try:
             rows = await conn.fetch(query, *params)
             return [dict(row) for row in rows]
        except Exception as e:
             # If column still undefined or other SQL error
             print(f"Error listing staff: {e}")
             return []

@router.post("/", response_model=StaffResponse)
async def create_staff(
    staff: StaffCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Create a new staff member."""
    try:
        async with pool.acquire() as conn:
             # Ensure table exists (redundant but safe)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS staff (
                    staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    full_name VARCHAR(100) NOT NULL,
                    employee_id VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100),
                    phone VARCHAR(20),
                    designation VARCHAR(50),
                    department VARCHAR(50),
                    role VARCHAR(20) DEFAULT 'teacher',
                    address TEXT,
                    qualifications TEXT,
                    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
                    salary_amount NUMERIC(10, 2) DEFAULT 0.00,
                    photo_url TEXT,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)
            
            # Smart Migration (Ensure columns exist)
            try:
                await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS address TEXT")
                await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS qualifications TEXT")
                await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'teacher'")
                await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary_amount NUMERIC(10, 2) DEFAULT 0.00")
                await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo_url TEXT")
                await conn.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'")
            except Exception:
                pass

            # Check unique employee_id
            exists = await conn.fetchval("SELECT 1 FROM staff WHERE employee_id = $1", staff.employee_id)
            if exists:
                raise HTTPException(status_code=400, detail="Employee ID already exists")

            row = await conn.fetchrow(
                """
                INSERT INTO staff (full_name, employee_id, email, phone, designation, department, role, address, qualifications, join_date, salary_amount, photo_url, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
                """,
                staff.full_name, staff.employee_id, staff.email, staff.phone, staff.designation, staff.department, 
                staff.role, staff.address, staff.qualifications, staff.join_date, staff.salary_amount, 
                staff.photo_url, staff.status
            )
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create staff: {str(e)}")

@router.get("/{staff_id}", response_model=StaffResponse)
async def get_staff(
    staff_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Get a single staff member."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM staff WHERE staff_id = $1", staff_id)
        if not row:
            raise HTTPException(status_code=404, detail="Staff member not found")
        return dict(row)

@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff(
    staff_id: UUID,
    staff: StaffCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Update a staff member."""
    try:
        async with pool.acquire() as conn:
            exists = await conn.fetchval("SELECT 1 FROM staff WHERE staff_id = $1", staff_id)
            if not exists:
                raise HTTPException(status_code=404, detail="Staff member not found")

            row = await conn.fetchrow(
                """
                UPDATE staff 
                SET full_name = $1, email = $2, phone = $3, designation = $4, 
                    department = $5, role = $6, address = $7, qualifications = $8,
                    join_date = $9, salary_amount = $10, photo_url = $11, status = $12
                WHERE staff_id = $13
                RETURNING *
                """,
                staff.full_name, staff.email, staff.phone, staff.designation, staff.department, 
                staff.role, staff.address, staff.qualifications, staff.join_date, staff.salary_amount,
                staff.photo_url, staff.status, staff_id
            )
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update staff: {str(e)}")

@router.delete("/{staff_id}")
async def delete_staff(
    staff_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """Soft delete a staff member."""
    try:
        async with pool.acquire() as conn:
            exists = await conn.fetchval("SELECT 1 FROM staff WHERE staff_id = $1", staff_id)
            if not exists:
                raise HTTPException(status_code=404, detail="Staff member not found")

            await conn.execute("UPDATE staff SET status = 'deleted' WHERE staff_id = $1", staff_id)
            return {"message": "Staff member deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete staff: {str(e)}")

# --- Payroll Module ---

class PayrollTransactionCreate(BaseModel):
    amount: float
    transaction_date: date
    type: str = 'salary' # salary, bonus, deduction, advance
    description: Optional[str] = None
    payment_method: str = 'cash'

@router.get("/{staff_id}/payroll")
async def get_staff_payroll(
    staff_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Get payroll history for a staff member"""
    async with pool.acquire() as conn:
        # Auto-init payroll table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS payroll_transactions (
                transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                staff_id UUID REFERENCES staff(staff_id),
                amount DECIMAL(10,2) NOT NULL,
                transaction_date DATE NOT NULL,
                type VARCHAR(20) DEFAULT 'salary',
                description TEXT,
                payment_method VARCHAR(20) DEFAULT 'cash',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_payroll_staff ON payroll_transactions(staff_id);
        """)

        rows = await conn.fetch("""
            SELECT * FROM payroll_transactions 
            WHERE staff_id = $1 
            ORDER BY transaction_date DESC
        """, staff_id)
        return [dict(row) for row in rows]

@router.post("/{staff_id}/payroll")
async def create_payroll_transaction(
    staff_id: UUID,
    data: PayrollTransactionCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """Record a salary payment or deduction"""
    async with pool.acquire() as conn:
        # Quick check staff exists
        exists = await conn.fetchval("SELECT 1 FROM staff WHERE staff_id = $1", staff_id)
        if not exists:
             raise HTTPException(status_code=404, detail="Staff not found")

        # Create Record
        row = await conn.fetchrow("""
            INSERT INTO payroll_transactions (staff_id, amount, transaction_date, type, description, payment_method)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        """, staff_id, data.amount, data.transaction_date, data.type, data.description, data.payment_method)
        
        # Optional: Also record as Expense in Finance module
        # We can implement a trigger or just dual-insert here if Finance module is strict.
        # For now, let's keep them decoupled or simple. 
        # Ideally, this SHOULD create an expense.
        try:
             await conn.execute("""
                INSERT INTO expenses (category, amount, description, date, payment_method, reference_id)
                VALUES ('Salary', $1, $2, $3, $4, $5)
             """, data.amount, f"Payroll: {data.type} for Staff {staff_id}", data.transaction_date, data.payment_method, row['transaction_id'])
        except Exception:
             # Ignore expense creation failure if table doesn't exist (loose coupling)
             pass

        return dict(row)
