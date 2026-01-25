"""
Apply ID Card Restriction Migration
Applies the ID card restriction and appeal system to tenant databases
Enhanced with retry logic and better error handling
"""

import asyncio
import asyncpg
import os
import time
from dotenv import load_dotenv

load_dotenv()


async def apply_migration_with_retry(max_retries=3, retry_delay=5):
    """Apply ID card restriction migration with retry logic"""
    
    # Read migration SQL
    migration_file = "app/db/id_card_restriction_migration.sql"
    
    print(f"📂 Reading migration file: {migration_file}")
    try:
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        print(f"✅ Migration file loaded ({len(migration_sql)} bytes)")
    except FileNotFoundError:
        print(f"❌ Error: Migration file not found: {migration_file}")
        return False
    
    # Get database connection string from environment
    db_url = os.getenv("MASTER_DATABASE_URL") or os.getenv("DATABASE_URL") or os.getenv("TENANT_DATABASE_URL")
    
    if not db_url:
        print("❌ Error: No database URL found in environment variables")
        print("Please set MASTER_DATABASE_URL, DATABASE_URL, or TENANT_DATABASE_URL")
        return False
    
    # Remove quotes if present
    db_url = db_url.strip("'").strip('"')
    
    print(f"\n🔗 Database Configuration:")
    print(f"   Host: {db_url.split('@')[1].split('/')[0] if '@' in db_url else 'unknown'}")
    print(f"   SSL: {'enabled' if 'sslmode=require' in db_url else 'disabled'}")
    
    # Retry logic
    for attempt in range(1, max_retries + 1):
        print(f"\n{'='*70}")
        print(f"🔄 Attempt {attempt}/{max_retries}")
        print(f"{'='*70}")
        
        try:
            print(f"⏳ Connecting to database (timeout: 60s)...")
            
            # Connect with longer timeout
            conn = await asyncio.wait_for(
                asyncpg.connect(
                    db_url,
                    timeout=60,
                    command_timeout=120,
                    server_settings={
                        'application_name': 'id_card_migration'
                    }
                ),
                timeout=60
            )
            
            print("✅ Connected successfully!")
            
            # Test connection
            print("🧪 Testing connection...")
            version = await conn.fetchval("SELECT version()")
            print(f"   PostgreSQL: {version.split(',')[0]}")
            
            print("\n📝 Applying ID Card Restriction Migration...")
            print("=" * 70)
            
            # Execute migration in a transaction
            async with conn.transaction():
                print("⏳ Executing migration SQL...")
                await conn.execute(migration_sql)
                print("✅ Migration SQL executed successfully!")
            
            print("\n📊 Verifying installation...")
            
            # Verify tables were created
            tables_query = """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('student_id_cards', 'id_card_appeals', 'id_card_templates')
                ORDER BY table_name
            """
            
            tables = await conn.fetch(tables_query)
            
            if tables:
                print("\n✅ Tables created:")
                for table in tables:
                    print(f"   ✓ {table['table_name']}")
            else:
                print("\n⚠️  Warning: No tables found (may already exist)")
            
            # Verify views
            views_query = """
                SELECT table_name 
                FROM information_schema.views 
                WHERE table_schema = 'public' 
                AND table_name IN ('v_pending_appeals', 'v_id_card_stats')
                ORDER BY table_name
            """
            
            views = await conn.fetch(views_query)
            
            if views:
                print("\n✅ Views created:")
                for view in views:
                    print(f"   ✓ {view['table_name']}")
            
            # Verify functions
            functions_query = """
                SELECT routine_name 
                FROM information_schema.routines 
                WHERE routine_schema = 'public' 
                AND routine_name IN ('generate_card_number', 'auto_create_id_card', 'update_updated_at_column')
                ORDER BY routine_name
            """
            
            functions = await conn.fetch(functions_query)
            
            if functions:
                print("\n✅ Functions created:")
                for func in functions:
                    print(f"   ✓ {func['routine_name']}")
            
            # Test card number generation
            try:
                print("\n🧪 Testing card number generation...")
                test_query = "SELECT generate_card_number() as card_number"
                result = await conn.fetchrow(test_query)
                print(f"   ✓ Generated card number: {result['card_number']}")
            except Exception as e:
                print(f"   ⚠️  Card number test failed: {str(e)}")
            
            # Check if students table exists
            students_check = await conn.fetchrow("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'students'
                ) as exists
            """)
            
            if students_check['exists']:
                print("\n✅ Students table exists - foreign keys will work correctly")
                
                try:
                    # Count existing students
                    student_count = await conn.fetchrow("SELECT COUNT(*) as count FROM students")
                    print(f"   📊 Existing students: {student_count['count']}")
                    
                    if student_count['count'] > 0:
                        print("\n💡 Note: ID cards will be auto-created for new students")
                        print("   To generate cards for existing students, use:")
                        print("   POST /api/v1/id-cards/bulk-generate")
                except Exception as e:
                    print(f"   ⚠️  Could not count students: {str(e)}")
            else:
                print("\n⚠️  Warning: Students table not found")
                print("   Make sure to apply the base tenant schema first")
            
            print("\n" + "=" * 70)
            print("✅ ID Card Restriction Migration Complete!")
            print("=" * 70)
            print("\n📚 Next Steps:")
            print("   1. Restart your backend server:")
            print("      cd app && uvicorn main:app --reload")
            print("   2. Test API endpoints:")
            print("      http://localhost:8000/docs")
            print("   3. Check ID card stats:")
            print("      GET /api/v1/id-cards/stats")
            print("   4. Access admin appeals dashboard:")
            print("      http://localhost:3000/dashboard/appeals")
            
            await conn.close()
            print("\n🔌 Database connection closed")
            return True
            
        except asyncio.TimeoutError:
            print(f"\n⏱️  Timeout error on attempt {attempt}")
            if attempt < max_retries:
                print(f"⏳ Waiting {retry_delay} seconds before retry...")
                time.sleep(retry_delay)
            else:
                print("\n❌ All retry attempts failed due to timeout")
                print("\n🔧 Troubleshooting:")
                print("   1. Check your internet connection")
                print("   2. Verify database URL is correct")
                print("   3. Check if firewall is blocking connection")
                print("   4. Try connecting from a different network")
                return False
                
        except asyncpg.PostgresError as e:
            print(f"\n❌ Database error: {str(e)}")
            print(f"   Error code: {e.sqlstate if hasattr(e, 'sqlstate') else 'unknown'}")
            
            # Check if tables already exist
            if "already exists" in str(e).lower():
                print("\n💡 Tables may already exist. Checking...")
                try:
                    # Try to connect and verify
                    conn = await asyncpg.connect(db_url, timeout=30)
                    tables = await conn.fetch("""
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name LIKE '%id_card%'
                    """)
                    if tables:
                        print("✅ ID card tables found:")
                        for table in tables:
                            print(f"   ✓ {table['table_name']}")
                        print("\n✅ Migration appears to be already applied!")
                        await conn.close()
                        return True
                except:
                    pass
            
            return False
            
        except Exception as e:
            print(f"\n❌ Unexpected error on attempt {attempt}: {str(e)}")
            print(f"   Type: {type(e).__name__}")
            
            if attempt < max_retries:
                print(f"⏳ Waiting {retry_delay} seconds before retry...")
                time.sleep(retry_delay)
            else:
                print("\n❌ All retry attempts failed")
                print("\n📋 Error details:")
                import traceback
                traceback.print_exc()
                
                print("\n🔧 Possible solutions:")
                print("   1. Check network connectivity:")
                print("      ping ep-wandering-block-ahqrebzm-pooler.c-3.us-east-1.aws.neon.tech")
                print("   2. Verify database credentials in .env file")
                print("   3. Check if VPN or proxy is interfering")
                print("   4. Try running migration manually via psql")
                return False
    
    return False


if __name__ == "__main__":
    print("🚀 ID Card Restriction Migration Script")
    print("=" * 70)
    print("Enhanced with retry logic and better error handling\n")
    
    success = asyncio.run(apply_migration_with_retry(max_retries=3, retry_delay=5))
    
    if success:
        print("\n🎉 Migration completed successfully!")
        exit(0)
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        exit(1)
