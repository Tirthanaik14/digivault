# app/models/transaction.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey

from app.db.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_name  = Column(String(255), nullable=False)
    account_number = Column(String(50),  nullable=False)
    amount         = Column(Float,       nullable=False)
    anomaly_score  = Column(Float,       nullable=False, default=0.0)
    is_flagged     = Column(Boolean,     nullable=False, default=False)
    # PENDING | APPROVED | FROZEN | REPORTED | DEFERRED
    status         = Column(String(50),  nullable=False, default="PENDING")
    created_at     = Column(DateTime, default=datetime.utcnow)
