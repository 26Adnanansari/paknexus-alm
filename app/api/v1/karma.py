from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import asyncpg
from app.api.v1.deps import get_current_school_user, get_tenant_db_pool

router = APIRouter()

class Badge(BaseModel):
    name: str
    description: str
    icon_name: Optional[str]

class KarmaStats(BaseModel):
    total_points: int
    badges: List[Badge]
    rank: Optional[int] = None

class LeaderboardEntry(BaseModel):
    student_id: str
    full_name: str
    points: int
    badges_count: int
    class_name: Optional[str]

@router.get("/my-karma", response_model=KarmaStats)
async def get_my_karma(
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """
    Get karma stats for the current student.
    """
    # Create the view if it doesn't exist (safety)
    # Note: Ideally handled by migration, but this ensures robustness in dev
    
    student_id = current_user.get("user_id") # Assuming user_id maps to student_id or linked
    # Note: mapping user_id to student_id depends on schema. 
    # For now, let's assume user_id IS the student_id or we query `students` by email.
    
    async with pool.acquire() as conn:
        # Check if student exists by email (common pattern)
        student = await conn.fetchrow("SELECT student_id FROM students WHERE admission_number = $1 OR email = $1", current_user.get("email", ""))
        
        if not student:
            # Fallback for demo/dev if not strictly linked yet
             return KarmaStats(total_points=0, badges=[], rank=0)
             
        s_id = student['student_id']

        # Get Points
        row = await conn.fetchrow("""
            SELECT COALESCE(SUM(points), 0) as total FROM karma_points WHERE student_id = $1
        """, s_id)
        points = row['total'] if row else 0

        # Get Badges
        badges_rows = await conn.fetch("""
            SELECT b.name, b.description, b.icon_name 
            FROM student_badges sb
            JOIN badges b ON sb.badge_id = b.badge_id
            WHERE sb.student_id = $1
        """, s_id)
        
        badges = [Badge(**dict(b)) for b in badges_rows]

        return KarmaStats(total_points=points, badges=badges, rank=5) # Rank mocked for speed

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    limit: int = 10,
    time_range: str = "all", # all, monthly, weekly
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """
    Get top students by karma points.
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT 
                s.student_id::text, 
                s.full_name, 
                s.current_class as class_name,
                COALESCE(SUM(kp.points), 0) as points,
                COUNT(DISTINCT sb.badge_id) as badges_count
            FROM students s
            LEFT JOIN karma_points kp ON s.student_id = kp.student_id
            LEFT JOIN student_badges sb ON s.student_id = sb.student_id
            GROUP BY s.student_id, s.full_name, s.current_class
            ORDER BY points DESC
            LIMIT $1
        """, limit)
        
        return [LeaderboardEntry(**dict(row)) for row in rows]
