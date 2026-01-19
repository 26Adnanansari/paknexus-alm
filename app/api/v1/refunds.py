from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.refund import (
    RefundPolicy, RefundPolicyCreate, RefundCalculationRequest, RefundCalculationResult,
    RefundTier
)
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=RefundPolicy)
async def create_refund_policy(
    policy: RefundPolicyCreate,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Create a new refund policy with tiers.
    """
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant context required")

    async with db.acquire() as conn:
        async with conn.transaction():
            # Create Policy
            policy_row = await conn.fetchrow(
                """
                INSERT INTO refund_policies (tenant_id, name, description, is_default)
                VALUES ($1, $2, $3, $4)
                RETURNING *
                """,
                UUID(tenant_id), policy.name, policy.description, policy.is_default
            )
            
            # If default, unset other defaults
            if policy.is_default:
                await conn.execute(
                    """
                    UPDATE refund_policies 
                    SET is_default = FALSE 
                    WHERE tenant_id = $1 AND id != $2
                    """,
                    UUID(tenant_id), policy_row['id']
                )

            # Create Tiers
            created_tiers = []
            for tier in policy.tiers:
                tier_row = await conn.fetchrow(
                    """
                    INSERT INTO refund_tiers (policy_id, days_before, refund_percentage, fee_deduction)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                    """,
                    policy_row['id'], tier.days_before, tier.refund_percentage, tier.fee_deduction
                )
                created_tiers.append(RefundTier(**dict(tier_row)))

            return RefundPolicy(
                **dict(policy_row),
                tiers=created_tiers
            )

@router.get("/", response_model=List[RefundPolicy])
async def list_policies(
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """List all refund policies for the tenant."""
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
         raise HTTPException(status_code=400, detail="Tenant context required")

    rows = await db.fetch(
        "SELECT * FROM refund_policies WHERE tenant_id = $1 ORDER BY is_default DESC, created_at DESC",
        UUID(tenant_id)
    )
    
    policies = []
    for row in rows:
        policy = dict(row)
        tiers_rows = await db.fetch(
            "SELECT * FROM refund_tiers WHERE policy_id = $1 ORDER BY days_before DESC",
            policy['id']
        )
        policy['tiers'] = [RefundTier(**dict(t)) for t in tiers_rows]
        policies.append(RefundPolicy(**policy))
        
    return policies

@router.post("/calculate", response_model=RefundCalculationResult)
async def calculate_refund(
    request: RefundCalculationRequest,
    db = Depends(get_db)
):
    """
    Calculate refund amount based on policy and dates.
    """
    tiers_rows = await db.fetch(
        "SELECT * FROM refund_tiers WHERE policy_id = $1 ORDER BY days_before DESC",
        request.policy_id
    )
    
    if not tiers_rows:
        return RefundCalculationResult(refund_amount=0, percentage=0, deduction=0)

    # Determine days difference
    cancel_date = request.cancellation_date or datetime.now(timezone.utc)
    
    # Ensure dates are offset-aware if needed, simplified logic:
    if request.event_date.tzinfo is None:
        request.event_date = request.event_date.replace(tzinfo=timezone.utc)
    if cancel_date.tzinfo is None:
        cancel_date = cancel_date.replace(tzinfo=timezone.utc)

    delta = request.event_date - cancel_date
    days_to_event = delta.days

    matched_tier = None
    
    # Logic: Look for the smallest 'days_before' constraint that we satisfying
    # Actually usually it's:
    # If > 30 days -> 100%
    # If > 14 days -> 50%
    # We iterate DESC (30, 14, 0). The first one where days_to_event >= tier.days_before is our match.
    
    for row in tiers_rows:
        if days_to_event >= row['days_before']:
            matched_tier = row
            break
            
    if not matched_tier:
        return RefundCalculationResult(refund_amount=0, percentage=0, deduction=0)
        
    percentage = matched_tier['refund_percentage']
    deduction = float(matched_tier['fee_deduction'])
    
    raw_amount = (request.amount_paid * (percentage / 100.0)) - deduction
    final_amount = max(0.0, raw_amount)
    
    return RefundCalculationResult(
        refund_amount=final_amount,
        percentage=percentage,
        deduction=deduction,
        effective_tier_id=matched_tier['id']
    )
