from typing import Optional, Callable
from datetime import datetime, timezone, timedelta
from uuid import UUID
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from functools import lru_cache
import asyncpg

from app.core.config import settings
from app.services.vault import CredentialVault

logger = logging.getLogger(__name__)

# In-memory LRU cache for tenant configs (1000 entries max)
@lru_cache(maxsize=1000)
def _get_cached_tenant_config(tenant_id: str):
    """Cache wrapper - actual data fetching happens in middleware"""
    return None  # Placeholder, actual caching logic in get_tenant_config

class TenantConfig:
    def __init__(self, tenant_id: UUID, name: str, status: str, 
                 subscription_expiry: datetime, supabase_url: str, supabase_key: str):
        self.tenant_id = tenant_id
        self.name = name
        self.status = status
        self.subscription_expiry = subscription_expiry
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key

class TenantMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, db_pool: asyncpg.Pool):
        super().__init__(app)
        self.db_pool = db_pool
        self._tenant_cache = {}  # Simple dict cache, in production use Redis

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip tenant validation for health check and global control plane endpoints
        path = request.url.path
        if (
            path in ["/health", "/"] or 
            path.startswith("/api/v1/auth") or 
            path.startswith("/api/v1/admin")
        ):
            return await call_next(request)

        # Step 1: Extract tenant identifier
        tenant_id = await self._extract_tenant_id(request)
        
        if not tenant_id:
            return JSONResponse(
                status_code=404,
                content={"detail": "Tenant not found"}
            )

        # Step 2: Get tenant configuration (with caching)
        try:
            tenant_config = await self._get_tenant_config(tenant_id)
        except ValueError as e:
            logger.warning(f"Tenant lookup failed: {str(e)}")
            return JSONResponse(
                status_code=404,
                content={"detail": "Tenant not found"}
            )

        # Step 3: Validate subscription status
        validation_result = self._validate_subscription(tenant_config)
        
        if validation_result["status"] == "forbidden":
            return JSONResponse(
                status_code=403,
                content={"detail": validation_result["message"]}
            )
        elif validation_result["status"] == "payment_required":
            return JSONResponse(
                status_code=402,
                content={
                    "detail": validation_result["message"],
                    "expiry_date": tenant_config.subscription_expiry.isoformat()
                }
            )

        # Step 4: Inject tenant context into request state
        request.state.tenant_config = tenant_config

        # Step 5: Proceed with request
        response = await call_next(request)

        # Add warning header if in grace period
        if validation_result["status"] == "grace":
            response.headers["X-Subscription-Warning"] = validation_result["message"]

        return response

    async def _extract_tenant_id(self, request: Request) -> Optional[str]:
        """
        Extract tenant ID from request in priority order:
        1. Subdomain (e.g., school1.yourdomain.com)
        2. X-Tenant-ID header
        3. JWT claim (future implementation)
        """
        # Priority 1: Subdomain
        host = request.headers.get("host", "")
        if "." in host:
            subdomain = host.split(".")[0]
            if subdomain and subdomain not in ["www", "api", "admin"]:
                return subdomain

        # Priority 2: Header
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            return tenant_id

        # Priority 3: JWT (not implemented yet)
        return None

    async def _get_tenant_config(self, tenant_id: str) -> TenantConfig:
        """
        Retrieve tenant configuration from cache or database.
        """
        # Check cache first
        if tenant_id in self._tenant_cache:
            cached = self._tenant_cache[tenant_id]
            # Simple TTL check (5 minutes)
            if (datetime.now(timezone.utc) - cached["cached_at"]).seconds < 300:
                logger.info(f"Cache hit for tenant {tenant_id}")
                return cached["config"]

        # Cache miss - query database
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT tenant_id, name, subdomain, status, subscription_expiry,
                       supabase_project_url, supabase_service_key
                FROM tenants
                WHERE tenant_id = $1 OR subdomain = $2
                """,
                tenant_id if self._is_uuid(tenant_id) else None,
                tenant_id
            )

        if not row:
            raise ValueError(f"Tenant {tenant_id} not found")

        # Decrypt credentials
        decrypted_url, decrypted_key = await CredentialVault.get_decrypted_credentials(
            row["tenant_id"],
            row["supabase_project_url"],
            row["supabase_service_key"]
        )

        tenant_config = TenantConfig(
            tenant_id=row["tenant_id"],
            name=row["name"],
            status=row["status"],
            subscription_expiry=row["subscription_expiry"],
            supabase_url=decrypted_url,
            supabase_key=decrypted_key
        )

        # Update cache
        self._tenant_cache[tenant_id] = {
            "config": tenant_config,
            "cached_at": datetime.now(timezone.utc)
        }

        logger.info(f"Loaded tenant config for {tenant_id} from database")
        return tenant_config

    def _validate_subscription(self, config: TenantConfig) -> dict:
        """
        Validate subscription status with minute-level accuracy.
        Returns: {"status": "ok"|"grace"|"payment_required"|"forbidden", "message": str}
        """
        now = datetime.now(timezone.utc)

        # Check if suspended by admin
        if config.status == "suspended":
            return {
                "status": "forbidden",
                "message": "Account suspended. Please contact support."
            }

        # Check if churned
        if config.status == "churned":
            return {
                "status": "forbidden",
                "message": "Account closed."
            }

        # Check if locked
        if config.status == "locked":
            return {
                "status": "payment_required",
                "message": "Subscription expired. Please renew to continue."
            }

        # Check expiry with grace period (24 hours)
        grace_period_end = config.subscription_expiry + timedelta(hours=24)

        if now > grace_period_end:
            return {
                "status": "payment_required",
                "message": "Subscription expired. Please renew to continue."
            }

        if now > config.subscription_expiry:
            return {
                "status": "grace",
                "message": f"Subscription expired on {config.subscription_expiry.isoformat()}. Grace period active."
            }

        # All good
        return {"status": "ok", "message": "Active"}

    @staticmethod
    def _is_uuid(value: str) -> bool:
        try:
            UUID(value)
            return True
        except (ValueError, AttributeError):
            return False
