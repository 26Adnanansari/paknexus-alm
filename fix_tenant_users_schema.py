"""
Fix tenant_users table schema - Remove incorrect UNIQUE constraints
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_schema():
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in environment")
        return
    
    print("🔧 Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL, ssl='require')
    
    try:
        # Set search path to public
        await conn.execute("SET search_path TO public")
        print("✅ Set search_path to public")
        
        # Drop incorrect UNIQUE constraints
        print("\n🔧 Fixing tenant_users table constraints...")
        
        # Drop the incorrect UNIQUE constraint on tenant_id
        try:
            await conn.execute("""
                ALTER TABLE tenant_users 
                DROP CONSTRAINT IF EXISTS tenant_users_tenant_id_key
            """)
            print("✅ Dropped incorrect UNIQUE constraint on tenant_id")
        except Exception as e:
            print(f"⚠️  Could not drop tenant_id constraint: {e}")
        
        # Drop the incorrect UNIQUE constraint on email
        try:
            await conn.execute("""
                ALTER TABLE tenant_users 
                DROP CONSTRAINT IF EXISTS tenant_users_email_key
            """)
            print("✅ Dropped incorrect UNIQUE constraint on email")
        except Exception as e:
            print(f"⚠️  Could not drop email constraint: {e}")
        
        # Verify the composite unique constraint exists
        constraint_check = await conn.fetchval("""
            SELECT COUNT(*) FROM information_schema.table_constraints
            WHERE constraint_name = 'tenant_users_email_tenant_id_key'
            AND table_name = 'tenant_users'
        """)
        
        if constraint_check > 0:
            print("✅ Composite UNIQUE(email, tenant_id) constraint exists")
        else:
            print("⚠️  Adding composite UNIQUE constraint...")
            await conn.execute("""
                ALTER TABLE tenant_users
                ADD CONSTRAINT tenant_users_email_tenant_id_key 
                UNIQUE(email, tenant_id)
            """)
            print("✅ Added composite UNIQUE(email, tenant_id) constraint")
        
        # Verify users
        users = await conn.fetch("""
            SELECT user_id, email, role, tenant_id, is_active
            FROM tenant_users
            ORDER BY created_at DESC
        """)
        
        print(f"\n📊 Found {len(users)} users in tenant_users:")
        for user in users:
            print(f"  - {user['email']} ({user['role']}) - Active: {user['is_active']}")
        
        print("\n✅ Schema fix complete!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await conn.close()
        print("🔌 Connection closed")

if __name__ == "__main__":
    asyncio.run(fix_schema())
