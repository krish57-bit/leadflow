import os
import sys
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Use in-memory SQLite with StaticPool for test isolation
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

from database import Base, get_db
from main import app
import models
from seed import seed_database


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=test_engine)

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_get_leads_pinned_today():
    res = client.get("/api/leads")
    assert res.status_code == 200
    leads = res.json()
    assert len(leads) >= 5

    # Sarah Connor has follow_up_date = today at 2:00 PM -> must be first item
    first_lead = leads[0]
    assert first_lead["name"] == "Sarah Connor"
    assert first_lead["follow_up_status"] == "today"

    # Tony Stark has follow_up_date = 2 days ago -> must be overdue
    overdue_lead = next(l for l in leads if l["name"] == "Tony Stark")
    assert overdue_lead["follow_up_status"] == "overdue"


def test_filter_by_status():
    res = client.get("/api/leads?status=Won")
    assert res.status_code == 200
    leads = res.json()
    assert len(leads) == 1
    assert leads[0]["name"] == "Bruce Wayne"
    assert leads[0]["status"] == "Won"


def test_search_by_name_and_note():
    # Search by name
    res = client.get("/api/leads?search=Bruce")
    assert res.status_code == 200
    leads = res.json()
    assert len(leads) == 1
    assert leads[0]["name"] == "Bruce Wayne"

    # Search by note content
    res = client.get("/api/leads?search=voicemail")
    assert res.status_code == 200
    leads = res.json()
    assert len(leads) == 1
    assert leads[0]["name"] == "Bill Lumbergh"


def test_create_lead():
    payload = {
        "name": "Pepper Potts",
        "company": "Stark Industries",
        "phone": "555-9988",
        "initial_note": "Interested in ESG tax strategy."
    }
    res = client.post("/api/leads", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Pepper Potts"
    assert data["status"] == "New"
    assert len(data["discussions"]) == 1
    assert data["discussions"][0]["note"] == "Interested in ESG tax strategy."


def test_update_status():
    # Find Hank Scorpio (Status: New)
    leads = client.get("/api/leads?status=New").json()
    hank = leads[0]
    lead_id = hank["id"]

    res = client.patch(f"/api/leads/{lead_id}/status", json={"status": "Contacted"})
    assert res.status_code == 200
    assert res.json()["status"] == "Contacted"

    # Verify persistence
    lead_detail = client.get(f"/api/leads/{lead_id}").json()
    assert lead_detail["status"] == "Contacted"


def test_add_discussion_updates_follow_up():
    leads = client.get("/api/leads").json()
    bill = next(l for l in leads if l["name"] == "Bill Lumbergh")
    lead_id = bill["id"]

    future_dt = (datetime.utcnow() + timedelta(days=3)).replace(hour=15, minute=0, second=0, microsecond=0)
    future_str = future_dt.isoformat()

    payload = {
        "note": "Spoke on phone. Bill agreed to review portfolio allocation proposal on Friday.",
        "follow_up_date": future_str
    }
    res = client.post(f"/api/leads/{lead_id}/discussions", json=payload)
    assert res.status_code == 201
    disc = res.json()
    assert disc["note"] == payload["note"]

    # Verify lead's follow_up_date was updated immediately
    updated_lead = client.get(f"/api/leads/{lead_id}").json()
    assert updated_lead["follow_up_status"] == "upcoming"
    assert updated_lead["discussions"][0]["note"] == payload["note"]


def test_ai_reasoning_endpoint():
    payload = {
        "note": "Client Sarah loved our proposal. Wants to review municipal bond tax yields next Tuesday at 3pm.",
        "lead_name": "Sarah Connor",
        "company": "Acme Corp",
        "current_status": "Contacted"
    }
    res = client.post("/api/ai/analyze-note", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "Tax-Advantaged Planning & Municipal Bonds" in data["financial_topics"]
    assert "Positive" in data["sentiment"]
    assert data["suggested_follow_up_date"] is not None
    assert "Tuesday" in data["suggested_follow_up_display"]
    assert len(data["reasoning_trace"]) >= 5
