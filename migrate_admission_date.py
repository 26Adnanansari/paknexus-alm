"""
Database Migration: Make admission_date optional with default value
This allows the old deployed backend API to continue working
while we prepare the proper deployment.
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def migrate():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found in environment")
        return
    
    conn = await asyncpg.connect(database_url)
    
    try:
        # Check if we're using shared database with schemas or separate databases
        # For now, we'll run on public schema (master DB) - tenant schemas handled separately
        
        print("Checking current admission_date column...")
        
        # This migration should be run on each tenant's schema
        # For demo, showing the query:
        migration_sql = """
        -- Make admission_date have a default so it's not required in INSERT
        ALTER TABLE students 
        ALTER COLUMN admission_date SET DEFAULT CURRENT_DATE;
        
        -- Also ensure it's still NOT NULL but has default
        ALTER TABLE students 
        ALTER COLUMN admission_date SET NOT NULL;
        """
        
        print("Migration SQL to run on each tenant schema:")
        print(migration_sql)
        print("\nNote: This should be applied to each tenant's isolated schema")
        print("Run this manually on your Neon database console for now.")
        
        # For master/shared tenants, we'd need to iterate through each schema
        # Example for later:
        # schemas = await conn.fetch("SELECT DISTINCT tenant_id FROM tenants")
        # for schema in schemas:
        #     tenant_schema = f"tenant_{schema['tenant_id'].replace('-', '')}"
        #     await conn.execute(f'SET search_path TO "{tenant_schema}"')
        #     await conn.execute(migration_sql)
        
    finally:
        await conn.close()

if __name__ == "__main__":
    print("=== Student Table Migration ===")
    print("Purpose: Add default value to admission_date")
    print("This allows backward compatibility with old API")
    print()
    asyncio.run(migrate())
