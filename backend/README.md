# Backend — Intelligent Financial Surveillance System

Complete FastAPI backend for the three-portal KYC + AML system.

---

## Folder Structure

```
backend/
├── main.py                          ← FastAPI entry point, run this
├── requirements.txt
├── .env.example                     ← copy to .env and fill in values
│
├── app/
│   ├── core/
│   │   ├── config.py                ← ALL thresholds & env vars (edit here, nowhere else)
│   │   └── security.py              ← JWT + bcrypt
│   ├── db/
│   │   └── database.py              ← SQLAlchemy engine + session
│   ├── models/                      ← ORM table definitions
│   │   ├── user.py
│   │   ├── transaction.py
│   │   ├── institution.py
│   │   └── blacklist.py
│   ├── schemas/                     ← Pydantic request/response shapes
│   │   ├── auth.py
│   │   └── kyc.py
│   ├── services/                    ← Business logic (no FastAPI here)
│   │   ├── aadhaar_service.py       ← pyaadhaar + signxml
│   │   ├── face_service.py          ← DeepFace
│   │   ├── blockchain_service.py    ← web3.py
│   │   └── voice_service.py         ← pyttsx3
│   └── api/routes/
│       ├── auth.py                  ← /api/auth/signup  /api/auth/login
│       ├── kyc.py                   ← /api/verify  /api/dashboard  /api/analyst/*
│       ├── aml.py                   ← /api/simulate-txn  /api/transactions
│       ├── analyst.py               ← /api/analyst/aml-alerts  /api/analyst/action
│       └── regulator.py             ← /api/regulator/*
│
├── blockchain/
│   ├── IdentityAnchor.sol           ← Solidity smart contract
│   ├── hardhat.config.js
│   └── scripts/deploy.js
│
├── certs/
│   └── uidai_auth_prod.cer          ← Download from UIDAI (see Step 4 below)
│
└── scripts/
    └── seed_db.py                   ← Populates demo data matching mockData.js
```

---

## Setup (do this once)

### Step 1 — Create and activate virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### Step 2 — Install dependencies

```bash
pip install -r requirements.txt
```

> DeepFace will download ~500 MB of model weights on first run.
> Run `python -c "from deepface import DeepFace"` once before the demo to pre-cache them.

### Step 3 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` — your PostgreSQL connection string
- `SECRET_KEY` — generate one: `python -c "import secrets; print(secrets.token_hex(32))"`
- `CONTRACT_ADDRESS` — filled in after Step 6 (blockchain deploy)

### Step 4 — UIDAI Certificate

Download the UIDAI public certificate:
```
https://uidai.gov.in/images/authDoc/uidai_auth_prod.cer
```
Place it at `backend/certs/uidai_auth_prod.cer`.

> **Without this file**, signature verification will always return `False`.
> This is intentional — it forces you to use real UIDAI-signed Aadhaar files.
> The demo XML from `/api/demo/aadhaar-sample` will still work for testing
> all other pipeline steps.

### Step 5 — Create PostgreSQL database

```sql
-- In psql or pgAdmin:
CREATE DATABASE kyc_aml;
```

Tables are created automatically when the server starts.

### Step 6 — Deploy the Blockchain Contract (optional but recommended)

```bash
# Terminal 1: Start the local Hardhat Ethereum node
cd backend/blockchain
npm install
npx hardhat node
```

```bash
# Terminal 2: Deploy the contract
npx hardhat run scripts/deploy.js --network localhost
```

Copy the printed contract address into `.env`:
```
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

The `DEPLOYER_PRIVATE_KEY` in `.env.example` is already set to Hardhat account[0]'s
default private key — no change needed for local development.

> **If you skip this step**, the KYC pipeline still works but returns
> `blockchain_tx_hash: null` with a warning message.

### Step 7 — Seed demo data

```bash
python scripts/seed_db.py
```

This creates demo accounts that match the data in `src/data/mockData.js`:

| Portal    | Email               | Password  |
|-----------|---------------------|-----------|
| User      | aditya@demo.com     | demo1234  |
| Analyst   | analyst@demo.com    | demo1234  |
| Regulator | rbi@demo.com        | demo1234  |

---

## Running the Server

```bash
# From the backend/ directory with venv activated:
uvicorn main:app --reload --port 8000
```

The server starts at **http://localhost:8000**

- **Swagger docs**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

---

## All API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | None | Register new account |
| POST | `/api/auth/login` | None | Login, get JWT |
| GET | `/api/dashboard` | user | Dashboard data + KYC steps |
| POST | `/api/verify` | user | Full KYC pipeline (multipart) |
| GET | `/api/demo/aadhaar-sample` | None | Demo Aadhaar XML for testing |
| POST | `/api/voice/speak` | any | Trigger TTS voice alert |
| POST | `/api/simulate-txn` | user | Submit transaction for AML scoring |
| GET | `/api/transactions` | user | Transaction history |
| GET | `/api/analyst/kyc-queue` | analyst | All pending KYC submissions |
| GET | `/api/analyst/kyc-detail/{id}` | analyst | Detail + both photos |
| POST | `/api/analyst/kyc-action` | analyst | Approve / Reject / Defer KYC |
| GET | `/api/analyst/aml-alerts` | analyst | Full transaction feed |
| POST | `/api/analyst/action` | analyst | Approve / Freeze / Report / Defer txn |
| GET | `/api/regulator/overview` | regulator | System-wide stats |
| POST | `/api/regulator/add-bank` | regulator | Register new bank |
| POST | `/api/regulator/revoke-bank` | regulator | Toggle bank licence |
| GET | `/api/regulator/blacklist` | regulator | List blacklisted hashes |
| POST | `/api/regulator/blacklist/add` | regulator | Add hash to blacklist |

---

## Connecting the Frontend

In every API call, attach the JWT from login as:
```
Authorization: Bearer <access_token>
```

The `POST /api/verify` endpoint expects `multipart/form-data`:
```
file:       <ZIP or XML file>
share_code: "1234"
selfie:     "<base64 JPEG string>"
```
All other endpoints use JSON bodies.

---

## Phase 1 Demo Checklist

- [ ] `uvicorn main:app --reload` running on port 8000
- [ ] Hardhat node running (`npx hardhat node`)
- [ ] Seeded with `python scripts/seed_db.py`
- [ ] Login works for all three portals
- [ ] KYC pipeline runs end-to-end (upload → signature → face → blockchain)
- [ ] Tamper demo: edit one char in XML → signature shows red cross
- [ ] AML simulator: large amount → red row in analyst hub
- [ ] Voice alert plays on server when anomaly detected
- [ ] Blockchain tx hash matches PostgreSQL record
