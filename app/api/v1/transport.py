"""
Transport Management API
Protocol Phase 4 Compliant
"""
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
import asyncpg
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---
class RouteCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    driver_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    capacity: int = Field(..., gt=0)
    monthly_fee: float = Field(..., ge=0)

class StopCreate(BaseModel):
    route_id: UUID
    name: str
    pickup_time: str # "07:30 AM" or Time object
    fee_adjustment: float = 0.0 # Optional surcharge/discount

class TransportAssignment(BaseModel):
    student_id: UUID
    route_id: UUID
    stop_id: Optional[UUID] = None

# --- DB Init (Phase 2) ---
@router.post("/system/init")
async def init_transport_tables(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        # 1. Routes (e.g., "Route 1 - North City")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS transport_routes (
                route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                driver_name VARCHAR(100),
                vehicle_number VARCHAR(50),
                capacity INT NOT NULL DEFAULT 30,
                monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
        """)

        # 2. Stops (Optional specific stops)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS transport_stops (
                stop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                route_id UUID NOT NULL REFERENCES transport_routes(route_id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                pickup_time VARCHAR(20),
                fee_adjustment NUMERIC(10, 2) DEFAULT 0.00,
                order_index INT DEFAULT 0
            );
        """)

        # 3. Allocations (Student <-> Route)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS transport_allocations (
                allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID NOT NULL REFERENCES students(student_id), -- Assuming students table exists
                route_id UUID NOT NULL REFERENCES transport_routes(route_id),
                stop_id UUID REFERENCES transport_stops(stop_id),
                allocated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(student_id)
            );
            CREATE INDEX IF NOT EXISTS idx_trans_route ON transport_allocations(route_id);
        """)
        return {"message": "Transport tables initialized"}

# --- Endpoints ---

@router.get("/routes", response_model=List[dict])
async def list_routes(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        # Check table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS transport_routes (
                route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                driver_name VARCHAR(100), vehicle_number VARCHAR(50),
                capacity INT NOT NULL DEFAULT 30, monthly_fee NUMERIC(10,2) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(), is_active BOOLEAN DEFAULT TRUE
            );
            CREATE TABLE IF NOT EXISTS transport_allocations (
                allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID NOT NULL, route_id UUID NOT NULL REFERENCES transport_routes(route_id),
                stop_id UUID, allocated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(student_id)
            ); 
        """)

        # Fetch routes with occupancy
        rows = await conn.fetch("""
            SELECT r.*, 
            (SELECT COUNT(*) FROM transport_allocations a WHERE a.route_id = r.route_id) as allocated_count
            FROM transport_routes r
            ORDER BY r.name
        """)
        return [dict(row) for row in rows]

@router.post("/routes")
async def create_route(
    route: RouteCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO transport_routes (name, driver_name, vehicle_number, capacity, monthly_fee)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """, route.name, route.driver_name, route.vehicle_number, route.capacity, route.monthly_fee)
        return dict(row)

@router.post("/assign")
async def assign_student(
    data: TransportAssignment,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        # Check capacity
        occupancy = await conn.fetchval("""
            SELECT COUNT(*) FROM transport_allocations WHERE route_id = $1
        """, data.route_id)
        
        capacity = await conn.fetchval("SELECT capacity FROM transport_routes WHERE route_id = $1", data.route_id)
        
        if occupancy >= capacity:
             raise HTTPException(400, "Route is at full capacity")

        # Assign (Upsert)
        await conn.execute("""
            INSERT INTO transport_allocations (student_id, route_id, stop_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (student_id)
            DO UPDATE SET route_id = EXCLUDED.route_id, stop_id = EXCLUDED.stop_id
        """, data.student_id, data.route_id, data.stop_id)
        
        return {"success": True}

@router.delete("/routes/{route_id}")
async def delete_route(
    route_id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        # Check dependency
        count = await conn.fetchval("SELECT COUNT(*) FROM transport_allocations WHERE route_id = $1", route_id)
        if count > 0:
            raise HTTPException(400, f"Cannot delete route with {count} allocated students.")
            
        await conn.execute("DELETE FROM transport_routes WHERE route_id = $1", route_id)
        return {"success": True}
