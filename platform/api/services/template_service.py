from typing import List, Optional, Dict, Any
from uuid import UUID
from utils.supabase_client import db
from models.template import TemplateCreate, TemplateUpdate
from services.compile_service import compile_design_json

class TemplateService:

    @staticmethod
    def create_template(tenant_id: str, user_id: str, template: TemplateCreate) -> Dict[str, Any]:
        """Create a new template with structured design JSON."""

        # Store design_json inside the mjml_json column (JSONB) to avoid DB migration
        design_data = template.design_json
        if design_data and hasattr(design_data, 'model_dump'):
            design_data = design_data.model_dump()
        elif design_data and hasattr(design_data, 'dict'):
            design_data = design_data.dict()

        # Auto-compile HTML if design_json is provided
        compiled_html = template.compiled_html
        is_placeholder = compiled_html in [None, "", "<p>Loading…</p>", "<p>Rendering failed...</p>"]
        
        if design_data and is_placeholder:
            try:
                compiled_html = compile_design_json(design_data)
            except Exception as e:
                print(f"Auto-compile failed on creation: {e}")
                compiled_html = "<p>Rendering failed...</p>"

        insert_data = {
            "tenant_id": tenant_id,
            "name": template.name,
            "subject": template.subject,
            "category": template.category,
            "created_by_user_id": user_id,
            "mjml_json": {
                "design_json": design_data,
                "preview": template.preview or ""
            } if design_data or template.preview else {},
            "mjml_source": "",
            "compiled_html": compiled_html or "<p>Loading…</p>",
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
    def get_template(tenant_id: str, jwt_payload: Any, template_id: str) -> Optional[Dict[str, Any]]:
        """Get a template by ID."""
        query = db.client.table("templates")\
            .select("*")\
            .eq("tenant_id", tenant_id)\
            .eq("id", template_id)
            
        from utils.jwt_middleware import apply_data_isolation
        query = apply_data_isolation(query, jwt_payload)
        
        result = query.execute()

        if not result.data:
            return None

        return TemplateService._unpack_design(result.data[0])

    @staticmethod
    def list_templates(tenant_id: str, jwt_payload: Any, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """List templates with pagination."""
        offset = (page - 1) * limit

        query = db.client.table("templates")\
            .select("*", count="exact")\
            .eq("tenant_id", tenant_id)
            
        from utils.jwt_middleware import apply_data_isolation
        query = apply_data_isolation(query, jwt_payload)
            
        result = query.order("updated_at", desc=True)\
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
    def update_template(tenant_id: str, template_id: str, template: TemplateUpdate, jwt_payload: Any) -> Optional[Dict[str, Any]]:
        """Update a template."""
        existing = TemplateService.get_template(tenant_id, jwt_payload, template_id)
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

        # Store design_json and preview inside mjml_json column (workaround for missing preview column)
        mjml_data = existing.get("mjml_json") or {}
        if not isinstance(mjml_data, dict):
            mjml_data = {}
            
        if template.design_json is not None:
            mjml_data["design_json"] = template.design_json
        if template.preview is not None:
            mjml_data["preview"] = template.preview
            
        if template.design_json is not None or template.preview is not None:
            update_data["mjml_json"] = mjml_data
            
            # If design_json was updated, also update compiled_html
            existing_html = existing.get("compiled_html") or update_data.get("compiled_html")
            html_placeholder = existing_html in [None, "", "<p>Loading…</p>", "<p>Rendering failed...</p>"]
            
            # Trigger compilation if we have design data and (no HTML or it's a placeholder)
            design_for_comp = mjml_data.get("design_json")
            if design_for_comp and (template.compiled_html is None or html_placeholder):
                try:
                    update_data["compiled_html"] = compile_design_json(design_for_comp)
                except Exception as e:
                    print(f"Auto-compile failed on update: {e}")

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
        The DB stores design_json and preview inside the mjml_json JSONB column.
        This unpacks them so the API response has top-level fields.
        """
        mjml = row.get("mjml_json") or {}
        if isinstance(mjml, dict):
            row["design_json"] = mjml.get("design_json")
            row["preview"] = mjml.get("preview") or ""
        else:
            row["design_json"] = None
            row["preview"] = ""

        # Ensure field compatibility with Pydantic response model
        row.setdefault("template_type", "block")
        row.setdefault("schema_version", "2.0.0")
        return row
