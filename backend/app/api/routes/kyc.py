# app/api/routes/kyc.py
"""
GET  /api/dashboard               — User dashboard data (kyc_steps, anomaly score, tx hash)
POST /api/verify                  — Full 6-step KYC pipeline (multipart/form-data)
GET  /api/demo/aadhaar-sample     — Returns a demo Aadhaar XML for graders
POST /api/voice/speak             — Trigger a TTS voice alert

Analyst routes:
GET  /api/analyst/kyc-queue       — All users who have uploaded documents
GET  /api/analyst/kyc-detail/{id} — Full detail for one user (both photos)
POST /api/analyst/kyc-action      — Approve / Reject / Defer a KYC submission
"""
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.config import UIDAI_CERT_PATH
from app.core.security import get_current_user, require_role
from app.db.database import get_db
from app.models.user import User
from app.models.blacklist import Blacklist
from app.models.transaction import Transaction
from app.schemas.kyc import (
    DashboardResponse, KycSteps,
    VerifyResponse,
    KycQueueResponse, KycQueueItem,
    KycDetailResponse,
)
from app.services.aadhaar_service import extract_aadhaar_zip, verify_uidai_signature, generate_demo_aadhaar_xml
from app.services.face_service import compare_faces
from app.services.blockchain_service import anchor_identity
from app.services import voice_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["kyc"])


# ── Dashboard ─────────────────────────────────────────────────────────────────
@router.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all data needed to render UserDashboard.jsx:
      - kyc_steps: the 5 booleans that drive the KYCStepper component
      - kyc_status, kyc_verified
      - Last transaction anomaly score
      - Blockchain tx hash
    """
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(404, detail="User not found.")

    # Last transaction anomaly score (for the Risk Score stat card)
    last_txn = (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
        .first()
    )

    return DashboardResponse(
        user_id=user.id,
        full_name=user.full_name,
        kyc_verified=(user.kyc_status == "VERIFIED"),
        kyc_status=user.kyc_status,
        kyc_steps=KycSteps(
            profile_created=bool(user.step_profile_created),
            document_uploaded=bool(user.step_document_uploaded),
            signature_verified=bool(user.step_signature_verified),
            face_matched=bool(user.step_face_matched),
            blockchain_anchored=bool(user.step_blockchain_anchored),
        ),
        anomaly_score=last_txn.anomaly_score if last_txn else None,
        blockchain_tx_hash=user.blockchain_tx_hash,
    )


# ── KYC Verification (the full 6-step pipeline) ───────────────────────────────
@router.post("/api/verify", response_model=VerifyResponse)
async def verify_kyc(
    file:       UploadFile = File(...,   description="Aadhaar offline eKYC ZIP or XML file"),
    share_code: str        = Form(...,   description="4-digit Aadhaar share code / PIN"),
    selfie:     str        = Form(...,   description="Base64-encoded JPEG of live selfie"),
    current_user: dict     = Depends(get_current_user),
    db: Session            = Depends(get_db),
):
    """
    The core KYC pipeline. Steps:
      1. Decrypt ZIP with share_code (pyaadhaar)
      2. Verify UIDAI XML-DSig signature (signxml)
      3. Check Aadhaar number hash against the global blacklist
      4. Compare Aadhaar photo vs selfie (DeepFace)
      5. Write VERIFIED status to PostgreSQL
      6. Anchor identity hash on Ethereum blockchain (web3.py)

    All steps must pass. Any failure returns the exact HTTP status and
    detail message defined in the SRS API contract.
    """
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(404, detail="User not found.")

    zip_bytes = await file.read()

    # ── STEP 1: Extract ZIP ───────────────────────────────────────────────────
    logger.info("[KYC Step 1] Extracting Aadhaar ZIP for user_id=%d", user.id)
    extracted = extract_aadhaar_zip(zip_bytes, share_code)
    # Mark document uploaded
    user.step_document_uploaded = True
    db.commit()

    # ── STEP 2: UIDAI Signature Verification ─────────────────────────────────
    logger.info("[KYC Step 2] Verifying UIDAI signature for user_id=%d", user.id)
    sig_valid = verify_uidai_signature(
        extracted["xml_content"],
        UIDAI_CERT_PATH,
        extracted.get("xml_bytes_raw", b"")
    )
    user.signature_valid = sig_valid
    user.step_signature_verified = sig_valid
    db.commit()

    if not sig_valid:
        raise HTTPException(
            status_code=422,
            detail="Aadhaar signature verification failed. "
                   "This document may have been tampered with."
        )

    # ── STEP 3: Blacklist Check ───────────────────────────────────────────────
    logger.info("[KYC Step 3] Blacklist check for user_id=%d", user.id)
    blacklisted = db.query(Blacklist).filter(
        Blacklist.aadhaar_hash == extracted["aadhaar_number_hash"]
    ).first()
    if blacklisted:
        raise HTTPException(
            status_code=403,
            detail="This identity has been globally blacklisted. KYC cannot proceed."
        )

    # ── STEP 4: Face Matching ─────────────────────────────────────────────────
    logger.info("[KYC Step 4] Running DeepFace comparison for user_id=%d", user.id)
    face_result = compare_faces(extracted["photo_b64"], selfie)
    # compare_faces raises HTTPException 422 if score < threshold

    user.face_match_score  = face_result["similarity"]
    user.step_face_matched = face_result["matched"]
    # Store both photos as data URIs for the analyst detail view
    user.aadhaar_photo_b64 = f"data:image/jpeg;base64,{extracted['photo_b64']}"
    user.selfie_photo_b64  = f"data:image/jpeg;base64,{selfie.split(',')[-1]}"
    db.commit()

    # ── STEP 5: Database Write ────────────────────────────────────────────────
    logger.info("[KYC Step 5] Writing VERIFIED status for user_id=%d", user.id)
    user.full_name            = extracted["name"]   or user.full_name
    user.dob                  = extracted["dob"]
    user.address              = extracted["address"]
    user.aadhaar_xml_hash     = extracted["xml_hash"]
    user.aadhaar_number_hash  = extracted["aadhaar_number_hash"]
    user.kyc_status           = "VERIFIED"
    db.commit()

    # ── STEP 6: Blockchain Anchor ─────────────────────────────────────────────
    logger.info("[KYC Step 6] Anchoring identity on blockchain for user_id=%d", user.id)
    tx_hash = anchor_identity(user.id, extracted["xml_hash"])
    blockchain_warning = None

    if tx_hash:
        user.blockchain_tx_hash      = tx_hash
        user.step_blockchain_anchored = True
    else:
        blockchain_warning = (
            "Blockchain node unavailable — identity verified in database but "
            "on-chain anchoring was skipped. Start Hardhat/Ganache and retry."
        )
        logger.warning("Blockchain anchor skipped for user_id=%d", user.id)

    db.commit()

    return VerifyResponse(
        kyc_verified=True,
        signature_valid=True,
        face_match_score=face_result["similarity"],
        face_matched=True,
        aadhaar_xml_hash=extracted["xml_hash"],
        blockchain_tx_hash=tx_hash,
        blockchain_warning=blockchain_warning,
        message="KYC verification successful. Your identity has been confirmed.",
    )


# ── Demo Aadhaar XML endpoint ─────────────────────────────────────────────────
@router.get("/api/demo/aadhaar-sample")
def demo_aadhaar():
    """
    Returns a synthetic Aadhaar XML for demonstration purposes.
    Used by the 'Use Demo File' button in KYCCenter.jsx.
    """
    xml = generate_demo_aadhaar_xml()
    return JSONResponse(content={"xml": xml, "share_code": "1234"})


# ── Voice Alert ───────────────────────────────────────────────────────────────
@router.post("/api/voice/speak")
def speak(payload: dict, current_user: dict = Depends(get_current_user)):
    """
    Triggers a TTS voice alert on the server machine.
    Called by the frontend speaker button and analyst hub.

    Payload: { "text": "message to speak" }
    Or send a predefined key: { "key": "welcome" | "anomaly" | "reported" }
    """
    text_map = {
        "welcome":  voice_service.WELCOME_MESSAGE,
        "anomaly":  voice_service.ANOMALY_DETECTED,
        "reported": voice_service.ANOMALY_REPORTED,
    }

    key  = payload.get("key")
    text = text_map.get(key) if key else payload.get("text", "")

    if not text:
        raise HTTPException(400, detail="Provide either 'text' or a valid 'key'.")

    success = voice_service.speak(text)
    return {"spoken": text, "success": success}


# ── Analyst: KYC Queue ────────────────────────────────────────────────────────
@router.get("/api/analyst/kyc-queue", response_model=KycQueueResponse)
def analyst_kyc_queue(
    current_user: dict = Depends(require_role("analyst", "regulator")),
    db: Session = Depends(get_db),
):
    """
    Returns all users who have at least uploaded their document.
    Drives the ReviewQueue.jsx table.
    """
    users = (
        db.query(User)
        .filter(User.step_document_uploaded == True)  # noqa: E712
        .filter(User.role == "user")
        .order_by(User.updated_at.desc())
        .all()
    )

    queue = []
    for u in users:
        pct = int(u.face_match_score * 100) if u.face_match_score is not None else None
        queue.append(KycQueueItem(
            user_id=u.id,
            full_name=u.full_name,
            face_match_score=u.face_match_score,
            face_match_pct=pct,
            signature_valid=u.signature_valid,
            kyc_status=u.kyc_status,
            submitted_at=str(u.updated_at),
        ))

    return KycQueueResponse(queue=queue)


# ── Analyst: KYC Detail ───────────────────────────────────────────────────────
@router.get("/api/analyst/kyc-detail/{user_id}", response_model=KycDetailResponse)
def analyst_kyc_detail(
    user_id: int,
    current_user: dict = Depends(require_role("analyst", "regulator")),
    db: Session = Depends(get_db),
):
    """
    Full detail for one user including both photos (data URIs).
    Drives DetailView.jsx — left panel: Aadhaar photo, right panel: selfie.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, detail=f"User {user_id} not found.")

    pct = int(user.face_match_score * 100) if user.face_match_score is not None else None

    return KycDetailResponse(
        user_id=user.id,
        full_name=user.full_name,
        dob=user.dob,
        address=user.address,
        face_match_score=user.face_match_score,
        face_match_pct=pct,
        signature_valid=user.signature_valid,
        aadhaar_photo_b64=user.aadhaar_photo_b64,
        selfie_photo_b64=user.selfie_photo_b64,
        aadhaar_xml_hash=user.aadhaar_xml_hash,
        blockchain_tx_hash=user.blockchain_tx_hash,
        kyc_status=user.kyc_status,
    )


# ── Analyst: KYC Action (Approve / Reject / Defer) ───────────────────────────
@router.post("/api/analyst/kyc-action")
def analyst_kyc_action(
    payload: dict,
    current_user: dict = Depends(require_role("analyst", "regulator")),
    db: Session = Depends(get_db),
):
    """
    Maps to the three buttons in DetailView.jsx:
      Approve KYC   → action: "APPROVE"
      Reject & Flag → action: "REJECT"
      Defer         → action: "DEFER"

    Payload: { "user_id": 42, "action": "APPROVE" | "REJECT" | "DEFER" }
    """
    user_id = payload.get("user_id")
    action  = payload.get("action", "").upper()

    valid_actions = {"APPROVE", "REJECT", "DEFER"}
    if action not in valid_actions:
        raise HTTPException(400, detail=f"Invalid action. Choose from: {valid_actions}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, detail=f"User {user_id} not found.")

    status_map = {
        "APPROVE": "VERIFIED",
        "REJECT":  "REJECTED",
        "DEFER":   "PENDING",   # stays PENDING, re-appears at top of queue
    }
    user.kyc_status = status_map[action]
    db.commit()

    return {
        "message": f"KYC status updated to {status_map[action]}",
        "user_id": user_id,
        "kyc_status": status_map[action],
    }
