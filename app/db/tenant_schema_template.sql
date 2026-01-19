-- Tenant Database Schema Template for School Management System
-- This schema is applied to each tenant's isolated Supabase/NeonDB database

-- ============================================================================
-- STUDENTS TABLE
-- ============================================================================
CREATE TABLE students (
    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Personal Information
    full_name VARCHAR(200) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    blood_group VARCHAR(5),
    photo_url TEXT,
    
    -- Academic Information
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    admission_date DATE NOT NULL,
    current_class VARCHAR(50),
    current_section VARCHAR(10),
    roll_number VARCHAR(20),
    
    -- Guardian Information
    father_name VARCHAR(200),
    father_phone VARCHAR(20),
    mother_name VARCHAR(200),
    mother_phone VARCHAR(20),
    guardian_email VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'alumni', 'transferred', 'withdrawn')),
    status_date DATE DEFAULT CURRENT_DATE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

CREATE INDEX idx_students_admission_number ON students(admission_number);
CREATE INDEX idx_students_class_section ON students(current_class, current_section);
CREATE INDEX idx_students_status ON students(status);

-- ============================================================================
-- STAFF TABLE
-- ============================================================================
CREATE TABLE staff (
    staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    designation VARCHAR(100),
    department VARCHAR(100),
    join_date DATE NOT NULL,
    
    -- Contact Details
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    
    -- Professional Details
    qualifications TEXT,
    specialization VARCHAR(200),
    
    -- Financial (encrypted in application layer if needed)
    salary_amount DECIMAL(10, 2),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    
    -- System Access
    role VARCHAR(50) CHECK (role IN ('teacher', 'admin', 'accountant', 'principal')),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_employee_id ON staff(employee_id);
CREATE INDEX idx_staff_role ON staff(role);

-- ============================================================================
-- CLASSES TABLE
-- ============================================================================
CREATE TABLE classes (
    class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    class_name VARCHAR(50) NOT NULL,  -- e.g., "Grade 5"
    section VARCHAR(10),  -- A, B, C
    class_teacher_id UUID REFERENCES staff(staff_id),
    room_number VARCHAR(20),
    capacity INTEGER,
    academic_year VARCHAR(20) NOT NULL,  -- e.g., "2024-2025"
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(class_name, section, academic_year)
);

-- ============================================================================
-- SUBJECTS TABLE
-- ============================================================================
CREATE TABLE subjects (
    subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CLASS_SUBJECTS (Many-to-Many)
-- ============================================================================
CREATE TABLE class_subjects (
    class_id UUID REFERENCES classes(class_id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(subject_id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES staff(staff_id),
    PRIMARY KEY (class_id, subject_id)
);

-- ============================================================================
-- ATTENDANCE TABLE
-- ============================================================================
CREATE TABLE attendance (
    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    period_number INTEGER,  -- Optional: for period-wise tracking
    
    marked_by UUID REFERENCES staff(staff_id),
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT,
    
    UNIQUE(student_id, date, period_number)
);

CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_status ON attendance(status);

-- ============================================================================
-- FEE STRUCTURE TABLE
-- ============================================================================
CREATE TABLE fee_structure (
    fee_structure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    fee_type VARCHAR(50) NOT NULL CHECK (fee_type IN ('tuition', 'transport', 'exam', 'library', 'sports', 'other')),
    
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fee_structure_student ON fee_structure(student_id);

-- ============================================================================
-- FEE PAYMENTS TABLE
-- ============================================================================
CREATE TABLE fee_payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structure(fee_structure_id),
    
    payment_date DATE NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'online')),
    receipt_number VARCHAR(100) UNIQUE,
    
    collected_by UUID REFERENCES staff(staff_id),
    remarks TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_date ON fee_payments(payment_date);

-- ============================================================================
-- EXAMINATIONS TABLE
-- ============================================================================
CREATE TABLE examinations (
    exam_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    exam_name VARCHAR(200) NOT NULL,  -- e.g., "Mid-Term Exam"
    academic_year VARCHAR(20) NOT NULL,
    exam_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EXAM SCHEDULE TABLE
-- ============================================================================
CREATE TABLE exam_schedule (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    exam_id UUID REFERENCES examinations(exam_id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(subject_id),
    class_id UUID REFERENCES classes(class_id),
    
    exam_date DATE NOT NULL,
    start_time TIME,
    duration_minutes INTEGER,
    total_marks INTEGER NOT NULL,
    passing_marks INTEGER NOT NULL,
    
    UNIQUE(exam_id, subject_id, class_id)
);

-- ============================================================================
-- EXAM RESULTS TABLE
-- ============================================================================
CREATE TABLE exam_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES exam_schedule(schedule_id) ON DELETE CASCADE,
    
    marks_obtained DECIMAL(5, 2) NOT NULL,
    grade VARCHAR(5),
    remarks TEXT,
    
    entered_by UUID REFERENCES staff(staff_id),
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, schedule_id)
);

CREATE INDEX idx_exam_results_student ON exam_results(student_id);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Outstanding Fees View
CREATE VIEW v_outstanding_fees AS
SELECT 
    s.student_id,
    s.full_name,
    s.admission_number,
    fs.fee_type,
    fs.amount AS total_due,
    COALESCE(SUM(fp.amount_paid), 0) AS total_paid,
    fs.amount - COALESCE(SUM(fp.amount_paid), 0) AS outstanding,
    fs.due_date
FROM students s
JOIN fee_structure fs ON s.student_id = fs.student_id
LEFT JOIN fee_payments fp ON fs.fee_structure_id = fp.fee_structure_id
GROUP BY s.student_id, s.full_name, s.admission_number, fs.fee_structure_id, fs.fee_type, fs.amount, fs.due_date
HAVING fs.amount - COALESCE(SUM(fp.amount_paid), 0) > 0;

-- Student Performance View
CREATE VIEW v_student_performance AS
SELECT 
    s.student_id,
    s.full_name,
    s.admission_number,
    s.current_class,
    e.exam_name,
    sub.subject_name,
    er.marks_obtained,
    es.total_marks,
    er.grade,
    ROUND((er.marks_obtained / es.total_marks) * 100, 2) AS percentage
FROM students s
JOIN exam_results er ON s.student_id = er.student_id
JOIN exam_schedule es ON er.schedule_id = es.schedule_id
JOIN examinations e ON es.exam_id = e.exam_id
JOIN subjects sub ON es.subject_id = sub.subject_id;

-- Attendance Summary View
CREATE VIEW v_attendance_summary AS
SELECT 
    s.student_id,
    s.full_name,
    s.admission_number,
    s.current_class,
    COUNT(*) FILTER (WHERE a.status = 'present') AS days_present,
    COUNT(*) FILTER (WHERE a.status = 'absent') AS days_absent,
    COUNT(*) AS total_days,
    ROUND(
        (COUNT(*) FILTER (WHERE a.status = 'present')::DECIMAL / COUNT(*)) * 100, 
        2
    ) AS attendance_percentage
FROM students s
LEFT JOIN attendance a ON s.student_id = a.student_id
GROUP BY s.student_id, s.full_name, s.admission_number, s.current_class;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy: Teachers can only see their assigned classes
-- (In production, implement based on authenticated user's role)
-- CREATE POLICY "Teachers see their students" ON students
-- FOR SELECT
-- USING (current_class IN (
--     SELECT class_name FROM classes WHERE class_teacher_id = auth.uid()
-- ));
