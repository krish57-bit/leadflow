from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    status = Column(String(50), default="New", nullable=False, index=True)
    follow_up_date = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    discussions = relationship(
        "Discussion",
        back_populates="lead",
        cascade="all, delete-orphan",
        order_by="desc(Discussion.created_at)"
    )


class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    note = Column(Text, nullable=False)
    activity_type = Column(String(50), default="note", nullable=False)  # "call", "meeting", "proposal", "note", "inbound"
    follow_up_date = Column(DateTime, nullable=True)
    ai_analysis = Column(Text, nullable=True)  # Stores JSON serialized AI reasoning & insights
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    lead = relationship("Lead", back_populates="discussions")
