# Neighborhood Library Service - Python (FastAPI)

The library backend reimplemented in Python with FastAPI and Pydantic, using
native SQL queries (no ORM) against PostgreSQL.

It exposes exactly the same REST API as the Java version - same paths, same
camelCase JSON - so the React or Angular frontend works against it unchanged.

## Project layout

```
library-python/
├── app/
│   ├── main.py          FastAPI app: CORS + exception handlers + routers
│   ├── database.py      Connection pool + transactional dependency
│   ├── schemas.py       Pydantic request/response models
│   ├── exceptions.py    NotFoundError / BusinessError
│   └── routers/
│       ├── books.py
│       ├── members.py
│       └── loans.py
├── database/
│   └── schema.sql       PostgreSQL tables + sample data
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 1. Database

Start PostgreSQL with the schema and sample data loaded:

```bash
docker compose up -d
```

Or load it into an existing database:

```bash
createdb library
psql -d library -f database/schema.sql
```

## 2. Run the API

Python 3.10+ is required (the code uses `list[...]` type hints).

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8080
```

The API starts on http://localhost:8080. Interactive docs are at
http://localhost:8080/docs.

Database settings come from environment variables (defaults in brackets):
`DB_HOST` (localhost), `DB_PORT` (5432), `DB_NAME` (library),
`DB_USER` (postgres), `DB_PASSWORD` (postgres).

## 3. Run with Docker

This repository includes a `Dockerfile` and `docker-compose.yml` for running
both the API and PostgreSQL together.

```bash
docker compose up --build
```

Then open the app at http://localhost:8080 and the docs at
http://localhost:8080/docs.

## Endpoints

| Method | Path                          | Description                            |
|--------|-------------------------------|----------------------------------------|
| GET    | `/api/books`                  | List books                             |
| GET    | `/api/books/{id}`             | Get one book                           |
| POST   | `/api/books`                  | Add a book                             |
| PUT    | `/api/books/{id}`             | Update a book                          |
| GET    | `/api/members`                | List members                           |
| GET    | `/api/members/{id}`           | Get one member                         |
| POST   | `/api/members`                | Add a member                           |
| PUT    | `/api/members/{id}`           | Update a member                        |
| GET    | `/api/loans`                  | List loans (filters below)             |
| POST   | `/api/loans/borrow`           | Record a borrow                        |
| POST   | `/api/loans/{loanId}/return`  | Record a return                        |

Loan filters: `?status=active`, `?memberId=1`, or both together.

## How the requirements are met

- **Native SQL** - every route runs plain `cur.execute(...)` statements. No ORM.
- **Transaction management** - `get_connection` in `database.py` is a FastAPI
  dependency that commits when a request finishes cleanly and rolls back on any
  error. Borrow and return each run two statements (update the book's available
  count + write the loan), and they commit together or not at all.
- **CORS** - configured in `main.py` for the React (3000) and Angular (4200)
  dev servers.
- **Exception handling** - `NotFoundError` -> 404, `BusinessError` -> 409, and
  invalid input -> 400 with field-level messages, all returned as JSON with the
  same shape as the Java backend.
- **Validation** - Pydantic models validate input (required title/author, valid
  email, at least one copy) before any handler runs.

## Example requests

```bash
# Add a book
curl -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Clean Architecture","author":"Robert C. Martin","totalCopies":2}'

# Borrow
curl -X POST http://localhost:8080/api/loans/borrow \
  -H "Content-Type: application/json" \
  -d '{"bookId":1,"memberId":1}'

# What does member 1 have out?
curl "http://localhost:8080/api/loans?memberId=1&status=active"

# Return
curl -X POST http://localhost:8080/api/loans/1/return
```
