from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID, uuid4
import logging
import asyncpg

from app.models.payment import (
    PaymentRecordRequest, 
    PaymentRecordResponse,
    PaymentPlan
)

logger = logging.getLogger(__name__)

class PaymentService:
    """
    Handles payment recording and subscription extension calculations.
    """
    
    # Pricing configuration (in production, store in database)
    MONTHLY_RATE = 100.0  # USD per month
    QUARTERLY_DISCOUNT = 0.05  # 5% discount
    ANNUAL_DISCOUNT = 0.15  # 15% discount
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool

    async def record_payment(
        self,
        payment_request: PaymentRecordRequest,
        admin_id: UUID
    ) -> PaymentRecordResponse:
        """
        Record a manual payment and calculate subscription extension.
        """
        # Calculate extension days based on payment plan
        extension_days = self._calculate_extension_days(
            payment_request.amount,
            payment_request.plan
        )
        
        async with self.db_pool.acquire() as conn:
            async with conn.transaction():
                # Get current tenant info
                tenant = await conn.fetchrow(
                    "SELECT subscription_expiry, status FROM tenants WHERE tenant_id = $1",
                    payment_request.tenant_id
                )
                
                if not tenant:
                    raise ValueError(f"Tenant {payment_request.tenant_id} not found")
                
                # Calculate new expiry (add to current expiry, not today)
                current_expiry = tenant["subscription_expiry"]
                new_expiry = current_expiry + timedelta(days=extension_days)
                
                # Update tenant
                await conn.execute(
                    """
                    UPDATE tenants 
                    SET subscription_expiry = $1,
                        last_payment_date = $2,
                        payment_method = $3,
                        updated_at = NOW()
                    WHERE tenant_id = $4
                    """,
                    new_expiry,
                    payment_request.payment_date,
                    payment_request.payment_method.value,
                    payment_request.tenant_id
                )
                
                # Log in audit trail
                await conn.execute(
                    """
                    INSERT INTO audit_logs (tenant_id, actor_id, action, details)
                    VALUES ($1, $2, 'PAYMENT_RECORDED', $3)
                    """,
                    payment_request.tenant_id,
                    admin_id,
                    {
                        "amount": payment_request.amount,
                        "currency": payment_request.currency,
                        "payment_method": payment_request.payment_method.value,
                        "reference_number": payment_request.reference_number,
                        "extension_days": extension_days,
                        "old_expiry": current_expiry.isoformat(),
                        "new_expiry": new_expiry.isoformat(),
                        "notes": payment_request.admin_notes
                    }
                )
                
                # Queue notification
                await conn.execute(
                    """
                    INSERT INTO notification_queue (tenant_id, type, payload)
                    VALUES ($1, 'email', $2)
                    """,
                    payment_request.tenant_id,
                    {
                        "template": "payment_received",
                        "amount": payment_request.amount,
                        "new_expiry": new_expiry.isoformat()
                    }
                )
                
                logger.info(
                    f"Payment recorded for tenant {payment_request.tenant_id}: "
                    f"${payment_request.amount} -> {extension_days} days"
                )
                
                return PaymentRecordResponse(
                    payment_id=uuid4(),  # In production, store in payments table
                    tenant_id=payment_request.tenant_id,
                    amount=payment_request.amount,
                    extension_days=extension_days,
                    new_expiry=new_expiry,
                    receipt_url=None  # TODO: Generate PDF receipt
                )

    def _calculate_extension_days(self, amount: float, plan: PaymentPlan) -> int:
        """
        Calculate subscription extension days based on amount and plan.
        """
        if plan == PaymentPlan.MONTHLY:
            # Standard: $100 = 30 days
            days = int((amount / self.MONTHLY_RATE) * 30)
            return days
        
        elif plan == PaymentPlan.QUARTERLY:
            # 90 days with 5% discount
            expected_amount = self.MONTHLY_RATE * 3 * (1 - self.QUARTERLY_DISCOUNT)
            if amount < expected_amount * 0.95:  # Allow 5% tolerance
                raise ValueError(
                    f"Quarterly plan requires ${expected_amount:.2f} "
                    f"(received ${amount})"
                )
            return 90
        
        elif plan == PaymentPlan.ANNUAL:
            # 365 days with 15% discount
            expected_amount = self.MONTHLY_RATE * 12 * (1 - self.ANNUAL_DISCOUNT)
            if amount < expected_amount * 0.95:
                raise ValueError(
                    f"Annual plan requires ${expected_amount:.2f} "
                    f"(received ${amount})"
                )
            return 365
        
        elif plan == PaymentPlan.CUSTOM:
            # Pro-rated calculation
            days = int((amount / self.MONTHLY_RATE) * 30)
            return days
        
        return 0

    async def get_overdue_payments(self) -> list:
        """
        Find tenants with overdue payments (7 days past expiry with no payment).
        """
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT tenant_id, name, contact_email, subscription_expiry
                FROM tenants
                WHERE subscription_expiry < NOW() - INTERVAL '7 days'
                AND status IN ('grace', 'locked')
                ORDER BY subscription_expiry ASC
                """
            )
            
            return [dict(row) for row in rows]

    async def calculate_collection_rate(self, month: Optional[int] = None) -> dict:
        """
        Calculate payment collection rate for a given month.
        """
        # TODO: Implement based on expected vs actual payments
        # This requires a payments history table
        return {
            "expected_payments": 0,
            "received_payments": 0,
            "collection_rate": 0.0
        }
