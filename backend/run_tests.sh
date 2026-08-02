#!/bin/bash
set -e

# Check for virtual environment
if [ ! -d ".venv" ]; then
    echo "Error: Virtual environment not found at .venv"
    echo "Run: python3 -m venv .venv && source .venv/bin/activate && pip install pytest mongomock -r requirements.txt"
    exit 1
fi

if [ ! -f ".venv/bin/activate" ]; then
    echo "Error: Virtual environment activate script not found"
    exit 1
fi

# Activate virtual environment
source .venv/bin/activate

echo "Running tests in virtual environment..."
# Ensure the current directory is in PYTHONPATH so 'app' can be imported
export PYTHONPATH=$PYTHONPATH:.
pytest
