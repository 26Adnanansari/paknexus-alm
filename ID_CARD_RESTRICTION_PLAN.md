# 🔒 ID Card Edit Restriction & Appeal System - Implementation Plan

## 📋 Overview

This document outlines the implementation plan for the **ID Card Edit Restriction & Appeal System**, a critical security feature that prevents unauthorized data tampering while allowing admin-controlled corrections.

---

## 🎯 Business Requirements

### Problem Statement
Currently, public users can edit ID card information unlimited times, which creates:
- ❌ Security vulnerabilities (data tampering)
- ❌ No audit trail
- ❌ Potential fraud
- ❌ Loss of data integrity

### Solution
Implement a **one-time edit restriction** with an **appeal workflow**:

1. ✅ Public user fills ID card form (DRAFT state)
2. ✅ Public user submits → Data locked (READ-ONLY)
3. ✅ If mistake found → Public submits appeal to admin
4. ✅ Admin reviews appeal → Can unlock for ONE MORE edit
5. ✅ Public edits again → Re-submit → Permanently locked

---

## 🗄️ Database Schema Changes

### 1. Update `student_id_cards` Table

```sql
-- Add tracking and restriction fields
ALTER TABLE student_id_cards ADD COLUMN IF NOT EXISTS
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'locked', 'appeal_pending', 'unlocked_for_edit')),
  submission_count INTEGER DEFAULT 0,
  last_submitted_at TIMESTAMPTZ,
  is_editable BOOLEAN DEFAULT TRUE,
  appeal_reason TEXT,
  appeal_submitted_at TIMESTAMPTZ,
  unlocked_by_admin_id UUID REFERENCES staff(staff_id),
  unlocked_at TIMESTAMPTZ,
  edit_history JSONB DEFAULT '[]'::jsonb;

-- Add index for performance
CREATE INDEX idx_id_cards_status ON student_id_cards(status);
CREATE INDEX idx_id_cards_editable ON student_id_cards(is_editable);
```

### 2. Create `id_card_appeals` Table

```sql
CREATE TABLE id_card_appeals (
  appeal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
  card_id UUID REFERENCES student_id_cards(card_id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL,
  mistake_description TEXT NOT NULL,
  requested_changes JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES staff(staff_id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appeals_status ON id_card_appeals(status);
CREATE INDEX idx_appeals_student ON id_card_appeals(student_id);
CREATE INDEX idx_appeals_submitted ON id_card_appeals(submitted_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_id_card_appeals_updated_at
  BEFORE UPDATE ON id_card_appeals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔧 Backend Implementation

### Phase 1: Database Migration Script

**File**: `app/db/migrations/add_id_card_restrictions.py`

```python
"""
Migration: Add ID Card Edit Restrictions
Date: 2026-01-25
"""

async def upgrade(conn):
    # Add columns to student_id_cards
    await conn.execute("""
        ALTER TABLE student_id_cards 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft',
        ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS appeal_reason TEXT,
        ADD COLUMN IF NOT EXISTS appeal_submitted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS unlocked_by_admin_id UUID,
        ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;
    """)
    
    # Create appeals table
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS id_card_appeals (
            appeal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
            card_id UUID REFERENCES student_id_cards(card_id) ON DELETE CASCADE,
            appeal_reason TEXT NOT NULL,
            mistake_description TEXT NOT NULL,
            requested_changes JSONB,
            status VARCHAR(20) DEFAULT 'pending',
            submitted_at TIMESTAMPTZ DEFAULT NOW(),
            reviewed_by UUID REFERENCES staff(staff_id),
            reviewed_at TIMESTAMPTZ,
            admin_notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
```

### Phase 2: Pydantic Models

**File**: `app/models/id_card.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum

class IDCardStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    LOCKED = "locked"
    APPEAL_PENDING = "appeal_pending"
    UNLOCKED_FOR_EDIT = "unlocked_for_edit"

class AppealStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class IDCardSubmit(BaseModel):
    student_id: UUID
    ip_address: Optional[str] = None

class AppealCreate(BaseModel):
    student_id: UUID
    card_id: UUID
    appeal_reason: str = Field(..., min_length=10, max_length=500)
    mistake_description: str = Field(..., min_length=10, max_length=1000)
    requested_changes: Optional[Dict[str, Any]] = None

class AppealResponse(BaseModel):
    appeal_id: UUID
    student_id: UUID
    status: AppealStatus
    appeal_reason: str
    mistake_description: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    admin_notes: Optional[str] = None

class AppealReview(BaseModel):
    action: str = Field(..., regex="^(approve|reject)$")
    admin_notes: Optional[str] = None
```

### Phase 3: API Endpoints

**File**: `app/api/v1/id_cards.py`

```python
from fastapi import APIRouter, Depends, HTTPException, Request
from uuid import UUID
from typing import List
from app.models.id_card import *
from app.services.id_card_service import IDCardService
from app.core.auth import get_current_user

router = APIRouter(prefix="/id-cards", tags=["ID Cards"])

@router.post("/{card_id}/submit")
async def submit_id_card(
    card_id: UUID,
    request: Request,
    service: IDCardService = Depends()
):
    """
    Submit ID card for review - locks the card
    """
    ip_address = request.client.host
    result = await service.submit_card(card_id, ip_address)
    return {"message": "ID card submitted successfully", "status": result.status}

@router.post("/{card_id}/appeal")
async def create_appeal(
    card_id: UUID,
    appeal: AppealCreate,
    service: IDCardService = Depends()
):
    """
    Submit an appeal for ID card correction
    """
    result = await service.create_appeal(appeal)
    return {"message": "Appeal submitted successfully", "appeal_id": result.appeal_id}

@router.get("/appeals", dependencies=[Depends(get_current_user)])
async def list_appeals(
    status: Optional[AppealStatus] = None,
    service: IDCardService = Depends()
) -> List[AppealResponse]:
    """
    List all appeals (Admin only)
    """
    return await service.list_appeals(status)

@router.put("/appeals/{appeal_id}/review", dependencies=[Depends(get_current_user)])
async def review_appeal(
    appeal_id: UUID,
    review: AppealReview,
    current_user = Depends(get_current_user),
    service: IDCardService = Depends()
):
    """
    Approve or reject an appeal (Admin only)
    """
    result = await service.review_appeal(
        appeal_id, 
        review.action, 
        current_user.id,
        review.admin_notes
    )
    return {"message": f"Appeal {review.action}d successfully", "result": result}

@router.get("/{card_id}/status")
async def get_card_status(
    card_id: UUID,
    service: IDCardService = Depends()
):
    """
    Get current status of ID card
    """
    return await service.get_card_status(card_id)
```

### Phase 4: Service Layer

**File**: `app/services/id_card_service.py`

```python
from uuid import UUID
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
from app.db.database import get_db_connection
from app.models.id_card import *
from app.services.email_service import EmailService

class IDCardService:
    def __init__(self):
        self.email_service = EmailService()
    
    async def submit_card(self, card_id: UUID, ip_address: str):
        """Submit ID card and lock it"""
        async with get_db_connection() as conn:
            # Get current card
            card = await conn.fetchrow(
                "SELECT * FROM student_id_cards WHERE card_id = $1",
                card_id
            )
            
            if not card:
                raise HTTPException(404, "ID card not found")
            
            if card['status'] != 'draft' and card['status'] != 'unlocked_for_edit':
                raise HTTPException(400, "Card cannot be submitted in current state")
            
            # Update card status
            new_status = 'submitted' if card['submission_count'] == 0 else 'locked'
            
            # Add to edit history
            edit_history = card.get('edit_history', [])
            edit_history.append({
                'action': 'submit',
                'timestamp': datetime.now().isoformat(),
                'ip_address': ip_address,
                'submission_count': card['submission_count'] + 1
            })
            
            updated = await conn.fetchrow("""
                UPDATE student_id_cards
                SET status = $1,
                    submission_count = submission_count + 1,
                    last_submitted_at = NOW(),
                    is_editable = FALSE,
                    edit_history = $2
                WHERE card_id = $3
                RETURNING *
            """, new_status, json.dumps(edit_history), card_id)
            
            # Send notification email
            await self._send_submission_email(card_id)
            
            return updated
    
    async def create_appeal(self, appeal: AppealCreate):
        """Create a new appeal for ID card correction"""
        async with get_db_connection() as conn:
            # Check if card exists and is locked
            card = await conn.fetchrow(
                "SELECT * FROM student_id_cards WHERE card_id = $1",
                appeal.card_id
            )
            
            if not card:
                raise HTTPException(404, "ID card not found")
            
            if card['is_editable']:
                raise HTTPException(400, "Card is already editable")
            
            # Check for pending appeals
            existing = await conn.fetchrow("""
                SELECT * FROM id_card_appeals
                WHERE card_id = $1 AND status = 'pending'
            """, appeal.card_id)
            
            if existing:
                raise HTTPException(400, "An appeal is already pending for this card")
            
            # Create appeal
            result = await conn.fetchrow("""
                INSERT INTO id_card_appeals (
                    student_id, card_id, appeal_reason,
                    mistake_description, requested_changes
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            """, 
                appeal.student_id,
                appeal.card_id,
                appeal.appeal_reason,
                appeal.mistake_description,
                json.dumps(appeal.requested_changes) if appeal.requested_changes else None
            )
            
            # Update card status
            await conn.execute("""
                UPDATE student_id_cards
                SET status = 'appeal_pending',
                    appeal_reason = $1,
                    appeal_submitted_at = NOW()
                WHERE card_id = $2
            """, appeal.appeal_reason, appeal.card_id)
            
            # Send notification to admin
            await self._send_appeal_notification(result['appeal_id'])
            
            return result
    
    async def review_appeal(
        self, 
        appeal_id: UUID, 
        action: str,
        admin_id: UUID,
        admin_notes: Optional[str] = None
    ):
        """Approve or reject an appeal"""
        async with get_db_connection() as conn:
            # Get appeal
            appeal = await conn.fetchrow(
                "SELECT * FROM id_card_appeals WHERE appeal_id = $1",
                appeal_id
            )
            
            if not appeal:
                raise HTTPException(404, "Appeal not found")
            
            if appeal['status'] != 'pending':
                raise HTTPException(400, "Appeal already reviewed")
            
            # Update appeal
            new_status = 'approved' if action == 'approve' else 'rejected'
            
            await conn.execute("""
                UPDATE id_card_appeals
                SET status = $1,
                    reviewed_by = $2,
                    reviewed_at = NOW(),
                    admin_notes = $3
                WHERE appeal_id = $4
            """, new_status, admin_id, admin_notes, appeal_id)
            
            # If approved, unlock card for editing
            if action == 'approve':
                await conn.execute("""
                    UPDATE student_id_cards
                    SET status = 'unlocked_for_edit',
                        is_editable = TRUE,
                        unlocked_by_admin_id = $1,
                        unlocked_at = NOW()
                    WHERE card_id = $2
                """, admin_id, appeal['card_id'])
            else:
                # If rejected, set back to locked
                await conn.execute("""
                    UPDATE student_id_cards
                    SET status = 'locked'
                    WHERE card_id = $1
                """, appeal['card_id'])
            
            # Send notification to user
            await self._send_appeal_decision_email(appeal_id, action)
            
            return {"appeal_id": appeal_id, "action": action}
    
    async def list_appeals(self, status: Optional[AppealStatus] = None) -> List[Dict]:
        """List all appeals"""
        async with get_db_connection() as conn:
            query = """
                SELECT a.*, s.full_name, s.admission_number
                FROM id_card_appeals a
                JOIN students s ON a.student_id = s.student_id
            """
            
            if status:
                query += f" WHERE a.status = '{status.value}'"
            
            query += " ORDER BY a.submitted_at DESC"
            
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]
    
    async def get_card_status(self, card_id: UUID):
        """Get current status of ID card"""
        async with get_db_connection() as conn:
            card = await conn.fetchrow(
                "SELECT status, is_editable, submission_count, last_submitted_at FROM student_id_cards WHERE card_id = $1",
                card_id
            )
            
            if not card:
                raise HTTPException(404, "ID card not found")
            
            return dict(card)
    
    # Email notification methods
    async def _send_submission_email(self, card_id: UUID):
        # Implementation for sending submission confirmation
        pass
    
    async def _send_appeal_notification(self, appeal_id: UUID):
        # Implementation for notifying admin of new appeal
        pass
    
    async def _send_appeal_decision_email(self, appeal_id: UUID, action: str):
        # Implementation for notifying user of appeal decision
        pass
```

---

## 🎨 Frontend Implementation

### Phase 1: Update ID Card Review Page

**File**: `tenant-app/app/id-card/[token]/page.tsx`

Add status management and appeal functionality:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface IDCardStatus {
  status: 'draft' | 'submitted' | 'locked' | 'appeal_pending' | 'unlocked_for_edit';
  is_editable: boolean;
  submission_count: number;
}

export default function IDCardReviewPage() {
  const params = useParams();
  const [cardStatus, setCardStatus] = useState<IDCardStatus | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  
  // Fetch card status
  useEffect(() => {
    fetchCardStatus();
  }, []);
  
  const fetchCardStatus = async () => {
    const res = await fetch(`/api/id-cards/${params.token}/status`);
    const data = await res.json();
    setCardStatus(data);
  };
  
  const handleSubmit = async () => {
    const res = await fetch(`/api/id-cards/${params.token}/submit`, {
      method: 'POST'
    });
    
    if (res.ok) {
      alert('ID Card submitted successfully!');
      fetchCardStatus();
    }
  };
  
  const handleAppealSubmit = async (reason: string, description: string) => {
    const res = await fetch(`/api/id-cards/${params.token}/appeal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appeal_reason: reason,
        mistake_description: description
      })
    });
    
    if (res.ok) {
      alert('Appeal submitted successfully!');
      setShowAppealModal(false);
      fetchCardStatus();
    }
  };
  
  return (
    <div>
      {/* Status Badge */}
      <StatusBadge status={cardStatus?.status} />
      
      {/* Edit/Submit Buttons */}
      {cardStatus?.is_editable ? (
        <>
          <button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          {!isEditing && (
            <button onClick={handleSubmit}>Submit ID Card</button>
          )}
        </>
      ) : (
        <button onClick={() => setShowAppealModal(true)}>
          Request Correction
        </button>
      )}
      
      {/* Appeal Modal */}
      {showAppealModal && (
        <AppealModal
          onSubmit={handleAppealSubmit}
          onClose={() => setShowAppealModal(false)}
        />
      )}
    </div>
  );
}
```

### Phase 2: Admin Appeals Dashboard

**File**: `tenant-app/app/dashboard/appeals/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function AppealsPage() {
  const [appeals, setAppeals] = useState([]);
  const [filter, setFilter] = useState('pending');
  
  useEffect(() => {
    fetchAppeals();
  }, [filter]);
  
  const fetchAppeals = async () => {
    const res = await fetch(`/api/id-cards/appeals?status=${filter}`);
    const data = await res.json();
    setAppeals(data);
  };
  
  const handleReview = async (appealId: string, action: 'approve' | 'reject', notes: string) => {
    const res = await fetch(`/api/id-cards/appeals/${appealId}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, admin_notes: notes })
    });
    
    if (res.ok) {
      alert(`Appeal ${action}d successfully!`);
      fetchAppeals();
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ID Card Appeals</h1>
      
      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setFilter('pending')}>Pending</button>
        <button onClick={() => setFilter('approved')}>Approved</button>
        <button onClick={() => setFilter('rejected')}>Rejected</button>
      </div>
      
      {/* Appeals List */}
      <div className="space-y-4">
        {appeals.map((appeal) => (
          <AppealCard
            key={appeal.appeal_id}
            appeal={appeal}
            onReview={handleReview}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 📧 Email Notifications

### Templates Needed:

1. **ID Card Submitted**
   - Subject: "ID Card Submitted Successfully"
   - Body: Confirmation with next steps

2. **Appeal Received**
   - Subject: "Your ID Card Correction Request Received"
   - Body: "We'll review within 24-48 hours"

3. **Appeal Approved**
   - Subject: "ID Card Correction Approved"
   - Body: Link to edit + deadline

4. **Appeal Rejected**
   - Subject: "ID Card Correction Request Update"
   - Body: Reason + contact admin info

5. **Admin: New Appeal**
   - Subject: "New ID Card Appeal - Action Required"
   - Body: Student details + appeal reason

---

## 🔐 Security Considerations

1. **Rate Limiting**
   - Max 3 appeals per card
   - 1 appeal per 24 hours

2. **IP Tracking**
   - Log all submissions
   - Detect suspicious patterns

3. **Token Expiration**
   - Review links expire after 7 days
   - Edit access expires after 48 hours

4. **Audit Trail**
   - Log all actions in `edit_history`
   - Track admin actions

---

## ✅ Testing Checklist

### Unit Tests
- [ ] Submit card (draft → submitted)
- [ ] Submit card (unlocked → locked)
- [ ] Create appeal (valid)
- [ ] Create appeal (duplicate - should fail)
- [ ] Approve appeal
- [ ] Reject appeal
- [ ] Get card status

### Integration Tests
- [ ] Full workflow: draft → submit → appeal → approve → edit → submit → locked
- [ ] Email notifications sent
- [ ] Admin dashboard shows appeals
- [ ] Public user sees correct UI states

### E2E Tests
- [ ] User fills form and submits
- [ ] User cannot edit after submit
- [ ] User submits appeal
- [ ] Admin approves appeal
- [ ] User can edit again
- [ ] User submits final version
- [ ] Card permanently locked

---

## 📊 Success Metrics

- ✅ Zero unauthorized edits after submission
- ✅ 100% audit trail coverage
- ✅ < 24hr average appeal review time
- ✅ Email delivery rate > 95%
- ✅ User satisfaction with appeal process

---

## 🚀 Deployment Steps

1. **Database Migration**
   ```bash
   python app/db/migrations/add_id_card_restrictions.py
   ```

2. **Backend Deployment**
   - Deploy new API endpoints
   - Test in staging environment

3. **Frontend Deployment**
   - Update tenant-app
   - Deploy admin dashboard changes

4. **Monitoring**
   - Set up alerts for appeal queue
   - Monitor submission rates
   - Track email delivery

---

**Status**: Ready for Implementation  
**Priority**: HIGH (Security Feature)  
**Estimated Time**: 2-3 days  
**Dependencies**: Email service, existing ID card system
