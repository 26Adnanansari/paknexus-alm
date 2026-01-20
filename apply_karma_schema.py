import asyncio
import logging
import asyncpg
from app.core.config import settings
from app.core.database import get_master_db_pool

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def apply_karma_migration():
    """
    Applies the karma_schema.sql to all available tenant databases.
    """
    logger.info("Starting Nexus Karma migration...")
    
    # 1. Read schema file
    try:
        with open("app/db/karma_schema.sql", "r") as f:
            schema_sql = f.read()
    except FileNotFoundError:
        logger.error("karma_schema.sql not found!")
        return

    # 2. Get all tenants from master DB
    master_pool = await get_master_db_pool()
    
    async with master_pool.acquire() as conn:
        tenants = await conn.fetch("SELECT tenant_id, name, supabase_project_url, supabase_service_key FROM tenants")
        
    logger.info(f"Found {len(tenants)} tenants to migrate.")
    
    # 3. Apply to each tenant
    for tenant in tenants:
        tenant_name = tenant['name']
        logger.info(f"Migrating tenant: {tenant_name}...")
        
        # Construct DB connection string for the tenant (Using service role / admin credentials)
        # Assuming the connection info is stored or constructed similarly to TenantDatabaseFactory
        # For this script, we'll try to use the project URL to derive the DSN if possible, 
        # OR just use a known pattern if strictly defined. 
        # However, looking at codebase, we usually use a Factory. 
        # Let's try to simulate what TenantDatabaseFactory does or import it.
        
        # Since I can't easily see TenantDatabaseFactory internal logic for DSN construction right now without viewing it,
        # I will check if I can import TenantDatabaseFactory and use `get_pool_for_tenant`.
        
        try:
            from app.core.database import TenantDatabaseFactory
            
            # This might create a pool only if it doesn't verify the DSN in a way that blocks us.
            # Usually creates a pool based on tenant_id lookup or passed credentials.
            # Let's attempt to use the factory.
            tenant_pool = await TenantDatabaseFactory.get_pool_for_tenant(tenant['tenant_id'])
            
            async with tenant_pool.acquire() as tenant_conn:
                await tenant_conn.execute(schema_sql)
                # Seed some default badges
                await tenant_conn.execute("""
                    INSERT INTO badges (name, description, icon_name, criteria)
                    VALUES 
                    ('Early Bird', 'Arrive on time for 30 consecutive days', 'Sun', '{"attendance_streak": 30}'),
                    ('Homework Hero', 'Submit all assignments on time for a month', 'Book', '{"submissions": 100}'),
                    ('Top Scorer', 'Achieve 90% or above in exams', 'Award', '{"grade": "A+"}')
                    ON CONFLICT (name) DO NOTHING;
                """)
                
            logger.info(f"Successfully migrated {tenant_name}")
            
        except Exception as e:
            logger.error(f"Failed to migrate {tenant_name}: {e}")

    logger.info("Migration complete.")

if __name__ == "__main__":
    asyncio.run(apply_karma_migration())
