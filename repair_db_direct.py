#!/usr/bin/env python3
"""
Direct database repair script - Run this locally to fix the master schema
"""
import asyncio
import asyncpg
import os

# Your Neon database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_SLGA6opCf8Rb@ep-wandering-block-ahqrebzm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require")

async def main():
    print("🔧 Connecting to database...")
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connected!")
        
        # Create user_role enum
        try:
            await conn.execute("CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');")
            print("✅ Created user_role type")
        except Exception as e:
            print(f"⚠️  user_role type: {str(e)[:50]}")
        
        # Create tenant_users table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS tenant_users (
                user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
                email VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                role user_role NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                profile_id UUID,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_login TIMESTAMPTZ,
                UNIQUE(email, tenant_id)
            );
        """)
        print("✅ Created/verified tenant_users table")
        
        # Create indexes
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);")
        print("✅ Created indexes")
        
        await conn.close()
        print("\n🎉 DATABASE REPAIR COMPLETE!")
        print("👉 Now refresh your dashboard - all errors should be gone!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
