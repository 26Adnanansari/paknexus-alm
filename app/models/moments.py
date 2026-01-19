from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum

class MomentStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class MomentBase(BaseModel):
    image_url: str
    caption: Optional[str] = None
    status: MomentStatus = MomentStatus.DRAFT

class MomentCreate(MomentBase):
    order_id: Optional[UUID] = None

class MomentUpdate(BaseModel):
    image_url: Optional[str] = None
    caption: Optional[str] = None
    status: Optional[MomentStatus] = None

class Moment(MomentBase):
    id: UUID
    tenant_id: UUID
    order_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
