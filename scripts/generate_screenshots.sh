#!/usr/bin/env bash
set -e
export PATH=$HOME/.nvm/versions/node/v20.20.2/bin:$PATH
cd /Users/krishkaul/.gemini/antigravity/scratch/leadflow

echo "🚀 Starting backend & frontend services..."
PYTHONPATH=backend .venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

(cd frontend && npm run dev) &
FRONTEND_PID=$!

cleanup() {
  echo "Stopping services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
}
trap cleanup EXIT

echo "⏳ Waiting for frontend to become responsive on http://127.0.0.1:3000..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:3000 >/dev/null 2>&1; then
    echo "✅ LeadFlow is responsive on port 3000!"
    break
  fi
  sleep 1
done

echo "📸 Executing screenshot capture..."
NODE_PATH=frontend/node_modules node take_screenshots.js

echo "✨ Completed screenshot capture!"
