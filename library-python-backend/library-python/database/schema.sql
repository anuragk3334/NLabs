-- Neighborhood Library Service - database schema
-- PostgreSQL

-- Run this once against an empty database, e.g.
--   psql -U postgres -d library -f schema.sql

CREATE TABLE IF NOT EXISTS books (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    author          VARCHAR(255) NOT NULL,
    isbn            VARCHAR(20)  UNIQUE,
    total_copies    INTEGER      NOT NULL DEFAULT 1,
    available_copies INTEGER     NOT NULL DEFAULT 1,
    created_at      TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT chk_total_copies     CHECK (total_copies >= 0),
    CONSTRAINT chk_available_copies CHECK (available_copies >= 0 AND available_copies <= total_copies)
);

CREATE TABLE IF NOT EXISTS members (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    phone       VARCHAR(30),
    joined_at   DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now()
);

-- A loan row is created every time a member borrows a book.
-- It is closed off (returned_at set) when the book comes back.
CREATE TABLE IF NOT EXISTS loans (
    id          BIGSERIAL PRIMARY KEY,
    book_id     BIGINT NOT NULL REFERENCES books(id),
    member_id   BIGINT NOT NULL REFERENCES members(id),
    borrowed_at TIMESTAMP NOT NULL DEFAULT now(),
    due_date    DATE      NOT NULL,
    returned_at TIMESTAMP,

    -- status is kept in sync by the application: BORROWED or RETURNED
    status      VARCHAR(20) NOT NULL DEFAULT 'BORROWED',

    CONSTRAINT chk_status CHECK (status IN ('BORROWED', 'RETURNED'))
);

-- Helpful indexes for the "what does this member have out" type queries.
CREATE INDEX IF NOT EXISTS idx_loans_member  ON loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_book    ON loans(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_status  ON loans(status);

-- Some sample data so the app isn't empty on first run.
INSERT INTO books (title, author, isbn, total_copies, available_copies) VALUES
    ('The Pragmatic Programmer', 'Andrew Hunt', '9780201616224', 3, 3),
    ('Clean Code', 'Robert C. Martin', '9780132350884', 2, 2),
    ('Effective Java', 'Joshua Bloch', '9780134685991', 4, 4)
ON CONFLICT (isbn) DO NOTHING;

INSERT INTO members (name, email, phone) VALUES
    ('Priya Sharma', 'priya@example.com', '9876543210'),
    ('John Carter', 'john@example.com', '9123456780')
ON CONFLICT (email) DO NOTHING;
