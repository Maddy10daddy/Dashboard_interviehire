#!/bin/bash
# Script to run FastAPI backend with hot reloading

echo "Starting InterviewHire FastAPI Backend..."
cd "$(dirname "$0")/backend"

if [ -d "venv" ]; then
    source venv/bin/activate
fi

uvicorn main:app --reload --port 8000
