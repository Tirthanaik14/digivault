# app/schemas/kyc.py
from typing import Optional
from pydantic import BaseModel


# ── Dashboard response ────────────────────────────────────────────────────────
class KycSteps(BaseModel):
    """
    Maps to the KYC_STEPS array in constants.js.
    Each boolean corresponds to one stepper circle.
    """
    profile_created:    bool
    document_uploaded:  bool
    signature_verified: bool
    face_matched:       bool
    blockchain_anchored:bool


class DashboardResponse(BaseModel):
    user_id:             int
    full_name:           str
    kyc_verified:        bool
    kyc_status:          str        # PENDING | VERIFIED | REJECTED
    kyc_steps:           KycSteps
    anomaly_score:       Optional[float] = None
    blockchain_tx_hash:  Optional[str]   = None


# ── POST /api/verify response ─────────────────────────────────────────────────
class VerifyResponse(BaseModel):
    kyc_verified:        bool
    signature_valid:     bool
    face_match_score:    float
    face_matched:        bool
    aadhaar_xml_hash:    str
    blockchain_tx_hash:  Optional[str] = None
    blockchain_warning:  Optional[str] = None   # set if chain unavailable
    message:             str


# ── Analyst KYC queue row ─────────────────────────────────────────────────────
class KycQueueItem(BaseModel):
    user_id:          int
    full_name:        str
    face_match_score: Optional[float]  # None if not yet processed
    face_match_pct:   Optional[int]    # score * 100, shown in table
    signature_valid:  Optional[bool]
    kyc_status:       str
    submitted_at:     str


class KycQueueResponse(BaseModel):
    queue: list[KycQueueItem]


# ── Analyst KYC detail view ───────────────────────────────────────────────────
class KycDetailResponse(BaseModel):
    user_id:              int
    full_name:            str
    dob:                  Optional[str]
    address:              Optional[str]
    face_match_score:     Optional[float]
    face_match_pct:       Optional[int]
    signature_valid:      Optional[bool]
    aadhaar_photo_b64:    Optional[str]  # data:image/jpeg;base64,...
    selfie_photo_b64:     Optional[str]  # data:image/jpeg;base64,...
    aadhaar_xml_hash:     Optional[str]
    blockchain_tx_hash:   Optional[str]
    kyc_status:           str
