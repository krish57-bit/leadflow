# 📈 LeadFlow — AI-Smart Wealth Advisor CRM

> A high-performance, single-screen Lead Management and Client Engagement CRM built for **Pravar AI**, tailored to enable wealth advisors to track prospects, log discussions with full chronological timelines, automate follow-up commitments, and leverage a **Chain-of-Thought AI Reasoning Architecture**.

---

## 🌟 Executive Summary & Problem Context

At **Pravar AI**, the mission is to re-imagine financial planning and wealth management—empowering advisors to deliver timely, fiduciary financial advice at scale and treat every customer as their top customer.

Traditional CRMs are static, cumbersome databases where sales notes get buried, action items are forgotten, and follow-ups fall through the cracks. **LeadFlow** solves this with a **single-screen, high-breathing-room command center**:
1. **Pinned Urgency**: Today's scheduled follow-ups are pinned prominently at the top with live alert badges. Overdue follow-ups are surfaced in urgent crimson styling.
2. **Reverse-Chronological Discussion Timeline**: Deep relationship context is maintained through an instant modal dialog where advisors log notes, set follow-up commitments, and update stages with immediate reactivity.
3. **AI Reasoning Architecture**: Ingests unstructured notes, resolves natural language temporal commitments (*"next Tuesday at 2pm"*), detects financial intents (*"tax-loss harvesting", "liquidity event"*), scores sentiment momentum, and provides an inspectable **fiduciary reasoning trace**.

---

## 🚀 Key Features & Assessment Requirements

### 1. Single-Screen Lead Management
- **Lead List**: Displays lead name, company, direct phone, status badge, excerpt of the last discussion note, and relative time since the last interaction (e.g. *“2 hours ago”*, *“2 days ago”*, *“3 weeks ago”*).
- **Today's Follow-ups Pinned (`🚀 TODAY'S FOLLOW-UPS`)**: Follow-up reminders scheduled for today are automatically pinned at the very top of the interface.
- **Overdue Highlighting (`⚠️ OVERDUE FOLLOW-UPS`)**: Scheduled follow-ups that passed without resolution are highlighted in high-visibility crimson cards with urgency badges.
- **Add New Lead Modal**: Clean modal with autofocus, input validation (Full Name required; Company, Phone, Initial Note optional; status defaults to `New`).

### 2. Interactive Lead Timeline Dialog
- **Modal View**: Clicking any lead immediately launches an interactive timeline modal without navigating to a new page.
- **Full Discussion History**: Discussions rendered in reverse chronological order with connected timeline markers, timestamps, relative time-ago, and associated follow-up badges.
- **Interactive Stage Management**: Status dropdown selector in the header (New, Contacted, Qualified, Proposal Sent, Won, Lost) that updates both database and parent list instantly.
- **Discussion Logger & Follow-up Scheduler**:
  - Textarea for logging meeting summaries or conversational bullets.
  - **✨ AI Reason & Extract**: Runs intelligent temporal resolution and fiduciary intent analysis on note text.
  - **Set Follow-up**: Checkbox toggles date and time pickers.
  - Immediate optimistic update: adding a note updates the timeline and parent lead list without a full page reload.

### 3. AI Reasoning Architecture (Pravar AI Differentiator)
- **Chain-of-Thought (CoT) Ingestion**: Decomposes natural language notes into structured metadata:
  - **Temporal Resolution**: Parses phrases like `"tomorrow at 2pm"`, `"next Tuesday at 10:30am"`, `"in 3 days"`, resolving them into ISO timestamps.
  - **Wealth Topic Identification**: Identifies financial planning topics (Portfolio Allocation, Tax-Exempt Municipal Bonds, Executive Liquidity, Retirement Drawdowns).
  - **Sentiment & Momentum**: Computes deal health (Positive / High Intent, Neutral / Exploratory, Hesitant / At Risk).
  - **Fiduciary Next-Best-Action**: Formulates recommended next steps for advisors.
  - **Inspectable Reasoning Trace**: Step-by-step audit trail (`[Perception] -> [Topic Modeling] -> [Temporal Resolution] -> [Sentiment] -> [Next Action]`).
- **Zero-Dependency Offline Fallback**: Works 100% out of the box without requiring external paid API keys. An optional LLM API key can be added to `.env` for extended analysis.

### 4. Bonus Features
- 🔍 **Real-Time Search**: Search leads by name, company, phone, or past discussion content (`⌘K` shortcut).
- 🏷️ **Multi-Status Filters**: Filter pills with live counts for all pipeline stages.
- 🐳 **Docker Compose**: Production-ready containerized deployment (`docker compose up --build`).
- 🌱 **Database Seed Script**: Pre-populated with realistic wireframe leads (Sarah Connor, Hank Scorpio, Bill Lumbergh, Bruce Wayne, Tony Stark, Elena Rostova).

---

## 🛠️ Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | **Next.js 14+ (App Router)** | High-performance React framework with server-ready routing and fast refresh |
| **Language** | **TypeScript** | Strict end-to-end type safety for lead models, discussions, and AI payloads |
| **Styling** | **Tailwind CSS** | Modern utility-first design system with ample breathing room, elevation, and badges |
| **Icons** | **Lucide React** | Clean, accessible iconography |
| **Backend** | **FastAPI (Python 3.10+)** | High-speed asynchronous Python framework with auto-generated OpenAPI docs |
| **Database** | **SQLite + SQLAlchemy ORM** | Lightweight, zero-config relational database with Pydantic v2 schemas |
| **AI Engine** | **CoT Temporal & Financial Reasoner** | Fiduciary rule and heuristic parser with step-by-step reasoning trace |
| **Testing** | **pytest + httpx** | Comprehensive automated test suite for endpoints, pinning, and AI reasoning |
| **Containers** | **Docker & Docker Compose** | Multi-container setup for standardized cross-platform evaluation |

---

## 🏁 Quickstart Guide

### Option 1: One-Command Docker Compose (Recommended)

Requires Docker Desktop installed and running.

```bash
# 1. Clone repository
git clone <your-repo-url>
cd leadflow

# 2. Start services with Docker Compose
docker compose up --build
```

- **Frontend**: Open [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend & Swagger Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Local Development Setup (Manual)

#### Prerequisites
- **Python 3.10+**
- **Node.js 18+** (Node 20 LTS recommended)

#### 1. Backend Setup (FastAPI)
```bash
# Navigate to project root
cd leadflow

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Seed the SQLite database with initial wireframe leads
PYTHONPATH=backend python backend/seed.py

# Start FastAPI backend server
cd backend
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs at `http://127.0.0.1:8000` (API docs at `http://127.0.0.1:8000/docs`).*

#### 2. Frontend Setup (Next.js)
Open a new terminal window:
```bash
cd leadflow/frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
*Frontend runs at `http://localhost:3000`.*

---

### Option 3: One-Command Local Script

On macOS/Linux, simply run:
```bash
./run_dev.sh
```

---

## 🧪 Automated Testing

LeadFlow includes comprehensive unit and integration tests covering API endpoints, lead pinning, status transitions, follow-up updates, and AI reasoning:

```bash
# Activate virtual environment
source .venv/bin/activate

# Run pytest suite
PYTHONPATH=backend pytest backend/tests/test_api.py -v
```

### Test Coverage Highlights:
- `test_health`: Verifies backend service health check.
- `test_get_leads_pinned_today`: Validates that today's follow-ups (Sarah Connor) are prioritized with priority 0.
- `test_filter_by_status`: Ensures stage filtering (`Won`, `New`, etc.) returns exact subsets.
- `test_search_by_name_and_note`: Validates search across lead names, companies, and historical discussion text.
- `test_create_lead`: Verifies lead creation with default status `New` and initial discussion notes.
- `test_update_status`: Verifies stage updates persist immediately.
- `test_add_discussion_updates_follow_up`: Asserts that saving a discussion with a follow-up date updates the lead's follow-up immediately.
- `test_ai_reasoning_endpoint`: Verifies temporal extraction ("next Tuesday at 3pm"), topic modeling, and reasoning traces.

---

## 📡 API Reference

Interactive Swagger documentation is available at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/leads` | List all leads with computed follow-up status, relative time, and pinning. Supports `?status=`, `?search=`, `?follow_up_filter=` |
| `POST` | `/api/leads` | Create a new lead (Name required; company, phone, initial note optional) |
| `GET` | `/api/leads/{id}` | Get lead details and full reverse-chronological discussion history |
| `PATCH` | `/api/leads/{id}/status` | Update lead status (`New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`) |
| `PATCH` | `/api/leads/{id}` | General lead update (name, company, phone, follow-up date) |
| `POST` | `/api/leads/{id}/discussions` | Add a discussion note and update lead follow-up date |
| `POST` | `/api/ai/analyze-note` | Chain-of-Thought AI reasoning pipeline for raw note analysis |
| `POST` | `/api/seed` | Reset and re-seed database with realistic advisor scenarios |
| `DELETE` | `/api/leads/{id}` | Delete a lead |

---

## 🎥 Video & Screenshot Walkthrough Guide

When recording your submission walkthrough or taking screenshots, follow this 4-step flow:

1. **Main Screen Overview**:
   - Point out **LeadFlow** branding with Pravar AI advisor context.
   - Show `🚀 TODAY'S FOLLOW-UPS` pinned at the top with Sarah Connor (`🔔 Follow-up today at 2:00 PM`).
   - Show `⚠️ OVERDUE FOLLOW-UPS` highlighted in red with Tony Stark.
   - Show `ALL LEADS` with relative times (*"2 hours ago"*, *"1 week ago"*).
2. **Search & Filters**:
   - Filter by status (`Contacted`, `Won`).
   - Use search input (`⌘K`) to search *"pricing"* or *"voicemail"* and show instant reactive results.
3. **Lead Timeline Dialog & AI Reasoning**:
   - Click Sarah Connor to open the timeline modal.
   - Demonstrate the reverse chronological discussion cards with follow-up markers.
   - Type in the discussion box: *"Reviewed portfolio proposal. Wants to review tax-exempt municipal bonds next Tuesday at 3pm."*
   - Click **"✨ AI Reason & Extract"**: show the auto-detected follow-up date, sentiment pill, and collapsible Fiduciary Reasoning Trace!
   - Click **"Save Note"**: demonstrate that the note appears at the top and Sarah's follow-up date updates immediately.
   - Change her status to `Won`: show it persists and reflects immediately on the main dashboard.
4. **Add New Lead**:
   - Click `+ Add New Lead` (or press `N`).
   - Enter *"Natasha Romanoff"*, Company *"Black Widow Capital"*, Phone *"555-0999"*.
   - Submit and verify she appears instantly in the `New` leads section.

---

## 📂 Project Structure

```
leadflow/
├── backend/
│   ├── ai_engine.py           # Chain-of-Thought reasoning & temporal date parser
│   ├── database.py            # SQLite & SQLAlchemy engine setup
│   ├── Dockerfile             # FastAPI backend container configuration
│   ├── main.py                # FastAPI endpoints, CORS, sorting & pinning logic
│   ├── models.py              # SQLAlchemy Lead and Discussion models
│   ├── requirements.txt       # Python dependencies
│   ├── schemas.py             # Pydantic v2 validation models
│   ├── seed.py                # Database seed script with 6 realistic wealth leads
│   └── tests/
│       └── test_api.py        # Automated pytest suite (8 test cases)
├── frontend/
│   ├── Dockerfile             # Next.js multi-stage build container
│   ├── next.config.mjs        # Next.js configuration and API rewrites
│   ├── package.json           # Frontend dependencies (React, Tailwind, Lucide)
│   ├── postcss.config.js      # PostCSS config
│   ├── tailwind.config.ts     # Tailwind theme & color tokens
│   ├── tsconfig.json          # TypeScript configuration
│   └── src/
│       ├── app/
│       │   ├── globals.css    # Global Tailwind styles
│       │   ├── layout.tsx     # Root HTML layout with Inter font
│       │   └── page.tsx       # Main single-screen LeadFlow dashboard
│       ├── components/
│       │   ├── AddLeadModal.tsx       # Modal for creating new leads
│       │   ├── AIAdvisorDossier.tsx   # AI reasoning display & trace
│       │   ├── FilterBar.tsx          # Status filter pills & live search (⌘K)
│       │   ├── LeadCard.tsx           # Lead card with badges & time-ago
│       │   ├── LeadTimelineModal.tsx  # Interactive dialog with timeline & note form
│       │   └── StatusBadge.tsx        # Color-coded pipeline stage badge
│       ├── lib/
│       │   └── api.ts                 # Strongly-typed API client
│       └── types/
│           └── index.ts               # Core TypeScript definitions
├── .env.example               # Example environment variable template
├── .gitignore                 # Git ignore rules
├── docker-compose.yml         # Multi-service container orchestration
├── README.md                  # Comprehensive documentation
└── run_dev.sh                 # Local development launcher
```

---

## 📄 License & Attribution

Submitted for the **AI-smart Fullstack Intern** coding assessment at **Pravar AI**. Developed with focus on clean software architecture, fiduciary domain reasoning, and human-centered design.
