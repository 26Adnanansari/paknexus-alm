"""
Library Management API
Protocol Phase 4 Compliant
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from uuid import UUID
from datetime import date, timedelta
from pydantic import BaseModel, Field
import asyncpg
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

# --- Models ---
class BookCreate(BaseModel):
    title: str = Field(..., min_length=2)
    author: str
    isbn: Optional[str] = None
    category: str = "General"
    total_copies: int = Field(1, gt=0)
    shelf_location: Optional[str] = None

class LoanCreate(BaseModel):
    student_id: UUID
    book_id: UUID
    days: int = 14 # Default loan period

class ReturnBook(BaseModel):
    transaction_id: UUID
    condition: str = "Good" # Good, Damaged, Lost

# --- DB Init ---
@router.post("/system/init")
async def init_library_tables(
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    async with pool.acquire() as conn:
        # 1. Books
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS library_books (
                book_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(200) NOT NULL,
                author VARCHAR(100) NOT NULL,
                isbn VARCHAR(20),
                category VARCHAR(50) DEFAULT 'General',
                total_copies INT NOT NULL DEFAULT 1,
                available_copies INT NOT NULL DEFAULT 1,
                shelf_location VARCHAR(50),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_lib_title ON library_books(title);
            CREATE INDEX IF NOT EXISTS idx_lib_cat ON library_books(category);
        """)

        # 2. Transactions (Loans)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS library_transactions (
                transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID NOT NULL, -- FK students
                book_id UUID NOT NULL REFERENCES library_books(book_id),
                issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
                due_date DATE NOT NULL,
                returned_date DATE,
                status VARCHAR(20) DEFAULT 'issued', -- issued, returned, lost
                fine_amount NUMERIC(10, 2) DEFAULT 0.00,
                remarks TEXT,
                issued_by UUID,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_lib_student ON library_transactions(student_id);
            CREATE INDEX IF NOT EXISTS idx_lib_status ON library_transactions(status);
        """)
        return {"message": "Library tables initialized"}

# --- Endpoints ---

@router.get("/books", response_model=List[dict])
async def list_books(
    search: Optional[str] = None,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        # Check tables exist (Lazy Init for dev speed, good for first run)
        await conn.execute("CREATE TABLE IF NOT EXISTS library_books (book_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(200) NOT NULL, author VARCHAR(100), isbn VARCHAR(20), category VARCHAR(50), total_copies INT DEFAULT 1, available_copies INT DEFAULT 1, shelf_location VARCHAR(50), created_at TIMESTAMPTZ DEFAULT NOW());")
        
        query = "SELECT * FROM library_books WHERE 1=1"
        params = []
        if search:
            query += " AND (title ILIKE $1 OR author ILIKE $1 OR isbn ILIKE $1)"
            params.append(f"%{search}%")
            
        query += " ORDER BY title LIMIT 50"
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

@router.post("/books")
async def add_book(
    book: BookCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO library_books (title, author, isbn, category, total_copies, available_copies, shelf_location)
            VALUES ($1, $2, $3, $4, $5, $5, $6)
            RETURNING *
        """, book.title, book.author, book.isbn, book.category, book.total_copies, book.shelf_location)
        return dict(row)

@router.post("/issue")
async def issue_book(
    loan: LoanCreate,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Check availability
            book = await conn.fetchrow("SELECT available_copies FROM library_books WHERE book_id = $1 FOR UPDATE", loan.book_id)
            if not book or book['available_copies'] < 1:
                raise HTTPException(400, "Book not available")
            
            # Check if student already has this book? (Optional, skipping for MVP)
            
            # Create Loan
            due_date = date.today() + timedelta(days=loan.days)
            await conn.execute("""
                INSERT INTO library_transactions (student_id, book_id, due_date, issued_by)
                VALUES ($1, $2, $3, $4)
            """, loan.student_id, loan.book_id, due_date, current_user['user_id'])
            
            # Update Stock
            await conn.execute("UPDATE library_books SET available_copies = available_copies - 1 WHERE book_id = $1", loan.book_id)
            
            return {"success": True, "due_date": due_date}

@router.get("/loans", response_model=List[dict])
async def list_loans(
    status: str = 'issued',
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        # Join with Book and Student
        query = """
            SELECT lt.*, lb.title, lb.author, s.full_name as student_name, s.admission_number,
                   (CURRENT_DATE > lt.due_date) as is_overdue
            FROM library_transactions lt
            JOIN library_books lb ON lt.book_id = lb.book_id
            JOIN students s ON lt.student_id = s.student_id
            WHERE lt.status = $1
            ORDER BY lt.due_date ASC
        """
        rows = await conn.fetch(query, status)
        return [dict(row) for row in rows]

@router.post("/return")
async def return_book(
    data: ReturnBook,
    pool: asyncpg.Pool = Depends(get_tenant_db_pool),
    current_user: dict = Depends(get_current_school_user)
):
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Get Loan
            loan = await conn.fetchrow("SELECT book_id, due_date, status FROM library_transactions WHERE transaction_id = $1", data.transaction_id)
            if not loan:
                raise HTTPException(404, "Transaction not found")
            if loan['status'] == 'returned':
                raise HTTPException(400, "Already returned")
                
            # Calc Fine (e.g. 10 units per day late)
            fine = 0.0
            today = date.today()
            if today > loan['due_date']:
                overdue_days = (today - loan['due_date']).days
                fine = overdue_days * 10.0 # Configurable?
            
            if data.condition == 'Lost':
                # Handle lost book logic (Charge full price?) - MVP just marks it
                pass

            # Update Transaction
            await conn.execute("""
                UPDATE library_transactions 
                SET returned_date = $1, status = 'returned', fine_amount = $2, remarks = $3
                WHERE transaction_id = $4
            """, today, fine, data.condition, data.transaction_id)
            
            # Update Stock
            await conn.execute("UPDATE library_books SET available_copies = available_copies + 1 WHERE book_id = $1", loan['book_id'])
            
            return {"success": True, "fine": fine}
