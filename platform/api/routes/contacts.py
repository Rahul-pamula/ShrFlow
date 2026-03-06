"""
Contacts API Routes
Handles contact listing, stats, CSV/Excel upload, and lifecycle management.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from typing import Optional, Dict, List
from pydantic import BaseModel
import pandas as pd
import logging
from services.contact_service import ContactService
from services.batch_service import BatchService
from utils.jwt_middleware import require_active_tenant
from utils.supabase_client import db
from utils.rabbitmq_client import mq_client  # Added for Background Jobs
from utils.file_parser import parse_file
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


# ===== STATS & LIST =====

@router.get("/stats", response_model=ContactStats)
async def get_contact_stats(tenant_id: str = Depends(require_active_tenant)):
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
    tenant_id: str = Depends(require_active_tenant)
):
    """List contacts with pagination, search, and optional batch filter"""
    return ContactService.get_contacts(tenant_id, page, limit, search, batch_id)


# ===== UPLOAD FLOW =====

@router.post("/upload/preview")
async def preview_csv(
    file: UploadFile = File(...),
    tenant_id: str = Depends(require_active_tenant)
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


@router.post("/upload/import")
async def import_contacts(
    file: UploadFile = File(...),
    email_col: str = "email",
    first_name_col: Optional[str] = None,
    last_name_col: Optional[str] = None,
    custom_mappings: Optional[str] = None,
    tenant_id: str = Depends(require_active_tenant)
):
    """
    Import contacts with field mapping + batch tracking.
    
    Supports dynamic custom fields via custom_mappings parameter:
    custom_mappings is a JSON string like: {"phone": "Phone Number", "company": "Company Name"}
    where keys = custom field names, values = CSV column names.
    """
    import json as json_lib
    
    # Parse custom mappings if provided
    custom_field_map = {}
    if custom_mappings:
        try:
            custom_field_map = json_lib.loads(custom_mappings)
        except json_lib.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid custom_mappings JSON")

    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 2MB.")

        df = parse_file(contents, file.filename)

        # Map columns with safe type conversion
        contacts_to_import = []
        for _, row in df.iterrows():
            raw_email = row.get(email_col, "")
            contact = {
                "email": str(raw_email).strip().lower() if pd.notna(raw_email) else "",
                "first_name": str(row.get(first_name_col, "")).strip() if first_name_col and pd.notna(row.get(first_name_col)) else "",
                "last_name": str(row.get(last_name_col, "")).strip() if last_name_col and pd.notna(row.get(last_name_col)) else ""
            }
            
            # Build custom fields from dynamic mapping
            if custom_field_map:
                custom = {}
                for field_name, csv_col in custom_field_map.items():
                    val = row.get(csv_col, "")
                    if pd.notna(val) and str(val).strip():
                        custom[field_name] = str(val).strip()
                if custom:
                    contact["custom_fields"] = custom
            
            contacts_to_import.append(contact)

        # ── PHASE 7.5: asynchronous JOB TRIGGER ─────────────────────────────
        # Instead of blocking and waiting for `bulk_upsert`, we queue a job.
        job_id = str(uuid.uuid4())
        
        # 1. Create the persistent Job record
        db.client.table("jobs").insert({
            "id": job_id,
            "tenant_id": tenant_id,
            "type": "csv_import",
            "status": "pending",
            "progress": 0,
            "total_items": len(contacts_to_import),
        }).execute()

        # 2. Create the import batch early so we have the ID to pass to the worker
        batch_id = BatchService.create_batch(
            tenant_id=tenant_id,
            file_name=file.filename,
            total_rows=len(contacts_to_import),
            imported_count=0
        )
        
        # 3. Queue the task to RabbitMQ (New queue: `background_tasks`)
        task_payload = {
            "job_id": job_id,
            "tenant_id": tenant_id,
            "batch_id": batch_id,
            "task_type": "csv_import",
            "contacts": contacts_to_import
        }
        await mq_client.publish_background_task(task_payload)

        # 4. Return immediately to the client (202 Accepted)
        return {"status": "accepted", "job_id": job_id, "batch_id": batch_id, "message": "Import queued for processing."}

    except HTTPException:
        raise
    except Exception as e:
        # Mark batch as failed if it was created
        try:
            if 'batch_id' in dir():
                db.client.table("import_batches")\
                    .update({"status": "failed"})\
                    .eq("id", batch_id)\
                    .eq("tenant_id", tenant_id)\
                    .execute()
                logger.error(f"[IMPORT_CRASH] tenant={tenant_id} batch={batch_id} error={str(e)}")
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to queue import: {str(e)}")

# ===== ASYNC JOB STATUS (POLLING) =====

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str, tenant_id: str = Depends(require_active_tenant)):
    """Fetch the realtime progress of a specific background job"""
    try:
        res = db.client.table("jobs").select("*").eq("id", job_id).eq("tenant_id", tenant_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Job not found")
        return res.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch job status")

# ===== DELETE OPERATIONS =====
# NOTE: Static routes MUST come before /{contact_id} to avoid path conflicts

@router.post("/bulk-delete")
async def bulk_delete_contacts(
    body: BulkDeleteRequest,
    tenant_id: str = Depends(require_active_tenant)
):
    """Delete multiple selected contacts"""
    if not body.contact_ids:
        raise HTTPException(status_code=400, detail="No contact IDs provided")

    if len(body.contact_ids) > 1000:
        raise HTTPException(status_code=400, detail="Maximum 1000 contacts per bulk delete")

    deleted_count = ContactService.delete_bulk(tenant_id, body.contact_ids)
    return {"deleted_count": deleted_count}


@router.delete("/all")
async def delete_all_contacts(tenant_id: str = Depends(require_active_tenant)):
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
async def delete_batch(batch_id: str, tenant_id: str = Depends(require_active_tenant)):
    """Delete all contacts from a specific import batch"""
    deleted_count = BatchService.delete_batch(tenant_id, batch_id)
    return {"deleted_count": deleted_count}

# ===== SINGLE CONTACT DELETE (dynamic path — must be last) =====

class ResolveErrorRequest(BaseModel):
    batch_id: str
    error_index: int
    email: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""


@router.post("/resolve-error")
async def resolve_error(
    body: ResolveErrorRequest,
    tenant_id: str = Depends(require_active_tenant)
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

    # Add the contact
    contact_data = {
        "tenant_id": tenant_id,
        "email": email,
        "first_name": body.first_name.strip() or None,
        "last_name": body.last_name.strip() or None,
        "import_batch_id": body.batch_id
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

@router.get("/{contact_id}")
async def get_contact(
    contact_id: str,
    tenant_id: str = Depends(require_active_tenant)
):
    """Get a single contact by ID"""
    try:
        result = db.client.table("contacts")\
            .select("*")\
            .eq("id", contact_id)\
            .eq("tenant_id", tenant_id)\
            .single()\
            .execute()
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
    tenant_id: str = Depends(require_active_tenant)
):
    """Update the tags array for a specific contact"""
    try:
        updated = ContactService.update_tags(tenant_id, contact_id, body.tags)
        return {"status": "success", "contact": updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update tags: {str(e)}")

@router.get("/suppression")
async def get_suppressed_contacts(
    page: int = 1,
    limit: int = 50,
    tenant_id: str = Depends(require_active_tenant)
):
    """List contacts that bounced, unsubscribed, or complained"""
    return ContactService.get_suppression_list(tenant_id, page, limit)

@router.get("/export")
async def export_contacts(tenant_id: str = Depends(require_active_tenant)):
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


@router.delete("/{contact_id}")
async def delete_contact(contact_id: str, tenant_id: str = Depends(require_active_tenant)):
    """Delete a single contact"""
    try:
        result = db.client.table("contacts")\
            .delete()\
            .eq("id", contact_id)\
            .eq("tenant_id", tenant_id)\
            .execute()

        if len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Contact not found")

        return {"status": "success", "message": "Contact deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete error: {str(e)}")
