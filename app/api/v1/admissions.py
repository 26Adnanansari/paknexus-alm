from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from uuid import UUID
from datetime import date
from pydantic import BaseModel, EmailStr, Field
import asyncpg
import json

from app.api.v1.deps import get_current_school_user, get_master_db_pool

router = APIRouter()
public_router = APIRouter()

# --- Models ---

class AdmissionSettingsData(BaseModel):
    is_open: bool
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    enable_entry_test: bool = False
    entry_test_link: Optional[str] = None
    instructions: Optional[str] = None
    fee_amount: Optional[float] = 0

class ApplicationCreate(BaseModel):
    tenant_id: UUID # Public user might send this from the form context
    applicant_name: str
    father_name: str
    phone: str
    email: Optional[EmailStr] = None
    applied_class: str
    previous_school: Optional[str] = None
    address: Optional[str] = None
    gender: str = "male"
    dob: Optional[date] = None

class ApplicationResponse(ApplicationCreate):
    application_id: UUID
    status: str
    created_at: str

# --- Init Schema ---

@router.post("/system/init-tables")
async def init_admission_tables(pool: asyncpg.Pool = Depends(get_master_db_pool)):
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS admission_settings (
                tenant_id UUID PRIMARY KEY REFERENCES tenants(tenant_id) ON DELETE CASCADE,
                is_open BOOLEAN DEFAULT FALSE,
                start_date DATE,
                end_date DATE,
                enable_entry_test BOOLEAN DEFAULT FALSE,
                entry_test_link TEXT,
                instructions TEXT,
                fee_amount DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS admission_applications (
                application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
                applicant_name VARCHAR(100) NOT NULL,
                father_name VARCHAR(100),
                phone VARCHAR(20),
                email VARCHAR(100),
                applied_class VARCHAR(50),
                previous_school VARCHAR(100),
                address TEXT,
                gender VARCHAR(10),
                dob DATE,
                status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, test_pending
                test_score DECIMAL(5,2),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        return {"message": "Admission tables initialized"}

# --- Admin Endpoints ---

@router.get("/settings")
async def get_settings(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    tenant_id = current_user["tenant_id"]
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM admission_settings WHERE tenant_id = $1", tenant_id)
        if not row:
            return {"is_open": False}
        return dict(row)

@router.post("/settings")
async def update_settings(
    settings: AdmissionSettingsData,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    tenant_id = current_user["tenant_id"]
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO admission_settings (tenant_id, is_open, start_date, end_date, enable_entry_test, entry_test_link, instructions, fee_amount, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (tenant_id) DO UPDATE SET
                is_open = $2, start_date = $3, end_date = $4,
                enable_entry_test = $5, entry_test_link = $6,
                instructions = $7, fee_amount = $8, updated_at = NOW()
        """, tenant_id, settings.is_open, settings.start_date, settings.end_date, 
             settings.enable_entry_test, settings.entry_test_link, settings.instructions, settings.fee_amount)
        return {"message": "Settings updated"}

@router.get("/applications")
async def list_applications(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    tenant_id = current_user["tenant_id"]
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM admission_applications 
            WHERE tenant_id = $1 
            ORDER BY created_at DESC
        """, tenant_id)
        # Convert date/uuid to string for JSON
        res = []
        for r in rows:
            d = dict(r)
            d['application_id'] = str(d['application_id'])
            d['tenant_id'] = str(d['tenant_id'])
            d['created_at'] = d['created_at'].isoformat()
            if d['dob']: d['dob'] = d['dob'].isoformat()
            res.append(d)
        return res

@router.post("/applications/{app_id}/status")
async def update_status(
    app_id: UUID,
    status: str = Body(..., embed=True), # e.g. {"status": "approved"}
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    valid_statuses = ['pending', 'approved', 'rejected', 'test_pending', 'interview']
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    async with pool.acquire() as conn:
        await conn.execute("UPDATE admission_applications SET status = $1 WHERE application_id = $2", status, app_id)
        return {"message": "Status updated"}

# --- Public Endpoints ---

@public_router.get("/check/{tenant_id}")
async def check_admission_status(
    tenant_id: UUID,
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """Public check if admissions are open"""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT is_open, start_date, end_date, instructions, fee_amount FROM admission_settings WHERE tenant_id = $1", tenant_id)
        if not row:
            return {"is_open": False, "message": "Admissions not configured."}
        
        # Check dates
        today = date.today()
        is_open = row['is_open']
        if row['start_date'] and today < row['start_date']:
            is_open = False
        if row['end_date'] and today > row['end_date']:
            is_open = False
            
        return {
            "is_open": is_open,
            "instructions": row['instructions'],
            "fee_amount": float(row['fee_amount']) if row['fee_amount'] else 0,
            "dates": {
                "start": row['start_date'],
                "end": row['end_date']
            }
        }

@public_router.post("/apply")
async def public_apply(
    app: ApplicationCreate,
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    async with pool.acquire() as conn:
        # Check if open
        settings = await conn.fetchrow("SELECT is_open, enable_entry_test, entry_test_link FROM admission_settings WHERE tenant_id = $1", app.tenant_id)
        if not settings or not settings['is_open']:
            raise HTTPException(status_code=400, detail="Admissions closed")
            
        app_id = await conn.fetchval("""
            INSERT INTO admission_applications
            (tenant_id, applicant_name, father_name, phone, email, applied_class, previous_school, address, gender, dob, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
            RETURNING application_id
        """, app.tenant_id, app.applicant_name, app.father_name, app.phone, app.email, 
             app.applied_class, app.previous_school, app.address, app.gender, app.dob)
        
        response = {
             "message": "Application Submitted Successfully",
             "application_id": str(app_id),
             "next_step": "wait_for_review"
        }
        
        if settings['enable_entry_test'] and settings['entry_test_link']:
             response['test_link'] = settings['entry_test_link']
             response['next_step'] = "take_test"
             
        return response
