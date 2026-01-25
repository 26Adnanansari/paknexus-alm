from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from typing import Optional
from uuid import UUID
import asyncpg
import json

from app.api.v1.deps import get_current_school_user, get_tenant_db_pool
from app.services.face_service import FaceService

router = APIRouter()

async def ensure_face_column(conn, table_name: str):
    """Lazy migration to add face_encoding column if not exists."""
    try:
        await conn.execute(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS face_encoding JSONB")
    except Exception as e:
        print(f"Migration warning: {e}")

@router.post("/enroll")
async def enroll_face(
    user_id: UUID = Form(...),
    user_type: str = Form(..., regex="^(student|staff)$"),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """
    Enroll a face for a student or staff member.
    Extracts 128-d facial encoding and stores it in the database.
    """
    # 1. Detect Face
    encoding = FaceService.get_encoding(file.file)
    if not encoding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No face detected in the image. Please upload a clear photo."
        )

    # 2. Update Database
    table_name = "students" if user_type == "student" else "staff"
    id_column = "student_id" if user_type == "student" else "staff_id"
    
    async with pool.acquire() as conn:
        await ensure_face_column(conn, table_name)
        
        # Check if user exists
        exists = await conn.fetchval(f"SELECT 1 FROM {table_name} WHERE {id_column} = $1", user_id)
        if not exists:
            raise HTTPException(status_code=404, detail=f"{user_type.capitalize()} not found")
        
        # Update encoding (store as JSON string or jsonb)
        await conn.execute(
            f"UPDATE {table_name} SET face_encoding = $1 WHERE {id_column} = $2",
            json.dumps(encoding), user_id
        )

    return {"status": "success", "message": "Face enrollment successful"}

@router.post("/identify")
async def identify_user(
    file: UploadFile = File(...),
    role: str = Form("student", regex="^(student|staff|all)$"),
    current_user: dict = Depends(get_current_school_user),
    pool: asyncpg.Pool = Depends(get_tenant_db_pool)
):
    """
    Identify a user from a face image.
    Returns the user info if matched.
    """
    # 1. Get embedding from uploaded image
    unknown_encoding = FaceService.get_encoding(file.file)
    if not unknown_encoding:
        raise HTTPException(status_code=400, detail="No face detected in submitted image")

    async with pool.acquire() as conn:
        candidates = []
        
        # Determine who to fetch
        fetch_students = role in ["student", "all"]
        fetch_staff = role in ["staff", "all"]
        
        if fetch_students:
            await ensure_face_column(conn, "students")
            rows = await conn.fetch("SELECT student_id as id, full_name, face_encoding FROM students WHERE status='active' AND face_encoding IS NOT NULL")
            for r in rows:
                candidates.append({
                    "id": r["id"], 
                    "name": r["full_name"], 
                    "type": "student", 
                    "encoding": json.loads(r["face_encoding"])
                })
                
        if fetch_staff:
            await ensure_face_column(conn, "staff")
            rows = await conn.fetch("SELECT staff_id as id, full_name, face_encoding FROM staff WHERE status='active' AND face_encoding IS NOT NULL")
            for r in rows:
                candidates.append({
                    "id": r["id"], 
                    "name": r["full_name"], 
                    "type": "staff", 
                    "encoding": json.loads(r["face_encoding"])
                })
        
        if not candidates:
            raise HTTPException(status_code=404, detail="No enrolled users found for matching")
            
        # 2. Compare (Brute force acceptable for <1000 users)
        known_encodings = [c["encoding"] for c in candidates]
        match_index = FaceService.compare_faces(known_encodings, unknown_encoding)
        
        if match_index is not None:
            match = candidates[match_index]
            return {
                "match": True,
                "user_id": str(match["id"]),
                "name": match["name"],
                "user_type": match["type"]
            }
            
    return {"match": False, "detail": "User not recognized"}
