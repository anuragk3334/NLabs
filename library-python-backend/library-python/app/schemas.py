from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


# Base model so every field is written in snake_case here but exposed as
# camelCase in JSON (e.g. total_copies <-> totalCopies). This keeps the API
# identical to the Java version, so the same frontend works unchanged.
class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ----- Books -----
class BookRequest(CamelModel):
    title: str = Field(min_length=1)
    author: str = Field(min_length=1)
    isbn: Optional[str] = None
    total_copies: int = Field(default=1, ge=1)


class BookResponse(CamelModel):
    id: int
    title: str
    author: str
    isbn: Optional[str]
    total_copies: int
    available_copies: int


# ----- Members -----
class MemberRequest(CamelModel):
    name: str = Field(min_length=1)
    email: EmailStr
    phone: Optional[str] = None


class MemberResponse(CamelModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    joined_at: date


# ----- Loans -----
class BorrowRequest(CamelModel):
    book_id: int
    member_id: int


class LoanResponse(CamelModel):
    id: int
    book_id: int
    book_title: str
    book_isbn: Optional[str]
    member_id: int
    member_name: str
    borrowed_at: datetime
    due_date: date
    returned_at: Optional[datetime]
    status: str
    overdue: bool
