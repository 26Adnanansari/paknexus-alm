import asyncio
import asyncpg
import os
import random
from datetime import date, timedelta
from uuid import uuid4

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not set")
    exit(1)

# Dummy Data Config
CLASSES = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]
SECTIONS = ["A", "B"]
SUBJECTS = ["Mathematics", "English", "Science", "Urdu", "Islamiat", "History", "Computer"]
TEACHERS = [
    "Sir Kamran", "Ms. Lubna", "Sir Farhan", "Ms. Hina", "Sir Adnan", 
    "Ms. Sara", "Sir Ali", "Ms. Fatima", "Sir Bilal", "Ms. Zainab"
]
STUDENTS_PER_CLASS = 5

async def populate():
    print("🚀 Starting Dummy Data Population...")
    
    # 1. Connect to DB (We'll use search_path='public' first to find tenant)
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Ask for tenant subdomain
        import sys
        if len(sys.argv) > 1:
            subdomain = sys.argv[1]
            print(f"Using subdomain from argument: {subdomain}")
        else:
            subdomain = input("Enter tenant subdomain (e.g. 'demo', 'school'): ").strip()
            
        if not subdomain:
            print("⚠️ No subdomain provided.")
            return

        await conn.execute("SET search_path TO public")
        
        # Find tenant ID
        row = await conn.fetchrow("SELECT tenant_id FROM tenants WHERE subdomain = $1", subdomain)
        if not row:
            print(f"❌ Tenant '{subdomain}' not found!")
            return
            
        tenant_id = str(row['tenant_id'])
        # DERIVE schema name: tenant_{uuid_no_dashes}
        schema = f"tenant_{tenant_id.replace('-', '')}"
        print(f"✅ Found tenant ID: {tenant_id}")
        print(f"✅ Target schema: {schema}")
        
        # Create schema if not exists
        await conn.execute(f"CREATE SCHEMA IF NOT EXISTS \"{schema}\"")
        
        # Switch to tenant schema
        await conn.execute(f"SET search_path TO \"{schema}\"")
        
        # 2. Create Tables (Idempotent)
        print("🛠️  Ensuring tables exist...")
        
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
                class_id UUID, -- Loose reference as class_id might not match valid FK if schema drifted
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

        # Timetable
        # We drop FK constraints for safety if schema is mixed
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

        # 3. Insert Data
        
        # Classes
        print("📚 Inserting Classes...")
        class_ids = []
        for cls in CLASSES:
            for sec in SECTIONS:
                # Check if exists
                cid = await conn.fetchval("SELECT class_id FROM classes WHERE class_name = $1 AND section = $2", cls, sec)
                
                if not cid:
                    cid = await conn.fetchval("""
                        INSERT INTO classes (class_name, section, academic_year) VALUES ($1, $2, '2025-2026')
                        RETURNING class_id
                    """, cls, sec)
                
                class_ids.append(cid)

        # Teachers
        print("👨‍🏫 Inserting Teachers...")
        teacher_ids = []
        for i, name in enumerate(TEACHERS):
            emp_id = f"EMP-{100+i}"
            tid = await conn.fetchval("""
                INSERT INTO staff (full_name, role, employee_id, join_date) VALUES ($1, 'teacher', $2, $3)
                ON CONFLICT (employee_id) DO UPDATE SET full_name = EXCLUDED.full_name
                RETURNING staff_id
            """, name, emp_id, date.today()) 
            teacher_ids.append(tid)

        # Subjects
        print("📖 Inserting Subjects...")
        subject_ids = []
        for sub in SUBJECTS:
            sid = await conn.fetchval("""
                INSERT INTO subjects (subject_name) VALUES ($1)
                RETURNING subject_id
            """, sub)
            subject_ids.append(sid)

        # Students
        print("Students...")
        first_names = ["Ali", "Ahmed", "Sara", "Fatima", "Zain", "Bilal", "Hina", "Omar", "Ayesha", "Usman"]
        last_names = ["Khan", "Malik", "Sheikh", "Raja", "Butt", "Qureshi", "Ansari", "Syed"]
        
        # We need class names/sections to map students
        class_info = [] # List of (class_name, section)
        for cls in CLASSES:
            for sec in SECTIONS:
                class_info.append((cls, sec))
        
        for idx, (cls_name, section) in enumerate(class_info):
            # Add 5 students per class
            for s_idx in range(STUDENTS_PER_CLASS):
                fname = f"{random.choice(first_names)} {random.choice(last_names)}"
                roll_no = str(random.randint(1000, 9999))
                adm_no = f"ADM-{2025}-{idx}-{s_idx}"
                
                await conn.execute("""
                    INSERT INTO students (
                        full_name, current_class, current_section, 
                        roll_number, admission_number, admission_date,
                        status, status_date, date_of_birth, gender
                    ) 
                    VALUES ($1, $2, $3, $4, $5, $6, 'active', $6, '2015-01-01', 'Male')
                    ON CONFLICT (admission_number) DO NOTHING
                """, fname, cls_name, section, roll_no, adm_no, date.today())

        # Periods
        print("⏰ Inserting Periods...")
        from datetime import time
        
        periods_data = [
            ("1st Period", time(8, 0), time(8, 40)),
            ("2nd Period", time(8, 40), time(9, 20)),
            ("3rd Period", time(9, 20), time(10, 0)),
            ("Break", time(10, 0), time(10, 20)),
            ("4th Period", time(10, 20), time(11, 0)),
            ("5th Period", time(11, 0), time(11, 40)),
            ("6th Period", time(11, 40), time(12, 20))
        ]
        
        period_ids = []
        for idx, (name, start, end) in enumerate(periods_data):
            pid = await conn.fetchval("""
                INSERT INTO school_periods (name, start_time, end_time, order_index, is_break)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING period_id
            """, name, start, end, idx+1, name == "Break")
            period_ids.append(pid)

        # Timetable (Monday to Friday)
        print("📅 Generating Timetable...")
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        
        for day in days:
            for cid in class_ids:
                for idx, pid in enumerate(period_ids):
                    # Skip break
                    if idx == 3: continue 
                    
                    tid = random.choice(teacher_ids)
                    sid = random.choice(subject_ids)
                    
                    # Insert allocation
                    await conn.execute("""
                        INSERT INTO timetable_allocations 
                        (class_id, period_id, teacher_id, subject_id, day_of_week)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT DO NOTHING
                    """, cid, pid, tid, sid, day)

        print("\n✅ Dummy Data Population Complete!")
        print(f"   - {len(class_ids)} Classes")
        print(f"   - {len(teacher_ids)} Teachers")
        print(f"   - {len(subject_ids)} Subjects")
        print(f"   - {len(class_ids) * STUDENTS_PER_CLASS} Students")
        print("   - Timetable Generated")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc() if 'traceback' in globals() else print(e)
    finally:
        await conn.close()

if __name__ == "__main__":
    populate()
    # Need to run with asyncio
    # Windows loop policy fix
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(populate())
