#!/bin/bash

echo "Starting scheduler..."
python3 /app/scheduler_runner.py &

echo "Starting Flask server..."
flask run --host=0.0.0.0 --port=5050
