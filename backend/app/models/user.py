# app/models/user.py
"""
ORM model for the `users` table.
Maps exactly to the fields the frontend expects in API responses.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)
    full_name        = Column(String(255), nullable=False)
    email            = Column(String(255), unique=True, nullable=False, index=True)
    password_hash    = Column(Text, nullable=False)
    role             = Column(String(50), nullable=False, default="user")
                       # "user" | "analyst" | "regulator"

    # KYC fields — populated during the verification pipeline
    dob              = Column(String(20),  nullable=True)
    address          = Column(Text,        nullable=True)
    aadhaar_xml_hash = Column(String(64),  nullable=True)   # SHA-256 of XML
    aadhaar_number_hash = Column(String(64), nullable=True) # SHA-256 of Aadhaar number (blacklist check)

    # KYC status: PENDING | VERIFIED | REJECTED
    kyc_status       = Column(String(50),  nullable=False, default="PENDING")

    # Step-by-step booleans — drive the 5-step progress bar in UserDashboard.jsx
    step_profile_created   = Column(Boolean, default=True)   # always True after signup
    step_document_uploaded = Column(Boolean, default=False)
    step_signature_verified= Column(Boolean, default=False)
    step_face_matched      = Column(Boolean, default=False)
    step_blockchain_anchored = Column(Boolean, default=False)

    # Scores
    face_match_score = Column(Float,   nullable=True)        # 0.0–1.0
    signature_valid  = Column(Boolean, nullable=True)

    # Aadhaar photos stored as base64 strings (for analyst detail view)
    aadhaar_photo_b64 = Column(Text, nullable=True)          # from XML
    selfie_photo_b64  = Column(Text, nullable=True)          # captured frame

    # Blockchain
    blockchain_tx_hash = Column(String(66), nullable=True)   # 0x...

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
