# Neighborhood Library Mono-Repo

This workspace contains the Python backend, React frontend, and a shared Docker Compose setup.

## Services

- `db` — PostgreSQL 16
- `api` — Python FastAPI backend
- `frontend` — React app served by Vite

## Run all services together

From the repository root (`C:\Assignment`):

```powershell
docker compose up --build
```

Then open:

- React UI: http://localhost:3000
- Python API: http://localhost:8080

## Notes

- The React frontend is configured to call the backend at `http://api:8080/api` when running in Docker.
- PostgreSQL data is persisted in the named volume `library_data`.
- The backend initializes the database schema from `library-python-backend/library-python/database/schema.sql`.

## Stop services

```powershell
docker compose down
```
