"""
ID Card Service
Business logic for ID card generation, restriction, and appeal management
"""

from uuid import UUID
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
import json
from fastapi import HTTPException, status

from app.models.id_card import (
    IDCardCreate, IDCardResponse, IDCardStatusResponse, IDCardWithStudent,
    AppealCreate, AppealResponse, AppealWithDetails, AppealStats,
    IDCardStats, IDCardStatus, AppealStatus, BulkIDCardGenerate, BulkIDCardResponse
)


class IDCardService:
    """Service for managing ID cards and appeals"""
    
    def __init__(self, db_conn):
        """Initialize service with database connection"""
        self.conn = db_conn
    
    # ========================================================================
    # ID CARD OPERATIONS
    # ========================================================================
    
    async def get_card_by_id(self, card_id: UUID) -> Optional[Dict]:
        """Get ID card by ID"""
        query = "SELECT * FROM student_id_cards WHERE card_id = $1"
        return await self.conn.fetchrow(query, card_id)
    
    async def get_card_by_student(self, student_id: UUID) -> Optional[Dict]:
        """Get ID card by student ID"""
        query = "SELECT * FROM student_id_cards WHERE student_id = $1"
        return await self.conn.fetchrow(query, student_id)
    
    async def get_card_status(self, card_id: UUID) -> IDCardStatusResponse:
        """Get current status of ID card"""
        card = await self.get_card_by_id(card_id)
        
        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ID card not found"
            )
        
        # Check if there's a pending appeal
        appeal_query = """
            SELECT COUNT(*) as count FROM id_card_appeals
            WHERE card_id = $1 AND status = 'pending'
        """
        appeal_result = await self.conn.fetchrow(appeal_query, card_id)
        appeal_pending = appeal_result['count'] > 0
        
        # Determine capabilities
        can_submit = card['is_editable'] and card['status'] in ['draft', 'unlocked_for_edit']
        can_appeal = not card['is_editable'] and not appeal_pending
        
        return IDCardStatusResponse(
            card_id=card['card_id'],
            status=card['status'],
            is_editable=card['is_editable'],
            submission_count=card['submission_count'],
            last_submitted_at=card['last_submitted_at'],
            can_submit=can_submit,
            can_appeal=can_appeal,
            appeal_pending=appeal_pending
        )
    
    async def submit_card(self, card_id: UUID, ip_address: Optional[str] = None) -> IDCardResponse:
        """Submit ID card and lock it"""
        card = await self.get_card_by_id(card_id)
        
        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ID card not found"
            )
        
        # Validate current status
        if card['status'] not in ['draft', 'unlocked_for_edit']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Card cannot be submitted in '{card['status']}' state"
            )
        
        if not card['is_editable']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Card is not editable"
            )
        
        # Determine new status
        new_status = 'submitted' if card['submission_count'] == 0 else 'locked'
        
        # Add to edit history
        edit_history = card.get('edit_history', [])
        if isinstance(edit_history, str):
            edit_history = json.loads(edit_history)
        
        edit_history.append({
            'action': 'submit',
            'timestamp': datetime.now().isoformat(),
            'ip_address': ip_address,
            'submission_count': card['submission_count'] + 1,
            'previous_status': card['status'],
            'new_status': new_status
        })
        
        # Update card
        update_query = """
            UPDATE student_id_cards
            SET status = $1,
                submission_count = submission_count + 1,
                last_submitted_at = NOW(),
                is_editable = FALSE,
                edit_history = $2,
                updated_at = NOW()
            WHERE card_id = $3
            RETURNING *
        """
        
        updated = await self.conn.fetchrow(
            update_query,
            new_status,
            json.dumps(edit_history),
            card_id
        )
        
        return IDCardResponse(**dict(updated))
    
    async def list_cards_with_students(
        self,
        status_filter: Optional[IDCardStatus] = None,
        class_filter: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[IDCardWithStudent]:
        """List ID cards with student information"""
        query = """
            SELECT 
                c.card_id,
                c.card_number,
                c.status,
                c.is_editable,
                c.qr_code_url,
                s.student_id,
                s.full_name,
                s.admission_number,
                s.current_class,
                s.photo_url
            FROM student_id_cards c
            JOIN students s ON c.student_id = s.student_id
            WHERE 1=1
        """
        
        params = []
        param_count = 1
        
        if status_filter:
            query += f" AND c.status = ${param_count}"
            params.append(status_filter.value)
            param_count += 1
        
        if class_filter:
            query += f" AND s.current_class = ${param_count}"
            params.append(class_filter)
            param_count += 1
        
        query += f" ORDER BY s.full_name LIMIT ${param_count} OFFSET ${param_count + 1}"
        params.extend([limit, offset])
        
        rows = await self.conn.fetch(query, *params)
        return [IDCardWithStudent(**dict(row)) for row in rows]
    
    async def get_statistics(self) -> IDCardStats:
        """Get ID card statistics"""
        query = "SELECT * FROM v_id_card_stats"
        result = await self.conn.fetchrow(query)
        
        if not result:
            return IDCardStats(
                draft_count=0, submitted_count=0, locked_count=0,
                appeal_pending_count=0, unlocked_count=0, total_cards=0,
                editable_count=0, locked_count_total=0
            )
        
        return IDCardStats(**dict(result))
    
    # ========================================================================
    # APPEAL OPERATIONS
    # ========================================================================
    
    async def create_appeal(self, appeal: AppealCreate) -> AppealResponse:
        """Create a new appeal for ID card correction"""
        # Verify card exists
        card = await self.get_card_by_id(appeal.card_id)
        
        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ID card not found"
            )
        
        # Verify card belongs to student
        if str(card['student_id']) != str(appeal.student_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Card does not belong to this student"
            )
        
        # Check if card is already editable
        if card['is_editable']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Card is already editable, no appeal needed"
            )
        
        # Check for existing pending appeal
        existing_query = """
            SELECT * FROM id_card_appeals
            WHERE card_id = $1 AND status = 'pending'
        """
        existing = await self.conn.fetchrow(existing_query, appeal.card_id)
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An appeal is already pending for this card"
            )
        
        # Create appeal
        insert_query = """
            INSERT INTO id_card_appeals (
                student_id, card_id, appeal_reason,
                mistake_description, requested_changes
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """
        
        result = await self.conn.fetchrow(
            insert_query,
            appeal.student_id,
            appeal.card_id,
            appeal.appeal_reason,
            appeal.mistake_description,
            json.dumps(appeal.requested_changes) if appeal.requested_changes else None
        )
        
        # Update card status to appeal_pending
        await self.conn.execute("""
            UPDATE student_id_cards
            SET status = 'appeal_pending',
                appeal_reason = $1,
                appeal_submitted_at = NOW()
            WHERE card_id = $2
        """, appeal.appeal_reason, appeal.card_id)
        
        return AppealResponse(**dict(result))
    
    async def list_appeals(
        self,
        status_filter: Optional[AppealStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AppealWithDetails]:
        """List appeals with details"""
        query = """
            SELECT 
                a.appeal_id,
                a.student_id,
                s.full_name,
                s.admission_number,
                s.current_class,
                a.appeal_reason,
                a.mistake_description,
                a.requested_changes,
                a.status,
                c.status AS card_status,
                c.submission_count,
                a.submitted_at,
                EXTRACT(EPOCH FROM (NOW() - a.submitted_at))/3600 AS hours_pending,
                a.reviewed_by,
                a.reviewed_at,
                a.admin_notes
            FROM id_card_appeals a
            JOIN students s ON a.student_id = s.student_id
            JOIN student_id_cards c ON a.card_id = c.card_id
            WHERE 1=1
        """
        
        params = []
        param_count = 1
        
        if status_filter:
            query += f" AND a.status = ${param_count}"
            params.append(status_filter.value)
            param_count += 1
        
        query += f" ORDER BY a.submitted_at DESC LIMIT ${param_count} OFFSET ${param_count + 1}"
        params.extend([limit, offset])
        
        rows = await self.conn.fetch(query, *params)
        
        results = []
        for row in rows:
            row_dict = dict(row)
            # Parse requested_changes if it's a string
            if row_dict.get('requested_changes') and isinstance(row_dict['requested_changes'], str):
                row_dict['requested_changes'] = json.loads(row_dict['requested_changes'])
            results.append(AppealWithDetails(**row_dict))
        
        return results
    
    async def review_appeal(
        self,
        appeal_id: UUID,
        action: str,
        admin_id: UUID,
        admin_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Approve or reject an appeal"""
        # Get appeal
        appeal_query = "SELECT * FROM id_card_appeals WHERE appeal_id = $1"
        appeal = await self.conn.fetchrow(appeal_query, appeal_id)
        
        if not appeal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appeal not found"
            )
        
        if appeal['status'] != 'pending':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Appeal already {appeal['status']}"
            )
        
        # Update appeal
        new_status = 'approved' if action == 'approve' else 'rejected'
        
        update_appeal_query = """
            UPDATE id_card_appeals
            SET status = $1,
                reviewed_by = $2,
                reviewed_at = NOW(),
                admin_notes = $3,
                updated_at = NOW()
            WHERE appeal_id = $4
            RETURNING *
        """
        
        updated_appeal = await self.conn.fetchrow(
            update_appeal_query,
            new_status,
            admin_id,
            admin_notes,
            appeal_id
        )
        
        # Update card based on decision
        if action == 'approve':
            # Unlock card for editing
            await self.conn.execute("""
                UPDATE student_id_cards
                SET status = 'unlocked_for_edit',
                    is_editable = TRUE,
                    unlocked_by_admin_id = $1,
                    unlocked_at = NOW(),
                    updated_at = NOW()
                WHERE card_id = $2
            """, admin_id, appeal['card_id'])
        else:
            # Keep card locked
            await self.conn.execute("""
                UPDATE student_id_cards
                SET status = 'locked',
                    updated_at = NOW()
                WHERE card_id = $1
            """, appeal['card_id'])
        
        return {
            "appeal_id": appeal_id,
            "action": action,
            "status": new_status,
            "reviewed_by": admin_id,
            "reviewed_at": updated_appeal['reviewed_at']
        }
    
    async def get_appeal_stats(self) -> AppealStats:
        """Get appeal statistics"""
        query = """
            SELECT 
                COUNT(*) as total_appeals,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
                AVG(EXTRACT(EPOCH FROM (reviewed_at - submitted_at))/3600) 
                    FILTER (WHERE reviewed_at IS NOT NULL) as avg_review_time_hours,
                MAX(EXTRACT(EPOCH FROM (NOW() - submitted_at))/3600) 
                    FILTER (WHERE status = 'pending') as oldest_pending_hours
            FROM id_card_appeals
        """
        
        result = await self.conn.fetchrow(query)
        
        return AppealStats(
            total_appeals=result['total_appeals'] or 0,
            pending_count=result['pending_count'] or 0,
            approved_count=result['approved_count'] or 0,
            rejected_count=result['rejected_count'] or 0,
            avg_review_time_hours=float(result['avg_review_time_hours']) if result['avg_review_time_hours'] else None,
            oldest_pending_hours=float(result['oldest_pending_hours']) if result['oldest_pending_hours'] else None
        )
    
    # ========================================================================
    # BULK OPERATIONS
    # ========================================================================
    
    async def bulk_generate_cards(self, data: BulkIDCardGenerate) -> BulkIDCardResponse:
        """Generate ID cards for multiple students"""
        successful = 0
        failed = 0
        errors = []
        card_ids = []
        
        for student_id in data.student_ids:
            try:
                # Check if card already exists
                existing = await self.get_card_by_student(student_id)
                if existing:
                    errors.append({
                        "student_id": str(student_id),
                        "error": "ID card already exists"
                    })
                    failed += 1
                    continue
                
                # Generate card number
                card_number_query = "SELECT generate_card_number() as card_number"
                card_number_result = await self.conn.fetchrow(card_number_query)
                card_number = card_number_result['card_number']
                
                # Create card
                insert_query = """
                    INSERT INTO student_id_cards (
                        student_id, card_number, issue_date, expiry_date
                    )
                    VALUES ($1, $2, $3, $4)
                    RETURNING card_id
                """
                
                issue_date = data.issue_date or date.today()
                expiry_date = data.expiry_date or (date.today() + timedelta(days=365*3))
                
                result = await self.conn.fetchrow(
                    insert_query,
                    student_id,
                    card_number,
                    issue_date,
                    expiry_date
                )
                
                card_ids.append(result['card_id'])
                successful += 1
                
            except Exception as e:
                errors.append({
                    "student_id": str(student_id),
                    "error": str(e)
                })
                failed += 1
        
        return BulkIDCardResponse(
            total=len(data.student_ids),
            successful=successful,
            failed=failed,
            errors=errors,
            card_ids=card_ids
        )
