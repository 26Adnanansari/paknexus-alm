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
        subdomain = input("Enter tenant subdomain (e.g. 'demo', 'school'): ").strip()
        if not subdomain:
            print("⚠️ No subdomain provided.")
            return

        # Find tenant schema
        row = await conn.fetchrow("SELECT schema_name FROM tenants WHERE subdomain = $1", subdomain)
        if not row:
            print(f"❌ Tenant '{subdomain}' not found!")
            return
            
        schema = row['schema_name']
        print(f"✅ Found schema: {schema}")
        
        # Switch to tenant schema
        await conn.execute(f"SET search_path TO {schema}")
        
        # 2. Create Tables (Idempotent)
        print("🛠️  Ensuring tables exist...")
        await conn.execute("""
            -- Classes
            CREATE TABLE IF NOT EXISTS classes (
                class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                class_name VARCHAR(50) NOT NULL,
                section VARCHAR(10),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(class_name, section)
            );

            -- Staff
            CREATE TABLE IF NOT EXISTS staff (
                staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Note: API uses 'teacher_id' alias in joins sometimes
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                role VARCHAR(20) DEFAULT 'teacher',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            -- Students
            CREATE TABLE IF NOT EXISTS students (
                student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                full_name VARCHAR(100) NOT NULL,
                roll_no VARCHAR(20),
                class_id UUID REFERENCES classes(class_id),
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            -- Subjects
            CREATE TABLE IF NOT EXISTS subjects (
                subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                subject_name VARCHAR(100) NOT NULL,
                class_id UUID REFERENCES classes(class_id), -- Optional: subject specific to class?
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            -- Periods
            CREATE TABLE IF NOT EXISTS school_periods (
                period_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(50) NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                order_index INT NOT NULL,
                is_break BOOLEAN DEFAULT FALSE
            );

            -- Timetable
            CREATE TABLE IF NOT EXISTS timetable_allocations (
                allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                class_id UUID REFERENCES classes(class_id),
                period_id UUID REFERENCES school_periods(period_id),
                teacher_id UUID REFERENCES staff(staff_id),
                subject_id UUID REFERENCES subjects(subject_id),
                day_of_week VARCHAR(20) NOT NULL, -- Monday, Tuesday...
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
                cid = await conn.fetchval("""
                    INSERT INTO classes (class_name, section) VALUES ($1, $2)
                    ON CONFLICT (class_name, section) DO UPDATE SET class_name = EXCLUDED.class_name
                    RETURNING class_id
                """, cls, sec)
                class_ids.append(cid)

        # Teachers
        print("👨‍🏫 Inserting Teachers...")
        teacher_ids = []
        for name in TEACHERS:
            tid = await conn.fetchval("""
                INSERT INTO staff (full_name, role) VALUES ($1, 'teacher')
                RETURNING staff_id
            """, name) # We use simple insert, assuming no conflict on name for now
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
        
        for cid in class_ids:
            # Add 5 students per class
            for _ in range(STUDENTS_PER_CLASS):
                fname = f"{random.choice(first_names)} {random.choice(last_names)}"
                await conn.execute("""
                    INSERT INTO students (full_name, class_id, roll_no) 
                    VALUES ($1, $2, $3)
                """, fname, cid, str(random.randint(1, 1000)))

        # Periods
        print("⏰ Inserting Periods...")
        periods = [
            ("1st Period", "08:00", "08:40"),
            ("2nd Period", "08:40", "09:20"),
            ("3rd Period", "09:20", "10:00"),
            ("Break", "10:00", "10:20"),
            ("4th Period", "10:20", "11:00"),
            ("5th Period", "11:00", "11:40"),
            ("6th Period", "11:40", "12:20")
        ]
        
        period_ids = []
        for idx, (name, start, end) in enumerate(periods):
            pid = await conn.fetchval("""
                INSERT INTO school_periods (name, start_time, end_time, order_index, is_break)
                VALUES ($1, $2::time, $3::time, $4, $5)
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
