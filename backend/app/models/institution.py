# app/models/institution.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime

from app.db.database import Base


class Institution(Base):
    __tablename__ = "institutions"

    id        = Column(Integer, primary_key=True, index=True)
    bank_name = Column(String(255), nullable=False)
    bank_code = Column(String(50),  unique=True, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    added_at  = Column(DateTime, default=datetime.utcnow)
