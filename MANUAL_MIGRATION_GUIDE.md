# 🔧 Manual Migration Guide - ID Card Restriction System

## ⚠️ Network Issue Detected

The automated migration script is experiencing network connectivity issues with the Neon database. This is likely due to:
- DNS resolution problems
- Network timeout
- Firewall/proxy interference
- Unstable internet connection

## 🛠️ **SOLUTION: Manual Migration**

Since the automated script cannot connect, you can apply the migration manually using one of these methods:

---

## **Method 1: Using Neon Console (RECOMMENDED)**

### Steps:
1. **Go to Neon Console**: https://console.neon.tech
2. **Login** to your account
3. **Select your project**: `summer-river-86962945`
4. **Go to SQL Editor**
5. **Copy and paste** the entire contents of:
   ```
   d:\almsaas\app\db\id_card_restriction_migration.sql
   ```
6. **Click "Run"** to execute the migration
7. **Verify** tables were created

### Verification Queries:
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%id_card%';

-- Test card number generation
SELECT generate_card_number();

-- Check views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('v_pending_appeals', 'v_id_card_stats');
```

---

## **Method 2: Using psql Command Line**

### Prerequisites:
```bash
# Install PostgreSQL client (if not already installed)
# Windows: Download from https://www.postgresql.org/download/windows/
# Or use: choco install postgresql
```

### Steps:
```bash
# 1. Navigate to project directory
cd d:\almsaas

# 2. Run migration using psql
psql "postgresql://neondb_owner:npg_SLGA6opCf8Rb@ep-wandering-block-ahqrebzm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" -f app/db/id_card_restriction_migration.sql

# 3. Verify installation
psql "postgresql://neondb_owner:npg_SLGA6opCf8Rb@ep-wandering-block-ahqrebzm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%id_card%';"
```

---

## **Method 3: Using DBeaver / pgAdmin**

### Steps:
1. **Download** DBeaver (https://dbeaver.io/) or pgAdmin
2. **Create new connection** with these details:
   - Host: `ep-wandering-block-ahqrebzm-pooler.c-3.us-east-1.aws.neon.tech`
   - Port: `5432`
   - Database: `neondb`
   - Username: `neondb_owner`
   - Password: `npg_SLGA6opCf8Rb`
   - SSL Mode: `require`
3. **Open SQL Editor**
4. **Load file**: `d:\almsaas\app\db\id_card_restriction_migration.sql`
5. **Execute** the script
6. **Verify** tables in the database explorer

---

## **Method 4: Wait for Network to Stabilize**

If you prefer to use the automated script:

### Steps:
1. **Check your internet connection**
   ```bash
   ping ep-wandering-block-ahqrebzm-pooler.c-3.us-east-1.aws.neon.tech
   ```

2. **Try from a different network** (mobile hotspot, different WiFi)

3. **Disable VPN/Proxy** if you're using one

4. **Run the migration script again**
   ```bash
   python apply_id_card_migration.py
   ```

---

## **Method 5: Use Neon API (Advanced)**

### Using curl:
```bash
# Set your API key
set NEON_API_KEY=napi_b0vw4eo8f8f58x9jfs0nb42t43teocefh6xeoi0q8gdzpng597zhp8uc2iiwodcl

# Read migration file
set /p MIGRATION_SQL=<app\db\id_card_restriction_migration.sql

# Execute via Neon API
curl -X POST https://console.neon.tech/api/v2/projects/summer-river-86962945/branches/main/query ^
  -H "Authorization: Bearer %NEON_API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"query\": \"%MIGRATION_SQL%\"}"
```

---

## 📋 **What the Migration Does**

The migration will create:

### Tables (3):
1. **student_id_cards** - Main ID card table with restriction fields
2. **id_card_appeals** - Appeal management table
3. **id_card_templates** - Template storage

### Views (2):
1. **v_pending_appeals** - Dashboard view for pending appeals
2. **v_id_card_stats** - Statistics view

### Functions (3):
1. **generate_card_number()** - Auto-generate unique card numbers
2. **auto_create_id_card()** - Trigger function for new students
3. **update_updated_at_column()** - Timestamp management

### Triggers (4):
- Auto-create ID cards for new students
- Update timestamps on all tables

---

## ✅ **After Migration is Complete**

### 1. Verify Installation:
```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('student_id_cards', 'id_card_appeals', 'id_card_templates');

-- Test function
SELECT generate_card_number();

-- Check views
SELECT * FROM v_id_card_stats;
```

### 2. Restart Backend Server:
```bash
cd d:\almsaas\app
uvicorn main:app --reload
```

### 3. Test API Endpoints:
- Open: http://localhost:8000/docs
- Try: GET `/api/v1/id-cards/stats`
- Try: GET `/api/v1/id-cards/list`

### 4. Access Frontend:
- Admin appeals: http://localhost:3000/dashboard/appeals
- ID card review: http://localhost:3000/id-card/[token]

---

## 🐛 **Troubleshooting**

### If migration fails with "already exists":
```sql
-- Check if tables already exist
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%id_card%';

-- If they exist, the migration was already applied!
-- You can skip to testing the API endpoints
```

### If foreign key errors occur:
```sql
-- Check if students table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'students'
);

-- If false, you need to apply the base tenant schema first
-- File: d:\almsaas\app\db\tenant_schema_template.sql
```

---

## 📞 **Need Help?**

If you're still having issues:

1. **Check the migration file**: `d:\almsaas\app\db\id_card_restriction_migration.sql`
2. **Verify database credentials** in `.env` file
3. **Test connection** using any database client
4. **Run migration manually** using Neon Console (easiest method)

---

## 🎯 **Recommended Approach**

**For fastest results, use Method 1 (Neon Console)**:
1. Go to https://console.neon.tech
2. Open SQL Editor
3. Copy/paste migration SQL
4. Click Run
5. Done! ✅

This bypasses all network issues and works directly in the browser.

---

**Last Updated**: January 25, 2026, 4:20 PM PKT  
**Status**: Manual migration guide ready  
**Recommended**: Use Neon Console for quickest results
