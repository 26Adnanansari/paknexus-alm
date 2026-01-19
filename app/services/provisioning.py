from typing import Optional, Dict
from uuid import UUID, uuid4
from datetime import datetime, timedelta, timezone
import asyncpg
import logging
import asyncio
import os

from app.services.vault import CredentialVault
from app.models.tenant import TenantCreate, TenantResponse
from app.core.security import SecurityService
from app.core.config import settings

logger = logging.getLogger(__name__)

class TenantProvisioningService:
    """
    Automated tenant onboarding and provisioning service.
    
    NOTE: This implementation assumes manual Supabase/NeonDB project creation.
    For full automation, integrate with Supabase Management API.
    """
    
    def __init__(self, master_db_pool: asyncpg.Pool):
        self.master_db_pool = master_db_pool

    async def provision_tenant(
        self,
        tenant_data: TenantCreate,
        admin_id: UUID,
        auto_create_db: bool = False
    ) -> TenantResponse:
        """
        Provision a new tenant with the following workflow:
        1. Validate tenant data
        2. Create Supabase/NeonDB project (manual or API)
        3. Apply tenant schema template
        4. Store encrypted credentials in master DB
        5. Set initial TRIAL status
        6. Send welcome email
        """
        tenant_id = uuid4()
        
        try:
            logger.info(f"Starting provisioning for tenant: {tenant_data.name}")
            
            # Step 1: Validate credentials format
            if not CredentialVault.validate_supabase_url(tenant_data.supabase_url_raw):
                raise ValueError("Invalid Supabase/NeonDB URL format")
            
            # Check if using shared database model
            is_shared_database = tenant_data.supabase_url_raw == 'shared_database'
            
            if is_shared_database and auto_create_db:
                # AUTO-PROVISIONING: Create a new schema in the master database
                schema_name = f"tenant_{tenant_data.subdomain.replace('-', '_')}"
                logger.info(f"Auto-provisioning: Creating schema {schema_name}")
                
                async with self.master_db_pool.acquire() as conn:
                    await conn.execute(f"CREATE SCHEMA IF NOT EXISTS {schema_name}")
                    # Apply schema template to the new schema
                    await self._apply_schema_template(
                        settings.DATABASE_URL, 
                        "none", # No service key needed for master DB
                        target_schema=schema_name,
                        existing_conn=conn
                    )
                
                # Update credentials to point to this schema
                tenant_data.supabase_url_raw = f"shared_database_schema:{schema_name}"
                tenant_data.supabase_key_raw = "shared"
                
            elif not is_shared_database:
                # Step 2: Test connection to tenant database (skip for shared database)
                await self._test_tenant_connection(
                    tenant_data.supabase_url_raw,
                    tenant_data.supabase_key_raw
                )
                
                # Step 3: Apply schema template (skip for shared database)
                await self._apply_schema_template(
                    tenant_data.supabase_url_raw,
                    tenant_data.supabase_key_raw
                )
                
                # Step 4: Seed initial data (skip for shared database)
                await self._seed_initial_data(
                    tenant_data.supabase_url_raw,
                    tenant_data.supabase_key_raw,
                    tenant_data
                )
            else:
                logger.info("Using shared database model - skipping database provisioning steps")
            
            # Step 5: Encrypt and store credentials
            encrypted_creds = await CredentialVault.store_credentials(
                tenant_id,
                tenant_data.supabase_url_raw,
                tenant_data.supabase_key_raw
            )
            
            # Step 6: Insert into master database
            trial_expiry = datetime.now(timezone.utc) + timedelta(days=7)
            
            async with self.master_db_pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO tenants (
                        tenant_id, name, contact_email, contact_phone,
                        supabase_project_url, supabase_service_key,
                        status, trial_start, subscription_expiry, created_by,
                        subdomain
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    """,
                    tenant_id,
                    tenant_data.name,
                    tenant_data.contact_email,
                    tenant_data.contact_phone,
                    encrypted_creds.supabase_project_url,
                    encrypted_creds.supabase_service_key,
                    'trial',
                    datetime.now(timezone.utc),
                    trial_expiry,
                    admin_id,
                    tenant_data.subdomain
                )
                
                # Log provisioning
                import json
                await conn.execute(
                    """
                    INSERT INTO audit_logs (tenant_id, actor_id, action, details)
                    VALUES ($1, $2, 'TENANT_PROVISIONED', $3)
                    """,
                    tenant_id,
                    admin_id,
                    json.dumps({
                        "name": tenant_data.name,
                        "trial_expiry": trial_expiry.isoformat()
                    })
                )
                
                # Queue welcome email
                await conn.execute(
                    """
                    INSERT INTO notification_queue (tenant_id, type, payload)
                    VALUES ($1, 'email', $2)
                    """,
                    tenant_id,
                    json.dumps({
                        "template": "welcome",
                        "tenant_name": tenant_data.name,
                        "trial_days": 7
                    })
                )
                
                # Step 7: Create initial School Admin in tenant_users table (Master DB)
                # Default password for first login (can be school slug or a welcome password)
                initial_password = "welcome" + tenant_data.name.replace(" ", "")[:5].lower()
                hashed_password = SecurityService.get_password_hash(initial_password)
                
                await conn.execute(
                    """
                    INSERT INTO tenant_users (
                        tenant_id, email, password_hash, full_name, role, is_active
                    ) VALUES ($1, $2, $3, $4, $5, TRUE)
                    ON CONFLICT (email, tenant_id) DO NOTHING
                    """,
                    tenant_id,
                    tenant_data.contact_email,
                    hashed_password,
                    f"{tenant_data.name} Admin",
                    'admin'
                )
                
                logger.info(f"Created initial school admin for {tenant_data.name} (Password: {initial_password})")
            
            logger.info(f"Successfully provisioned tenant {tenant_id}: {tenant_data.name}")
            
            return TenantResponse(
                tenant_id=tenant_id,
                name=tenant_data.name,
                contact_email=tenant_data.contact_email,
                contact_phone=tenant_data.contact_phone,
                status='trial',
                trial_start=datetime.now(timezone.utc),
                subscription_expiry=trial_expiry,
                created_at=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            import traceback
            logger.error(f"Provisioning failed for {tenant_data.name}: {str(e)}")
            logger.error(traceback.format_exc())
            # Rollback: In production, delete the Supabase project if created via API
            raise

    async def _test_tenant_connection(self, url: str, key: str) -> bool:
        """Test connection to tenant database."""
        try:
            # For PostgreSQL connection strings
            conn = await asyncpg.connect(url)
            await conn.execute("SELECT 1")
            await conn.close()
            logger.info("Tenant database connection test successful")
            return True
        except Exception as e:
            logger.error(f"Tenant database connection failed: {str(e)}")
            raise ValueError("Cannot connect to tenant database. Check credentials.")

    async def _apply_schema_template(self, url: str, key: str, target_schema: Optional[str] = None, existing_conn: Optional[asyncpg.Connection] = None) -> bool:
        """Apply the initial schema template to a tenant database."""
        try:
            # Read template file
            template_path = os.path.join(os.path.dirname(__file__), "..", "db", "tenant_schema_template.sql")
            with open(template_path, "r") as f:
                schema_sql = f.read()

            if target_schema:
                # Add SET search_path at the beginning
                schema_sql = f"SET search_path TO {target_schema}, public;\n" + schema_sql

            if existing_conn:
                await existing_conn.execute(schema_sql)
                logger.info(f"Applied schema template to existing connection (Schema: {target_schema or 'default'})")
                return True
            
            conn = await asyncpg.connect(url)
            try:
                await conn.execute(schema_sql)
                logger.info(f"Applied schema template to {url} (Schema: {target_schema or 'default'})")
            finally:
                await conn.close()
            return True
        except Exception as e:
            logger.error(f"Schema application failed: {str(e)}")
            raise

    async def _seed_initial_data(self, url: str, key: str, tenant_data: TenantCreate):
        """Seed initial data for the tenant."""
        try:
            conn = await asyncpg.connect(url)
            
            # Create default academic year
            current_year = datetime.now().year
            academic_year = f"{current_year}-{current_year + 1}"
            
            # Insert default subjects
            default_subjects = [
                ('Mathematics', 'MATH'),
                ('English', 'ENG'),
                ('Science', 'SCI'),
                ('Social Studies', 'SS'),
                ('Physical Education', 'PE')
            ]
            
            for subject_name, subject_code in default_subjects:
                await conn.execute(
                    """
                    INSERT INTO subjects (subject_name, subject_code)
                    VALUES ($1, $2)
                    ON CONFLICT (subject_code) DO NOTHING
                    """,
                    subject_name,
                    subject_code
                )
            
            # Create admin staff user
            await conn.execute(
                """
                INSERT INTO staff (
                    employee_id, full_name, designation, department,
                    join_date, email, role, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """,
                'ADMIN001',
                'System Administrator',
                'Principal',
                'Administration',
                datetime.now().date(),
                tenant_data.contact_email,
                'admin',
                True
            )
            
            await conn.close()
            logger.info("Initial data seeded successfully")
            
        except Exception as e:
            logger.error(f"Data seeding failed: {str(e)}")
            raise

    async def bulk_import_tenants(
        self,
        tenants_data: list[Dict],
        admin_id: UUID
    ) -> Dict[str, list]:
        """
        Bulk import tenants from CSV data.
        Returns: {"success": [...], "failed": [...]}
        """
        results = {"success": [], "failed": []}
        
        for tenant_dict in tenants_data:
            try:
                tenant_create = TenantCreate(**tenant_dict)
                result = await self.provision_tenant(tenant_create, admin_id)
                results["success"].append({
                    "name": tenant_create.name,
                    "tenant_id": str(result.tenant_id)
                })
            except Exception as e:
                results["failed"].append({
                    "name": tenant_dict.get("name", "Unknown"),
                    "error": str(e)
                })
        
        return results
