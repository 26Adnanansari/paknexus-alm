import asyncio
import logging
from app.core.database import get_master_db_pool

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_tenants():
    """
    Prints tenant details to debug connection issues.
    """
    logger.info("Debugging Tenant Data...")
    
    try:
        master_pool = await get_master_db_pool()
        async with master_pool.acquire() as conn:
            tenants = await conn.fetch("SELECT tenant_id, name, supabase_project_url FROM tenants")
            
        for t in tenants:
            url = t['supabase_project_url']
            masked_url = url[:15] + "..." if url and len(url) > 15 else "None/Empty"
            print(f"Tenant: {t['name']}")
            print(f"  ID: {t['tenant_id']}")
            print(f"  URL Raw Length: {len(url) if url else 0}")
            print(f"  URL Preview: {masked_url}")
            
    except Exception as e:
        logger.error(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_tenants())
