import asyncio
import asyncpg
import os
import bcrypt

# Fix for bcrypt 4.0+ 72-byte limit error in passlib
_orig_hashpw = bcrypt.hashpw
def _fixed_hashpw(password, salt):
    if isinstance(password, str):
        password = password.encode("utf-8")
    if len(password) > 72:
        password = password[:72]
    return _orig_hashpw(password, salt)
bcrypt.hashpw = _fixed_hashpw

# Workaround for passlib/bcrypt incompatibility (AttributeError: module 'bcrypt' has no attribute '__about__')
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("about", (object,), {"__version__": bcrypt.__version__})

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_admin():
    # Use environment variables for connection
    database_url = os.getenv("MASTER_DATABASE_URL") or os.getenv("DATABASE_URL") or os.getenv("LOCAL_DATABASE_URL")
    if not database_url:
        print("ERROR: Database connection URL not found in environment (MASTER_DATABASE_URL, DATABASE_URL, or LOCAL_DATABASE_URL).")
        return

    email = "admin@pakainexus.com"
    password = "admin123"
    hashed_password = pwd_context.hash(password)

    print(f"Connecting to database...")
    try:
        conn = await asyncpg.connect(database_url)
        
        # Check if table exists
        exists = await conn.fetchval("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users')")
        if not exists:
            print("ERROR: table 'admin_users' does not exist. Please run master_schema.sql first.")
            await conn.close()
            return

        # Update or Insert admin user
        res = await conn.execute(
            """
            INSERT INTO admin_users (email, password_hash, role, is_active)
            VALUES ($1, $2, 'super_admin', TRUE)
            ON CONFLICT (email) 
            DO UPDATE SET password_hash = $2, role = 'super_admin', is_active = TRUE
            """,
            email, hashed_password
        )
        
        print(f"SUCCESS: Admin password reset to '{password}' for '{email}'")
        print(f"Result: {res}")
        
        await conn.close()
    except Exception as e:
        print(f"DATABASE ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(reset_admin())
