import asyncio
import logging
from app.core.database import get_master_db_pool, close_master_db_pool
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def apply_schema():
    logger.info("Connecting to Database...")
    try:
        pool = await get_master_db_pool()
        
        with open("app/db/social_schema.sql", "r") as f:
            sql_script = f.read()
            
        async with pool.acquire() as conn:
            logger.info("Executing Schema...")
            await conn.execute(sql_script)
            logger.info("Social Schema Applied Successfully!")
            
        await close_master_db_pool()
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Failed to apply schema: {e}")

if __name__ == "__main__":
    asyncio.run(apply_schema())
