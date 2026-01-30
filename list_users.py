#!/usr/bin/env python3
"""
Check users in PUBLIC schema (master database)
"""
import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_SLGA6opCf8Rb@ep-wandering-block-ahqrebzm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require")

async def main():
    print("🔍 Checking users in master database...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    # Explicitly set search_path to public
    await conn.execute("SET search_path TO public")
    
    # Check tenant_users
    users = await conn.fetch("""
        SELECT u.user_id, u.email, u.role, u.full_name, t.name as tenant_name, t.subdomain
        FROM public.tenant_users u
        JOIN public.tenants t ON u.tenant_id = t.tenant_id
        WHERE u.is_active = TRUE
        ORDER BY u.created_at DESC
    """)
    
    print(f"\n👥 Active users found: {len(users)}\n")
    for u in users:
        print(f"📧 {u['email']}")
        print(f"   Role: {u['role']}")
        print(f"   Name: {u['full_name']}")
        print(f"   Tenant: {u['tenant_name']} ({u['subdomain']})")
        print(f"   User ID: {u['user_id']}\n")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
