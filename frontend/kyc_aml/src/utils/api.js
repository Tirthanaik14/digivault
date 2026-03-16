// src/utils/api.js
// Central API helper — all fetch calls go through here.
// Base URL points to the FastAPI backend running on port 8000.

const BASE = "http://localhost:8000";

function getToken() {
  // Token is stored in window.__authToken by AppContext after login
  return window.__authToken || null;
}

async function request(method, path, body = null, isFormData = false) {
  const token = getToken();

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : null,
  });

  const data = await res.json();

  if (!res.ok) {
    // FastAPI always returns { detail: "..." } on errors
    throw new Error(data.detail || "Something went wrong");
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  // POST /api/auth/signup
  signup: (email, password, full_name, role = "user") =>
    request("POST", "/api/auth/signup", { email, password, full_name, role }),

  // POST /api/auth/login
  login: (email, password, role = "user") =>
    request("POST", "/api/auth/login", { email, password, role }),

  // ── User Portal ─────────────────────────────────────────────────────────────
  // GET /api/dashboard
  getDashboard: () => request("GET", "/api/dashboard"),

  // POST /api/verify  (multipart/form-data)
  verifyKyc: (file, shareCode, selfieBase64) => {
    const form = new FormData();
    form.append("file", file);
    form.append("share_code", shareCode);
    form.append("selfie", selfieBase64);
    return request("POST", "/api/verify", form, true);
  },

  // POST /api/voice/speak
  speak: (key) => request("POST", "/api/voice/speak", { key }),

  // POST /api/simulate-txn
  simulateTxn: (userId, amount, receiverName, accountNumber) =>
    request("POST", "/api/simulate-txn", {
      user_id: userId,
      amount,
      receiver_name: receiverName,
      account_number: accountNumber,
    }),

  // GET /api/transactions
  getTransactions: (userId) =>
    request("GET", `/api/transactions?user_id=${userId}`),

  // ── Analyst Portal ──────────────────────────────────────────────────────────
  // GET /api/analyst/kyc-queue
  getKycQueue: () => request("GET", "/api/analyst/kyc-queue"),

  // GET /api/analyst/kyc-detail/:id
  getKycDetail: (userId) => request("GET", `/api/analyst/kyc-detail/${userId}`),

  // POST /api/analyst/kyc-action
  kycAction: (userId, action) =>
    request("POST", "/api/analyst/kyc-action", { user_id: userId, action }),

  // GET /api/analyst/aml-alerts
  getAmlAlerts: () => request("GET", "/api/analyst/aml-alerts"),

  // POST /api/analyst/action
  analystAction: (transactionId, action) =>
    request("POST", "/api/analyst/action", { transaction_id: transactionId, action }),

  // ── Regulator Portal ────────────────────────────────────────────────────────
  getOverview:   () => request("GET", "/api/regulator/overview"),
  getBanks:      () => request("GET", "/api/regulator/overview"),
  addBank:       (bankName, bankCode) =>
    request("POST", "/api/regulator/add-bank", { bank_name: bankName, bank_code: bankCode }),
  revokeBank:    (bankId) =>
    request("POST", "/api/regulator/revoke-bank", { bank_id: bankId }),
  getBlacklist:  () => request("GET", "/api/regulator/blacklist"),
  addBlacklist:  (aadhaarHash, reason, addedBy) =>
    request("POST", "/api/regulator/blacklist/add", {
      aadhaar_hash: aadhaarHash, reason, added_by: addedBy,
    }),
};
