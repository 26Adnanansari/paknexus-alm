import asyncio
import asyncpg
import os

async def run_migration():
    database_url = os.getenv("MASTER_DATABASE_URL")
    if not database_url:
        print("ERROR: MASTER_DATABASE_URL not found.")
        return

    print(f"Connecting to remote database...")
    try:
        # Read the migration file
        with open('app/db/repair_migration.sql', 'r') as f:
            sql = f.read()

        conn = await asyncpg.connect(database_url)
        print("Executing migration...")
        await conn.execute(sql)
        print("SUCCESS: Migration applied to remote database.")
        await conn.close()
    except Exception as e:
        print(f"MIGRATION ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(run_migration())
