#!/usr/bin/env bash
set -e

# LeadFlow Local Development Launcher
echo "🚀 Starting LeadFlow Fullstack (FastAPI + Next.js)..."

# Ensure venv exists
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r backend/requirements.txt
else
    source .venv/bin/activate
fi

# Ensure seed data
PYTHONPATH=backend python backend/seed.py

# Trap SIGINT to kill background processes on exit
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Start backend on 8000
echo "Starting FastAPI backend on http://127.0.0.1:8000..."
(cd backend && uvicorn main:app --host 127.0.0.1 --port 8000 --reload) &

# Start frontend on 3000
echo "Starting Next.js frontend on http://localhost:3000..."
(cd frontend && npm run dev) &

wait
