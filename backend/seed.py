from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
import json

def seed_database(db: Session = None) -> int:
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # Clear existing data
        db.query(models.Discussion).delete()
        db.query(models.Lead).delete()
        db.commit()

        now = datetime.utcnow()
        # Today at 2:00 PM
        today_2pm = now.replace(hour=14, minute=0, second=0, microsecond=0)
        # Overdue (2 days ago at 11:00 AM)
        overdue_date = (now - timedelta(days=2)).replace(hour=11, minute=0, second=0, microsecond=0)
        # Upcoming (5 days from now at 10:00 AM)
        upcoming_date = (now + timedelta(days=5)).replace(hour=10, minute=0, second=0, microsecond=0)

        seed_leads = [
            {
                "name": "Sarah Connor",
                "company": "Acme Corp",
                "phone": "565-0199",
                "status": "Proposal Sent",
                "follow_up_date": today_2pm,
                "discussions": [
                    {
                        "note": "Lead created via web form.",
                        "created_at": now - timedelta(days=6),
                        "follow_up_date": None
                    },
                    {
                        "note": "Initial discovery call. They need a CRM for 50 reps. Pain points include dropping leads and no follow-up tracking.",
                        "created_at": now - timedelta(days=5),
                        "follow_up_date": None
                    },
                    {
                        "note": "Sent pricing tier PDF. Said she would review with her boss.",
                        "created_at": now - timedelta(days=2),
                        "follow_up_date": today_2pm,
                        "ai_analysis": json.dumps({
                            "detected_intent": "Fee Schedule & Advisory Mandate Review",
                            "sentiment": "Positive (High Intent)",
                            "financial_topics": ["Advisory Fee Structure & Mandate Terms", "Portfolio Allocation & Risk Profiling"],
                            "next_best_action": "Follow up on pricing tier PDF review; address executive committee inquiries.",
                            "recommended_status": "Proposal Sent"
                        })
                    }
                ]
            },
            {
                "name": "Hank Scorpio",
                "company": "Globex",
                "phone": "555-0144",
                "status": "New",
                "follow_up_date": None,
                "discussions": [
                    {
                        "note": "Inbound lead from website contact form.",
                        "created_at": now - timedelta(hours=2),
                        "follow_up_date": None
                    }
                ]
            },
            {
                "name": "Bill Lumbergh",
                "company": "Initech",
                "phone": "555-0177",
                "status": "Contacted",
                "follow_up_date": None,
                "discussions": [
                    {
                        "note": "Inbound inquiry regarding wealth management preservation strategies.",
                        "created_at": now - timedelta(days=10),
                        "follow_up_date": None
                    },
                    {
                        "note": "Left a voicemail with his assistant.",
                        "created_at": now - timedelta(days=7),
                        "follow_up_date": None
                    }
                ]
            },
            {
                "name": "Bruce Wayne",
                "company": "Wayne Ent",
                "phone": "555-0199",
                "status": "Won",
                "follow_up_date": None,
                "discussions": [
                    {
                        "note": "Comprehensive family office and trust structuring review.",
                        "created_at": now - timedelta(weeks=4),
                        "follow_up_date": None
                    },
                    {
                        "note": "Contract signed! Sending welcome package.",
                        "created_at": now - timedelta(weeks=3),
                        "follow_up_date": None,
                        "ai_analysis": json.dumps({
                            "detected_intent": "Mandate Closure & Custodial Onboarding",
                            "sentiment": "Positive (High Intent)",
                            "financial_topics": ["Retirement Readiness & Trust Structuring", "Portfolio Allocation & Risk Profiling"],
                            "next_best_action": "Initiate custodial paperwork and schedule onboarding review.",
                            "recommended_status": "Won"
                        })
                    }
                ]
            },
            {
                "name": "Tony Stark",
                "company": "Stark Industries",
                "phone": "555-0188",
                "status": "Qualified",
                "follow_up_date": overdue_date,
                "discussions": [
                    {
                        "note": "Inquired about executive stock options and private equity liquidity strategy.",
                        "created_at": now - timedelta(days=4),
                        "follow_up_date": None
                    },
                    {
                        "note": "Completed wealth suitability questionnaire. Requested municipal bond tax shield proposal.",
                        "created_at": now - timedelta(days=2),
                        "follow_up_date": overdue_date,
                        "ai_analysis": json.dumps({
                            "detected_intent": "Tax Optimization Strategy",
                            "sentiment": "Positive (High Intent)",
                            "financial_topics": ["Tax-Advantaged Planning & Municipal Bonds", "Executive Liquidity & Stock Option Advisory"],
                            "next_best_action": "Generate customized municipal bond tax-equivalent yield comparison deck.",
                            "recommended_status": "Qualified"
                        })
                    }
                ]
            },
            {
                "name": "Elena Rostova",
                "company": "Horizon Capital",
                "phone": "555-0211",
                "status": "Contacted",
                "follow_up_date": upcoming_date,
                "discussions": [
                    {
                        "note": "Met at wealth summit. Discussed hedging downside volatility for corporate treasury.",
                        "created_at": now - timedelta(days=1),
                        "follow_up_date": upcoming_date,
                        "ai_analysis": json.dumps({
                            "detected_intent": "Exploratory Wealth Advisory Discovery",
                            "sentiment": "Neutral / Exploratory",
                            "financial_topics": ["Portfolio Allocation & Risk Profiling"],
                            "next_best_action": "Prepare follow-up agenda covering asset allocation goals.",
                            "recommended_status": "Contacted"
                        })
                    }
                ]
            }
        ]

        count = 0
        for item in seed_leads:
            lead = models.Lead(
                name=item["name"],
                company=item["company"],
                phone=item["phone"],
                status=item["status"],
                follow_up_date=item["follow_up_date"],
                created_at=item["discussions"][0]["created_at"]
            )
            db.add(lead)
            db.commit()
            db.refresh(lead)

            for d in item["discussions"]:
                disc = models.Discussion(
                    lead_id=lead.id,
                    note=d["note"],
                    activity_type=d.get("activity_type", "note"),
                    follow_up_date=d.get("follow_up_date"),
                    ai_analysis=d.get("ai_analysis"),
                    created_at=d["created_at"]
                )
                db.add(disc)

            lead.updated_at = item["discussions"][-1]["created_at"]
            db.commit()
            count += 1

        print(f"Successfully seeded {count} leads with discussion histories.")
        return count
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_database()
