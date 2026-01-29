
import logging
import asyncpg

logger = logging.getLogger(__name__)

async def fix_master_schema(pool: asyncpg.Pool):
    """
    Self-healing function to ensure critical master tables exist.
    Run on application startup to prevent 500 errors if schema is drifted.
    """
    logger.info("Running Master Schema Repair...")
    try:
        async with pool.acquire() as conn:
            # 1. Create Type if missing (Postgres doesn't support IF NOT EXISTS for TYPE easily, so catch exception)
            try:
                await conn.execute("CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');")
            except asyncpg.DuplicateObjectError:
                pass # Already exists
            except Exception as e:
                # If it fails for other reasons (like type used), ignore
                logger.warning(f"Note on user_role type creation: {e}")

            # 2. Create tenant_users Table
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
            
            # 3. Create Indexes
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);")
            
            logger.info("Master Schema Repair Complete (tenant_users ensured).")
    except Exception as e:
        logger.error(f"Master Schema Repair Failed: {e}")
