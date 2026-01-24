import asyncio
import os
import asyncpg
import json
from dotenv import load_dotenv

load_dotenv()

# Match logic in app/core/config.py
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    MASTER = os.getenv("MASTER_DATABASE_URL")
    if MASTER and MASTER.strip():
        DATABASE_URL = MASTER
    else:
        DATABASE_URL = os.getenv("LOCAL_DATABASE_URL")

if not DATABASE_URL:
    print("Error: Could not resolve DATABASE_URL.")
    exit(1)

async def debug_operations():
    print(f"Connecting to master database...")
    try:
        pool = await asyncpg.create_pool(DATABASE_URL)
        print("Connected to Master.")
    except Exception as e:
        print(f"Failed to connect to master: {e}")
        return

    async with pool.acquire() as conn:
        # 1. Fetch the first tenant to test with (assuming user is interacting with one of these)
        # We'll prioritize one that is 'active' or 'trial'
        tenant = await conn.fetchrow("""
            SELECT tenant_id, name, supabase_url, status 
            FROM tenants 
            LIMIT 1
        """)
        
        if not tenant:
            print("No tenants found in Master DB.")
            return

        print(f"\nTesting with Tenant: {tenant['name']}")
        print(f"Tenant ID: {tenant['tenant_id']}")
        print(f"Supabase URL (length): {len(tenant['supabase_url']) if tenant['supabase_url'] else 'NULL'}")

        if not tenant['supabase_url']:
            print("Error: supabase_url is NULL!")
            return
            
        tenant_db_url = tenant['supabase_url']

    # 2. Connect to Tenant DB
    print(f"\nConnecting to Tenant DB...")
    try:
        tenant_pool = await asyncpg.create_pool(tenant_db_url)
        print("Connected to Tenant DB.")
    except Exception as e:
        print(f"Failed to connect to tenant DB: {e}")
        return

    async with tenant_pool.acquire() as t_conn:
        # 3. Check Schema
        print("\nChecking 'students' table schema...")
        columns = await t_conn.fetch("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'students'
        """)
        
        if not columns:
            print("❌ Table 'students' DOES NOT EXIST in tenant DB!")
            # Should we create it?
            print("Attempting to create basic schema...")
            # Ideally load from tenant_schema_template.sql, but for now let's just create 'students' if missing.
            # But wait, if it's missing, ALL tables are likely missing.
        else:
            print("✓ Table 'students' exists.")
            print(f"Columns found: {[c['column_name'] for c in columns]}")
            
            # Check for specific columns we use in INSERT
            required = ['full_name', 'admission_number', 'date_of_birth', 'gender', 'current_class', 'father_name', 'father_phone']
            existing_cols = [c['column_name'] for c in columns]
            
            missing = [c for c in required if c not in existing_cols]
            if missing:
                print(f"❌ MISSING COLUMNS: {missing}")
                # Attempt repair?
                if 'father_phone' in missing and 'contact_phone' in existing_cols:
                    print("Note: 'contact_phone' exists, but code looks for 'father_phone'.")
                if 'father_phone' not in existing_cols and 'contact_phone' not in existing_cols:
                    print("Attempting to add missing columns...")
                    try:
                         for m in missing:
                             dtype = "VARCHAR(255)" if m in ['full_name', 'father_name', 'current_class'] else "VARCHAR(50)"
                             if m == 'date_of_birth': dtype = "DATE"
                             await t_conn.execute(f"ALTER TABLE students ADD COLUMN {m} {dtype}")
                         print("✓ Added missing columns.")
                    except Exception as e:
                        print(f"Failed to add columns: {e}")

        # 4. Attempt INSERT simulation
        print("\nSimulating INSERT operation...")
        try:
            # Generate random admission number to avoid collision
            import random
            adm_no = f"TEST-{random.randint(1000,9999)}"
            print(f"Using Admission No: {adm_no}")
            
            query = """
            INSERT INTO students (full_name, admission_number, date_of_birth, gender, current_class, father_name, father_phone)
            VALUES ($1, $2, $3::date, $4, $5, $6, $7)
            RETURNING student_id
            """
            # Note: casting date just in case
            row = await t_conn.fetchrow(
                query, 
                "Debug User", adm_no, "2013-01-01", 
                "Male", "5th", "Debug Father", "1234567890"
            )
            print(f"✓ INSERT SUCCESS! Student ID: {row['student_id']}")
            
            # Cleanup
            await t_conn.execute("DELETE FROM students WHERE admission_number = $1", adm_no)
            print("✓ Cleanup (Deleted test student)")
            
        except Exception as e:
            print(f"❌ INSERT FAILED: {e}")
            if "relation \"students\" does not exist" in str(e):
                 print("!!! The table truly doesn't exist. We need to initialize the tenant schema.")

    await tenant_pool.close()
    await pool.close()

if __name__ == "__main__":
    asyncio.run(debug_operations())
