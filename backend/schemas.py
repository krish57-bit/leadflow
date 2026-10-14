from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict


VALID_STATUSES = [
    "New",
    "Contacted",
    "Qualified",
    "Proposal Sent",
    "Won",
    "Lost"
]


# Discussion Schemas
class DiscussionBase(BaseModel):
    note: str = Field(..., min_length=1, description="Discussion notes content")
    activity_type: Optional[str] = "note"  # "call", "meeting", "proposal", "note", "inbound"
    follow_up_date: Optional[datetime] = None


class DiscussionCreate(DiscussionBase):
    ai_analysis: Optional[str] = None


class DiscussionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    note: str
    activity_type: str = "note"
    follow_up_date: Optional[datetime] = None
    ai_analysis: Optional[str] = None
    created_at: datetime
    time_ago: Optional[str] = None


# Lead Schemas
class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of the lead")
    company: Optional[str] = Field(None, max_length=255, description="Company or firm name")
    phone: Optional[str] = Field(None, max_length=50, description="Contact phone number")


class LeadCreate(LeadBase):
    status: Optional[str] = "New"
    initial_note: Optional[str] = None
    activity_type: Optional[str] = "note"
    follow_up_date: Optional[datetime] = None


class LeadUpdateStatus(BaseModel):
    status: str = Field(..., description="Lead status")


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    follow_up_date: Optional[datetime] = None


class LeadSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None
    status: str
    follow_up_date: Optional[datetime] = None
    follow_up_status: str  # "today", "overdue", "upcoming", "none"
    best_time_to_contact: Optional[str] = None
    last_discussion_note: Optional[str] = None
    last_discussion_at: Optional[datetime] = None
    time_ago: Optional[str] = None
    discussions_count: int = 0
    created_at: datetime
    updated_at: datetime


class LeadDetailResponse(LeadSummaryResponse):
    model_config = ConfigDict(from_attributes=True)

    discussions: List[DiscussionResponse] = []


# AI Schemas
class AIAnalyzeRequest(BaseModel):
    note: str = Field(..., min_length=2, description="Raw discussion note or voice transcription")
    lead_name: Optional[str] = None
    company: Optional[str] = None
    current_status: Optional[str] = None


class AIAnalyzeResponse(BaseModel):
    detected_intent: str
    sentiment: str  # "Positive", "Neutral", "Hesitant / At Risk"
    financial_topics: List[str]
    suggested_follow_up_date: Optional[str] = None  # ISO format string if detected
    suggested_follow_up_display: Optional[str] = None  # User friendly display, e.g. "Next Tuesday at 2:00 PM"
    next_best_action: str
    recommended_status: Optional[str] = None
    reasoning_trace: List[str]  # Step-by-step fiduciary reasoning path
