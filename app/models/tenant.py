from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum

class SubscriptionStatus(str, Enum):
    TRIAL = 'trial'
    ACTIVE = 'active'
    GRACE = 'grace'
    LOCKED = 'locked'
    SUSPENDED = 'suspended'
    CHURNED = 'churned'

class TenantCredentials(BaseModel):
    supabase_project_url: str
    supabase_service_key: str

class TenantBase(BaseModel):
    name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    
    # Branding
    logo_url: Optional[str] = None
    primary_color: Optional[str] = '#0f172a'
    secondary_color: Optional[str] = '#3b82f6'
    website: Optional[str] = None
    address: Optional[str] = None
    subdomain: str = Field(..., description="Unique slug for the tenant's application URL")

class TenantCreate(TenantBase):
    # During creation, we accept raw credentials to be encrypted by the Vault
    supabase_url_raw: str
    supabase_key_raw: str

class TenantResponse(TenantBase):
    tenant_id: UUID
    status: SubscriptionStatus
    trial_start: Optional[datetime]
    subscription_expiry: datetime
    created_at: datetime
    
    # We never return credentials in the standard response
    
    class Config:
        from_attributes = True

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
