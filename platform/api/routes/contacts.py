"""
Contacts API Routes
Handles contact listing, stats, CSV/Excel upload, and lifecycle management.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Response
from typing import Optional, Dict, List
from pydantic import BaseModel
import pandas as pd
import logging
from services.contact_service import ContactService
from services.batch_service import BatchService
from services.import_service import process_csv_import
from utils.jwt_middleware import require_active_tenant
from utils.permissions import require_permission, verify_jwt_token, JWTPayload
from utils.file_parser import parse_file
from utils.rabbitmq_client import mq_client
from services.storage import get_storage_provider
from utils.supabase_client import db
import uuid

logger = logging.getLogger("email_engine.contacts")

router = APIRouter(prefix="/contacts", tags=["Contacts"])

MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

# ===== Request/Response Models =====

class ContactStats(BaseModel):
    total_contacts: int
    limit: int
    usage_percent: float
    available: int

class UploadPreviewResponse(BaseModel):
    headers: List[str]
    preview: List[Dict]
    row_count: int

class BulkDeleteRequest(BaseModel):
    contact_ids: List[str]


class UpdateContactRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    custom_fields: Dict[str, str] = {}


class BulkTagRequest(BaseModel):
    contact_ids: List[str]
    tags: List[str]
    action: str = "add"  # "add" or "remove"


class ImportInitializeRequest(BaseModel):
    filename: str
    content_type: str
    estimated_rows: int = 0


class ImportInitializeResponse(BaseModel):
    job_id: str
    upload_url: str
    fields: Dict[str, str]
    file_key: str


class ImportProcessRequest(BaseModel):
    email_col: str
    first_name_col: Optional[str] = None
    last_name_col: Optional[str] = None
    custom_mappings: Optional[Dict[str, str]] = None


class ImportProcessResponse(BaseModel):
    job_id: str
    status: str
    message: str


# ===== STATS & LIST =====

@router.get("/stats", response_model=ContactStats)
async def get_contact_stats(
    tenant_id: str = Depends(require_active_tenant),
    _: JWTPayload = Depends(require_permission("VIEW_CONTACT")),
):
    """Get contact usage stats for current tenant"""
    can_add, stats = ContactService.check_plan_limits(tenant_id, 0)
    usage_percent = (stats["current"] / stats["limit"]) * 100 if stats["limit"] > 0 else 0
    return ContactStats(
        total_contacts=stats["current"],
        limit=stats["limit"],
        usage_percent=round(usage_percent, 2),
        available=stats["available"]
    )

@router.get("/")
async def list_contacts(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    batch_id: Optional[str] = None,
    domain: Optional[str] = None,
    domains: Optional[str] = None,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_CONTACT"))
):
    """List contacts with pagination, search, and optional batch filter"""
    requested_domains = []
    if domains:
        requested_domains.extend([item for item in domains.split(",") if item.strip()])
    elif domain:
        requested_domains.append(domain)

    return ContactService.get_contacts(tenant_id, jwt_payload, page, limit, search, batch_id, requested_domains)


@router.get("/domains")
async def list_contact_domains(
    limit: int = 12,
    batch_id: Optional[str] = None,
    tenant_id: str = Depends(require_active_tenant),
    _: JWTPayload = Depends(require_permission("VIEW_CONTACT")),
):
    """Return the most common contact domains for the current tenant."""
    safe_limit = max(1, min(limit, 50))
    return ContactService.get_domain_summary(tenant_id, safe_limit, batch_id)


# ===== UPLOAD FLOW =====

@router.post("/upload/preview")
async def preview_csv(
    file: UploadFile = File(...),
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_CONTACT"))
):

    """Step 1: Parse uploaded file and return headers + preview"""
    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 2MB.")

        df = parse_file(contents, file.filename)
        headers = list(df.columns)
        preview = df.head(5).to_dict(orient="records")

        return UploadPreviewResponse(
            headers=headers,
            preview=preview,
            row_count=len(df)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File parsing error: {str(e)}")


# ===== NEW ROBUST IMPORT FLOW (PHASE 2) =====

@router.post("/import/initialize", response_model=ImportInitializeResponse)
async def initialize_import(
    request: ImportInitializeRequest,
    project_id: str, # For now passing via query param
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_CONTACT"))
):

    """
    Step 1: Create an import job and get a presigned URL for direct S3 upload.
    This bypasses the API for the actual file transfer.
    """
    try:
        # 1. Verify plan limits (pessimistic check)
        can_add, stats = ContactService.check_plan_limits(tenant_id, request.estimated_rows)
        if not can_add:
            raise HTTPException(
                status_code=403, 
                detail=f"Plan limit reached. You can only add {stats['available']} more contacts."
            )

        # 2. Generate unique file key
        file_ext = request.filename.split(".")[-1] if "." in request.filename else "csv"
        job_id = str(uuid.uuid4())
        file_key = f"imports/{tenant_id}/{job_id}.{file_ext}"

        # 3. Create the job record and the batch history record
        # We need BOTH for the foreign key constraints to pass in the worker.
        job_data = {
            "id": job_id,
            "file_key": file_key,
            "status": "initializing",
            "total_rows": request.estimated_rows
        }
        
        batch_data = {
            "id": job_id,
            "tenant_id": tenant_id,
            "file_name": request.filename,
            "total_rows": request.estimated_rows,
            "imported_count": 0,
            "failed_count": 0,
            "status": "processing"
        }
        
        if project_id and project_id != "default":
            job_data["project_id"] = project_id

        # Insert both
        db.client.table("import_jobs").insert(job_data).execute()
        db.client.table("import_batches").insert(batch_data).execute()

        # 4. Generate Supabase Native Signed PUT URL
        try:
            url_data = db.client.storage.from_("imports").create_signed_upload_url(file_key)
            presigned_url = url_data.get("signedUrl", url_data.get("signed_url"))
            upload_fields = {}
        except Exception as e:
            logger.error(f"Failed to generate signed url: {str(e)}")
            raise HTTPException(status_code=500, detail="Storage generation failed")

        return ImportInitializeResponse(
            job_id=job_id,
            upload_url=presigned_url,
            fields=upload_fields,
            file_key=file_key
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to initialize import job: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize import.")


@router.post("/import/process/{job_id}", response_model=ImportProcessResponse)
async def process_import_signal(
    job_id: str,
    request: ImportProcessRequest,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_CONTACT"))
):

    """
    Step 3: Signal that the file upload to S3 is complete.
    This triggers the RabbitMQ worker to start parsing.
    """
    # 1. Fetch job to verify ownership and current status
    job_result = db.client.table("import_jobs")\
        .select("*")\
        .eq("id", job_id)\
        .eq("status", "initializing")\
        .execute()
    
    if not job_result.data:
        # Check if it exists but is already processing
        existing = db.client.table("import_jobs").select("status").eq("id", job_id).execute()
        if existing.data:
            return ImportProcessResponse(
                job_id=job_id,
                status=existing.data[0]["status"],
                message="Job is already further in the pipeline."
            )
        raise HTTPException(status_code=404, detail="Import job not found or not in 'initializing' state.")

    job = job_result.data[0]

    # 2. Update status to 'pending'
    try:
        db.client.table("import_jobs")\
            .update({"status": "pending"})\
            .eq("id", job_id)\
            .execute()
    except Exception as e:
        logger.error(f"Failed to update job status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update job status in database.")

    # 3. Publish to RabbitMQ
    try:
        task_payload = {
            "task_type": "contact_import",
            "job_id": job_id,
            "tenant_id": tenant_id,
            "project_id": job.get("project_id"),
            "file_key": job["file_key"],
            "email_col": request.email_col,
            "first_name_col": request.first_name_col,
            "last_name_col": request.last_name_col,
            "custom_mappings": request.custom_mappings
        }
        await mq_client.publish_background_task(task_payload, routing_key="task.import")
        logger.info(f"Triggered async import for job {job_id}")
    except Exception as e:
        logger.error(f"Failed to queue import task: {str(e)}")
        db.client.table("import_jobs").update({"status": "failed", "error_message": "Failed to queue task"}).eq("id", job_id).execute()
        raise HTTPException(status_code=500, detail="Failed to trigger background processing.")

    return ImportProcessResponse(
        job_id=job_id,
        status="pending",
        message="Import triggered successfully. Monitoring progress via jobs table."
    )


# Legacy endpoint removed: Use /import/initialize and /import/process instead.

# ===== ASYNC JOB STATUS (POLLING) =====

@router.get("/jobs/{job_id}")
async def get_job_status(
    job_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_CONTACT"))
):

    """Fetch the realtime progress of a specific background job (Public ID scoped)"""
    try:
        # Direct fetch by ID is safe as job_ids are UUID4, but we scope by tenant_id for absolute isolation
        res = db.client.table("import_jobs").select("*").eq("id", job_id).eq("tenant_id", tenant_id).execute()
        if res.data:
            return res.data[0]
            
        res_legacy = db.client.table("jobs").select("*").eq("id", job_id).eq("tenant_id", tenant_id).execute()
        if res_legacy.data:
            return res_legacy.data[0]


        raise HTTPException(status_code=404, detail="Job not found")
    except Exception as e:
        logger.error(f"Job status fetch error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ===== DELETE OPERATIONS =====
# NOTE: Static routes MUST come before /{contact_id} to avoid path conflicts

@router.post("/bulk-delete")
async def bulk_delete_contacts(
    body: BulkDeleteRequest,
    tenant_id: str = Depends(require_active_tenant),
    _ = Depends(require_permission("MANAGE_CONTACT"))
):
    """Delete multiple selected contacts"""
    if not body.contact_ids:
        raise HTTPException(status_code=400, detail="No contact IDs provided")

    if len(body.contact_ids) > 1000:
        raise HTTPException(status_code=400, detail="Maximum 1000 contacts per bulk delete")

    # Capture batch ids for recalculation
    batch_ids = db.client.table("contacts")\
        .select("import_batch_id")\
        .eq("tenant_id", tenant_id)\
        .in_("id", body.contact_ids)\
        .execute()
    batch_ids = {row.get("import_batch_id") for row in (batch_ids.data or []) if row.get("import_batch_id")}

    deleted_count = ContactService.delete_bulk(tenant_id, body.contact_ids)

    # Recalc affected batches
    from services.batch_service import BatchService
    for b_id in batch_ids:
        BatchService.recalc_batch_counts(tenant_id, b_id)

    return {"deleted_count": deleted_count}


@router.get("/tags")
async def get_all_tags(tenant_id: str = Depends(require_active_tenant)):
    """Fetch all unique tags used by this tenant"""
    try:
        # Use a raw query via rpc if available, or fetch all tags and unique them in Python
        # For simplicity and given the scale, we'll fetch them from the contacts rows
        # In a high-volume prod env, we'd use a dedicated 'tags' table.
        res = db.client.table("contacts")\
            .select("tags")\
            .eq("tenant_id", tenant_id)\
            .not_.is_("tags", "null")\
            .execute()
        
        all_tags = set()
        for row in res.data or []:
            if row.get("tags"):
                all_tags.update(row["tags"])
        
        return sorted(list(all_tags))
    except Exception as e:
        logger.error(f"Tags fetch error: {e}")
        return []


@router.post("/bulk-tag")
async def bulk_tag_contacts(
    body: BulkTagRequest,
    tenant_id: str = Depends(require_active_tenant),
    _ = Depends(require_permission("MANAGE_CONTACT"))
):
    """Add or remove tags for multiple contacts"""
    if not body.contact_ids:
        raise HTTPException(status_code=400, detail="No contact IDs provided")

    if not body.tags:
        raise HTTPException(status_code=400, detail="No tags provided")

    # Fetch existing tags for these contacts
    res = db.client.table("contacts")\
        .select("id, tags")\
        .eq("tenant_id", tenant_id)\
        .in_("id", body.contact_ids)\
        .execute()
    
    updates = []
    for row in res.data or []:
        current_tags = set(row.get("tags") or [])
        new_tags = set(body.tags)
        
        if body.action == "add":
            updated_tags = list(current_tags.union(new_tags))
        else:
            updated_tags = list(current_tags.difference(new_tags))
            
        updates.append({
            "id": row["id"],
            "tenant_id": tenant_id,
            "tags": updated_tags
        })
    
    if updates:
        # Batch upsert updates (on conflict id)
        db.client.table("contacts").upsert(updates).execute()

    return {"updated_count": len(updates)}


@router.delete("/all")
async def delete_all_contacts(tenant_id: str = Depends(require_active_tenant), _ = Depends(require_permission("MANAGE_CONTACT"))):
    """Delete ALL contacts for tenant (reset)"""
    deleted_count = ContactService.delete_all(tenant_id)

    # Also clean up all batch records
    try:
        db.client.table("import_batches")\
            .delete()\
            .eq("tenant_id", tenant_id)\
            .execute()
        logger.info(f"[DELETE_ALL_BATCHES] tenant={tenant_id}")
    except Exception:
        pass  # Non-critical cleanup

    return {"deleted_count": deleted_count}


# ===== BATCH / IMPORT HISTORY =====

@router.get("/batches")
async def list_batches(tenant_id: str = Depends(require_active_tenant)):
    """List all import batches for current tenant"""
    batches = BatchService.list_batches(tenant_id)
    return {"data": batches}


@router.delete("/batch/{batch_id}")
async def delete_batch(batch_id: str, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_permission("MANAGE_CONTACT"))):
    """Delete all contacts from a specific import batch"""
    deleted_count = BatchService.delete_batch(tenant_id, batch_id)
    return {"deleted_count": deleted_count}

# ===== SINGLE CONTACT DELETE (dynamic path — must be last) =====

class ResolveErrorRequest(BaseModel):
    batch_id: str
    error_index: int
    email: str
    first_name: str
    last_name: str


@router.post("/resolve-error")
async def resolve_error(
    body: ResolveErrorRequest,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_CONTACT"))
):
    """Resolve a failed contact by manually adding corrected data"""
    import json as json_lib

    email = body.email.strip().lower()
    if not ContactService.validate_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Get the batch and its errors
    batch_result = db.client.table("import_batches")\
        .select("errors, failed_count")\
        .eq("id", body.batch_id)\
        .eq("tenant_id", tenant_id)\
        .single()\
        .execute()

    if not batch_result.data:
        raise HTTPException(status_code=404, detail="Batch not found")

    errors = batch_result.data.get("errors", [])
    if isinstance(errors, str):
        errors = json_lib.loads(errors)

    if body.error_index < 0 or body.error_index >= len(errors):
        raise HTTPException(status_code=400, detail="Invalid error index")

    # Check plan limits
    can_add, stats = ContactService.check_plan_limits(tenant_id, 1)
    if not can_add:
        raise HTTPException(status_code=400, detail=f"Plan limit reached. {stats['current']}/{stats['limit']} contacts")

    first_name = body.first_name.strip()
    last_name = body.last_name.strip()

    if not first_name or not last_name:
        raise HTTPException(status_code=400, detail="First Name and Last Name are required.")

    # Add the contact
    contact_data = {
        "tenant_id": tenant_id,
        "email": email,
        "email_domain": ContactService.extract_email_domain(email),
        "first_name": first_name,
        "last_name": last_name,
        "import_batch_id": body.batch_id,
        "created_by_user_id": jwt_payload.user_id
    }
    db.client.table("contacts")\
        .upsert(contact_data, on_conflict="tenant_id,email")\
        .execute()

    # Remove the error from the list
    errors.pop(body.error_index)
    new_failed = max(0, (batch_result.data.get("failed_count", 1)) - 1)

    db.client.table("import_batches")\
        .update({
            "errors": json_lib.dumps(errors),
            "failed_count": new_failed,
            "imported_count": db.client.table("contacts")
                .select("id", count="exact")
                .eq("import_batch_id", body.batch_id)
                .eq("tenant_id", tenant_id)
                .execute().count
        })\
        .eq("id", body.batch_id)\
        .eq("tenant_id", tenant_id)\
        .execute()

    return {"status": "success", "remaining_errors": len(errors)}


class UpdateTagsRequest(BaseModel):
    tags: List[str]

@router.get("/suppression")
async def get_suppressed_contacts(
    page: int = 1,
    limit: int = 50,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_CONTACT"))
):
    """List contacts that bounced, unsubscribed, or complained"""
    return ContactService.get_suppression_list(tenant_id, jwt_payload, page, limit)

@router.get("/{contact_id}")
async def get_contact(
    contact_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_CONTACT"))
):
    """Get a single contact by ID"""
    try:
        query = db.client.table("contacts").select("*").eq("id", contact_id).eq("tenant_id", tenant_id)
        query = apply_data_isolation(query, jwt_payload)
        result = query.single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Contact not found")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch contact: {str(e)}")

@router.post("/{contact_id}/tags")
async def update_contact_tags(
    contact_id: str,
    body: UpdateTagsRequest,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_CONTACT"))
):
    """Update the tags array for a specific contact"""
    try:
        # Verify ownership / isolation constraints
        query = db.client.table("contacts").select("id").eq("id", contact_id).eq("tenant_id", tenant_id)
        if hasattr(jwt_payload, 'isolation_model'):
            query = apply_data_isolation(query, jwt_payload)
        
        if not query.execute().data:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        updated = ContactService.update_tags(tenant_id, contact_id, body.tags)
        return {"status": "success", "contact": updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update tags: {str(e)}")


@router.patch("/{contact_id}")
async def update_contact(
    contact_id: str,
    body: UpdateContactRequest,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_CONTACT"))
):
    """Update a contact email and custom fields."""
    try:
        # Verify ownership / isolation constraints
        query = db.client.table("contacts").select("id").eq("id", contact_id).eq("tenant_id", tenant_id)
        if hasattr(jwt_payload, 'isolation_model'):
            query = apply_data_isolation(query, jwt_payload)
        
        if not query.execute().data:
            raise HTTPException(status_code=404, detail="Contact not found")
            
        contact = ContactService.update_contact(
            tenant_id=tenant_id,
            contact_id=contact_id,
            email=body.email,
            first_name=body.first_name,
            last_name=body.last_name,
            custom_fields=body.custom_fields
        )
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        return {"status": "success", "contact": contact}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update contact: {str(e)}")


class ExportAsyncRequest(BaseModel):
    batch_id: Optional[str] = None

@router.post("/export/async")
async def export_contacts_async(
    background_tasks: BackgroundTasks,
    payload: Optional[ExportAsyncRequest] = None,
    tenant_id: str = Depends(require_active_tenant),
    _ = Depends(require_permission("MANAGE_CONTACT"))
):
    """Start an async background task to export all contacts for the tenant"""
    try:
        from utils.redis_client import redis_client
        lock_key = f"tenant:{tenant_id}:export_running"
        if not await redis_client.client.set(lock_key, "1", nx=True, ex=3600):
            raise HTTPException(status_code=429, detail="An export is already running for this workspace.")

        job_id = str(uuid.uuid4())
        
        # 1. Create the persistent Job record
        db.client.table("jobs").insert({
            "id": job_id,
            "tenant_id": tenant_id,
            "type": "csv_export",
            "status": "pending",
            "progress": 0,
            "total_items": 0,
        }).execute()
        
        # 2. Schedule the background task
        from services.export_service import process_csv_export
        batch_id = payload.batch_id if payload else None
        background_tasks.add_task(process_csv_export, job_id=job_id, tenant_id=tenant_id, batch_id=batch_id)
        
        return {
            "status": "accepted",
            "job_id": job_id,
            "message": "Export started. Poll /contacts/jobs/{job_id} for progress."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue export: {str(e)}")

@router.get("/export")
async def export_contacts(tenant_id: str = Depends(require_active_tenant), _ = Depends(require_permission("MANAGE_CONTACT"))):
    """Export all contacts for the tenant as a CSV file"""
    try:
        csv_data = ContactService.export_contacts(tenant_id)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=contacts_export.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/export/batch/{batch_id}")
async def export_batch_contacts_sync(
    batch_id: str,
    tenant_id: str = Depends(require_active_tenant),
    _ = Depends(require_permission("MANAGE_CONTACT"))
):
    """Fast synchronous export for a specific import batch — no job queue, no polling."""
    import gzip as _gzip
    try:
        csv_data = ContactService.export_contacts(tenant_id, batch_id=batch_id)
        compressed = _gzip.compress(csv_data.encode("utf-8"))
        return Response(
            content=compressed,
            media_type="application/gzip",
            headers={"Content-Disposition": f"attachment; filename=batch_{batch_id}.csv.gz"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch export failed: {str(e)}")


@router.delete("/{contact_id}")
async def delete_contact(contact_id: str, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_permission("MANAGE_CONTACT"))):
    """Delete a single contact"""
    try:
        # Fetch batch id before delete for recalculation
        existing = db.client.table("contacts")\
            .select("import_batch_id")\
            .eq("id", contact_id)\
            .eq("tenant_id", tenant_id)\
            .single()\
            .execute()

        result = db.client.table("contacts")\
            .delete()\
            .eq("id", contact_id)\
            .eq("tenant_id", tenant_id)\
            .execute()

        if len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Contact not found")

        # Recalc batch counts if this contact was part of a batch
        batch_id = existing.data.get("import_batch_id") if existing.data else None
        if batch_id:
            from services.batch_service import BatchService
            BatchService.recalc_batch_counts(tenant_id, batch_id)

        return {"status": "success", "message": "Contact deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete error: {str(e)}")
