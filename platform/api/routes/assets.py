from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import os
import uuid
import shutil
from utils.permissions import require_permission, JWTPayload

router = APIRouter(prefix="/assets", tags=["assets"])

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_asset(
    file: UploadFile = File(...),
    jwt_payload: JWTPayload = Depends(require_permission("asset:create"))
):
    """Uploads an image file to the server and returns the URL."""
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not supported. Use JPG, PNG, GIF, WebP, or SVG.")

    # Validate file size (max 5MB)
    MAX_SIZE = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max size is 5MB.")
    await file.seek(0) # Reset pointer

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        # Try to infer extension from content type
        ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp", "image/svg+xml": ".svg"}
        ext = ext_map.get(file.content_type, ".bin")
        
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

    # Return the URL
    # In a real app, this would be a CDN URL. 
    # For local dev, we assume the server serves the /uploads directory.
    return {"url": f"/uploads/{filename}", "filename": filename}
