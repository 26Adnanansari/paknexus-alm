from typing import Optional, Tuple
import re
from datetime import datetime
from uuid import UUID
import logging
from app.core.security import SecurityService
from app.models.tenant import TenantCredentials

# Mocking a cache for now, in production use Redis
_local_cache = {}

logger = logging.getLogger(__name__)

class CredentialVault:
    
    @staticmethod
    def validate_supabase_url(url: str) -> bool:
        """Validate database URL format - accepts shared_database placeholder or PostgreSQL URLs."""
        # Allow 'shared_database' placeholder for shared database model
        if url == 'shared_database':
            return True
        
        # Accept PostgreSQL URLs for NeonDB
        if url and (url.startswith('postgresql://') or url.startswith('shared_database_schema:')):
            return True
            
        # Legacy Supabase URL pattern
        pattern = r"^https://[a-z0-9-]+\.supabase\.co$"
        return bool(re.match(pattern, url))

    @staticmethod
    async def store_credentials(tenant_id: UUID, url: str, service_key: str) -> TenantCredentials:
        """
        Encrypts and prepares credentials for storage.
        Note: The actual DB insert happens in the TenantService/Repository, 
        this value service prepares the encrypted payload.
        """
        if not CredentialVault.validate_supabase_url(url):
            raise ValueError("Invalid Supabase URL format")

        encrypted_url = SecurityService.encrypt(url)
        encrypted_key = SecurityService.encrypt(service_key)
        
        # Cache invalidation (or update)
        if tenant_id in _local_cache:
            del _local_cache[tenant_id]
            
        return TenantCredentials(
            supabase_project_url=encrypted_url,
            supabase_service_key=encrypted_key
        )

    @staticmethod
    async def get_decrypted_credentials(tenant_id: UUID, encrypted_url: str, encrypted_key: str) -> Tuple[str, str]:
        """
        Retrieves credentials, checking cache first, then decrypting.
        """
        if tenant_id in _local_cache:
            logger.info(f"Credential cache hit for tenant {tenant_id}")
            return _local_cache[tenant_id]

        try:
            url = SecurityService.decrypt(encrypted_url)
            key = SecurityService.decrypt(encrypted_key)
            
            # Update cache (TTL logic would go here in Redis)
            _local_cache[tenant_id] = (url, key)
            
            logger.info(f"Credentials retrieved and decrypted for tenant {tenant_id}")
            return url, key
        except Exception as e:
            logger.error(f"Failed to decrypt credentials for tenant {tenant_id}: {str(e)}")
            raise ValueError("Credential decryption failed") from e

    @staticmethod
    async def rotate_keys(tenant_id: UUID, new_url: str, new_key: str) -> TenantCredentials:
        """
        Rotates credentials.
        """
        logger.info(f"Rotating credentials for tenant {tenant_id}")
        return await CredentialVault.store_credentials(tenant_id, new_url, new_key)
