import re
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from schemas import AIAnalyzeResponse


DAYS_MAP = {
    "monday": 0, "mon": 0,
    "tuesday": 1, "tue": 1,
    "wednesday": 2, "wed": 2,
    "thursday": 3, "thu": 3,
    "friday": 4, "fri": 4,
    "saturday": 5, "sat": 5,
    "sunday": 6, "sun": 6
}


def parse_time_component(text: str, default_hour: int = 14, default_minute: int = 0) -> Tuple[int, int]:
    """Extract hour and minute from text like '2pm', '2:30 pm', '10am', '14:00'."""
    time_match = re.search(r'(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b', text, re.IGNORECASE)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0
        meridiem = time_match.group(3)
        if meridiem:
            meridiem = meridiem.lower()
            if meridiem == 'pm' and hour < 12:
                hour += 12
            elif meridiem == 'am' and hour == 12:
                hour = 0
        return hour, minute
    return default_hour, default_minute


def resolve_temporal_followup(text: str, reference_time: Optional[datetime] = None) -> Tuple[Optional[datetime], Optional[str]]:
    """
    Parses conversational time expressions into actionable future datetimes.
    Supports:
      - 'today at 2pm'
      - 'tomorrow at 10:30am'
      - 'next Tuesday at 2pm', 'this Friday at 4pm', 'on Monday'
      - 'in 2 days', 'in 3 days at 3pm'
      - 'next week', 'end of week'
    """
    if not reference_time:
        reference_time = datetime.now()

    text_lower = text.lower()
    hour, minute = parse_time_component(text_lower, default_hour=14, default_minute=0)

    # 1. "today"
    if "today" in text_lower:
        target = reference_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
        display = f"Today at {target.strftime('%I:%M %p').lstrip('0')}"
        return target, display

    # 2. "tomorrow"
    if "tomorrow" in text_lower:
        target = reference_time + timedelta(days=1)
        target = target.replace(hour=hour, minute=minute, second=0, microsecond=0)
        display = f"Tomorrow at {target.strftime('%I:%M %p').lstrip('0')}"
        return target, display

    # 3. "in X days"
    days_match = re.search(r'in\s+(\d+)\s+days?', text_lower)
    if days_match:
        days_offset = int(days_match.group(1))
        target = reference_time + timedelta(days=days_offset)
        target = target.replace(hour=hour, minute=minute, second=0, microsecond=0)
        display = f"In {days_offset} days ({target.strftime('%b %d')} at {target.strftime('%I:%M %p').lstrip('0')})"
        return target, display

    # 4. "next week"
    if "next week" in text_lower:
        target = reference_time + timedelta(days=7)
        target = target.replace(hour=hour, minute=minute, second=0, microsecond=0)
        display = f"Next week ({target.strftime('%b %d')} at {target.strftime('%I:%M %p').lstrip('0')})"
        return target, display

    # 5. Day of week (e.g. "next Tuesday", "on Friday", "this Thursday")
    for day_name, day_idx in DAYS_MAP.items():
        pattern = rf'\b(?:next\s+|this\s+|on\s+)?{day_name}\b'
        if re.search(pattern, text_lower):
            current_day_idx = reference_time.weekday()
            days_ahead = (day_idx - current_day_idx) % 7
            if days_ahead == 0 or "next" in text_lower:
                days_ahead += 7
            target = reference_time + timedelta(days=days_ahead)
            target = target.replace(hour=hour, minute=minute, second=0, microsecond=0)
            capitalized_day = day_name.capitalize()
            display = f"{capitalized_day}, {target.strftime('%b %d')} at {target.strftime('%I:%M %p').lstrip('0')}"
            return target, display

    return None, None


def analyze_discussion_note(
    note: str,
    lead_name: Optional[str] = None,
    company: Optional[str] = None,
    current_status: Optional[str] = None
) -> AIAnalyzeResponse:
    """
    Reasoning pipeline for wealth management client interactions.
    Decomposes notes into:
      1. Temporal commitments (follow-up date/time)
      2. Key financial themes & client lifecycle events
      3. Client sentiment & deal momentum
      4. Fiduciary next-best-action recommendation
      5. Pipeline status transition suggestion
      6. Verifiable Chain-of-Thought reasoning trace
    """
    cleaned_note = note.strip()
    note_lower = cleaned_note.lower()

    # 1. Temporal follow-up parsing
    target_dt, dt_display = resolve_temporal_followup(cleaned_note)
    iso_date = target_dt.isoformat() if target_dt else None

    # 2. Financial intent & topic detection
    topics = []
    if any(k in note_lower for k in ["tax", "muni", "municipal", "harvesting", "ira", "roth"]):
        topics.append("Tax-Advantaged Planning & Municipal Bonds")
    if any(k in note_lower for k in ["portfolio", "allocation", "yield", "volatility", "risk", "equity", "fixed income"]):
        topics.append("Portfolio Allocation & Risk Profiling")
    if any(k in note_lower for k in ["ipo", "options", "stock options", "equity grant", "liquidity", "founder"]):
        topics.append("Executive Liquidity & Stock Option Advisory")
    if any(k in note_lower for k in ["retire", "retirement", "drawdown", "pension", "401k", "estate", "trust"]):
        topics.append("Retirement Readiness & Trust Structuring")
    if any(k in note_lower for k in ["pricing", "fee", "bps", "contract", "proposal", "agreement", "tier"]):
        topics.append("Advisory Fee Structure & Mandate Terms")

    if not topics:
        topics.append("General Advisory Discovery & Relationship Building")

    # 3. Sentiment & Momentum
    positive_cues = [
        "ready", "love", "loves", "loved", "liked", "signed", "commit", "committed",
        "review with boss", "excited", "great meeting", "send proposal", "positive",
        "impressed", "agreed", "moving forward", "approved"
    ]
    negative_cues = [
        "push back", "hesitant", "concern", "concerned", "competitor", "expensive",
        "not interested", "delay", "declined", "unresponsive", "cancelled"
    ]

    pos_score = sum(1 for c in positive_cues if c in note_lower)
    neg_score = sum(1 for c in negative_cues if c in note_lower)

    if pos_score > neg_score:
        sentiment = "Positive (High Intent)"
    elif neg_score > pos_score:
        sentiment = "Hesitant / At Risk"
    else:
        sentiment = "Neutral / Exploratory"

    # 4. Status Transition Recommendation
    recommended_status = current_status
    if any(k in note_lower for k in ["signed", "onboarded", "contract closed", "funds transferred", "mandate won"]):
        recommended_status = "Won"
    elif any(k in note_lower for k in ["pricing tier", "sent proposal", "sent pitch", "fee schedule sent", "proposal pdf"]):
        recommended_status = "Proposal Sent"
    elif any(k in note_lower for k in ["qualified", "aum meets", "needs wealth management", "accredited", "budget confirmed"]):
        recommended_status = "Qualified"
    elif any(k in note_lower for k in ["not interested", "declined", "went with competitor", "unresponsive"]):
        recommended_status = "Lost"
    elif current_status == "New" and len(cleaned_note) > 10:
        recommended_status = "Contacted"

    # 5. Detected Primary Intent & Next Best Action
    client_ref = lead_name or "the client"
    firm_ref = f" at {company}" if company else ""

    if "Won" == recommended_status:
        detected_intent = "Mandate Closure & Custodial Onboarding"
        next_action = f"Initiate custodial paperwork and schedule kickoff onboarding review with {client_ref}{firm_ref}."
    elif "Proposal Sent" == recommended_status or "pricing" in note_lower:
        detected_intent = "Fee Schedule & Advisory Mandate Review"
        follow_str = f" for {dt_display}" if dt_display else " before target deadline"
        next_action = f"Follow up on pricing tier PDF review{follow_str}; address executive committee or spouse inquiries."
    elif any(k in note_lower for k in ["muni", "tax", "bond"]):
        detected_intent = "Tax Optimization Strategy"
        next_action = f"Generate customized municipal bond tax-equivalent yield comparison deck for {client_ref}."
    elif any(k in note_lower for k in ["liquidity", "ipo", "option"]):
        detected_intent = "Pre-Liquidity Wealth Preservation"
        next_action = f"Draft 10b5-1 pre-scheduled trading plan overview and multi-scenario liquidity model for {client_ref}."
    else:
        detected_intent = "Exploratory Wealth Advisory Discovery"
        next_action = f"Prepare follow-up agenda covering asset allocation goals and schedule 30-min strategy session."

    # 6. Chain-of-Thought Reasoning Trace
    reasoning_trace = [
        f"Step 1 [Perception]: Ingested discussion context for {client_ref}{firm_ref}.",
        f"Step 2 [Topic Modeling]: Extracted primary wealth management themes: {', '.join(topics)}.",
        f"Step 3 [Temporal Resolution]: {'Detected relative commitment ' + repr(dt_display) + ' -> resolved ISO: ' + str(iso_date) if dt_display else 'No explicit temporal expression detected; manual follow-up scheduling recommended.'}",
        f"Step 4 [Sentiment Evaluation]: Identified client sentiment as {sentiment} (positive cues: {pos_score}, hesitation cues: {neg_score}).",
        f"Step 5 [Fiduciary Action Synthesis]: Formulated next best action: '{next_action}'.",
        f"Step 6 [Lifecycle Transition]: Recommended pipeline stage transition '{current_status or 'New'} -> {recommended_status}' based on mandate milestones."
    ]

    return AIAnalyzeResponse(
        detected_intent=detected_intent,
        sentiment=sentiment,
        financial_topics=topics,
        suggested_follow_up_date=iso_date,
        suggested_follow_up_display=dt_display,
        next_best_action=next_action,
        recommended_status=recommended_status,
        reasoning_trace=reasoning_trace
    )
