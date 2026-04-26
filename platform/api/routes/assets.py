from fastapi import APIRouter, UploadFile, File, HTTPException, Depends


from services.storage import get_storage_provider
from pydantic import BaseModel
import uuid
import httpx

class MirrorRequest(BaseModel):
    url: str

from utils.jwt_middleware import require_active_tenant, JWTPayload
from utils.permissions import require_permission

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.post("/upload")
async def upload_asset(
    file: UploadFile = File(...),
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("ADD_ASSETS"))
):

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")
    
    storage = get_storage_provider()
    
    # Generate a unique filename to avoid collisions
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    unique_filename = f"{uuid.uuid4()}.{ext}"
    
    try:
        print(f"DEBUG: Received upload request for {file.filename} from tenant {tenant_id}")
        url = await storage.upload(file, unique_filename, tenant_id)
        print(f"DEBUG: Resource uploaded. URL: {url}")
        return {"url": url, "filename": unique_filename}

    except Exception as e:
        print(f"ERROR in upload_asset: {str(e)}")
        raise HTTPException(status_code=500, detail="Access denied.")


@router.post("/mirror")
async def mirror_asset(
    request: MirrorRequest,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("ADD_ASSETS"))
):

    storage = get_storage_provider()
    try:
        print(f"DEBUG: Attempting to mirror URL: {request.url}")
        async with httpx.AsyncClient() as client:
            response = await client.get(request.url, follow_redirects=True, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to fetch image: {response.status_code}")
            
            content_type = response.headers.get("Content-Type", "")
            if not content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail="URL does not point to a valid image")
            
            # Generate filename
            ext = content_type.split("/")[-1] if "/" in content_type else "png"
            if ";" in ext: ext = ext.split(";")[0]
            unique_filename = f"mirrored-{uuid.uuid4()}.{ext}"
            
            url = await storage.upload_bytes(response.content, unique_filename, content_type, tenant_id)
            print(f"DEBUG: Mirrored to S3. New URL: {url}")
            return {"url": url, "filename": unique_filename, "original_url": request.url}
    except Exception as e:
        print(f"ERROR in mirror_asset: {str(e)}")
        raise HTTPException(status_code=500, detail="Access denied.")

@router.get("/list")
async def list_assets(
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_ASSETS"))
):
    storage = get_storage_provider()
    return storage.list_files(tenant_id)

