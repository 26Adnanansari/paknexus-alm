#!/usr/bin/env python3
"""
Debug schema and search path
"""
import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_SLGA6opCf8Rb@ep-wandering-block-ahqrebzm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require")

async def main():
    print("🔍 Debugging schema...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    # Check current schema
    current_schema = await conn.fetchval("SELECT current_schema()")
    print(f"Current schema: {current_schema}")
    
    # Check search path
    search_path = await conn.fetchval("SHOW search_path")
    print(f"Search path: {search_path}")
    
    # Find tenant_users in all schemas
    tables = await conn.fetch("""
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name = 'tenant_users'
    """)
    
    print(f"\nFound 'tenant_users' in schemas:")
    for t in tables:
        print(f"  - {t['table_schema']}.{t['table_name']}")
    
    # Try to query with explicit schema
    try:
        count = await conn.fetchval("SELECT COUNT(*) FROM public.tenant_users")
        print(f"\n✅ public.tenant_users has {count} rows")
    except Exception as e:
        print(f"\n❌ public.tenant_users: {e}")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
