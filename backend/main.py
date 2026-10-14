import json
from datetime import datetime, date
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from database import engine, Base, get_db
import models
import schemas
from ai_engine import analyze_discussion_note

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LeadFlow API",
    description="Wealth Advisor CRM & AI Reasoning Engine for Pravar AI",
    version="1.0.0"
)

# CORS configuration allowing local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def format_time_ago(dt: Optional[datetime]) -> Optional[str]:
    """Converts a datetime into a human-readable relative time string."""
    if not dt:
        return None
    now = datetime.utcnow()
    diff = now - dt

    seconds = diff.total_seconds()
    if seconds < 0:
        return "just now"
    if seconds < 60:
        return "just now"
    minutes = int(seconds // 60)
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    hours = int(minutes // 60)
    if hours < 24:
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    days = int(hours // 24)
    if days == 1:
        return "yesterday"
    if days < 7:
        return f"{days} days ago"
    weeks = int(days // 7)
    if weeks < 4:
        return f"{weeks} week{'s' if weeks > 1 else ''} ago"
    months = int(days // 30)
    if months < 12:
        return f"{months} month{'s' if months > 1 else ''} ago"
    years = int(days // 365)
    return f"{years} year{'s' if years > 1 else ''} ago"


def compute_follow_up_status(dt: Optional[datetime]) -> str:
    """Classifies follow-up date as 'today', 'overdue', 'upcoming', or 'none'."""
    if not dt:
        return "none"
    now = datetime.utcnow()
    today_date = now.date()
    target_date = dt.date()

    if target_date == today_date:
        return "today"
    elif target_date < today_date:
        return "overdue"
    else:
        return "upcoming"


def build_lead_summary(lead: models.Lead) -> schemas.LeadSummaryResponse:
    # Most recent discussion
    last_discussion = lead.discussions[0] if lead.discussions else None
    last_note = last_discussion.note if last_discussion else None
    last_at = last_discussion.created_at if last_discussion else lead.created_at

    return schemas.LeadSummaryResponse(
        id=lead.id,
        name=lead.name,
        company=lead.company,
        phone=lead.phone,
        status=lead.status,
        follow_up_date=lead.follow_up_date,
        follow_up_status=compute_follow_up_status(lead.follow_up_date),
        last_discussion_note=last_note,
        last_discussion_at=last_at,
        time_ago=format_time_ago(last_at),
        discussions_count=len(lead.discussions),
        created_at=lead.created_at,
        updated_at=lead.updated_at
    )


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "leadflow-backend", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/leads", response_model=List[schemas.LeadSummaryResponse], tags=["Leads"])
def get_leads(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    follow_up_filter: Optional[str] = Query(None),  # 'today', 'overdue', 'upcoming', 'all'
    db: Session = Depends(get_db)
):
    query = db.query(models.Lead)

    # Status filter
    if status_filter and status_filter.lower() != "all":
        query = query.filter(models.Lead.status.ilike(status_filter))

    # Search filter (name, company, phone, or discussion note content)
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.outerjoin(models.Discussion).filter(
            or_(
                models.Lead.name.ilike(search_term),
                models.Lead.company.ilike(search_term),
                models.Lead.phone.ilike(search_term),
                models.Discussion.note.ilike(search_term)
            )
        ).distinct()

    leads = query.all()

    # Convert to summary models
    summaries = [build_lead_summary(lead) for lead in leads]

    # Optional follow_up_filter
    if follow_up_filter and follow_up_filter.lower() != "all":
        summaries = [s for s in summaries if s.follow_up_status == follow_up_filter.lower()]

    # Pinning Logic:
    # 1. Today's follow-ups pinned at the very top (priority 0)
    # 2. Overdue follow-ups next (priority 1)
    # 3. All other leads ordered by last activity date (priority 2)
    def sort_key(item: schemas.LeadSummaryResponse):
        if item.follow_up_status == "today":
            priority = 0
        elif item.follow_up_status == "overdue":
            priority = 1
        else:
            priority = 2
        # Sort within category by last discussion date (newest first)
        dt_val = item.last_discussion_at or item.created_at
        return (priority, -dt_val.timestamp() if dt_val else 0)

    summaries.sort(key=sort_key)
    return summaries


@app.post("/api/leads", response_model=schemas.LeadDetailResponse, status_code=status.HTTP_201_CREATED, tags=["Leads"])
def create_lead(payload: schemas.LeadCreate, db: Session = Depends(get_db)):
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Lead full name is required.")

    status_val = payload.status or "New"
    if status_val not in schemas.VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status_val}'. Valid statuses: {schemas.VALID_STATUSES}"
        )

    new_lead = models.Lead(
        name=payload.name.strip(),
        company=payload.company.strip() if payload.company else None,
        phone=payload.phone.strip() if payload.phone else None,
        status=status_val,
        follow_up_date=payload.follow_up_date
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)

    # If an initial note was provided, log it as the first discussion
    initial_note = payload.initial_note.strip() if payload.initial_note else "Lead created via web form."
    first_discussion = models.Discussion(
        lead_id=new_lead.id,
        note=initial_note,
        follow_up_date=payload.follow_up_date
    )
    db.add(first_discussion)
    db.commit()
    db.refresh(new_lead)

    return get_lead_details(new_lead.id, db)


@app.get("/api/leads/{lead_id}", response_model=schemas.LeadDetailResponse, tags=["Leads"])
def get_lead_details(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead with id {lead_id} not found.")

    summary = build_lead_summary(lead)
    discussions_res = [
        schemas.DiscussionResponse(
            id=d.id,
            lead_id=d.lead_id,
            note=d.note,
            follow_up_date=d.follow_up_date,
            ai_analysis=d.ai_analysis,
            created_at=d.created_at,
            time_ago=format_time_ago(d.created_at)
        )
        for d in lead.discussions
    ]

    return schemas.LeadDetailResponse(
        **summary.model_dump(),
        discussions=discussions_res
    )


@app.patch("/api/leads/{lead_id}/status", response_model=schemas.LeadSummaryResponse, tags=["Leads"])
def update_lead_status(lead_id: int, payload: schemas.LeadUpdateStatus, db: Session = Depends(get_db)):
    if payload.status not in schemas.VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{payload.status}'. Valid statuses: {schemas.VALID_STATUSES}"
        )

    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead with id {lead_id} not found.")

    lead.status = payload.status
    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)

    return build_lead_summary(lead)


@app.patch("/api/leads/{lead_id}", response_model=schemas.LeadDetailResponse, tags=["Leads"])
def update_lead(lead_id: int, payload: schemas.LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead with id {lead_id} not found.")

    if payload.name is not None:
        lead.name = payload.name.strip()
    if payload.company is not None:
        lead.company = payload.company.strip() if payload.company else None
    if payload.phone is not None:
        lead.phone = payload.phone.strip() if payload.phone else None
    if payload.status is not None:
        if payload.status not in schemas.VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")
        lead.status = payload.status
    if payload.follow_up_date is not None:
        lead.follow_up_date = payload.follow_up_date

    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)

    return get_lead_details(lead.id, db)


@app.post("/api/leads/{lead_id}/discussions", response_model=schemas.DiscussionResponse, status_code=status.HTTP_201_CREATED, tags=["Discussions"])
def add_discussion(lead_id: int, payload: schemas.DiscussionCreate, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead with id {lead_id} not found.")

    if not payload.note or not payload.note.strip():
        raise HTTPException(status_code=400, detail="Discussion note cannot be empty.")

    discussion = models.Discussion(
        lead_id=lead.id,
        note=payload.note.strip(),
        follow_up_date=payload.follow_up_date,
        ai_analysis=payload.ai_analysis
    )
    db.add(discussion)

    # Immediately reflect follow_up_date on the lead if provided
    if payload.follow_up_date is not None:
        lead.follow_up_date = payload.follow_up_date

    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(discussion)
    db.refresh(lead)

    return schemas.DiscussionResponse(
        id=discussion.id,
        lead_id=discussion.lead_id,
        note=discussion.note,
        follow_up_date=discussion.follow_up_date,
        ai_analysis=discussion.ai_analysis,
        created_at=discussion.created_at,
        time_ago=format_time_ago(discussion.created_at)
    )


@app.post("/api/ai/analyze-note", response_model=schemas.AIAnalyzeResponse, tags=["AI Reasoning"])
def analyze_note(payload: schemas.AIAnalyzeRequest):
    """
    Performs Chain-of-Thought reasoning on raw notes:
    Extracts financial topics, client sentiment, temporal follow-up dates,
    and fiduciary next best action with a verifiable reasoning trace.
    """
    return analyze_discussion_note(
        note=payload.note,
        lead_name=payload.lead_name,
        company=payload.company,
        current_status=payload.current_status
    )


@app.post("/api/seed", tags=["Seed"])
def run_seed_data(db: Session = Depends(get_db)):
    """Resets and seeds database with realistic financial advisory leads & discussions."""
    from seed import seed_database
    count = seed_database(db)
    return {"message": "Database successfully seeded.", "leads_created": count}


@app.delete("/api/leads/{lead_id}", tags=["Leads"])
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"message": f"Lead {lead_id} deleted"}
