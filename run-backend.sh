#!/bin/bash
# Script to run FastAPI backend with hot reloading

echo "Starting InterviewHire FastAPI Backend..."

# Free port 8000 if occupied
PID=$(lsof -t -i :8000)
if [ ! -z "$PID" ]; then
    echo "Port 8000 is occupied by process $PID. Reclaiming port..."
    kill -9 $PID 2>/dev/null
    sleep 1
fi

cd "$(dirname "$0")/backend"

if [ -d "venv" ]; then
    source venv/bin/activate
fi

uvicorn main:app --reload --port 8000
