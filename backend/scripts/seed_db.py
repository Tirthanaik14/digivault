#!/usr/bin/env python3
"""
scripts/seed_db.py
------------------
Seeds the database with demo data that mirrors src/data/mockData.js so the
analyst and regulator portals show realistic content on first run.

Run from the backend/ directory:
    python scripts/seed_db.py

This is safe to run multiple times — it skips records that already exist.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal, create_all_tables
from app.models.user import User
from app.models.transaction import Transaction
from app.models.institution import Institution
from app.core.security import hash_password


def seed():
    create_all_tables()
    db = SessionLocal()

    print("Seeding institutions...")
    banks = [
        {"bank_name": "HDFC Bank",            "bank_code": "HDFC0001", "is_active": True},
        {"bank_name": "State Bank of India",  "bank_code": "SBIN0001", "is_active": True},
        {"bank_name": "ICICI Bank",           "bank_code": "ICIC0001", "is_active": True},
        {"bank_name": "Axis Bank",            "bank_code": "UTIB0001", "is_active": False},
        {"bank_name": "Punjab National Bank", "bank_code": "PUNB0001", "is_active": True},
    ]
    for b in banks:
        exists = db.query(Institution).filter(Institution.bank_code == b["bank_code"]).first()
        if not exists:
            db.add(Institution(**b))
    db.commit()
    print(f"  {len(banks)} institutions seeded.")

    print("Seeding demo users...")
    demo_users = [
        # These mirror the REVIEW_QUEUE entries in mockData.js
        # so the analyst portal shows real data instead of mock data
        {"full_name": "Aditya Sharma",  "email": "aditya@demo.com",  "role": "user",
         "kyc_status": "VERIFIED",  "face_match_score": 0.94,
         "step_profile_created": True, "step_document_uploaded": True,
         "step_signature_verified": True, "step_face_matched": True,
         "step_blockchain_anchored": True},

        {"full_name": "Priya Nair",     "email": "priya@demo.com",   "role": "user",
         "kyc_status": "PENDING",   "face_match_score": 0.61,
         "step_profile_created": True, "step_document_uploaded": True,
         "step_signature_verified": True, "step_face_matched": False,
         "step_blockchain_anchored": False},

        {"full_name": "Rohan Gupta",    "email": "rohan@demo.com",   "role": "user",
         "kyc_status": "VERIFIED",  "face_match_score": 0.87,
         "step_profile_created": True, "step_document_uploaded": True,
         "step_signature_verified": True, "step_face_matched": True,
         "step_blockchain_anchored": True},

        {"full_name": "Fatima Sheikh",  "email": "fatima@demo.com",  "role": "user",
         "kyc_status": "REJECTED",  "face_match_score": 0.38,
         "step_profile_created": True, "step_document_uploaded": True,
         "step_signature_verified": False, "step_face_matched": False,
         "step_blockchain_anchored": False},

        {"full_name": "Vikram Singh",   "email": "vikram@demo.com",  "role": "user",
         "kyc_status": "PENDING",   "face_match_score": 0.79,
         "step_profile_created": True, "step_document_uploaded": True,
         "step_signature_verified": True, "step_face_matched": True,
         "step_blockchain_anchored": False},

        # Analyst account
        {"full_name": "Bank Analyst",   "email": "analyst@demo.com", "role": "analyst",
         "kyc_status": "VERIFIED",  "face_match_score": None,
         "step_profile_created": True, "step_document_uploaded": False,
         "step_signature_verified": False, "step_face_matched": False,
         "step_blockchain_anchored": False},

        # Regulator account
        {"full_name": "RBI Officer",    "email": "rbi@demo.com",     "role": "regulator",
         "kyc_status": "VERIFIED",  "face_match_score": None,
         "step_profile_created": True, "step_document_uploaded": False,
         "step_signature_verified": False, "step_face_matched": False,
         "step_blockchain_anchored": False},
    ]

    created_users = {}
    for u in demo_users:
        exists = db.query(User).filter(User.email == u["email"]).first()
        if not exists:
            user = User(
                full_name=u["full_name"],
                email=u["email"],
                password_hash=hash_password("demo1234"),  # default password for ALL demo accounts
                role=u["role"],
                kyc_status=u["kyc_status"],
                face_match_score=u.get("face_match_score"),
                step_profile_created=u["step_profile_created"],
                step_document_uploaded=u["step_document_uploaded"],
                step_signature_verified=u["step_signature_verified"],
                step_face_matched=u["step_face_matched"],
                step_blockchain_anchored=u["step_blockchain_anchored"],
            )
            db.add(user)
            db.flush()
            created_users[u["email"]] = user.id
    db.commit()
    print(f"  {len(demo_users)} users seeded (password for all: demo1234)")

    print("Seeding demo transactions...")
    # Re-fetch Aditya and Vikram for transaction linking
    aditya = db.query(User).filter(User.email == "aditya@demo.com").first()
    if aditya:
        txns = [
            # mirrors AML_TRANSACTIONS in mockData.js
            {"receiver_name": "Riya Mehta",        "account_number": "HDFC4521", "amount": 12500,  "anomaly_score": 0.12, "is_flagged": False, "status": "APPROVED"},
            {"receiver_name": "Global Traders Ltd", "account_number": "SBI8834",  "amount": 485000, "anomaly_score": 0.91, "is_flagged": True,  "status": "PENDING"},
            {"receiver_name": "Arjun Patel",        "account_number": "ICICI2201","amount": 3200,   "anomaly_score": 0.08, "is_flagged": False, "status": "APPROVED"},
            {"receiver_name": "Phantom Exports",    "account_number": "AXIS7711", "amount": 920000, "anomaly_score": 0.88, "is_flagged": True,  "status": "PENDING"},
            {"receiver_name": "Sneha Kapoor",       "account_number": "PNB3390",  "amount": 8750,   "anomaly_score": 0.19, "is_flagged": False, "status": "APPROVED"},
        ]
        existing_count = db.query(Transaction).filter(Transaction.user_id == aditya.id).count()
        if existing_count == 0:
            for t in txns:
                db.add(Transaction(user_id=aditya.id, **t))
    db.commit()
    print("  5 demo transactions seeded for Aditya Sharma.")
    db.close()
    print("\nSeeding complete!")
    print("=" * 50)
    print("Demo login credentials (password: demo1234):")
    print("  User portal:      aditya@demo.com")
    print("  Analyst portal:   analyst@demo.com")
    print("  Regulator portal: rbi@demo.com")
    print("=" * 50)


if __name__ == "__main__":
    seed()
