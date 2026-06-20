from fastapi import APIRouter, Depends
from psycopg2.extras import RealDictCursor

from ..database import get_connection
from ..exceptions import BusinessError, NotFoundError
from ..schemas import MemberRequest, MemberResponse

router = APIRouter(prefix="/api/members", tags=["members"])


@router.get("", response_model=list[MemberResponse])
def list_members(conn=Depends(get_connection)):
    """ List all members. """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM members ORDER BY id")
        return cur.fetchall()


@router.get("/{member_id}", response_model=MemberResponse)
def get_member(member_id: int, conn=Depends(get_connection)):
    """ Get a member by id. """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM members WHERE id = %s", (member_id,))
        member = cur.fetchone()
        if member is None:
            raise NotFoundError(f"Member not found with id {member_id}")
        return member


@router.post("", response_model=MemberResponse, status_code=201)
def create_member(payload: MemberRequest, conn=Depends(get_connection)):
    """ Create a new member. """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT 1 FROM members WHERE email = %s", (payload.email,))
        if cur.fetchone():
            raise BusinessError("A member with this email already exists")

        cur.execute(
            """
            INSERT INTO members (name, email, phone)
            VALUES (%s, %s, %s)
            RETURNING *
            """,
            (payload.name, payload.email, payload.phone),
        )
        return cur.fetchone()


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(member_id: int, payload: MemberRequest, conn=Depends(get_connection)):
    """ Update a member's information. """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT 1 FROM members WHERE id = %s", (member_id,))
        if cur.fetchone() is None:
            raise NotFoundError(f"Member not found with id {member_id}")

        # Don't let a member take an email that already belongs to someone else.
        cur.execute(
            "SELECT 1 FROM members WHERE email = %s AND id <> %s",
            (payload.email, member_id),
        )
        if cur.fetchone():
            raise BusinessError("A member with this email already exists")

        cur.execute(
            """
            UPDATE members
            SET name = %s, email = %s, phone = %s, updated_at = now()
            WHERE id = %s
            RETURNING *
            """,
            (payload.name, payload.email, payload.phone, member_id),
        )
        return cur.fetchone()
