# app/core/config.py
"""
Single source of truth for all threshold constants and environment variables.
Never hardcode these values anywhere else in the codebase.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/kyc_aml"
)

# ── JWT ───────────────────────────────────────────────────────────────────────
SECRET_KEY: str  = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM:  str  = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# ── Blockchain ────────────────────────────────────────────────────────────────
BLOCKCHAIN_RPC_URL:   str = os.getenv("BLOCKCHAIN_RPC_URL",   "http://127.0.0.1:8545")
CONTRACT_ADDRESS:     str = os.getenv("CONTRACT_ADDRESS",     "0x0000000000000000000000000000000000000000")
DEPLOYER_PRIVATE_KEY: str = os.getenv("DEPLOYER_PRIVATE_KEY", "")

# ── Certificates ──────────────────────────────────────────────────────────────
UIDAI_CERT_PATH: str = os.getenv("UIDAI_CERT_PATH", "certs/uidai_auth_prod.cer")

# ── KYC Thresholds ────────────────────────────────────────────────────────────
# Face match: cosine similarity 0.0–1.0. Below this → KYC fails.
FACE_MATCH_THRESHOLD: float = float(os.getenv("FACE_MATCH_THRESHOLD", "0.60"))

# AML: Isolation Forest score 0.0–1.0. Above this → transaction flagged.
AML_FLAG_THRESHOLD: float = float(os.getenv("AML_FLAG_THRESHOLD", "0.70"))

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:5173")
