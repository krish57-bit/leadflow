# 📈 LeadFlow — AI-Augmented Wealth Advisor CRM

> An enterprise-grade, single-screen Client Engagement and Lead Management CRM engineered for **Pravar AI**, empowering wealth advisors to track prospects, maintain rich chronological interaction timelines, automate fiduciary follow-up commitments, and leverage a **Chain-of-Thought AI Reasoning Architecture**.

---

## 🌟 Executive Summary & Architectural Motivation

In modern wealth management and financial planning, an advisor's primary constraint is cognitive bandwidth. High-net-worth relationships require meticulous follow-up, contextual memory of lifecycle events (e.g., liquidity events, retirement milestones, tax obligations), and prompt engagement. Traditional enterprise CRMs fail advisors because they function as passive, siloed data repositories requiring high-friction manual data entry.

**LeadFlow** is designed from first principles as an **active advisory cockpit**:
1. **Urgency-Driven Single-Screen Layout**: Pinned real-time tracking of today's scheduled follow-ups and high-visibility crimson alerts for overdue commitments.
2. **Context-Preserving Chronological Timeline**: Deep relationship history presented in reverse chronological order with interactive pipeline stage progression.
3. **Chain-of-Thought (CoT) Advisory AI**: Natural language parsing of conversational notes to extract temporal commitments, financial topics, client sentiment, and fiduciary next-best-actions with an inspectable reasoning trace.

---

## 🐟 Root-Cause Analysis: The Advisory CRM Problem Space (Ishikawa / Fishbone Model)

To understand why conventional CRMs degrade advisor efficiency and client conversion, LeadFlow applies an Ishikawa Cause-and-Effect framework:

```
                    ADVISORY CRM LEAD DROP-OFF & CONVERSION LEAKAGE
 ┌─────────────────────────┐               ┌─────────────────────────┐
 │   ADVISOR INTERACTION   │               │    DATA & INTEGRATION   │
 └────────────┬────────────┘               └────────────┬────────────┘
              │                                         │
  Manual Data Friction                     Unstructured Note Graveyards
         \                                         \
          \── Disjointed Form Fields                \── Missing Semantic Context
           \                                         \
            \── Manual Date Pickers                   \── No Fiduciary Trace
             │                                         │
─────────────┴─────────────────────────────────────────┴──────────────► [CLIENT CHURN &
             ┬─────────────────────────────────────────┬──────────────►  MISSED REVENUE]
             │                                         │
            /── Uncalibrated Contact Timing           /── Hidden Lead Details
           /                                         /
          /── Forgotten Deadlines                   /── Cluttered Navigation
         /                                         /
  Timing Blindspots                        Cognitive Overload
 ┌────────────┴────────────┐               ┌────────────┴────────────┐
 │    TIMING & CADENCE     │               │    UI / ARCHITECTURE    │
 └─────────────────────────┘               └─────────────────────────┘
```

### LeadFlow Structural Countermeasures

| Dimension | Root Cause in Legacy CRMs | LeadFlow Architectural Solution |
|---|---|---|
| **Interaction** | Manual form entry and date selection fatigue | 1-Click Follow-up presets (`+ Tomorrow 10 AM`, `+ In 2 Days`) & AI date detection |
| **Data & Intel** | Notes buried as plain text without semantic meaning | Chain-of-Thought topic modeling (Bonds, Taxes, Liquidity) and sentiment scoring |
| **Timing** | Advisors miss critical follow-up windows | Pinned `Today's Follow-ups` section with priority 0 sorting and Zia-style Best-Time suggestions |
| **Architecture** | Deep navigation hierarchies and page redirects | Single-screen reactive hub with slide-over timeline dialog and optimistic updates |

---

## 📐 System Architecture & Data Flow

```
                                      +---------------------------------------------+
                                      |         Next.js 14 Single-Screen UI         |
                                      |   (React 18, TypeScript, Tailwind CSS)      |
                                      +----------------------+----------------------+
                                                             |
                                      REST API (JSON / HTTP) | Port 8000
                                                             v
                                      +---------------------------------------------+
                                      |            FastAPI Python Backend           |
                                      |         (Pydantic v2, Uvicorn ASGI)         |
                                      +----------------------+----------------------+
                                                             |
                        +------------------------------------+------------------------------------+
                        |                                                                         |
                        v                                                                         v
      +-----------------------------------+                                     +-----------------------------------+
      |      AI Reasoning Pipeline        |                                     |         Persistence Layer         |
      |   (Chain-of-Thought Engine)       |                                     |    (SQLAlchemy ORM + SQLite)      |
      +-----------------+-----------------+                                     +-----------------+-----------------+
                        |                                                                         |
                        |-- Temporal Resolver (Regex & Date Parser)                               |-- Leads Table
                        |-- Wealth Management Topic Classifier                                    |-- Discussions Table
                        |-- Client Sentiment & Momentum Evaluator                                 |-- Activity Logs
                        \-- Fiduciary Reasoning Trace Generator                                   \-- Pinned Indexing
```

---

## 🚀 Core Functional Capabilities

### 1. Single-Screen Command Center
- **Lead Overview**: Displays full client name, firm/company affiliation, contact phone, status badge, excerpt of the most recent discussion note, and relative time elapsed (`time_ago`).
- **Priority-Pinned Today's Follow-ups (`🚀 TODAY'S FOLLOW-UPS`)**: Automatically isolates and pins follow-ups scheduled for the current date with high-visibility urgency badges and real-time pulse indicators.
- **Overdue Attention Flagging (`⚠️ OVERDUE FOLLOW-UPS`)**: Highlights missed commitments in distinct crimson cards with days-overdue indicators.
- **Executive KPI Signals Strip**: Top-level metric cards providing immediate visibility into Total Pipeline, Follow-ups Due Today, Overdue Items, and Mandates Won with real-time conversion rates.

### 2. Contextual Lead Timeline Dialog
- **Modal Viewport**: Opens immediately upon selecting any lead, preserving page state without navigation overhead.
- **Reverse-Chronological Discussion History**: Chronological feed connected via a vertical rail, showing relative time stamps, formatted calendar dates, and activity categorization (`📞 Phone Call`, `🤝 Discovery Meeting`, `📑 Proposal`, `📝 Note`).
- **Interactive Pipeline Stage Progression Chevrons**: Visual pipeline tracker (`New` $\rightarrow$ `Contacted` $\rightarrow$ `Qualified` $\rightarrow$ `Proposal Sent` $\rightarrow$ `Won`) allowing single-click stage updates with immediate backend persistence.
- **Discussion Logger & Scheduling**:
  - Textarea supporting natural language entry.
  - **✨ AI Reason & Extract**: Automatically extracts dates, topics, and actions from raw notes.
  - **1-Click Follow-Up Presets**: Quick chips (`+ Tomorrow 10 AM`, `+ In 2 Days 2 PM`, `+ Next Week`) eliminating manual calendar input.
  - **Optimistic State Synchronization**: Parent dashboard updates immediately upon saving.

### 3. Fiduciary AI Reasoning Architecture
- **Chain-of-Thought (CoT) Ingestion**: Structured decomposition of conversational notes:
  - **Temporal Extraction**: Converts natural language phrases (e.g., *"tomorrow at 2pm"*, *"next Tuesday at 3pm"*, *"in 3 days"*) into standardized ISO 8601 timestamps.
  - **Financial Intent Recognition**: Detects domain-specific advisory categories (Municipal Bonds, Tax-Advantaged Planning, Executive Stock Options, Retirement Drawdowns).
  - **Sentiment & Deal Health**: Evaluates conversational sentiment (Positive / High Intent, Neutral / Exploratory, Hesitant / At Risk).
  - **Verifiable Fiduciary Trace**: Provides an inspectable audit trail explaining *why* an action or stage transition was recommended.
- **Zero-Dependency Fallback**: Fully functional offline without requiring external paid API keys; seamlessly accepts OpenAI / Gemini API keys via `.env` for LLM inference.

### 4. Search & Multi-Criteria Filtering
- **Live Search**: Instant client filtering across client names, company names, phone numbers, and past discussion text (`⌘K` shortcut).
- **Stage & Cadence Filters**: Status pills (`All`, `New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`) with dynamic count badges and follow-up cadence chips.

---

## 🛠️ Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | **Next.js 14+ (App Router)** | Server-rendered React framework providing optimal performance and modular component boundaries |
| **Language** | **TypeScript** | Strict compile-time typing for domain models, API contracts, and UI state |
| **Design System** | **Tailwind CSS** | Utility-first styling enabling precise typography, elevation, and responsive layouts |
| **Iconography** | **Lucide React** | Accessible, consistent enterprise icon system |
| **Backend Framework** | **FastAPI (Python 3.10+)** | High-throughput asynchronous ASGI web framework with native Pydantic validation |
| **Database & ORM** | **SQLite + SQLAlchemy ORM** | Lightweight relational engine with zero external daemon requirements and full ACID compliance |
| **Testing** | **pytest + HTTPX** | Automated test harness validating API endpoints, sorting logic, and AI extraction |
| **Containerization** | **Docker & Docker Compose** | Reproducible multi-container deployment architecture |

---

## 🏁 Deployment & Setup Guide

### Method 1: Containerized Deployment via Docker Compose (Recommended)

Requires Docker Desktop installed and running.

```bash
# Clone repository
git clone https://github.com/krish57-bit/leadflow.git
cd leadflow

# Launch services
docker compose up --build
```

- **Frontend Client**: Access at [http://localhost:3000](http://localhost:3000)
- **FastAPI OpenAPI Swagger Documentation**: Access at [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Method 2: Local Development Environment

#### Prerequisites
- **Python 3.10+**
- **Node.js 18+** (Node 20 LTS recommended)

#### 1. Backend Service Configuration
```bash
cd leadflow

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Seed database with initial wireframe dataset
PYTHONPATH=backend python backend/seed.py

# Launch FastAPI ASGI server
cd backend
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API service available at `http://127.0.0.1:8000`.*

#### 2. Frontend Application Configuration
Open a secondary terminal:
```bash
cd leadflow/frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
*Frontend application available at `http://localhost:3000`.*

---

### Method 3: Unified Local Script

On POSIX-compliant systems (macOS / Linux):
```bash
chmod +x run_dev.sh
./run_dev.sh
```

---

## 🧪 Automated Testing & Verification

LeadFlow features an automated test suite executed via `pytest`, verifying data integrity, priority pinning, stage persistence, and AI extraction:

```bash
cd leadflow
source .venv/bin/activate
PYTHONPATH=backend pytest backend/tests/test_api.py -v
```

### Verification Matrix
- `test_health`: Asserts backend service readiness.
- `test_get_leads_pinned_today`: Validates priority 0 sorting for today's follow-up commitments.
- `test_filter_by_status`: Confirms pipeline stage filtering accuracy.
- `test_search_by_name_and_note`: Validates search across entity names and nested discussion notes.
- `test_create_lead`: Verifies initial entity validation and default stage allocation.
- `test_update_status`: Tests state persistence of stage updates.
- `test_add_discussion_updates_follow_up`: Verifies that logging discussions synchronizes lead follow-up dates.
- `test_ai_reasoning_endpoint`: Asserts temporal resolution accuracy, financial topic modeling, and reasoning trace generation.

---

## 📡 API Specification Reference

Interactive OpenAPI documentation is hosted at `http://localhost:8000/docs`.

| Method | Route | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Service health status check | `200` |
| `GET` | `/api/leads` | List leads with computed status, pinning, and Zia best-time | `200` |
| `POST` | `/api/leads` | Create new lead entity | `201`, `400` |
| `GET` | `/api/leads/{id}` | Retrieve lead detail and chronological discussion timeline | `200`, `404` |
| `PATCH` | `/api/leads/{id}/status` | Update lead pipeline stage | `200`, `400`, `404` |
| `PATCH` | `/api/leads/{id}` | Update lead demographic and contact attributes | `200`, `400`, `404` |
| `POST` | `/api/leads/{id}/discussions` | Append discussion record and update follow-up timestamp | `201`, `400`, `404` |
| `POST` | `/api/ai/analyze-note` | Execute Chain-of-Thought reasoning on raw discussion text | `200`, `400` |
| `POST` | `/api/seed` | Reset and initialize demonstration dataset | `200` |
| `DELETE` | `/api/leads/{id}` | Remove lead entity | `200`, `404` |

---

## 📂 Repository Structure

```
leadflow/
├── backend/
│   ├── ai_engine.py           # Chain-of-Thought financial reasoning & temporal parser
│   ├── database.py            # SQLite & SQLAlchemy engine configuration
│   ├── Dockerfile             # Multi-stage FastAPI container configuration
│   ├── main.py                # REST endpoints, CORS policies, and pinning logic
│   ├── models.py              # SQLAlchemy Lead and Discussion database models
│   ├── requirements.txt       # Python runtime dependencies
│   ├── schemas.py             # Pydantic v2 validation contracts
│   ├── seed.py                # Database seed script with 6 realistic wealth leads
│   └── tests/
│       └── test_api.py        # Automated test suite (8 test specifications)
├── frontend/
│   ├── Dockerfile             # Multi-stage production container build
│   ├── next.config.mjs        # Next.js routing and API proxy configuration
│   ├── package.json           # Frontend dependency manifest
│   ├── postcss.config.js      # PostCSS configuration
│   ├── tailwind.config.ts     # Tailwind design tokens and palette definitions
│   ├── tsconfig.json          # TypeScript strict compiler configuration
│   └── src/
│       ├── app/
│       │   ├── globals.css    # Global stylesheet and custom scrollbars
│       │   ├── layout.tsx     # Root HTML document layout
│       │   └── page.tsx       # Single-screen dashboard orchestrator
│       ├── components/
│       │   ├── AddLeadModal.tsx       # Entity creation modal with validation
│       │   ├── AIAdvisorDossier.tsx   # Fiduciary reasoning trace and topic tags
│       │   ├── FilterBar.tsx          # Multi-criteria status pills and live search
│       │   ├── LeadCard.tsx           # Lead card with status, time-ago, and Zia badges
│       │   ├── LeadTimelineModal.tsx  # Timeline dialog with pipeline chevrons
│       │   └── StatusBadge.tsx        # Pipeline stage badge component
│       ├── lib/
│       │   └── api.ts                 # Strongly-typed HTTP API client
│       └── types/
│           └── index.ts               # Shared domain interfaces
├── .env.example               # Environment variable specification template
├── .gitignore                 # Version control exclusion rules
├── docker-compose.yml         # Multi-service container orchestration
├── README.md                  # Enterprise documentation
└── run_dev.sh                 # Local development launcher script
```

---

## 📄 License & Attribution

Developed for the **AI-Smart Fullstack Intern** technical assessment at **Pravar AI**. Focused on fiduciary software engineering, cognitive UX reduction, and robust agentic reasoning.
