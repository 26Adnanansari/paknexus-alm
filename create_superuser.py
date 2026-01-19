import asyncio
import asyncpg
from app.core.security import SecurityService
from app.core.config import settings

async def create_superuser():
    print(f"Connecting to database: {settings.LOCAL_DATABASE_URL}")
    conn = await asyncpg.connect(settings.LOCAL_DATABASE_URL)
    
    email = "admin@pakainexus.com"
    password = "admin"
    full_name = "Super Admin"
    
    hashed_pw = SecurityService.get_password_hash(password)
    
    try:
        # Check if exists
        exists = await conn.fetchval("SELECT user_id FROM admin_users WHERE email = $1", email)
        if exists:
            print(f"User {email} already exists.")
            # Update password
            await conn.execute("UPDATE admin_users SET password_hash = $1 WHERE email = $2", hashed_pw, email)
            print("Password updated.")
        else:
            await conn.execute(
                """
                INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
                VALUES ($1, $2, $3, 'super_admin', TRUE)
                """,
                email, hashed_pw, full_name
            )
            print(f"Created superuser: {email} / {password}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_superuser())
