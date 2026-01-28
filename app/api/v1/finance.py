"""
Financial Management API
Protocol Phase 4 Compliant
Handles Expenses and Financial Reports (Income vs Expense)
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime, timedelta
from pydantic import BaseModel, Field
import asyncpg
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---
class ExpenseCreate(BaseModel):
    category: str = Field(..., min_length=2) # Salary, Utility, Inventory, Maintenance, etc.
    amount: float = Field(..., gt=0)
    description: str
    date: date
    payment_method: str = "cash" # cash, bank, cheque, online

class ExpenseResponse(BaseModel):
    expense_id: UUID
    category: str
    amount: float
    description: str
    date: date
    payment_method: str
    created_at: datetime
    paid_by_name: Optional[str]

class FinancialSummary(BaseModel):
    total_income: float
    total_expenses: float
    net_profit: float
    expense_breakdown: List[dict] # {category: str, total: float}
    monthly_trend: List[dict] # {month: str, income: float, expense: float}

# --- Initialization ---
@router.post("/system/init")
async def init_finance_tables(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    try:
        async with pool.acquire() as conn:
            await conn.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS expenses (
                    expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    category VARCHAR(50) NOT NULL,
                    amount DECIMAL(12, 2) NOT NULL,
                    description TEXT,
                    date DATE NOT NULL,
                    payment_method VARCHAR(20) DEFAULT 'cash',
                    paid_by UUID, -- Staff ID
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    reference_id UUID -- For linking to Inventory Transactions or Transport
                );
                
                CREATE INDEX IF NOT EXISTS idx_expense_date ON expenses(date);
                CREATE INDEX IF NOT EXISTS idx_expense_cat ON expenses(category);
            """)
            return {"message": "Finance tables initialized"}
    except Exception as e:
        raise HTTPException(500, f"Init Failed: {e}")

# --- Endpoints ---

@router.post("/expenses", response_model=ExpenseResponse)
async def record_expense(
    data: ExpenseCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        # Check table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                category VARCHAR(50) NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                description TEXT, date DATE NOT NULL,
                payment_method VARCHAR(20) DEFAULT 'cash',
                paid_by UUID, created_at TIMESTAMPTZ DEFAULT NOW(), reference_id UUID
            );
        """)
        
        row = await conn.fetchrow("""
            INSERT INTO expenses (category, amount, description, date, payment_method, paid_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        """, data.category, data.amount, data.description, data.date, data.payment_method, current_user['user_id'])
        
        # Get User Name (mock or fetch)
        return {**dict(row), "paid_by_name": "Current User"} 

@router.get("/expenses", response_model=List[ExpenseResponse])
async def list_expenses(
    limit: int = 50,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM expenses ORDER BY date DESC LIMIT $1
        """, limit)
        return [dict(row) for row in rows]

@router.get("/summary", response_model=FinancialSummary)
async def get_financial_summary(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        # 1. Total Expenses
        total_expenses = await conn.fetchval("SELECT COALESCE(SUM(amount), 0) FROM expenses") or 0.0
        
        # 2. Total Income (from fee_payments)
        # Check if table fee_payments exists first
        income = 0.0
        has_fees = await conn.fetchval("SELECT to_regclass('fee_payments')")
        if has_fees:
            income = await conn.fetchval("SELECT COALESCE(SUM(amount_paid), 0) FROM fee_payments") or 0.0
            
        # 3. Expense Breakdown
        cat_rows = await conn.fetch("""
             SELECT category, SUM(amount) as total 
             FROM expenses 
             GROUP BY category
             ORDER BY total DESC
        """)
        breakdown = [{"category": r['category'], "total": float(r['total'])} for r in cat_rows]
        
        # 4. Monthly Trend (Income vs Expense) - Last 6 months
        # Complex query or multiple queries. Let's do simple separate queries for last 6 months.
        trend = []
        today = date.today()
        for i in range(5, -1, -1):
            # Calculate Month Start/End
            d = today.replace(day=1) 
            # Go back i months
            # Simplified subtraction logic:
            year = d.year
            month = d.month - i
            while month <= 0:
                month += 12
                year -= 1
            
            month_start = date(year, month, 1)
            # End of month
            next_month = month + 1
            next_year = year
            if next_month > 12:
                next_month = 1
                next_year += 1
            month_end = date(next_year, next_month, 1) - timedelta(days=1)
            
            month_name = month_start.strftime("%b %Y")
            
            # Period Income
            p_income = 0.0
            if has_fees:
                p_income = await conn.fetchval("""
                    SELECT COALESCE(SUM(amount_paid), 0) FROM fee_payments 
                    WHERE payment_date BETWEEN $1 AND $2
                """, month_start, month_end) or 0.0
            
            # Period Expense
            p_expense = await conn.fetchval("""
                SELECT COALESCE(SUM(amount), 0) FROM expenses 
                WHERE date BETWEEN $1 AND $2
            """, month_start, month_end) or 0.0
            
            trend.append({
                "month": month_name,
                "income": float(p_income),
                "expense": float(p_expense)
            })
            
        return {
            "total_income": float(income),
            "total_expenses": float(total_expenses),
            "net_profit": float(income) - float(total_expenses),
            "expense_breakdown": breakdown,
            "monthly_trend": trend
        }

@router.delete("/expenses/{id}")
async def delete_expense(
    id: UUID,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM expenses WHERE expense_id = $1", id)
        return {"success": True}
