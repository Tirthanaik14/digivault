# main.py
"""
FastAPI application entry point.

Start the server with:
    uvicorn main:app --reload --port 8000

Swagger docs auto-generated at:  http://localhost:8000/docs
ReDoc:                            http://localhost:8000/redoc
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGIN
from app.db.database import create_all_tables
from app.api.routes import auth, kyc, analyst, aml, regulator

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Intelligent Financial Surveillance System",
    description=(
        "Backend API for the three-portal KYC + AML system. "
        "Swagger docs show all endpoints with request/response schemas."
    ),
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allows the React dev server (localhost:5173) to call the API.
# Tighten origins in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(kyc.router)
app.include_router(analyst.router)
app.include_router(aml.router)
app.include_router(regulator.router)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    """
    Runs once when the server starts.
    Creates all database tables if they don't exist yet.
    You never need to run migrations manually for a fresh setup.
    """
    logger.info("Starting up — creating database tables...")
    create_all_tables()
    logger.info("Database tables ready.")
    logger.info("Server running. Swagger docs at http://localhost:8000/docs")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    """Simple liveness probe. Returns 200 if the server is running."""
    return {"status": "ok", "service": "Intelligent Financial Surveillance System"}
