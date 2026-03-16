# app/db/database.py
"""
SQLAlchemy engine, session factory, and the Base class all models inherit from.
Call create_all_tables() once at startup to create tables if they don't exist.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # drops stale connections automatically
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """
    FastAPI dependency — yields a DB session and guarantees it closes
    even if the route raises an exception.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables():
    """Called from main.py on startup to auto-create missing tables."""
    # Import all models here so SQLAlchemy registers them before create_all
    from app.models import user, transaction, institution, blacklist  # noqa: F401
    Base.metadata.create_all(bind=engine)
