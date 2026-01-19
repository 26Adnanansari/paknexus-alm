from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum

class PaymentMethod(str, Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CHEQUE = "cheque"
    STRIPE = "stripe"

class PaymentPlan(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    CUSTOM = "custom"

class PaymentRecordRequest(BaseModel):
    tenant_id: UUID
    amount: float = Field(gt=0, description="Payment amount")
    currency: str = Field(default="USD", max_length=3)
    payment_date: datetime
    payment_method: PaymentMethod
    reference_number: str = Field(min_length=1, max_length=100)
    admin_notes: Optional[str] = None
    plan: PaymentPlan = PaymentPlan.MONTHLY

class PaymentRecordResponse(BaseModel):
    payment_id: UUID
    tenant_id: UUID
    amount: float
    extension_days: int
    new_expiry: datetime
    receipt_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class SubscriptionExtensionRequest(BaseModel):
    extension_days: int = Field(gt=0, le=3650, description="Days to extend (max 10 years)")
    payment_reference: str
    amount: float = Field(gt=0)
    notes: Optional[str] = None
