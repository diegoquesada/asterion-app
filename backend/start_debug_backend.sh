#!/bin/bash
set -e

# Check for virtual environment
if [ ! -d ".venv" ]; then
    echo "Error: Virtual environment not found at .venv"
    echo "Run: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

if [ ! -f ".venv/bin/activate" ]; then
    echo "Error: Virtual environment activate script not found"
    exit 1
fi

# Check for app.py
if [ ! -f "app.py" ]; then
    echo "Error: app.py not found in $(pwd)"
    exit 1
fi

# Activate virtual environment
source .venv/bin/activate

# Run the Flask app
python3 app.py
