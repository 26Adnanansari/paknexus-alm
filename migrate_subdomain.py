import asyncio
import asyncpg
import os
from app.core.config import settings

async def migrate():
    print("Migrating: Adding subdomain column to tenants table...")
    conn = await asyncpg.connect(settings.DATABASE_URL)
    
    try:
        # 1. Add column if not exists
        await conn.execute("""
            ALTER TABLE tenants 
            ADD COLUMN IF NOT EXISTS subdomain VARCHAR(255) UNIQUE;
        """)
        print("Column 'subdomain' added (or already exists).")
        
        # 2. Populate subdomain for existing tenants
        tenants = await conn.fetch("SELECT tenant_id, name FROM tenants WHERE subdomain IS NULL")
        for t in tenants:
            # Slugify name
            slug = t['name'].lower().replace(' ', '-').replace('_', '-')
            slug = ''.join(c for c in slug if c.isalnum() or c == '-')
            # Ensure unique
            final_slug = slug
            counter = 1
            while await conn.fetchval("SELECT 1 FROM tenants WHERE subdomain = $1", final_slug):
                final_slug = f"{slug}-{counter}"
                counter += 1
            
            await conn.execute("UPDATE tenants SET subdomain = $1 WHERE tenant_id = $2", final_slug, t['tenant_id'])
            print(f"Updated tenant '{t['name']}' with subdomain '{final_slug}'")
            
        # 3. Make it NOT NULL after population
        await conn.execute("ALTER TABLE tenants ALTER COLUMN subdomain SET NOT NULL")
        print("Column 'subdomain' set to NOT NULL.")
        
    except Exception as e:
        print(f"Migration error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
