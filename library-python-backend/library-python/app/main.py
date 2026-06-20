from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .exceptions import BusinessError, NotFoundError
from .routers import books, loans, members

app = FastAPI(title="Neighborhood Library Service")

# Allow the local dev frontends (React on 3000, Angular on 4200) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4200"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


def _error_body(status: int, error: str, message: str) -> dict:
    return {
        "timestamp": datetime.now().isoformat(),
        "status": status,
        "error": error,
        "message": message,
    }


@app.exception_handler(NotFoundError)
def handle_not_found(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content=_error_body(404, "Not Found", exc.message))


@app.exception_handler(BusinessError)
def handle_business(request: Request, exc: BusinessError):
    return JSONResponse(status_code=409, content=_error_body(409, "Conflict", exc.message))


# FastAPI returns 422 for bad input by default; reshape it to a 400 with the
# field-level messages, matching the Java backend.
@app.exception_handler(RequestValidationError)
def handle_validation(request: Request, exc: RequestValidationError):
    field_errors = {}
    for err in exc.errors():
        field = err["loc"][-1]
        field_errors[str(field)] = err["msg"]

    body = _error_body(400, "Bad Request", "Validation failed")
    body["errors"] = field_errors
    return JSONResponse(status_code=400, content=body)


app.include_router(books.router)
app.include_router(members.router)
app.include_router(loans.router)


@app.get("/")
def root():
    return {"service": "Neighborhood Library", "docs": "/docs"}
