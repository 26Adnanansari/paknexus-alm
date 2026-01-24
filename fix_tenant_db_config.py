import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

# Match logic in app/core/config.py
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    MASTER = os.getenv("MASTER_DATABASE_URL")
    if MASTER and MASTER.strip():
        DATABASE_URL = MASTER
    else:
        DATABASE_URL = os.getenv("LOCAL_DATABASE_URL")

if not DATABASE_URL:
    print("Error: Could not resolve DATABASE_URL. Checked DATABASE_URL, MASTER_DATABASE_URL, and LOCAL_DATABASE_URL.")
    exit(1)

async def fix_schema():
    print(f"Connecting to database...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
    except Exception as e:
        print(f"Failed to connect: {e}")
        return

    print("Checking 'tenants' table schema...")
    
    # 1. Add supabase_url column if it doesn't exist
    try:
        await conn.execute("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='supabase_url') THEN 
                    ALTER TABLE tenants ADD COLUMN supabase_url TEXT; 
                    RAISE NOTICE 'Added supabase_url column';
                END IF;
            END $$;
        """)
        print("✓ Verified/Added 'supabase_url' column.")
    except Exception as e:
        print(f"Error adding column: {e}")

    # 2. Update existing tenants to have the default DATABASE_URL if their supabase_url is NULL
    # This assumes all current tenants are hosted on the main DB.
    try:
        # We need to ensure we don't overwrite if it's already set (though it's likely null since we just made it)
        # Note: We store the SAME connection string. 
        # CAUTION: If direct connection string has sslmode stuff, asyncpg might need adjustment, but usually it's fine.
        result = await conn.execute("UPDATE tenants SET supabase_url = $1 WHERE supabase_url IS NULL", DATABASE_URL)
        print(f"✓ Backfilled 'supabase_url' for tenants. ({result})")
    except Exception as e:
        print(f"Error updating tenants: {e}")

    # 3. Verify
    rows = await conn.fetch("SELECT name, supabase_url FROM tenants")
    print("\nCurrent Tenant Configuration:")
    for row in rows:
        url_display = row['supabase_url']
        if url_display and len(url_display) > 20:
             url_display = url_display[:10] + "..." + url_display[-10:]
        print(f"- {row['name']}: {url_display}")

    await conn.close()

if __name__ == "__main__":
    asyncio.run(fix_schema())
