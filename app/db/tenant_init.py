import asyncpg
import logging

logger = logging.getLogger("app.db.tenant_init")

async def init_tenant_schema(conn: asyncpg.Connection, schema_name: str):
    """
    Initialize the database schema for a new tenant.
    This creates the schema itself and all necessary tables.
    """
    logger.info(f"Initializing schema for {schema_name}")
    
    # 1. Create Schema
    await conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"')
    
    # 2. Set Search Path for this transaction/connection
    await conn.execute(f'SET search_path TO "{schema_name}"')
    
    # 3. Create Tables
    # We use a large block for transactions, or individual executes.
    # Individual executes are better for debugging.
    
    # Classes
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS classes (
            class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            class_name VARCHAR(50) NOT NULL,
            section VARCHAR(10),
            academic_year VARCHAR(20) DEFAULT '2025-2026',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(class_name, section)
        );
    """)

    # Staff
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS staff (
            staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            role VARCHAR(20) DEFAULT 'teacher',
            employee_id VARCHAR(50) UNIQUE,
            join_date DATE DEFAULT CURRENT_DATE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    # Students
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS students (
            student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(100) NOT NULL,
            current_class VARCHAR(50),
            current_section VARCHAR(50),
            roll_number VARCHAR(20),
            admission_number VARCHAR(50) UNIQUE,
            admission_date DATE,
            date_of_birth DATE,
            gender VARCHAR(20),
            status VARCHAR(20) DEFAULT 'active',
            status_date DATE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    # Subjects
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            subject_name VARCHAR(100) NOT NULL,
            class_id UUID,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    # Periods
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS school_periods (
            period_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            order_index INT NOT NULL,
            is_break BOOLEAN DEFAULT FALSE
        );
    """)

    # Timetable Allocations
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS timetable_allocations (
            allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            class_id UUID,
            period_id UUID,
            teacher_id UUID,
            subject_id UUID,
            day_of_week VARCHAR(20) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(class_id, period_id, day_of_week)
        );
    """)
    
    # Attendance Sessions
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS attendance_sessions (
            session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            class_id UUID NOT NULL, 
            period_id UUID NOT NULL, 
            date DATE NOT NULL,
            subject_id UUID,
            teacher_id UUID,
            marked_by UUID,
            status VARCHAR(20) DEFAULT 'submitted',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(class_id, period_id, date)
        );
        CREATE INDEX IF NOT EXISTS idx_sess_date ON attendance_sessions(date);
        CREATE INDEX IF NOT EXISTS idx_sess_class ON attendance_sessions(class_id);
    """)

    # Attendance Records
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS attendance_records (
            record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID NOT NULL REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
            student_id UUID NOT NULL, 
            status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
            remarks TEXT,
            marked_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(session_id, student_id)
        );
        CREATE INDEX IF NOT EXISTS idx_rec_student ON attendance_records(student_id);
    """)

    # Student Documents
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS student_documents (
            document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
            title VARCHAR(100) NOT NULL,
            url TEXT NOT NULL,
            doc_type VARCHAR(50) DEFAULT 'other',
            uploaded_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    
    logger.info(f"Schema {schema_name} initialized successfully.")
