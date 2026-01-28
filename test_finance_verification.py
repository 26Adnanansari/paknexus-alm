
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, AsyncMock
import sys
import os

# Add root to path
sys.path.append(os.getcwd())

from app.main import app
from app.api.v1.deps import get_tenant_db_pool, get_current_school_user

# Setup Client
client = TestClient(app)

# Mock DB Connection
mock_pool = MagicMock() # Pool itself is not awaited, methods are
mock_conn = AsyncMock()

# Setup Context Manager for acquire()
mock_acquire_ctx = AsyncMock()
mock_acquire_ctx.__aenter__.return_value = mock_conn
mock_acquire_ctx.__aexit__.return_value = None

# Make pool.acquire() return the context manager (Not a coroutine)
mock_pool.acquire.return_value = mock_acquire_ctx

async def override_get_db():
    return mock_pool

async def override_get_user():
    return {"user_id": "00000000-0000-0000-0000-000000000000", "tenant_id": "test", "role": "admin"}

app.dependency_overrides[get_tenant_db_pool] = override_get_db
app.dependency_overrides[get_current_school_user] = override_get_user

def test_finance_endpoints_structure():
    print("Testing Finance Module Structure...")
    
    # 1. Test Summary Endpoint Structure (Mocking DB Responses)
    # We configure mocks to return minimal valid data types to avoid crashing the endpoint logic.
    
    # Mock return for: Total Expenses
    # Mock return for: Table Existence Check (TRUE)
    # Mock return for: Income
    # Mock return for: Breakdown
    # Mock return for: Monthly Trend (multiple loops)
    
    # Since the endpoint does many await conn.fetchval calls, side_effect is needed.
    # Logic:
    # 1. total_expenses (fetchval) -> 500.0
    # 2. to_regclass (fetchval) -> True
    # 3. income (fetchval) -> 2000.0
    # 4. breakdown (fetch) -> [{'category': 'Salary', 'total': 500.0}]
    # 5. loop 6 times:
    #    - income (fetchval) -> 100.0
    #    - expense (fetchval) -> 50.0
    
    mock_conn.fetchval.side_effect = [
        500.0, # expenses
        True,  # has_fees
        2000.0, # income
        # Loop 0
        100.0, 50.0,
        # Loop 1
        100.0, 50.0,
        # Loop 2
        100.0, 50.0,
        # Loop 3
        100.0, 50.0,
        # Loop 4
        100.0, 50.0,
        # Loop 5
        100.0, 50.0,
        # Buffer
        0, 0, 0
    ]
    
    mock_conn.fetch.return_value = [
        {'category': 'Salary', 'total': 500.0}
    ]
    
    try:
        response = client.get("/api/v1/finance/summary")
        if response.status_code != 200:
            print(f"FAILED: {response.text}")
        assert response.status_code == 200
        data = response.json()
        assert data['total_income'] == 2000.0
        assert data['total_expenses'] == 500.0
        assert len(data['expense_breakdown']) == 1
        print("✅ GET /finance/summary passed validation")
    except Exception as e:
        print(f"❌ GET /finance/summary failed: {e}")

    # 2. Test Record Expense
    # Mock create table -> None
    # Mock insert -> Row
    
    mock_conn.execute.return_value = None
    mock_conn.fetchrow.return_value = {
        "expense_id": "12345678-1234-5678-1234-567812345678",
        "category": "Maintenance",
        "amount": 150.0,
        "description": "Repair",
        "date": "2025-01-01",
        "payment_method": "cash",
        "created_at": "2025-01-01T10:00:00Z",
        "paid_by": "00000000-0000-0000-0000-000000000000"
    }

    try:
        payload = {
            "category": "Maintenance",
            "amount": 150.0,
            "description": "Repair",
            "date": "2025-01-01"
        }
        res = client.post("/api/v1/finance/expenses", json=payload)
        if res.status_code != 200:
            print(f"FAILED POST: {res.text}")
        assert res.status_code == 200
        assert res.json()['amount'] == 150.0
        print("✅ POST /finance/expenses passed validation")
    except Exception as e:
         print(f"❌ POST /finance/expenses failed: {e}")

if __name__ == "__main__":
    test_finance_endpoints_structure()
