# app/api/routes/analyst.py
"""
GET  /api/analyst/aml-alerts       — Full transaction feed for AlertHub.jsx
POST /api/analyst/action            — Approve / Freeze / Report / Defer a transaction

Row colour rule (enforced in frontend, driven by this data):
  anomaly_score > 0.70  →  red row  (Tailwind bg-red-600)
  anomaly_score ≤ 0.70  →  normal row
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.db.database import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.services import voice_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["analyst"])

VALID_ACTIONS = {"APPROVE", "FREEZE", "REPORT", "DEFER"}


# ── AML Alert Feed ────────────────────────────────────────────────────────────
@router.get("/api/analyst/aml-alerts")
def get_aml_alerts(
    current_user: dict = Depends(require_role("analyst", "regulator")),
    db: Session = Depends(get_db),
):
    """
    Returns all transactions sorted newest-first.
    The frontend's AlertHub.jsx colours rows red when anomaly_score > 0.70.

    Each alert row includes full_name so the analyst knows which user sent it
    without a second API call.
    """
    rows = (
        db.query(Transaction, User)
        .join(User, Transaction.user_id == User.id)
        .order_by(Transaction.created_at.desc())
        .all()
    )

    alerts = []
    for txn, user in rows:
        alerts.append({
            "transaction_id":  txn.id,
            "user_id":         txn.user_id,
            "full_name":       user.full_name,
            "amount":          txn.amount,
            "receiver_name":   txn.receiver_name,
            "account_number":  txn.account_number,
            "anomaly_score":   txn.anomaly_score,
            "is_flagged":      txn.is_flagged,
            "status":          txn.status,
            "created_at":      str(txn.created_at),
        })

    return {"alerts": alerts}


# ── Analyst Action (Approve / Freeze / Report / Defer) ────────────────────────
@router.post("/api/analyst/action")
def analyst_action(
    payload: dict,
    current_user: dict = Depends(require_role("analyst", "regulator")),
    db: Session = Depends(get_db),
):
    """
    Maps exactly to the three buttons in AlertHub.jsx plus the Defer option:

      Approve  → status = APPROVED
      Freeze   → status = FROZEN
      Report   → status = REPORTED  +  triggers voice alert on server
      Defer    → status = DEFERRED  (re-surfaces after 24 h — future scope)

    Payload: { "transaction_id": 17, "action": "APPROVE" | "FREEZE" | "REPORT" | "DEFER" }
    """
    txn_id = payload.get("transaction_id")
    action = payload.get("action", "").upper()

    if action not in VALID_ACTIONS:
        raise HTTPException(
            400,
            detail=f"Invalid action '{action}'. Must be one of: {sorted(VALID_ACTIONS)}"
        )

    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(404, detail=f"Transaction {txn_id} not found.")

    status_map = {
        "APPROVE": "APPROVED",
        "FREEZE":  "FROZEN",
        "REPORT":  "REPORTED",
        "DEFER":   "DEFERRED",
    }
    txn.status = status_map[action]
    db.commit()

    # Trigger voice alert when analyst reports to Central Bank
    if action == "REPORT":
        voice_service.speak(voice_service.ANOMALY_REPORTED)
        logger.info(
            "Transaction %d reported to Central Bank by analyst %d",
            txn_id, current_user["user_id"]
        )

    return {
        "message":        f"Transaction status updated to {txn.status}",
        "transaction_id": txn_id,
        "status":         txn.status,
    }
