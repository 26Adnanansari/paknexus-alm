from pydantic import BaseModel, conint, condecimal
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class RefundTierBase(BaseModel):
    days_before: int
    refund_percentage: conint(ge=0, le=100) # type: ignore
    fee_deduction: Optional[float] = 0.0

class RefundTierCreate(RefundTierBase):
    pass

class RefundTier(RefundTierBase):
    id: UUID
    policy_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class RefundPolicyBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False

class RefundPolicyCreate(RefundPolicyBase):
    tiers: List[RefundTierCreate]

class RefundPolicy(RefundPolicyBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
    tiers: List[RefundTier] = []

    class Config:
        from_attributes = True

class RefundCalculationRequest(BaseModel):
    policy_id: UUID
    event_date: datetime
    cancellation_date: Optional[datetime] = None  # Defaults to now if empty
    amount_paid: float

class RefundCalculationResult(BaseModel):
    refund_amount: float
    percentage: int
    deduction: float
    effective_tier_id: Optional[UUID] = None
