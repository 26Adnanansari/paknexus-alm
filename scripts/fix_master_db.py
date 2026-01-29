
import asyncio
import asyncpg
import os
import sys
import ssl

# Add parent dir to path to import app.core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Hardcoded fallback if import fails (to ensure script runs)
DATABASE_URL = "postgresql://neondb_owner:npg_SLGA6opCf8Rb@ep-wandering-block-ahqrebzm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

async def fix_master_db():
    print(f"Connecting to Master DB...")
    
    # Create SSL Context manually to avoid verification issues
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    conn = None
    try:
        conn = await asyncpg.connect(DATABASE_URL, ssl=ctx)
        print("Connected successfully!")
    except Exception as e:
        print(f"Connection with SSL Context failed: {e}")
        try:
            # Try without explicit context (asyncpg generic)
            conn = await asyncpg.connect(DATABASE_URL)
            print("Connected with default SSL!")
        except Exception as e2:
             print(f"All connection attempts failed. Error: {e2}")
             return

    try:
        # 1. Create Type user_role
        try:
            await conn.execute("CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');")
            print("Created type: user_role")
        except asyncpg.DuplicateObjectError:
            print("Type user_role already exists")
        except Exception as e:
            print(f"Note on type: {e}")

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
                profile_id UUID,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_login TIMESTAMPTZ,
                UNIQUE(email, tenant_id)
            );
        """)
        print("Ensured table: tenant_users")

        # 3. Create Indexes
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);")
        print("Ensured indexes for tenant_users")

    except Exception as e:
        print(f"Error during repair: {e}")
    finally:
        if conn:
            await conn.close()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(fix_master_db())
