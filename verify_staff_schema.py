
import asyncio
import asyncpg
from app.core.config import settings

async def main():
    url = settings.DATABASE_URL
    print(f"Checking schema for DB: {url.split('@')[-1]}")
    
    conn = None
    # Try multiple connection options
    options = [
        url,
        url.replace("&channel_binding=require", "").replace("channel_binding=require", ""),
        url.replace("sslmode=require", "sslmode=prefer")
    ]
    
    for i, u in enumerate(options):
        try:
            print(f"Connecting attempt {i+1}...")
            conn = await asyncpg.connect(u, timeout=10)
            print("Connected!")
            break
        except Exception as e:
            print(f"Failed: {e}")
            
    if not conn:
        print("Could not connect to DB.")
        return

    try:
        
        # Get column names for 'staff' table
        rows = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'staff'
        """)
        
        print("\nColumns in 'staff' table:")
        for row in rows:
            print(f"- {row['column_name']}: {row['data_type']}")
            
        # Fetch one row to see actual data keys
        row = await conn.fetchrow("SELECT * FROM staff LIMIT 1")
        if row:
            print("\nSample Row Keys:", list(row.keys()))
            print("Sample Row IDs:", row.get('staff_id'), row.get('id'))
        else:
            print("\nTable is empty.")
            
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
