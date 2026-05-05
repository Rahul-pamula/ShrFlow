from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel

from services.template_service import TemplateService
from models import TemplateCreate, TemplateUpdate
from core.auth import require_active_tenant, JWTPayload, require_permission

router = APIRouter(prefix="/templates", tags=["Templates"])

@router.post("/")
async def create_template_endpoint(
    template: TemplateCreate,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("template:manage"))
):
    result = TemplateService.create_template(tenant_id, jwt_payload.user_id, template)
    if not result:
        raise HTTPException(status_code=500, detail="Error creating template")
    return result

@router.get("/")
async def list_templates_endpoint(
    page: int = 1,
    limit: int = 20,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("template:view"))
):
    try:
        return TemplateService.list_templates(tenant_id, page, limit)
    except Exception as e:
        print(f"ERROR list_templates: {e}")
        raise HTTPException(status_code=500, detail="Error listing templates")

@router.get("/{template_id}")
async def get_template_endpoint(
    template_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("template:view"))
):
    result = TemplateService.get_template(tenant_id, template_id)
    if not result:
        raise HTTPException(status_code=404, detail="Template not found")
    return result

@router.put("/{template_id}")
async def update_template_endpoint(
    template_id: str,
    template: TemplateUpdate,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("template:manage"))
):
    result = TemplateService.update_template(tenant_id, template_id, template)
    if not result:
        raise HTTPException(status_code=404, detail="Template not found")
    return result

@router.delete("/{template_id}")
async def delete_template_endpoint(
    template_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("template:manage"))
):
    success = TemplateService.delete_template(tenant_id, template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}

# ── COMPILE PREVIEW ────────────────────────────────────────────────────────
class CompilePreviewRequest(BaseModel):
    design_json: Dict[str, Any]

@router.post("/compile/preview")
async def compile_preview_endpoint(
    payload: CompilePreviewRequest,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("template:view"))
):
    try:
        from services.compile_service import compile_design_json
        html = compile_design_json(payload.design_json)
        return {"html": html}
    except Exception as e:
        print(f"COMPILE ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Compilation failed: {str(e)}")

# ── VALIDATE ───────────────────────────────────────────────────────────────
class ValidateRequest(BaseModel):
    design_json: Dict[str, Any]

SPAM_KEYWORDS = [
    "free!!", "click here", "act now", "limited time", "you have been selected",
    "100% free", "no cost", "winner", "guaranteed", "cash bonus", "earn money"
]

def _find_merge_tags(design_json: Dict[str, Any]) -> List[str]:
    import re, json
    return list(set(re.findall(r"\{\{([^}]+)\}\}", json.dumps(design_json))))

def _has_unsubscribe(design_json: Dict[str, Any]) -> bool:
    import json
    return "unsubscribe" in json.dumps(design_json).lower()

def _extract_text(design_json: Dict[str, Any]) -> str:
    import re
    parts = []
    all_blocks = (
        design_json.get("headerBlocks", []) +
        design_json.get("bodyBlocks", []) +
        design_json.get("footerBlocks", [])
    )
    for block in all_blocks:
        p = block.get("props", {})
        for k in ["content", "headline", "subheadline", "text"]:
            v = p.get(k, "")
            if v:
                parts.append(re.sub(r"<[^>]+>", "", str(v)))
    return " ".join(parts)

def _count_images(design_json: Dict[str, Any]) -> int:
    all_blocks = (
        design_json.get("headerBlocks", []) +
        design_json.get("bodyBlocks", []) +
        design_json.get("footerBlocks", [])
    )
    return sum(1 for b in all_blocks if b.get("type") in ("image", "hero", "floating-image"))

@router.post("/validate")
async def validate_template_endpoint(
    payload: ValidateRequest,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("template:view"))
):
    errors = []
    warnings = []
    design = payload.design_json

    # Token scan
    tags = _find_merge_tags(design)
    no_fallback = [t for t in tags if "|" not in t and "default" not in t]
    for tag in no_fallback:
        warnings.append({
            "type": "token",
            "message": f"Tag '{{{{{tag}}}}}' has no fallback value",
            "severity": "warning"
        })

    # Unsubscribe (CAN-SPAM compliance)
    if not _has_unsubscribe(design):
        errors.append({
            "type": "compliance",
            "message": "Missing unsubscribe link — required by CAN-SPAM / GDPR",
            "severity": "error"
        })

    # Image/text ratio
    text = _extract_text(design)
    word_count = len(text.split())
    image_count = _count_images(design)
    if image_count > 0 and word_count < image_count * 50:
        warnings.append({
            "type": "spam",
            "message": f"High image-to-text ratio ({image_count} images, ~{word_count} words)",
            "severity": "warning"
        })

    # Spam keywords
    for kw in SPAM_KEYWORDS:
        if kw in text.lower():
            warnings.append({"type": "spam", "message": f"Spam trigger word: '{kw}'", "severity": "warning"})

    # Empty body check
    if not design.get("bodyBlocks"):
        errors.append({"type": "structure", "message": "Email body is empty", "severity": "error"})

    status = "pass" if not errors else "fail"
    score = max(0, 100 - (len(errors) * 25) - (len(warnings) * 10))

    return {
        "status": status,
        "score": score,
        "errors": errors,
        "warnings": warnings,
        "token_count": len(tags),
        "unresolved_tokens": no_fallback,
    }

# ── SEND TEST EMAIL ────────────────────────────────────────────────────────
class SendTestRequest(BaseModel):
    design_json: Dict[str, Any]
    to_email: str
    persona: Optional[Dict[str, Any]] = None
    subject: Optional[str] = "Test Email from ShrFlow"

@router.post("/send-test")
async def send_test_email_endpoint(
    payload: SendTestRequest,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("template:manage"))
):
    try:
        import re
        from services.compile_service import compile_design_json

        html = compile_design_json(payload.design_json)

        # Inject persona data (replace merge tags)
        if payload.persona:
            for key, value in payload.persona.items():
                html = re.sub(
                    rf"\{{\{{{re.escape(key)}[^}}]*\}}\}}",
                    str(value), html
                )

        # Dispatch via SES
        import boto3, os
        ses_client = boto3.client(
            "ses",
            region_name=os.environ.get("AWS_REGION", "us-east-1"),
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        )
        from_address = os.environ.get("SES_FROM_EMAIL", "noreply@shrflow.app")
        ses_client.send_email(
            Source=from_address,
            Destination={"ToAddresses": [payload.to_email]},
            Message={
                "Subject": {"Data": payload.subject or "Test Email from ShrFlow"},
                "Body": {"Html": {"Data": html}},
            },
        )
        return {"status": "sent", "to": payload.to_email}

    except Exception as e:
        print(f"SEND TEST ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Send test failed: {str(e)}")
