import asyncio
import asyncpg
from app.core.database import get_master_db_pool
from app.core.security import SecurityService
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_dsn_decryption():
    print("Starting DSN debugging...")
    pool = await get_master_db_pool()
    
    async with pool.acquire() as conn:
        # Check available columns first to be safe
        print("Checking columns in 'tenants' table...")
        columns = await conn.fetch("SELECT column_name FROM information_schema.columns WHERE table_name = 'tenants'")
        col_names = [c['column_name'] for c in columns]
        print(f"Columns: {col_names}")

        query_cols = "tenant_id, name, supabase_project_url"
        # If 'supabase_url' exists, select it, otherwise ignore
        if 'supabase_url' in col_names:
             query_cols += ", supabase_url"
        
        tenants = await conn.fetch(f"SELECT {query_cols} FROM tenants")
        
        for tenant in tenants:
            name = tenant['name']
            encrypted_dsn = tenant['supabase_project_url']
            
            # Use safe get
            raw_url = tenant.get('supabase_url', 'N/A')

            print(f"\nScanning Tenant: {name} ({tenant['tenant_id']})")
            print(f"Stored URL (raw): {raw_url}")
            
            if not encrypted_dsn:
                print("❌ No encrypted DSN found in 'supabase_project_url'")
                continue
                
            try:
                decrypted = SecurityService.decrypt(encrypted_dsn)
                # print(f"✅ Decrypted DSN: {decrypted}") # printing sensitive info for debug only
                
                if decrypted.startswith('postgres'):
                     print("✅ Format looks correct (starts with postgres)")
                else:
                     print("❌ Invalid Format (does not start with postgres)")
                     print(f"Decrypted start: {decrypted[:10]}...")
                     
                # Test connection
                try:
                    conn_test = await asyncpg.connect(decrypted, timeout=5)
                    await conn_test.close()
                    print("✅ Connection Successful!")
                except Exception as e:
                    print(f"❌ Connection Failed: {e}")

            except Exception as e:
                print(f"❌ Decryption Failed: {e}")
                print(f"Raw encrypted value (snippet): {encrypted_dsn[:20]}...")

    await pool.close()

if __name__ == "__main__":
    asyncio.run(debug_dsn_decryption())
