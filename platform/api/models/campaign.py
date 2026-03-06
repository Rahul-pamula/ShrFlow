from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class CampaignBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    subject: str = Field(..., min_length=1, max_length=500)
    body_html: str = Field(..., description="HTML email content with optional Spintax/variables")
    status: str = Field(default="draft") # draft, scheduled, sending, sent, paused, cancelled
    scheduled_at: Optional[datetime] = None

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class CampaignResponse(CampaignBase):
    id: UUID
    project_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class CampaignSnapshotBase(BaseModel):
    campaign_id: UUID
    body_snapshot: str
    subject_snapshot: str

class CampaignSnapshotCreate(CampaignSnapshotBase):
    pass

class CampaignSnapshotResponse(CampaignSnapshotBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class SendRequest(BaseModel):
    """Request body for sending a campaign"""
    target_list_id: Optional[str] = None   # "all" | "batch:{uuid}"
    test_emails: Optional[List[str]] = None

class CampaignDispatchBase(BaseModel):
    campaign_id: UUID
    subscriber_id: UUID
    status: str = Field(default="PENDING") # PENDING, PROCESSING, DISPATCHED, FAILED, CANCELLED
    ses_message_id: Optional[str] = None
    error_log: Optional[str] = None

class CampaignDispatchCreate(CampaignDispatchBase):
    pass

class CampaignDispatchResponse(CampaignDispatchBase):
    id: UUID
    sent_at: Optional[datetime] = None
    open_count: int = 0
    click_count: int = 0

    class Config:
        from_attributes = True
