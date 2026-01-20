import asyncio
import logging
import asyncpg
from app.core.config import settings
from app.core.database import get_master_db_pool

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def apply_refund_migration():
    """
    Applies the refund_schema.sql to all available tenant databases.
    """
    logger.info("Starting Refund Schema migration...")
    
    # 1. Read schema file
    try:
        with open("app/db/refund_schema.sql", "r") as f:
            schema_sql = f.read()
    except FileNotFoundError:
        logger.error("refund_schema.sql not found!")
        return

    # 2. Get all tenants from master DB
    try:
        master_pool = await get_master_db_pool()
        async with master_pool.acquire() as conn:
            tenants = await conn.fetch("SELECT tenant_id, name, supabase_project_url, supabase_service_key FROM tenants")
    except Exception as e:
        logger.error(f"Failed to fetch tenants: {e}")
        return

    logger.info(f"Found {len(tenants)} tenants to migrate.")
    
    # 3. Apply to each tenant
    for tenant in tenants:
        tenant_name = tenant['name']
        tenant_id = str(tenant['tenant_id'])
        url = tenant['supabase_project_url']
        
        logger.info(f"Migrating tenant: {tenant_name} ({tenant_id})")
        
        pool = None
        try:
            # Logic mirrored from TenantDatabaseFactory
            if url.startswith("shared_database_schema:"):
                schema_name = url.split(":")[1]
                logger.info(f"  - Using shared schema: {schema_name}")
                
                # Connect to master DB but set search_path
                pool = await asyncpg.create_pool(
                    settings.DATABASE_URL,
                    min_size=1,
                    max_size=2,
                    command_timeout=60,
                    init=lambda conn: conn.execute(f"SET search_path TO {schema_name}, public")
                )
            else:
                # Isolated Database
                logger.info(f"  - Using isolated database URL")
                pool = await asyncpg.create_pool(
                    url,
                    min_size=1,
                    max_size=2,
                    command_timeout=60
                )
            
            async with pool.acquire() as conn:
                await conn.execute(schema_sql)
                logger.info(f"  - [SUCCESS] Schema applied.")
                
        except Exception as e:
            logger.error(f"  - [FAILED] Migration failed for {tenant_name}: {e}")
        finally:
            if pool:
                await pool.close()

    logger.info("Refund Migration complete.")

if __name__ == "__main__":
    asyncio.run(apply_refund_migration())
