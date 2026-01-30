import asyncio
import asyncpg
import os
import sys

# Standalone Env Loader
def load_env(path=".env"):
    if not os.path.exists(path):
        return
    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

# Load Env
load_env()
load_env(os.path.join(os.getcwd(), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("MASTER_DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env")
    sys.exit(1)

EXPECTED_TABLES = {
    "classes", "staff", "students", "subjects", 
    "school_periods", "timetable_allocations", 
    "attendance_sessions", "attendance_records", 
    "student_documents"
}

async def verify():
    print(f"🔌 Connecting to Database...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return

    try:
        # 1. Check Tenants
        print("\n🔍 Checking Tenants...")
        tenants = await conn.fetch("SELECT tenant_id, subdomain, name FROM tenants")
        print(f"Found {len(tenants)} tenants.")
        
        for t in tenants:
            tid = str(t['tenant_id'])
            name = t['name']
            schema = f"tenant_{tid.replace('-', '')}"
            print(f"\n  🏢 Tenant: {name} ({t['subdomain']})")
            print(f"     Schema: {schema}")
            
            # Check if schema exists
            exists = await conn.fetchval(
                "SELECT 1 FROM information_schema.schemata WHERE schema_name = $1", schema
            )
            
            if not exists:
                print("     ❌ Schema does NOT exist!")
                continue
                
            print("     ✅ Schema exists.")
            
            # Check Tables
            tables = await conn.fetch(
                f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{schema}'"
            )
            found_tables = {row['table_name'] for row in tables}
            
            missing = EXPECTED_TABLES - found_tables
            if missing:
                print(f"     ⚠️  Missing Tables: {missing}")
                print(f"     Found: {found_tables}")
            else:
                print(f"     ✅ All {len(EXPECTED_TABLES)} core tables present.")
                
        print("\n✅ Verification Complete.")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(verify())
