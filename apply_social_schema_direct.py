import asyncio
import asyncpg
import logging
import os
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def apply_schema_direct():
    logger.info("Connecting to Database (Direct Mode)...")
    try:
        # manual parse or use connection string directly
        dsn = settings.MASTER_DATABASE_URL
        if not dsn:
            logger.error("MASTER_DATABASE_URL is not set!")
            return

        logger.info(f"Using DSN: {dsn.split('@')[1] if '@' in dsn else 'local'}")

        conn = await asyncpg.connect(dsn)
        
        with open("app/db/social_schema.sql", "r") as f:
            sql_script = f.read()
            
        logger.info("Executing Social Schema...")
        await conn.execute(sql_script)
        logger.info("Social Schema Applied Successfully!")
            
        await conn.close()
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Failed to apply schema: {e}")

if __name__ == "__main__":
    asyncio.run(apply_schema_direct())
