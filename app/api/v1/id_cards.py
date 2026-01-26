"""
ID Card API Endpoints
RESTful API for ID card generation, restriction, and appeal management
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import List, Optional
from uuid import UUID
import json
import asyncpg

from app.models.id_card import (
    IDCardResponse, IDCardStatusResponse, IDCardWithStudent, IDCardStats,
    IDCardSubmit, AppealCreate, AppealResponse, AppealWithDetails,
    AppealReview, AppealStats, BulkIDCardGenerate, BulkIDCardResponse,
    IDCardStatus, AppealStatus
)
from app.services.id_card_service import IDCardService
from app.api.v1.deps import get_tenant_db_pool, get_current_school_user


router = APIRouter(prefix="/id-cards", tags=["ID Cards"])


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

async def get_id_card_service(db=Depends(get_tenant_db_pool)) -> IDCardService:
    """Get ID card service instance"""
    return IDCardService(db)


# ============================================================================
# ID CARD ENDPOINTS
# ============================================================================

@router.get("/stats", response_model=IDCardStats)
async def get_id_card_statistics(
    service: IDCardService = Depends(get_id_card_service),
    current_user=Depends(get_current_school_user)
):
    """
    Get ID card statistics (Admin only)
    
    Returns counts for different card statuses and overall metrics.
    """
    return await service.get_statistics()


@router.get("/list", response_model=List[IDCardWithStudent])
async def list_id_cards(
    status: Optional[IDCardStatus] = None,
    current_class: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    service: IDCardService = Depends(get_id_card_service),
    current_user=Depends(get_current_school_user)
):
    """
    List ID cards with student information (Admin only)
    
    Supports filtering by status and class.
    """
    return await service.list_cards_with_students(
        status_filter=status,
        class_filter=current_class,
        limit=limit,
        offset=offset
    )


@router.get("/{card_id}/status", response_model=IDCardStatusResponse)
async def get_card_status(
    card_id: UUID,
    service: IDCardService = Depends(get_id_card_service)
):
    """
    Get current status of an ID card
    
    Public endpoint - can be accessed with card token.
    Returns status, editability, and available actions.
    """
    return await service.get_card_status(card_id)


@router.get("/{card_id}", response_model=IDCardResponse)
async def get_id_card(
    card_id: UUID,
    service: IDCardService = Depends(get_id_card_service)
):
    """
    Get ID card details
    
    Public endpoint - can be accessed with card token.
    """
    card = await service.get_card_by_id(card_id)
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ID card not found"
        )
    
    return IDCardResponse(**dict(card))


@router.get("/student/{student_id}", response_model=IDCardResponse)
async def get_card_by_student(
    student_id: UUID,
    service: IDCardService = Depends(get_id_card_service),
    current_user=Depends(get_current_school_user)
):
    """
    Get ID card by student ID (Admin only)
    """
    card = await service.get_card_by_student(student_id)
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ID card not found for this student"
        )
    
    return IDCardResponse(**dict(card))


@router.post("/{card_id}/submit", response_model=IDCardResponse)
async def submit_id_card(
    card_id: UUID,
    request: Request,
    service: IDCardService = Depends(get_id_card_service)
):
    """
    Submit ID card for review - locks the card
    
    Public endpoint - can be accessed with card token.
    After submission, the card becomes read-only.
    """
    # Get IP address from request
    ip_address = request.client.host if request.client else None
    
    return await service.submit_card(card_id, ip_address)


@router.post("/bulk-generate", response_model=BulkIDCardResponse)
async def bulk_generate_id_cards(
    data: BulkIDCardGenerate,
    service: IDCardService = Depends(get_id_card_service),
    current_user=Depends(get_current_school_user)
):
    """
    Generate ID cards for multiple students (Admin only)
    
    Useful for batch operations like generating cards for an entire class.
    """
    return await service.bulk_generate_cards(data)


# ============================================================================
# APPEAL ENDPOINTS
# ============================================================================

@router.post("/appeals", response_model=AppealResponse, status_code=status.HTTP_201_CREATED)
async def create_appeal(
    appeal: AppealCreate,
    service: IDCardService = Depends(get_id_card_service)
):
    """
    Submit an appeal for ID card correction
    
    Public endpoint - can be accessed with card token.
    Used when a student/parent finds a mistake in their locked ID card.
    """
    return await service.create_appeal(appeal)


@router.get("/appeals", response_model=List[AppealWithDetails])
async def list_appeals(
    status: Optional[AppealStatus] = None,
    limit: int = 100,
    offset: int = 0,
    service: IDCardService = Depends(get_id_card_service),
    current_user=Depends(get_current_school_user)
):
    """
    List all appeals with details (Admin only)
    
    Supports filtering by status (pending, approved, rejected).
    """
    return await service.list_appeals(
        status_filter=status,
        limit=limit,
        offset=offset
    )


@router.get("/appeals/stats", response_model=AppealStats)
async def get_appeal_statistics(
    service: IDCardService = Depends(get_id_card_service),
    current_user=Depends(get_current_school_user)
):
    """
    Get appeal statistics (Admin only)
    
    Returns counts, average review time, and oldest pending appeal.
    """
    return await service.get_appeal_stats()


@router.get("/appeals/pending", response_model=List[AppealWithDetails])
async def get_pending_appeals(
    service: IDCardService = Depends(get_id_card_service),
    current_user=Depends(get_current_school_user)
):
    """
    Get all pending appeals (Admin only)
    
    Shortcut endpoint for the most common use case.
    """
    return await service.list_appeals(status_filter=AppealStatus.PENDING)


@router.put("/appeals/{appeal_id}/review")
async def review_appeal(
    appeal_id: UUID,
    review: AppealReview,
    service: IDCardService = Depends(get_id_card_service),
    current_user=Depends(get_current_school_user)
):
    """
    Approve or reject an appeal (Admin only)
    
    If approved, the ID card is unlocked for ONE MORE edit.
    If rejected, the card remains locked.
    """
    result = await service.review_appeal(
        appeal_id=appeal_id,
        action=review.action,
        admin_id=current_user.get("user_id"),  # Adjust based on your auth system
        admin_notes=review.admin_notes
    )
    
    return {
        "message": f"Appeal {review.action}d successfully",
        "result": result
    }


@router.get("/appeals/{appeal_id}", response_model=AppealResponse)
async def get_appeal(
    appeal_id: UUID,
    service: IDCardService = Depends(get_id_card_service),
    current_user=Depends(get_current_school_user)
):
    """
    Get appeal details by ID (Admin only)
    """
    query = "SELECT * FROM id_card_appeals WHERE appeal_id = $1"
    appeal = await service.conn.fetchrow(query, appeal_id)
    
    if not appeal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appeal not found"
        )
    
    return AppealResponse(**dict(appeal))


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "service": "ID Card Management",
        "version": "1.0.0"
    }


@router.get("/pending-count")
async def get_pending_count(
    service: IDCardService = Depends(get_id_card_service),
    current_user=Depends(get_current_school_user)
):
    """
    Get count of pending appeals (Admin only)
    
    Useful for dashboard badges/notifications.
    """
    stats = await service.get_appeal_stats()
    return {
        "pending_count": stats.pending_count,
        "oldest_pending_hours": stats.oldest_pending_hours
    }


# ============================================================================
# TEMPLATE MANAGEMENT
# ============================================================================
from app.api.v1.deps import get_master_db_pool
from app.models.id_card import TemplateCreate, TemplateResponse, TemplateUpdate

@router.post("/system/init-templates")
async def init_template_schema(
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """Update schema to support multiple templates"""
    async with pool.acquire() as conn:
        await conn.execute("""
            ALTER TABLE id_card_templates DROP CONSTRAINT IF EXISTS id_card_templates_tenant_id_key;
            ALTER TABLE id_card_templates ADD COLUMN IF NOT EXISTS template_name VARCHAR(100);
            ALTER TABLE id_card_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
            ALTER TABLE id_card_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
        """)
        return {"message": "Template schema updated"}

@router.get("/templates", response_model=List[TemplateResponse])
async def list_templates(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """List all ID card templates for tenant"""
    tenant_id = current_user["tenant_id"]
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM id_card_templates 
            WHERE tenant_id = $1 AND is_active = TRUE
            ORDER BY created_at DESC
        """, tenant_id)
        return [dict(r) for r in rows]

@router.post("/templates", response_model=TemplateResponse)
async def create_template(
    template: TemplateCreate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """Create a new ID card template with Cloudinary URLs"""
    tenant_id = current_user["tenant_id"]
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO id_card_templates 
            (tenant_id, template_name, front_bg_url, back_bg_url, field_positions, is_default, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        """, tenant_id, template.template_name, template.front_image_url, template.back_image_url, 
             json.dumps(template.layout_json), template.is_default, template.is_active)
        return dict(row)

@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: UUID,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """Delete a template"""
    tenant_id = current_user["tenant_id"]
    async with pool.acquire() as conn:
        result = await conn.execute("""
            DELETE FROM id_card_templates
            WHERE template_id = $1 AND tenant_id = $2
        """, template_id, tenant_id)
        if result == "DELETE 0":
             raise HTTPException(status_code=404, detail="Template not found")
        return {"message": "Template deleted"}

@router.put("/templates/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: UUID,
    template: TemplateUpdate,
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_master_db_pool)
):
    """Update a template"""
    tenant_id = current_user["tenant_id"]
    async with pool.acquire() as conn:
        # Check existence
        existing = await conn.fetchrow("SELECT * FROM id_card_templates WHERE template_id=$1 AND tenant_id=$2", template_id, tenant_id)
        if not existing:
             raise HTTPException(status_code=404, detail="Template not found")
             
        # Update fields
        # Ideally using a dynamic query builder, but given limited fields:
        front = template.front_image_url if template.front_image_url is not None else existing['front_bg_url']
        back = template.back_image_url if template.back_image_url is not None else existing['back_bg_url']
        name = template.template_name if template.template_name is not None else existing['template_name']
        layout = json.dumps(template.layout_json) if template.layout_json is not None else existing['field_positions']
        active = template.is_active if template.is_active is not None else existing['is_active']
        
        row = await conn.fetchrow("""
             UPDATE id_card_templates
             SET template_name = $1, front_bg_url = $2, back_bg_url = $3, field_positions = $4, is_active = $5, updated_at = NOW()
             WHERE template_id = $6 AND tenant_id = $7
             RETURNING *
        """, name, front, back, layout, active, template_id, tenant_id)
        
        return dict(row)

