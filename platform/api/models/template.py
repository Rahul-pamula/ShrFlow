"""
template.py – Strict Pydantic models for the Structured Email Editor.

Schema: Row → Column → Block
No legacy flat blocks[] support.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime
from uuid import UUID


# ---------------------------------------------------------------------------
# Block
# ---------------------------------------------------------------------------

BlockType = Literal[
    "text", "image", "button", "divider", "spacer", "social", "hero", "footer"
]

class BlockSchema(BaseModel):
    id: str
    type: BlockType
    props: Dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Column
# ---------------------------------------------------------------------------

class ColumnSchema(BaseModel):
    id: str
    width: int = Field(..., gt=0, le=100, description="Column width as percentage (1–100)")
    blocks: List[BlockSchema] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Row
# ---------------------------------------------------------------------------

class RowSettings(BaseModel):
    backgroundColor: Optional[str] = None
    paddingTop: Optional[int] = Field(default=0, ge=0)
    paddingBottom: Optional[int] = Field(default=0, ge=0)
    paddingLeft: Optional[int] = Field(default=0, ge=0)
    paddingRight: Optional[int] = Field(default=0, ge=0)

class RowSchema(BaseModel):
    id: str
    settings: RowSettings = Field(default_factory=RowSettings)
    columns: List[ColumnSchema] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_column_widths(self):
        total = sum(c.width for c in self.columns)
        if total != 100:
            raise ValueError(
                f"Column widths must sum to 100, got {total} "
                f"(columns: {[c.width for c in self.columns]})"
            )
        return self


# ---------------------------------------------------------------------------
# Theme & Design JSON
# ---------------------------------------------------------------------------

class ThemeTokens(BaseModel):
    background: str = "#f3f4f6"
    contentWidth: int = Field(default=600, ge=320, le=800)
    fontFamily: str = "Arial, sans-serif"
    primaryColor: str = "#4f46e5"

class DesignJSONSchema(BaseModel):
    theme: ThemeTokens = Field(default_factory=ThemeTokens)
    rows: List[RowSchema] = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Template CRUD models
# ---------------------------------------------------------------------------

class TemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    subject: Optional[str] = Field(default="", max_length=255)
    category: Optional[str] = Field("marketing")

    design_json: Optional[Dict[str, Any]] = None
    compiled_html: Optional[str] = None
    plain_text: Optional[str] = None

    preview: Optional[str] = Field(default="", max_length=1000)
    template_type: str = Field("block")
    schema_version: str = Field("2.0.0")

    @field_validator("compiled_html")
    def validate_html_size(cls, v):
        if not v:
            return v
        if len(v.encode("utf-8")) > 500 * 1024:
            raise ValueError("Compiled HTML size must be less than 500 KB")
        return v


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = None

    design_json: Optional[Dict[str, Any]] = None
    compiled_html: Optional[str] = None
    plain_text: Optional[str] = None

    preview: Optional[str] = None
    template_type: Optional[str] = None
    schema_version: Optional[str] = None

    @field_validator("compiled_html")
    def validate_html_size(cls, v):
        if v is None:
            return v
        if len(v.encode("utf-8")) > 500 * 1024:
            raise ValueError("Compiled HTML size must be less than 500 KB")
        return v


class TemplateResponse(TemplateBase):
    id: UUID
    tenant_id: UUID
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
