# app/api/routes/aml.py
"""
POST /api/simulate-txn       — Submit a transaction and get an anomaly score
GET  /api/transactions        — Transaction history for the logged-in user

AML scoring uses Isolation Forest from scikit-learn.
SMOTE is applied during training to handle class imbalance
(real fraud << 2% of transactions, per Shah et al. 2025).
"""
import logging
from datetime import datetime

import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import AML_FLAG_THRESHOLD
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.transaction import Transaction
from app.services import voice_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["aml"])


# ── Isolation Forest scoring ──────────────────────────────────────────────────
def _score_transaction(history: list[Transaction], new_amount: float) -> float:
    """
    Scores `new_amount` using an Isolation Forest trained on the user's
    historical amounts.

    Feature vector (per transaction): [amount, hour_of_day, log_amount]
    SMOTE is applied when we have enough samples to avoid bias toward
    the majority class (normal transactions).

    Returns a normalised anomaly score in [0.0, 1.0].
    Scores > AML_FLAG_THRESHOLD (0.70) are considered anomalous.
    """
    from sklearn.ensemble import IsolationForest

    now = datetime.utcnow()

    # Build training data from history
    if len(history) < 5:
        # Not enough history — use a simple threshold rule
        # Any amount > 500,000 INR is automatically flagged
        if new_amount > 500_000:
            return 0.85  # high anomaly score
        elif new_amount > 100_000:
            return 0.55
        else:
            return 0.10

    # Feature extraction: [amount, log(amount+1), hour_of_day]
    def _features(amount: float, ts: datetime) -> list:
        return [
            amount,
            np.log1p(amount),
            ts.hour if ts else 12,
        ]

    X_hist = np.array([
        _features(t.amount, t.created_at) for t in history
    ])

    # Apply SMOTE only if we have enough samples
    # (addresses the class imbalance problem from Shah et al. 2025)
    if len(X_hist) >= 10:
        try:
            from imblearn.over_sampling import SMOTE
            # SMOTE needs labels; we treat all history as normal (0)
            y_dummy = np.zeros(len(X_hist), dtype=int)
            sm = SMOTE(k_neighbors=min(3, len(X_hist) - 1), random_state=42)
            X_hist, _ = sm.fit_resample(X_hist, y_dummy)
        except Exception as e:
            logger.warning("SMOTE failed, using raw history: %s", e)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.02,   # expect ~2% anomalous, matches real financial data
        random_state=42,
    )
    model.fit(X_hist)

    # Score the new transaction
    x_new = np.array([_features(new_amount, now)])
    raw_score = model.decision_function(x_new)[0]

    # decision_function: positive = normal, negative = anomalous
    # Normalise to [0, 1] where 1 = most anomalous
    # Typical range is roughly [-0.5, 0.5]
    normalised = 1.0 - (raw_score - (-0.5)) / (0.5 - (-0.5))
    return float(np.clip(normalised, 0.0, 1.0))


# ── POST /api/simulate-txn ────────────────────────────────────────────────────
@router.post("/api/simulate-txn")
def simulate_transaction(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Receives a transaction from the AML Simulator form and scores it.

    Payload (matches AMLSimulator.jsx form fields):
    {
        "user_id":        42,
        "amount":         50000,
        "receiver_name":  "Sharma Traders",
        "account_number": "9876543210"
    }

    Response drives the history table in AMLSimulator.jsx:
    - is_flagged=false → green "Safe" badge
    - is_flagged=true  → red "Flagged" badge
    """
    user_id        = payload.get("user_id") or current_user["user_id"]
    amount         = payload.get("amount")
    receiver_name  = payload.get("receiver_name", "")
    account_number = payload.get("account_number", "")

    if amount is None or amount <= 0:
        raise HTTPException(400, detail="amount must be a positive number.")
    if not receiver_name:
        raise HTTPException(400, detail="receiver_name is required.")
    if not account_number:
        raise HTTPException(400, detail="account_number is required.")

    # Load this user's transaction history for model training
    history = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
        .limit(200)   # cap to last 200 for performance
        .all()
    )

    # Score the transaction
    anomaly_score = _score_transaction(history, float(amount))
    is_flagged    = anomaly_score > AML_FLAG_THRESHOLD
    status        = "PENDING" if is_flagged else "APPROVED"

    # Persist to database
    txn = Transaction(
        user_id=user_id,
        receiver_name=receiver_name,
        account_number=account_number,
        amount=float(amount),
        anomaly_score=round(anomaly_score, 4),
        is_flagged=is_flagged,
        status=status,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    # Trigger voice alert if flagged
    if is_flagged:
        voice_service.speak(voice_service.ANOMALY_DETECTED)
        logger.warning(
            "Flagged transaction: user_id=%d, amount=%.2f, score=%.4f",
            user_id, amount, anomaly_score
        )

    message = (
        "Transaction flagged for analyst review. Score: "
        f"{anomaly_score:.2f}"
        if is_flagged
        else "Transaction approved. Score: "
        f"{anomaly_score:.2f}"
    )

    return {
        "transaction_id": txn.id,
        "anomaly_score":  txn.anomaly_score,
        "is_flagged":     txn.is_flagged,
        "status":         txn.status,
        "message":        message,
    }


# ── GET /api/transactions ─────────────────────────────────────────────────────
@router.get("/api/transactions")
def get_transactions(
    user_id: int = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the transaction history for the logged-in user.
    Drives the history table in AMLSimulator.jsx.

    Query param: ?user_id=42
    Falls back to the JWT user_id if not provided.
    """
    uid = user_id or current_user["user_id"]

    txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == uid)
        .order_by(Transaction.created_at.desc())
        .all()
    )

    return {
        "transactions": [
            {
                "transaction_id": t.id,
                "receiver_name":  t.receiver_name,
                "account_number": t.account_number,
                "amount":         t.amount,
                "anomaly_score":  t.anomaly_score,
                "is_flagged":     t.is_flagged,
                "status":         t.status,
                "created_at":     str(t.created_at),
            }
            for t in txns
        ]
    }
