from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from uuid import UUID
from datetime import date
from pydantic import BaseModel
import asyncpg

from app.core.database import get_master_db_pool
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

class StaffCreate(BaseModel):
    full_name: str
    employee_id: str
    designation: Optional[str] = None
    department: Optional[str] = None
    role: str = 'teacher'
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    qualifications: Optional[str] = None
    join_date: date
    salary_amount: Optional[float] = None

@router.get("/", response_model=List[dict])
async def list_staff(
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        query = "SELECT * FROM staff WHERE is_active = TRUE"
        params = []
        param_count = 1
        
        if role:
            query += f" AND role = ${param_count}"
            params.append(role)
            param_count += 1
            
        if search:
            query += f" AND (full_name ILIKE ${param_count} OR employee_id ILIKE ${param_count})"
            params.append(f"%{search}%")
            param_count += 1
        
        query += " ORDER BY join_date DESC"
            
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

@router.post("/", response_model=dict)
async def create_staff(
    staff: StaffCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        exists = await conn.fetchval("SELECT 1 FROM staff WHERE employee_id = $1", staff.employee_id)
        if exists:
            raise HTTPException(status_code=400, detail="Employee ID already exists")

        row = await conn.fetchrow("""
            INSERT INTO staff (
                full_name, employee_id, designation, department, role, 
                email, phone, address, qualifications, join_date, salary_amount
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        """, 
        staff.full_name, staff.employee_id, staff.designation, staff.department, staff.role,
        staff.email, staff.phone, staff.address, staff.qualifications, staff.join_date, staff.salary_amount
        )
        
        return dict(row)
