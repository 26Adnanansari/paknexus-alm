
import asyncio
import asyncpg
from app.core.config import settings

async def main():
    url = settings.DATABASE_URL
    print(f"Original URL: {url.split('@')[-1]}")
    
    # Try 1: As is
    try:
        print("Attempt 1: Original URL")
        conn = await asyncpg.connect(url, timeout=5)
        print("Success!")
        await conn.close()
        return
    except Exception as e:
        print(f"Failed: {e}")

    # Try 2: No channel_binding
    if "channel_binding=require" in url:
        print("Attempt 2: Removing channel_binding")
        url2 = url.replace("&channel_binding=require", "").replace("channel_binding=require", "")
        try:
            conn = await asyncpg.connect(url2, timeout=5)
            print("Success with modified URL!")
            await conn.close()
            return
        except Exception as e:
            print(f"Failed: {e}")

    # Try 3: sslmode=prefer
    print("Attempt 3: sslmode=prefer")
    url3 = url.replace("sslmode=require", "sslmode=prefer")
    try:
        conn = await asyncpg.connect(url3, timeout=5)
        print("Success with sslmode=prefer!")
        await conn.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
