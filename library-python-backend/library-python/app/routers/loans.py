from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from ..database import get_connection
from ..exceptions import BusinessError, NotFoundError
from ..schemas import BorrowRequest, LoanResponse

router = APIRouter(prefix="/api/loans", tags=["loans"])

# Overdue time
LOAN_PERIOD_DAYS = 14

# Sql quesry to return all the loans with book and member details.
LOAN_SELECT = """
    SELECT l.id, l.book_id, b.title AS book_title, b.isbn AS book_isbn,
           l.member_id, m.name AS member_name,
           l.borrowed_at, l.due_date, l.returned_at, l.status
    FROM loans l
    JOIN books b ON b.id = l.book_id
    JOIN members m ON m.id = l.member_id
"""


def _with_overdue(row):
    """ Add an 'overdue' field to the loan row, based on due_date and returned_at. """
    row = dict(row)
    row["overdue"] = row["returned_at"] is None and row["due_date"] < date.today()
    return row


def _fetch_loan(cur, loan_id):
    """ Fetch a loan by id and return it with the 'overdue' field. """
    cur.execute(LOAN_SELECT + " WHERE l.id = %s", (loan_id,))
    return _with_overdue(cur.fetchone())


@router.get("", response_model=list[LoanResponse])
def list_loans(memberId: Optional[int] = None,
               status: Optional[str] = None,
               conn=Depends(get_connection)):
    """ List loans, optionally filtered by memberId and/or status. """
    conditions = []
    params = []

    if memberId is not None:
        conditions.append("l.member_id = %s")
        params.append(memberId)

    if status and status.lower() == "active":
        conditions.append("l.status = 'BORROWED'")

    query = LOAN_SELECT
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY l.borrowed_at DESC"

    with conn.cursor() as cur:
        cur.execute(query, params)
        return [_with_overdue(row) for row in cur.fetchall()]


@router.post("/borrow", response_model=LoanResponse, status_code=201)
def borrow(payload: BorrowRequest, conn=Depends(get_connection)):
    """ Borrow a book for a member. """
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM books WHERE id = %s", (payload.book_id,))
        book = cur.fetchone()
        if book is None:
            raise NotFoundError(f"Book not found with id {payload.book_id}")

        cur.execute("SELECT 1 FROM members WHERE id = %s", (payload.member_id,))
        if cur.fetchone() is None:
            raise NotFoundError(f"Member not found with id {payload.member_id}")

        if book["available_copies"] <= 0:
            raise BusinessError(
                f"No copies of \"{book['title']}\" are available right now"
            )

        
        cur.execute(
            "UPDATE books SET available_copies = available_copies - 1 WHERE id = %s",
            (payload.book_id,),
        )

        due_date = date.today() + timedelta(days=LOAN_PERIOD_DAYS)
        cur.execute(
            """
            INSERT INTO loans (book_id, member_id, borrowed_at, due_date, status) VALUES (%s, %s, now(), %s, 'BORROWED') RETURNING id
            """,
            (payload.book_id, payload.member_id, due_date),
        )
        loan_id = cur.fetchone()["id"]
        return _fetch_loan(cur, loan_id)


@router.post("/{loan_id}/return", response_model=LoanResponse)
def return_book(loan_id: int, conn=Depends(get_connection)):
    """ Return a borrowed book. """
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM loans WHERE id = %s", (loan_id,))
        loan = cur.fetchone()
        if loan is None:
            raise NotFoundError(f"Loan not found with id {loan_id}")

        if loan["status"] == "RETURNED":
            raise BusinessError("This book has already been returned")

        cur.execute(
            "UPDATE loans SET status = 'RETURNED', returned_at = now() WHERE id = %s",
            (loan_id,),
        )
        
        cur.execute(
            "UPDATE books SET available_copies = available_copies + 1 WHERE id = %s",
            (loan["book_id"],),
        )
        return _fetch_loan(cur, loan_id)
