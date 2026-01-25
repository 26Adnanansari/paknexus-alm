"""
ID Card API Endpoints
RESTful API for ID card generation, restriction, and appeal management
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import List, Optional
from uuid import UUID

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


# Note: Exception handling is done at the app level in main.py
