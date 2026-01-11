"""Database connection utilities."""
from app.db.models import SessionLocal


def get_db():
    """Get a database session dependency for FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
