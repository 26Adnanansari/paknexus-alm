import asyncio
import asyncpg
from app.core.config import settings

async def check_schema():
    print(f"Connecting to: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'local'}")
    conn = await asyncpg.connect(settings.DATABASE_URL)
    try:
        schema_name = "tenant_verify_school_5"
        rows = await conn.fetch(
            f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{schema_name}'"
        )
        print(f"Found {len(rows)} tables in schema {schema_name}:")
        for row in rows:
            print(f" - {row['table_name']}")
            
        # Check views too
        views = await conn.fetch(
            f"SELECT table_name FROM information_schema.views WHERE table_schema = '{schema_name}'"
        )
        print(f"Found {len(views)} views:")
        for view in views:
            print(f" - {view['table_name']}")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_schema())
