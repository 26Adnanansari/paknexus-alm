#!/usr/bin/env python3
"""
Check if tenant_users has any data
"""
import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_SLGA6opCf8Rb@ep-wandering-block-ahqrebzm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require")

async def main():
    print("🔍 Checking database...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    # Check tenants
    tenants = await conn.fetch("SELECT tenant_id, name, subdomain FROM tenants LIMIT 5")
    print(f"\n📊 Tenants found: {len(tenants)}")
    for t in tenants:
        print(f"  - {t['name']} ({t['subdomain']})")
    
    # Check tenant_users
    users = await conn.fetch("SELECT user_id, email, role, tenant_id FROM tenant_users LIMIT 5")
    print(f"\n👥 Users found: {len(users)}")
    for u in users:
        print(f"  - {u['email']} ({u['role']})")
    
    await conn.close()
    
    if len(users) == 0:
        print("\n⚠️  NO USERS FOUND!")
        print("You need to create an admin user. I'll help you with that.")
    else:
        print("\n✅ Users exist. Just clear your browser cookies and login again.")

if __name__ == "__main__":
    asyncio.run(main())
