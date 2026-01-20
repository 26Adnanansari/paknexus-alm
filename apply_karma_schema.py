import asyncio
import logging
import asyncpg
from app.core.config import settings
from app.core.database import get_master_db_pool
from app.core.security import SecurityService

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
        
        try:
            dsn = None
            schema_name = None
            is_shared_schema = False

            # Decrypt DSN
            try:
                decrypted_dsn = SecurityService.decrypt(tenant['supabase_project_url'])
            except Exception as e:
                logger.warning(f"Skipping {tenant_name}: Failed to decrypt DSN. Error: {e}")
                continue
            
            # Check for dummy values
            if not decrypted_dsn or decrypted_dsn == 'pending' or decrypted_dsn.startswith('pending'):
                 logger.warning(f"Skipping {tenant_name}: DSN is pending.")
                 continue

            # Handle shared schema isolation
            if decrypted_dsn.startswith("shared_database_schema:"):
                is_shared_schema = True
                schema_name = decrypted_dsn.split(":")[1]
                logger.info(f"  Using shared schema: {schema_name}")
                dsn = settings.DATABASE_URL
            else:
                 dsn = decrypted_dsn

            # Basic validation
            if not dsn or not dsn.startswith('postgres'):
                logger.warning(f"Skipping {tenant_name}: Invalid DSN format: {dsn[:10]}...")
                continue

            # Create pool with appropriate init function
            init_func = None
            if is_shared_schema and schema_name:
                 # This init function runs on every new connection in the pool
                 async def init_schema(conn):
                     await conn.execute(f"SET search_path TO {schema_name}, public")
                 init_func = init_schema

            tenant_pool = await asyncpg.create_pool(
                dsn,
                min_size=1,
                max_size=2,
                command_timeout=30,
                init=init_func
            )
            
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
            
            await tenant_pool.close()
                
            logger.info(f"Successfully migrated {tenant_name}")
            
        except Exception as e:
            logger.error(f"Failed to migrate {tenant_name}: {e}")

    logger.info("Migration complete.")

if __name__ == "__main__":
    asyncio.run(apply_karma_migration())
