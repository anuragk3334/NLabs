import os

from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool

# Pin a connection pool to the module 
pool = SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432"),
    dbname=os.getenv("DB_NAME", "library"),
    user=os.getenv("DB_USER", "admin"),
    password=os.getenv("DB_PASSWORD", "password"),
    # Pin the session timezone so we don't depend on the OS locale
    # (avoids the "Asia/Calcutta" timezone error some machines hit).
    options="-c timezone=UTC",
    cursor_factory=RealDictCursor,
)


def get_connection():
    """Get the connection from the pool. Execute the request and put the connection back to the pool.
    """
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)
