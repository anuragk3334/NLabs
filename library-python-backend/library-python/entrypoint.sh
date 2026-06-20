#!/bin/sh
set -e

echo "Waiting for Postgres at ${DB_HOST:-db}:${DB_PORT:-5432}..."
until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USER:-admin}" >/dev/null 2>&1; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - starting application"
exec uvicorn app.main:app --host 0.0.0.0 --port 8080
