from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel
import asyncpg

from app.core.database import get_master_db_pool
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

class ClassCreate(BaseModel):
    class_name: str
    section: str
    academic_year: str

class SubjectCreate(BaseModel):
    subject_name: str
    subject_code: str

@router.get("/classes", response_model=List[dict])
async def list_classes(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM classes ORDER BY class_name, section")
        return [dict(row) for row in rows]

@router.post("/classes", response_model=dict)
async def create_class(
    data: ClassCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        # Check constraints
        exists = await conn.fetchval(
            "SELECT 1 FROM classes WHERE class_name=$1 AND section=$2 AND academic_year=$3",
            data.class_name, data.section, data.academic_year
        )
        if exists:
            raise HTTPException(status_code=400, detail="Class already exists")

        row = await conn.fetchrow("""
            INSERT INTO classes (class_name, section, academic_year)
            VALUES ($1, $2, $3)
            RETURNING *
        """, data.class_name, data.section, data.academic_year)
        return dict(row)

@router.get("/subjects", response_model=List[dict])
async def list_subjects(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM subjects ORDER BY subject_name")
        return [dict(row) for row in rows]

@router.post("/subjects", response_model=dict)
async def create_subject(
    data: SubjectCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO subjects (subject_name, subject_code)
            VALUES ($1, $2)
            RETURNING *
        """, data.subject_name, data.subject_code)
        return dict(row)
