import asyncio
import os
import asyncpg
import uuid
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

TEMPLATE_PATH = "app/db/tenant_schema_template.sql"

async def init_tenant_schemas():
    print(f"Connecting to Master DB...")
    try:
        pool = await asyncpg.create_pool(DATABASE_URL)
    except Exception as e:
        print(f"Failed to connect to master: {e}")
        return

    # Read the SQL template
    try:
        with open(TEMPLATE_PATH, 'r') as f:
            sql_template = f.read()
    except Exception as e:
        print(f"Error reading template SQL: {e}")
        return

    async with pool.acquire() as conn:
        # Fetch all active tenants
        tenants = await conn.fetch("SELECT tenant_id, name, supabase_url FROM tenants")
        
        print(f"Found {len(tenants)} tenants to initialize.")

        for tenant in tenants:
            t_id = str(tenant['tenant_id'])
            t_name = tenant['name']
            
            # Derive schema name logic (Must match deps.py!)
            schema_name = f"tenant_{t_id.replace('-', '')}"
            print(f"\nProcessing: {t_name} -> Schema: {schema_name}")

            # Connect to Tenant DB (which is just Master for now)
            # We must use a separate connection to manipulate schemas safely?
            # Or just use the pool if it points to the same DB.
            # tenant['supabase_url'] should be same as Master URL.
            
            db_conn_str = tenant['supabase_url']
            if not db_conn_str:
                print("Skipping (No DB URL)")
                continue

            try:
                # Use a fresh connection for the migration
                t_conn = await asyncpg.connect(db_conn_str)
                
                # 1. Create Schema
                await t_conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}";')
                print(f"✓ Schema verified.")

                # 2. Set search path for this session
                await t_conn.execute(f'SET search_path TO "{schema_name}";')
                
                # 3. Check if 'students' table exists to avoid re-running heavy SQL if not needed
                # (Simple check)
                exists = await t_conn.fetchval(f"""
                    SELECT 1 
                    FROM information_schema.tables 
                    WHERE table_schema = '{schema_name}' AND table_name = 'students'
                """)
                
                if exists:
                    print("✓ Tables already exist. Skipping creation.")
                else:
                    print("Creating tables...")
                    # Execute the massive SQL block
                    await t_conn.execute(sql_template)
                    print("✓ Tables CREATED successfully.")

                await t_conn.close()
                
            except Exception as e:
                print(f"❌ Failed to initialize schema for {t_name}: {e}")

    await pool.close()
    print("\nDone. Please REDEPLOY the backend to apply code changes.")

if __name__ == "__main__":
    asyncio.run(init_tenant_schemas())
