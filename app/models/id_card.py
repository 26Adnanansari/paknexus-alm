"""
ID Card Models
Pydantic models for ID card generation, restriction, and appeal system
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from uuid import UUID
from enum import Enum


class IDCardStatus(str, Enum):
    """ID Card status enumeration"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    LOCKED = "locked"
    APPEAL_PENDING = "appeal_pending"
    UNLOCKED_FOR_EDIT = "unlocked_for_edit"


class AppealStatus(str, Enum):
    """Appeal status enumeration"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# ============================================================================
# ID CARD MODELS
# ============================================================================

class IDCardBase(BaseModel):
    """Base ID card model"""
    card_number: str
    issue_date: date
    expiry_date: Optional[date] = None


class IDCardCreate(BaseModel):
    """Create new ID card"""
    student_id: UUID
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None


class IDCardUpdate(BaseModel):
    """Update ID card information"""
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    qr_code_url: Optional[str] = None


class IDCardSubmit(BaseModel):
    """Submit ID card for review"""
    student_id: UUID
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class IDCardResponse(BaseModel):
    """ID card response model"""
    card_id: UUID
    student_id: UUID
    card_number: str
    qr_code_url: Optional[str] = None
    issue_date: date
    expiry_date: Optional[date] = None
    status: IDCardStatus
    submission_count: int
    is_editable: bool
    last_submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IDCardStatusResponse(BaseModel):
    """ID card status information"""
    card_id: UUID
    status: IDCardStatus
    is_editable: bool
    submission_count: int
    last_submitted_at: Optional[datetime] = None
    can_submit: bool
    can_appeal: bool
    appeal_pending: bool


class IDCardWithStudent(BaseModel):
    """ID card with student information"""
    card_id: UUID
    card_number: str
    status: IDCardStatus
    is_editable: bool
    student_id: UUID
    full_name: str
    admission_number: str
    current_class: Optional[str] = None
    photo_url: Optional[str] = None
    qr_code_url: Optional[str] = None


# ============================================================================
# APPEAL MODELS
# ============================================================================

class AppealCreate(BaseModel):
    """Create new appeal"""
    student_id: UUID
    card_id: UUID
    appeal_reason: str = Field(..., min_length=10, max_length=500)
    mistake_description: str = Field(..., min_length=10, max_length=1000)
    requested_changes: Optional[Dict[str, Any]] = None

    @validator('appeal_reason', 'mistake_description')
    def validate_text_fields(cls, v):
        """Validate text fields are not just whitespace"""
        if not v or not v.strip():
            raise ValueError('Field cannot be empty or just whitespace')
        return v.strip()


class AppealUpdate(BaseModel):
    """Update appeal (admin only)"""
    admin_notes: Optional[str] = None
    status: Optional[AppealStatus] = None


class AppealReview(BaseModel):
    """Review appeal (approve/reject)"""
    action: str = Field(..., pattern="^(approve|reject)$")
    admin_notes: Optional[str] = Field(None, max_length=1000)

    @validator('action')
    def validate_action(cls, v):
        """Validate action is approve or reject"""
        if v not in ['approve', 'reject']:
            raise ValueError('Action must be either "approve" or "reject"')
        return v


class AppealResponse(BaseModel):
    """Appeal response model"""
    appeal_id: UUID
    student_id: UUID
    card_id: UUID
    appeal_reason: str
    mistake_description: str
    requested_changes: Optional[Dict[str, Any]] = None
    status: AppealStatus
    submitted_at: datetime
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppealWithDetails(BaseModel):
    """Appeal with student and card details"""
    appeal_id: UUID
    student_id: UUID
    full_name: str
    admission_number: str
    current_class: Optional[str] = None
    appeal_reason: str
    mistake_description: str
    requested_changes: Optional[Dict[str, Any]] = None
    status: AppealStatus
    card_status: IDCardStatus
    submission_count: int
    submitted_at: datetime
    hours_pending: Optional[float] = None
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    admin_notes: Optional[str] = None


class AppealStats(BaseModel):
    """Appeal statistics"""
    total_appeals: int
    pending_count: int
    approved_count: int
    rejected_count: int
    avg_review_time_hours: Optional[float] = None
    oldest_pending_hours: Optional[float] = None


# ============================================================================
# TEMPLATE MODELS
# ============================================================================

class TemplateCreate(BaseModel):
    """Create ID card template"""
    template_name: str = Field(..., min_length=3, max_length=100)
    layout_json: Dict[str, Any]
    front_image_url: Optional[str] = None  # Legacy field name
    back_image_url: Optional[str] = None   # Legacy field name
    front_bg_url: Optional[str] = None     # New field name
    back_bg_url: Optional[str] = None      # New field name
    is_default: bool = False
    is_active: bool = True


class TemplateUpdate(BaseModel):
    """Update ID card template"""
    template_name: Optional[str] = Field(None, min_length=3, max_length=100)
    layout_json: Optional[Dict[str, Any]] = None
    front_image_url: Optional[str] = None  # Legacy field name
    back_image_url: Optional[str] = None   # Legacy field name
    front_bg_url: Optional[str] = None     # New field name
    back_bg_url: Optional[str] = None      # New field name
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


class TemplateResponse(BaseModel):
    """Template response model"""
    template_id: UUID
    template_name: str
    layout_json: Dict[str, Any] = {}
    front_image_url: Optional[str] = None
    back_image_url: Optional[str] = None
    is_default: bool = False
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# BULK OPERATIONS
# ============================================================================

class BulkIDCardGenerate(BaseModel):
    """Generate ID cards for multiple students"""
    student_ids: List[UUID] = Field(..., min_items=1, max_items=500)
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None


class BulkIDCardResponse(BaseModel):
    """Bulk operation response"""
    total: int
    successful: int
    failed: int
    errors: List[Dict[str, Any]] = []
    card_ids: List[UUID] = []


# ============================================================================
# STATISTICS & REPORTS
# ============================================================================

class IDCardStats(BaseModel):
    """ID card statistics"""
    draft_count: int
    submitted_count: int
    locked_count: int
    appeal_pending_count: int
    unlocked_count: int
    total_cards: int
    editable_count: int
    locked_count_total: int


class EditHistoryEntry(BaseModel):
    """Single edit history entry"""
    action: str
    timestamp: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    submission_count: Optional[int] = None
    admin_id: Optional[str] = None


class IDCardAuditLog(BaseModel):
    """Complete audit log for ID card"""
    card_id: UUID
    student_id: UUID
    student_name: str
    admission_number: str
    current_status: IDCardStatus
    edit_history: List[EditHistoryEntry]
    appeals: List[AppealResponse]


# ============================================================================
# VALIDATION MODELS
# ============================================================================

class IDCardValidation(BaseModel):
    """Validate ID card data before submission"""
    card_id: UUID
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    can_submit: bool


# ============================================================================
# PUBLIC MODELS (for sharing links)
# ============================================================================

class PublicIDCardView(BaseModel):
    """Public view of ID card (limited information)"""
    card_number: str
    full_name: str
    admission_number: str
    current_class: Optional[str] = None
    photo_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    issue_date: date
    expiry_date: Optional[date] = None
    is_valid: bool
    status: str  # Generic status, not detailed


class ShareLinkCreate(BaseModel):
    """Create shareable link for ID card"""
    card_id: UUID
    expires_in_days: int = Field(default=7, ge=1, le=30)
    allow_edit: bool = True


class ShareLinkResponse(BaseModel):
    """Shareable link response"""
    link_token: str
    card_id: UUID
    expires_at: datetime
    allow_edit: bool
    share_url: str
