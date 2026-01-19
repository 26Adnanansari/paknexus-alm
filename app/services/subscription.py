from enum import Enum
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from uuid import UUID
import logging
import asyncpg

from app.models.tenant import SubscriptionStatus

logger = logging.getLogger(__name__)

class StateTransition(str, Enum):
    TRIAL_TO_ACTIVE = "trial_to_active"
    ACTIVE_TO_GRACE = "active_to_grace"
    GRACE_TO_LOCKED = "grace_to_locked"
    LOCKED_TO_ACTIVE = "locked_to_active"
    ANY_TO_SUSPENDED = "any_to_suspended"
    ANY_TO_CHURNED = "any_to_churned"

class SubscriptionStateMachine:
    """
    Manages tenant subscription lifecycle with automated state transitions.
    """
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool

    async def transition_to_active(
        self, 
        tenant_id: UUID, 
        admin_id: UUID,
        payment_reference: str,
        notes: Optional[str] = None
    ) -> dict:
        """
        TRIAL → ACTIVE: Manual admin approval after payment verification.
        """
        async with self.db_pool.acquire() as conn:
            async with conn.transaction():
                # Get current tenant state
                tenant = await conn.fetchrow(
                    "SELECT status, subscription_expiry FROM tenants WHERE tenant_id = $1",
                    tenant_id
                )
                
                if not tenant:
                    raise ValueError(f"Tenant {tenant_id} not found")
                
                if tenant["status"] != "trial":
                    raise ValueError(f"Cannot transition from {tenant['status']} to active")
                
                # Update to active
                await conn.execute(
                    """
                    UPDATE tenants 
                    SET status = 'active', 
                        last_payment_date = NOW(),
                        updated_at = NOW()
                    WHERE tenant_id = $1
                    """,
                    tenant_id
                )
                
                # Log the transition
                await self._log_transition(
                    conn, tenant_id, admin_id,
                    StateTransition.TRIAL_TO_ACTIVE,
                    {"payment_reference": payment_reference, "notes": notes}
                )
                
                logger.info(f"Tenant {tenant_id} transitioned from TRIAL to ACTIVE")
                return {"status": "success", "new_state": "active"}

    async def auto_transition_to_grace(self) -> int:
        """
        ACTIVE → GRACE: Automatic when current_time > subscription_expiry.
        Returns count of tenants transitioned.
        """
        async with self.db_pool.acquire() as conn:
            async with conn.transaction():
                # Find all active tenants past expiry
                tenants = await conn.fetch(
                    """
                    SELECT tenant_id FROM tenants
                    WHERE status = 'active' 
                    AND subscription_expiry < NOW()
                    """
                )
                
                count = 0
                for tenant in tenants:
                    await conn.execute(
                        """
                        UPDATE tenants 
                        SET status = 'grace', updated_at = NOW()
                        WHERE tenant_id = $1
                        """,
                        tenant["tenant_id"]
                    )
                    
                    # Queue notification
                    await conn.execute(
                        """
                        INSERT INTO notification_queue (tenant_id, type, payload)
                        VALUES ($1, 'email', $2)
                        """,
                        tenant["tenant_id"],
                        {"template": "grace_period_started", "urgency": "high"}
                    )
                    
                    count += 1
                    logger.info(f"Tenant {tenant['tenant_id']} transitioned to GRACE")
                
                return count

    async def auto_transition_to_locked(self) -> int:
        """
        GRACE → LOCKED: Automatic after 24-hour grace period.
        Returns count of tenants locked.
        """
        async with self.db_pool.acquire() as conn:
            async with conn.transaction():
                # Find all grace tenants past grace period (24 hours)
                tenants = await conn.fetch(
                    """
                    SELECT tenant_id FROM tenants
                    WHERE status = 'grace'
                    AND subscription_expiry + INTERVAL '24 hours' < NOW()
                    """
                )
                
                count = 0
                for tenant in tenants:
                    await conn.execute(
                        """
                        UPDATE tenants 
                        SET status = 'locked', updated_at = NOW()
                        WHERE tenant_id = $1
                        """,
                        tenant["tenant_id"]
                    )
                    
                    # Queue notification
                    await conn.execute(
                        """
                        INSERT INTO notification_queue (tenant_id, type, payload)
                        VALUES ($1, 'email', $2)
                        """,
                        tenant["tenant_id"],
                        {"template": "account_locked", "urgency": "critical"}
                    )
                    
                    count += 1
                    logger.warning(f"Tenant {tenant['tenant_id']} LOCKED due to expired grace period")
                
                return count

    async def unlock_and_extend(
        self,
        tenant_id: UUID,
        admin_id: UUID,
        extension_days: int,
        payment_reference: str,
        notes: Optional[str] = None
    ) -> dict:
        """
        LOCKED → ACTIVE: Manual admin action after payment + date extension.
        """
        async with self.db_pool.acquire() as conn:
            async with conn.transaction():
                tenant = await conn.fetchrow(
                    "SELECT status, subscription_expiry FROM tenants WHERE tenant_id = $1",
                    tenant_id
                )
                
                if not tenant:
                    raise ValueError(f"Tenant {tenant_id} not found")
                
                if tenant["status"] != "locked":
                    raise ValueError(f"Tenant is {tenant['status']}, not locked")
                
                # Calculate new expiry
                new_expiry = tenant["subscription_expiry"] + timedelta(days=extension_days)
                
                # Update to active with new expiry
                await conn.execute(
                    """
                    UPDATE tenants 
                    SET status = 'active',
                        subscription_expiry = $1,
                        last_payment_date = NOW(),
                        updated_at = NOW()
                    WHERE tenant_id = $2
                    """,
                    new_expiry,
                    tenant_id
                )
                
                # Log transition
                await self._log_transition(
                    conn, tenant_id, admin_id,
                    StateTransition.LOCKED_TO_ACTIVE,
                    {
                        "payment_reference": payment_reference,
                        "extension_days": extension_days,
                        "new_expiry": new_expiry.isoformat(),
                        "notes": notes
                    }
                )
                
                logger.info(f"Tenant {tenant_id} unlocked and extended by {extension_days} days")
                return {
                    "status": "success",
                    "new_state": "active",
                    "new_expiry": new_expiry.isoformat()
                }

    async def suspend_tenant(
        self,
        tenant_id: UUID,
        admin_id: UUID,
        reason: str
    ) -> dict:
        """
        Any → SUSPENDED: Admin action with mandatory reason.
        """
        if not reason or len(reason.strip()) < 10:
            raise ValueError("Suspension reason must be at least 10 characters")
        
        async with self.db_pool.acquire() as conn:
            async with conn.transaction():
                old_status = await conn.fetchval(
                    "SELECT status FROM tenants WHERE tenant_id = $1",
                    tenant_id
                )
                
                if not old_status:
                    raise ValueError(f"Tenant {tenant_id} not found")
                
                await conn.execute(
                    """
                    UPDATE tenants 
                    SET status = 'suspended', updated_at = NOW()
                    WHERE tenant_id = $1
                    """,
                    tenant_id
                )
                
                await self._log_transition(
                    conn, tenant_id, admin_id,
                    StateTransition.ANY_TO_SUSPENDED,
                    {"reason": reason, "previous_status": old_status}
                )
                
                logger.warning(f"Tenant {tenant_id} SUSPENDED by admin {admin_id}: {reason}")
                return {"status": "success", "new_state": "suspended"}

    async def churn_tenant(
        self,
        tenant_id: UUID,
        admin_id: UUID,
        reason: Optional[str] = None
    ) -> dict:
        """
        Any → CHURNED: Voluntary cancellation with 90-day data retention.
        """
        async with self.db_pool.acquire() as conn:
            async with conn.transaction():
                old_status = await conn.fetchval(
                    "SELECT status FROM tenants WHERE tenant_id = $1",
                    tenant_id
                )
                
                if not old_status:
                    raise ValueError(f"Tenant {tenant_id} not found")
                
                # Set deletion date to 90 days from now
                deletion_date = datetime.now(timezone.utc) + timedelta(days=90)
                
                await conn.execute(
                    """
                    UPDATE tenants 
                    SET status = 'churned', updated_at = NOW()
                    WHERE tenant_id = $1
                    """,
                    tenant_id
                )
                
                await self._log_transition(
                    conn, tenant_id, admin_id,
                    StateTransition.ANY_TO_CHURNED,
                    {
                        "reason": reason,
                        "previous_status": old_status,
                        "data_deletion_date": deletion_date.isoformat()
                    }
                )
                
                logger.info(f"Tenant {tenant_id} marked as CHURNED. Data deletion: {deletion_date}")
                return {
                    "status": "success",
                    "new_state": "churned",
                    "data_deletion_date": deletion_date.isoformat()
                }

    async def extend_subscription(
        self,
        tenant_id: UUID,
        admin_id: UUID,
        extension_days: int,
        payment_reference: str,
        amount: float,
        notes: Optional[str] = None
    ) -> dict:
        """
        Extend subscription for active/trial tenants.
        Adds days to current expiry (not from today).
        """
        async with self.db_pool.acquire() as conn:
            async with conn.transaction():
                tenant = await conn.fetchrow(
                    "SELECT status, subscription_expiry FROM tenants WHERE tenant_id = $1",
                    tenant_id
                )
                
                if not tenant:
                    raise ValueError(f"Tenant {tenant_id} not found")
                
                if tenant["status"] in ["suspended", "churned"]:
                    raise ValueError(f"Cannot extend {tenant['status']} tenant")
                
                # Add days to current expiry
                new_expiry = tenant["subscription_expiry"] + timedelta(days=extension_days)
                
                await conn.execute(
                    """
                    UPDATE tenants 
                    SET subscription_expiry = $1,
                        last_payment_date = NOW(),
                        updated_at = NOW()
                    WHERE tenant_id = $2
                    """,
                    new_expiry,
                    tenant_id
                )
                
                await self._log_transition(
                    conn, tenant_id, admin_id,
                    "subscription_extended",
                    {
                        "payment_reference": payment_reference,
                        "amount": amount,
                        "extension_days": extension_days,
                        "old_expiry": tenant["subscription_expiry"].isoformat(),
                        "new_expiry": new_expiry.isoformat(),
                        "notes": notes
                    }
                )
                
                logger.info(f"Tenant {tenant_id} subscription extended by {extension_days} days")
                return {
                    "status": "success",
                    "new_expiry": new_expiry.isoformat()
                }

    async def _log_transition(
        self,
        conn: asyncpg.Connection,
        tenant_id: UUID,
        admin_id: UUID,
        action: str,
        details: dict
    ):
        """Log state transition to audit log."""
        await conn.execute(
            """
            INSERT INTO audit_logs (tenant_id, actor_id, action, details)
            VALUES ($1, $2, $3, $4)
            """,
            tenant_id,
            admin_id,
            action,
            details
        )
