# app/models/blacklist.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime

from app.db.database import Base


class Blacklist(Base):
    __tablename__ = "blacklist"

    id            = Column(Integer, primary_key=True, index=True)
    aadhaar_hash  = Column(String(64), unique=True, nullable=False, index=True)
                   # SHA-256 of the Aadhaar number — NEVER the raw number
    reason        = Column(Text,       nullable=True)
    added_by      = Column(String(100),nullable=True)
    added_at      = Column(DateTime,   default=datetime.utcnow)
