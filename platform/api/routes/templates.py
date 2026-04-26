from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel

from services.template_service import TemplateService
from models.template import TemplateCreate, TemplateUpdate
from utils.jwt_middleware import require_active_tenant, JWTPayload, verify_jwt_token
from utils.permissions import require_permission
from utils.supabase_client import db


router = APIRouter(prefix="/templates", tags=["Templates"])

@router.post("/")
async def create_template_endpoint(
    template: TemplateCreate,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEMPLATE"))
):

    """Create a new template"""
    result = TemplateService.create_template(tenant_id, jwt_payload.user_id, template)
    if not result:
        raise HTTPException(status_code=500, detail="Access denied.")
    return result


@router.get("/")
async def list_templates_endpoint(
    page: int = 1,
    limit: int = 20,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_TEMPLATE"))
):

    """List templates with pagination"""
    try:
        return TemplateService.list_templates(tenant_id, jwt_payload, page, limit)
    except Exception as e:
        print(f"ERROR list_templates: {e}")
        raise HTTPException(status_code=500, detail="Access denied.")


@router.get("/{template_id}")
async def get_template_endpoint(
    template_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_TEMPLATE"))
):

    """Get a template by ID"""
    result = TemplateService.get_template(tenant_id, jwt_payload, template_id)
    if not result:
        raise HTTPException(status_code=404, detail="Access denied.")
    return result


@router.put("/{template_id}")
async def update_template_endpoint(
    template_id: str,
    template: TemplateUpdate,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEMPLATE"))
):

    """Update a template"""


    result = TemplateService.update_template(tenant_id, template_id, template, jwt_payload)
    if not result:
        raise HTTPException(status_code=404, detail="Access denied.")
    return result


@router.delete("/{template_id}")
async def delete_template_endpoint(
    template_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEMPLATE"))
):

    """Delete a template"""


    success = TemplateService.delete_template(tenant_id, template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Access denied.")
    return {"message": "Template deleted"}


class CompilePreviewRequest(BaseModel):
    design_json: Dict[str, Any]

@router.post("/compile/preview")
async def compile_preview_endpoint(
    payload: CompilePreviewRequest,
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_TEMPLATE"))
):

    """Compiles the given design_json to raw HTML for editor preview."""
    try:
        from services.compile_service import compile_design_json
        html = compile_design_json(payload.design_json)
        return {"html": html}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Access denied.")

