# **Library Management System**

**A simple library management system built with FastAPI (Python) and PostgreSQL.** It lets you manage books, members, and loan transactions through a REST API, with a React frontend for easy interaction.

---

## **Live Demo**

**Frontend:** **http://20.81.42.105:3000/**

**API Docs (Swagger):** **http://20.81.42.105:8080/docs**

---

## **Setting Up the Database**

**Before running the app, you need a running PostgreSQL instance.** Use the command below to spin one up with Docker:

```bash
docker run --name my-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=admin \
  -e POSTGRES_DB=library \
  -p 5432:5432 \
  -d postgres:16
```

### **pgAdmin (optional, for database GUI)**

If you want a graphical interface to browse the database, you can also run pgAdmin:

```bash
docker run --name my-pgadmin \
  -e PGADMIN_DEFAULT_EMAIL=admin@admin.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  -p 5050:80 \
  -d dpage/pgadmin4
```

Then open **http://localhost:5050** in your browser and connect using the postgres credentials above.

---

## **Running the Application**

**The easiest way to run everything together (API + database + frontend) is with Docker Compose.** From the root of the project:

```bash
docker compose up --build
```

This will start:
- **PostgreSQL** on port `5432`
- **FastAPI backend** on port `8080`
- **React frontend** on port `3000`
- **The database schema and sample data are loaded automatically on first run.**

### **Stopping the application**

```bash
docker compose down
```

To also wipe the database volume and start completely fresh:

```bash
docker compose down -v
docker compose up --build
```

---

## **API Documentation (Swagger)**

Once the app is running, the interactive API docs are available at:

**http://localhost:8080/docs**

**You can test all endpoints directly from the browser there.**

---

## **API Endpoints**

### **Books**

| **Method** | **Endpoint** | **Description** |
|--------|----------|-------------|
| **GET** | `/api/books` | Get all books |
| **GET** | `/api/books/{book_id}` | Get a specific book by ID |
| **POST** | `/api/books` | Add a new book |
| **PUT** | `/api/books/{book_id}` | Update book details |

### **Members**

| **Method** | **Endpoint** | **Description** |
|--------|----------|-------------|
| **GET** | `/api/members` | Get all members |
| **GET** | `/api/members/{member_id}` | Get a specific member by ID |
| **POST** | `/api/members` | Register a new member |
| **PUT** | `/api/members/{member_id}` | Update member details |

### **Loans**

| **Method** | **Endpoint** | **Description** |
|--------|----------|-------------|
| **GET** | `/api/loans` | Get all loans (optional filters: `memberId`, `status`) |
| **POST** | `/api/loans/borrow` | Borrow a book |
| **POST** | `/api/loans/{loan_id}/return` | Return a borrowed book |

---

## **Database Schema**

**The database has three tables: `books`, `members`, and `loans`.**

### **`books`**

```sql
CREATE TABLE books (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    author           VARCHAR(255) NOT NULL,
    isbn             VARCHAR(20) UNIQUE,
    total_copies     INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_total_copies     CHECK (total_copies >= 0),
    CONSTRAINT chk_available_copies CHECK (available_copies >= 0 AND available_copies <= total_copies)
);
```

### **`members`**

```sql
CREATE TABLE members (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    phone      VARCHAR(30),
    joined_at  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

### **`loans`**

```sql
CREATE TABLE loans (
    id          BIGSERIAL PRIMARY KEY,
    book_id     BIGINT NOT NULL REFERENCES books(id),
    member_id   BIGINT NOT NULL REFERENCES members(id),
    borrowed_at TIMESTAMP NOT NULL DEFAULT now(),
    due_date    DATE NOT NULL,
    returned_at TIMESTAMP,
    status      VARCHAR(20) NOT NULL DEFAULT 'BORROWED',
    CONSTRAINT chk_status CHECK (status IN ('BORROWED', 'RETURNED'))
);

CREATE INDEX idx_loans_member ON loans(member_id);
CREATE INDEX idx_loans_book   ON loans(book_id);
CREATE INDEX idx_loans_status ON loans(status);
```

**When a book is borrowed, `available_copies` decreases by one and goes back up when it is returned.**
