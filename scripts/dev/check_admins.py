import asyncio
import asyncpg
from app.core.config import settings

async def check_admins():
    print(f"Connecting to: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'local'}")
    conn = await asyncpg.connect(settings.DATABASE_URL)
    try:
        rows = await conn.fetch("SELECT user_id, email, role, is_active FROM admin_users")
        print(f"\nFound {len(rows)} admin users:")
        for row in rows:
            print(f" - ID: {row['user_id']}, Email: {row['email']}, Role: {row['role']}, Active: {row['is_active']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_admins())
