#!/bin/bash
set -e

echo "Running Alembic Database Migrations..."
alembic upgrade head

echo "Seeding base roles and departments..."
python -m app.init_db

echo "Starting Application Server..."
# This executes the CMD provided in the Dockerfile (uvicorn)
exec "$@"
