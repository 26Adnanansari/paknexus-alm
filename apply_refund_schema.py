import asyncio
import logging
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
            tenants = await conn.fetch("SELECT tenant_id, name FROM tenants")
    except Exception as e:
        logger.error(f"Failed to fetch tenants: {e}")
        return

    logger.info(f"Found {len(tenants)} tenants to migrate.")
    
    # 3. Apply to each tenant
    # Note: In a real/deployment scenario, we use the Factory or a specific migration tool.
    # Here we are using the codebase's existing pattern or simulating it.
    from app.core.database import TenantDatabaseFactory

    for tenant in tenants:
        tenant_name = tenant['name']
        logger.info(f"Migrating tenant: {tenant_name}...")
        
        try:
            tenant_pool = await TenantDatabaseFactory.get_pool_for_tenant(tenant['tenant_id'])
            async with tenant_pool.acquire() as tenant_conn:
                await tenant_conn.execute(schema_sql)
            logger.info(f"Successfully migrated {tenant_name}")
        except Exception as e:
            logger.error(f"Failed to migrate {tenant_name}: {e}")

    logger.info("Refund Migration complete.")

if __name__ == "__main__":
    asyncio.run(apply_refund_migration())
