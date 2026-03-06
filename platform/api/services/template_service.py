from typing import List, Optional, Dict, Any
from uuid import UUID
from utils.supabase_client import db
from models.template import TemplateCreate, TemplateUpdate

class TemplateService:

    @staticmethod
    def create_template(tenant_id: str, template: TemplateCreate) -> Dict[str, Any]:
        """Create a new template with structured design JSON."""

        # Store design_json inside the mjml_json column (JSONB) to avoid DB migration
        design_data = template.design_json
        if design_data and hasattr(design_data, 'model_dump'):
            design_data = design_data.model_dump()
        elif design_data and hasattr(design_data, 'dict'):
            design_data = design_data.dict()

        insert_data = {
            "tenant_id": tenant_id,
            "name": template.name,
            "subject": template.subject,
            "category": template.category,
            "mjml_json": {"design_json": design_data} if design_data else {},
            "mjml_source": "",
            "compiled_html": template.compiled_html or "<p>Loading…</p>",
            "plain_text": template.plain_text,
            "version": 1,
        }

        result = db.client.table("templates").insert(insert_data).execute()
        row = result.data[0] if result.data else None

        # Unpack design_json for the API response
        if row:
            row = TemplateService._unpack_design(row)
        return row

    @staticmethod
    def get_template(tenant_id: str, template_id: str) -> Optional[Dict[str, Any]]:
        """Get a template by ID."""
        result = db.client.table("templates")\
            .select("*")\
            .eq("tenant_id", tenant_id)\
            .eq("id", template_id)\
            .execute()

        if not result.data:
            return None

        return TemplateService._unpack_design(result.data[0])

    @staticmethod
    def list_templates(tenant_id: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """List templates with pagination."""
        offset = (page - 1) * limit

        result = db.client.table("templates")\
            .select("*", count="exact")\
            .eq("tenant_id", tenant_id)\
            .order("updated_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()

        data = [TemplateService._unpack_design(row) for row in result.data]

        return {
            "data": data,
            "total": result.count,
            "page": page,
            "limit": limit,
        }

    @staticmethod
    def update_template(tenant_id: str, template_id: str, template: TemplateUpdate) -> Optional[Dict[str, Any]]:
        """Update a template."""
        existing = TemplateService.get_template(tenant_id, template_id)
        if not existing:
            return None

        update_data: Dict[str, Any] = {}
        if template.name is not None:
            update_data["name"] = template.name
        if template.subject is not None:
            update_data["subject"] = template.subject
        if template.category is not None:
            update_data["category"] = template.category
        if template.compiled_html is not None:
            update_data["compiled_html"] = template.compiled_html
        if template.plain_text is not None:
            update_data["plain_text"] = template.plain_text

        # Store design_json inside mjml_json column
        if template.design_json is not None:
            update_data["mjml_json"] = {"design_json": template.design_json}

        if not update_data:
            return existing

        result = db.client.table("templates")\
            .update(update_data)\
            .eq("tenant_id", tenant_id)\
            .eq("id", template_id)\
            .execute()

        row = result.data[0] if result.data else None
        if row:
            row = TemplateService._unpack_design(row)
        return row

    @staticmethod
    def delete_template(tenant_id: str, template_id: str) -> bool:
        """Delete a template."""
        result = db.client.table("templates")\
            .delete()\
            .eq("tenant_id", tenant_id)\
            .eq("id", template_id)\
            .execute()

        return len(result.data) > 0

    # ── Internal helpers ────────────────────────────────────────────────

    @staticmethod
    def _unpack_design(row: Dict[str, Any]) -> Dict[str, Any]:
        """
        The DB stores design_json inside the mjml_json JSONB column.
        This unpacks it so the API response has a top-level design_json field.
        """
        mjml = row.get("mjml_json") or {}
        if isinstance(mjml, dict) and "design_json" in mjml:
            row["design_json"] = mjml["design_json"]
        else:
            row["design_json"] = None

        # Ensure field compatibility with Pydantic response model
        row.setdefault("template_type", "block")
        row.setdefault("schema_version", "2.0.0")
        return row
