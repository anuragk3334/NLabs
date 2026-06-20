class NotFoundError(Exception):
    """Raised when a book, member or loan id does not exist."""

    def __init__(self, message: str):
        self.message = message


class BusinessError(Exception):
    """Raised for business rule violations, e.g. borrowing a book with no copies left."""

    def __init__(self, message: str):
        self.message = message
