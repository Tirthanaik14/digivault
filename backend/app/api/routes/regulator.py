# app/api/routes/regulator.py
"""
GET  /api/regulator/overview          — NetworkOverview.jsx stat cards + bank list
POST /api/regulator/add-bank          — Register a new institution
POST /api/regulator/revoke-bank       — Revoke / restore a bank licence
GET  /api/regulator/blacklist         — List all blacklisted Aadhaar hashes
POST /api/regulator/blacklist/add     — Add a hash to the global blacklist
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.db.database import get_db
from app.models.institution import Institution
from app.models.blacklist import Blacklist
from app.models.user import User
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/regulator", tags=["regulator"])


# ── Network Overview ──────────────────────────────────────────────────────────
@router.get("/overview")
def network_overview(
    current_user: dict = Depends(require_role("regulator")),
    db: Session = Depends(get_db),
):
    """
    Drives the stat cards in NetworkOverview.jsx:
      - Total verified users
      - Total pending KYC
      - Flagged (unresolved) transactions
      - Active bank count
      - Full bank list
    """
    total_verified  = db.query(User).filter(User.kyc_status == "VERIFIED").count()
    total_pending   = db.query(User).filter(User.kyc_status == "PENDING").count()
    flagged_txns    = db.query(Transaction).filter(
        Transaction.is_flagged == True,         # noqa: E712
        Transaction.status == "PENDING"
    ).count()

    banks = db.query(Institution).order_by(Institution.added_at.desc()).all()
    active_count = sum(1 for b in banks if b.is_active)

    return {
        "total_verified_users":      total_verified,
        "total_pending_kyc":         total_pending,
        "total_flagged_transactions": flagged_txns,
        "active_banks":              active_count,
        "banks": [
            {
                "bank_id":   b.id,
                "bank_name": b.bank_name,
                "bank_code": b.bank_code,
                "is_active": b.is_active,
                "added_at":  str(b.added_at),
            }
            for b in banks
        ],
    }


# ── Add New Bank ──────────────────────────────────────────────────────────────
@router.post("/add-bank", status_code=201)
def add_bank(
    payload: dict,
    current_user: dict = Depends(require_role("regulator")),
    db: Session = Depends(get_db),
):
    """
    Registers a new financial institution.
    Payload: { "bank_name": "HDFC Bank", "bank_code": "HDFC001" }
    """
    bank_name = payload.get("bank_name", "").strip()
    bank_code = payload.get("bank_code", "").strip()

    if not bank_name or not bank_code:
        raise HTTPException(400, detail="Both bank_name and bank_code are required.")

    existing = db.query(Institution).filter(Institution.bank_code == bank_code).first()
    if existing:
        raise HTTPException(400, detail=f"Bank code '{bank_code}' already registered.")

    bank = Institution(bank_name=bank_name, bank_code=bank_code, is_active=True)
    db.add(bank)
    db.commit()
    db.refresh(bank)

    return {
        "bank_id": bank.id,
        "message": f"Bank '{bank_name}' registered successfully.",
        "is_active": True,
    }


# ── Revoke / Restore Bank Licence ─────────────────────────────────────────────
@router.post("/revoke-bank")
def revoke_bank(
    payload: dict,
    current_user: dict = Depends(require_role("regulator")),
    db: Session = Depends(get_db),
):
    """
    Toggles a bank's is_active status.
    Maps to the toggle button in InstitutionManagement.jsx.

    Payload: { "bank_id": 5 }
    Revoking sets is_active = False.
    Calling again on a revoked bank restores it (is_active = True).
    """
    bank_id = payload.get("bank_id")
    if not bank_id:
        raise HTTPException(400, detail="bank_id is required.")

    bank = db.query(Institution).filter(Institution.id == bank_id).first()
    if not bank:
        raise HTTPException(404, detail=f"Bank {bank_id} not found.")

    bank.is_active = not bank.is_active
    db.commit()

    action = "restored" if bank.is_active else "revoked"
    return {
        "message":   f"Bank licence {action}.",
        "bank_id":   bank.id,
        "bank_name": bank.bank_name,
        "is_active": bank.is_active,
    }


# ── Global Blacklist: List ─────────────────────────────────────────────────────
@router.get("/blacklist")
def get_blacklist(
    current_user: dict = Depends(require_role("regulator", "analyst")),
    db: Session = Depends(get_db),
):
    """
    Returns all blacklisted Aadhaar hashes.
    The UI truncates the hash to first 16 chars + '...' for display.
    Raw Aadhaar numbers are NEVER stored — only SHA-256 hashes.
    """
    entries = db.query(Blacklist).order_by(Blacklist.added_at.desc()).all()
    return {
        "blacklist": [
            {
                "id":           e.id,
                "aadhaar_hash": e.aadhaar_hash,
                "reason":       e.reason,
                "added_by":     e.added_by,
                "added_at":     str(e.added_at),
            }
            for e in entries
        ]
    }


# ── Global Blacklist: Add ─────────────────────────────────────────────────────
@router.post("/blacklist/add", status_code=201)
def add_to_blacklist(
    payload: dict,
    current_user: dict = Depends(require_role("regulator")),
    db: Session = Depends(get_db),
):
    """
    Adds an Aadhaar hash to the global blacklist.
    Payload: { "aadhaar_hash": "e3b0c44...", "reason": "Fraud", "added_by": "RBI_OFFICER_01" }

    NOTE: The caller must already have the SHA-256 hash — this endpoint
    never accepts or processes a raw Aadhaar number.
    """
    aadhaar_hash = payload.get("aadhaar_hash", "").strip()
    reason       = payload.get("reason", "")
    added_by     = payload.get("added_by", "RBI_OFFICER")

    if not aadhaar_hash or len(aadhaar_hash) != 64:
        raise HTTPException(
            400,
            detail="aadhaar_hash must be a 64-character SHA-256 hex string."
        )

    existing = db.query(Blacklist).filter(Blacklist.aadhaar_hash == aadhaar_hash).first()
    if existing:
        raise HTTPException(400, detail="This hash is already on the blacklist.")

    entry = Blacklist(
        aadhaar_hash=aadhaar_hash,
        reason=reason,
        added_by=added_by,
    )
    db.add(entry)
    db.commit()

    return {"message": "Hash added to global blacklist.", "id": entry.id}
