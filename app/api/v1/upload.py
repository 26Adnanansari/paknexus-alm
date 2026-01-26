from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Optional
import os
import shutil
from pathlib import Path

# Try importing cloudinary
try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False

from app.api.v1.deps import get_current_school_user

router = APIRouter(tags=["Uploads"])

# Configure Cloudinary (Expects env vars or can be set here if user provided)
# CLOUDINARY_URL should be in .env
# Example: cloudinary://API_KEY:API_SECRET@CLOUD_NAME

@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = "id_cards",
    current_user: dict = Depends(get_current_school_user)
):
    """
    Upload an image to Cloudinary (or local fallback if not configured).
    Returns the URL of the uploaded image.
    """
    
    # 1. Cloudinary Upload
    if CLOUDINARY_AVAILABLE and os.getenv("CLOUDINARY_URL"):
        try:
            # Result contains 'secure_url'
            result = cloudinary.uploader.upload(
                file.file,
                folder=f"almsaas/{folder}",
                resource_type="image"
            )
            return {"url": result.get("secure_url")}
        except Exception as e:
            print(f"Cloudinary upload failed: {e}")
            # Fallback to local if Cloudinary fails but is available?
            # Or raise error.
            # Let's try local fallback if Cloudinary config is wrong.

    # 2. Local Fallback (for Dev/Testing without Cloudinary)
    # This is important so the user can test immediately even without API keys
    try:
        upload_dir = Path("static/uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_ext = file.filename.split(".")[-1]
        filename = f"{folder}_{os.urandom(4).hex()}.{file_ext}"
        file_path = upload_dir / filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return a URL that points to this server
        # In production, this needs 'StaticFiles' mounted in main.py
        # Assuming '/static' is mounted
        # Use localhost for now or relative path
        return {"url": f"/static/uploads/{filename}", "note": "Local fallback (Cloudinary not configured)"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
