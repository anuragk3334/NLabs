from fastapi import APIRouter, Depends
from psycopg2.extras import RealDictCursor

from ..database import get_connection
from ..exceptions import BusinessError, NotFoundError
from ..schemas import BookRequest, BookResponse

router = APIRouter(prefix="/api/books", tags=["books"])


@router.get("", response_model=list[BookResponse])
def list_books(conn=Depends(get_connection)):
    """ List all books. """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM books ORDER BY id")
        return cur.fetchall()


@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: int, conn=Depends(get_connection)):
    """ Get a book by id. """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM books WHERE id = %s", (book_id,))
        book = cur.fetchone()
        if book is None:
            raise NotFoundError(f"Book not found with id {book_id}")
        return book


@router.post("", response_model=BookResponse, status_code=201)
def create_book(payload: BookRequest, conn=Depends(get_connection)):
    """ Create a new book. """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if payload.isbn:
            cur.execute("SELECT 1 FROM books WHERE isbn = %s", (payload.isbn,))
            if cur.fetchone():
                raise BusinessError("A book with this ISBN already exists")

        # A brand new book has all of its copies available.
        cur.execute(
            """
            INSERT INTO books (title, author, isbn, total_copies, available_copies)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
            """,
            (payload.title, payload.author, payload.isbn,
             payload.total_copies, payload.total_copies),
        )
        return cur.fetchone()


@router.put("/{book_id}", response_model=BookResponse)
def update_book(book_id: int, payload: BookRequest, conn=Depends(get_connection)):
    """ Update a book's information. """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM books WHERE id = %s", (book_id,))
        book = cur.fetchone()
        if book is None:
            raise NotFoundError(f"Book not found with id {book_id}")

       
        borrowed = book["total_copies"] - book["available_copies"]
        if payload.total_copies < borrowed:
            raise BusinessError(
                f"Cannot set total copies below the number currently borrowed ({borrowed})"
            )

        cur.execute(
            """
            UPDATE books
            SET title = %s, author = %s, isbn = %s,
                total_copies = %s, available_copies = %s, updated_at = now()
            WHERE id = %s
            RETURNING *
            """,
            (payload.title, payload.author, payload.isbn,
             payload.total_copies, payload.total_copies - borrowed, book_id),
        )
        return cur.fetchone()
