
import asyncio
import asyncpg
import os
import sys

# Add parent dir to path to import app.core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

async def fix_master_db():
    print(f"Connecting to Master DB: {settings.DATABASE_URL}...")
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL)
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    try:
        # 1. Create Type user_role
        try:
            await conn.execute("CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');")
            print("Created type: user_role")
        except asyncpg.DuplicateObjectError:
            print("Type user_role already exists")

        # 2. Create Table tenant_users
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS tenant_users (
                user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
                email VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                role user_role NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                
                -- Profile linkage
                profile_id UUID,
                
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_login TIMESTAMPTZ,
                
                -- Ensure email is unique within a tenant
                UNIQUE(email, tenant_id)
            );
        """)
        print("Ensured table: tenant_users")

        # 3. Create Indexes
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tenant_users_login ON tenant_users(email, tenant_id, is_active);")
        print("Ensured indexes for tenant_users")

    except Exception as e:
        print(f"Error during repair: {e}")
    finally:
        await conn.close()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(fix_master_db())
