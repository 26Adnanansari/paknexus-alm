"""
Inventory & Asset Management API
Protocol Phase 4 Compliant
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
import asyncpg
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---
class ItemCreate(BaseModel):
    name: str = Field(..., min_length=2)
    category: str # "Stationary", "Uniform", "Furniture", "Electronics"
    quantity: int = Field(0, ge=0)
    unit: str = "pcs" # pcs, kg, boxes
    cost_per_unit: float = 0.0
    low_stock_threshold: int = Field(10, ge=0)
    supplier_name: Optional[str] = None

class StockAdjustment(BaseModel):
    item_id: UUID
    type: str = Field(..., pattern="^(in|out|damage)$")
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = None

# --- DB Init ---
@router.post("/system/init")
async def init_inventory_tables(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        # 1. Items
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS inventory_items (
                item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                quantity INT NOT NULL DEFAULT 0,
                unit VARCHAR(20) DEFAULT 'pcs',
                cost_per_unit NUMERIC(10, 2) DEFAULT 0.00,
                low_stock_threshold INT DEFAULT 10,
                supplier_name VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_inv_cat ON inventory_items(category);
        """)

        # 2. Transactions (Audit Log)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS inventory_transactions (
                transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                item_id UUID NOT NULL REFERENCES inventory_items(item_id) ON DELETE CASCADE,
                type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'damage')),
                quantity INT NOT NULL,
                reason TEXT,
                performed_by UUID, -- User ID
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_trans_item ON inventory_transactions(item_id);
        """)
        return {"message": "Inventory tables initialized"}

# --- Endpoints ---

@router.get("/items", response_model=List[dict])
async def list_items(
    category: Optional[str] = None,
    low_stock: bool = False,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        # Check & Init
        await conn.execute("CREATE TABLE IF NOT EXISTS inventory_items (item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL, category VARCHAR(50) NOT NULL, quantity INT NOT NULL DEFAULT 0, unit VARCHAR(20) DEFAULT 'pcs', cost_per_unit NUMERIC(10, 2) DEFAULT 0.00, low_stock_threshold INT DEFAULT 10, supplier_name VARCHAR(100), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());")
        
        query = "SELECT * FROM inventory_items WHERE 1=1"
        params = []
        i = 1
        
        if category:
            query += f" AND category = ${i}"
            params.append(category)
            i += 1
            
        if low_stock:
            query += " AND quantity <= low_stock_threshold"
            
        query += " ORDER BY name"
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

@router.post("/items")
async def create_item(
    item: ItemCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO inventory_items (name, category, quantity, unit, cost_per_unit, low_stock_threshold, supplier_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        """, item.name, item.category, item.quantity, item.unit, item.cost_per_unit, item.low_stock_threshold, item.supplier_name)
        return dict(row)

@router.post("/adjust")
async def adjust_stock(
    data: StockAdjustment,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Get current stock
            current = await conn.fetchval("SELECT quantity FROM inventory_items WHERE item_id = $1", data.item_id)
            if current is None:
                raise HTTPException(404, "Item not found")
            
            # Calc new stock
            new_qty = current
            if data.type == 'in':
                new_qty += data.quantity
            elif data.type in ('out', 'damage'):
                if current < data.quantity:
                    raise HTTPException(400, "Insufficient stock")
                new_qty -= data.quantity
                
            # Update Item
            await conn.execute("UPDATE inventory_items SET quantity = $1, updated_at = NOW() WHERE item_id = $2", new_qty, data.item_id)
            
            # Log Transaction
            await conn.execute("""
                INSERT INTO inventory_transactions (item_id, type, quantity, reason, performed_by)
                VALUES ($1, $2, $3, $4, $5)
            """, data.item_id, data.type, data.quantity, data.reason, current_user['user_id'])
            
            return {"success": True, "new_quantity": new_qty}

@router.get("/transactions", response_model=List[dict])
async def list_transactions(
    limit: int = 50,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    """List recent inventory transactions"""
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT 
                t.*, 
                i.name as item_name, 
                i.unit,
                u.full_name as performed_by_name
            FROM inventory_transactions t
            JOIN inventory_items i ON t.item_id = i.item_id
            LEFT JOIN tenant_users u ON t.performed_by = u.user_id
            ORDER BY t.created_at DESC
            LIMIT $1
        """, limit)
        return [dict(row) for row in rows]
