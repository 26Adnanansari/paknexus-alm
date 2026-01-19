from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class ModuleBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    base_price: Decimal

class ModuleResponse(ModuleBase):
    module_id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TenantModuleUpdate(BaseModel):
    module_id: UUID
    is_enabled: bool
    price_override: Optional[Decimal] = None

class TenantModuleResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    module: ModuleResponse
    status: str
    price_override: Optional[Decimal]
    enabled_at: datetime
    
    class Config:
        from_attributes = True
