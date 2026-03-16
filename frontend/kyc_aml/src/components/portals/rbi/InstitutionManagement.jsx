// src/components/portals/rbi/InstitutionManagement.jsx

import { useState, useEffect, useCallback } from "react";
import { Building2, Unlock, Lock, Plus, Loader2, RefreshCw, X, AlertTriangle } from "lucide-react";
import { Panel, SectionHeader } from "../../shared";
import { api } from "../../../utils/api";

// ── Tier badge ────────────────────────────────────────────────────────────────
function TierBadge({ tier }) {
  const map = {
    "Tier 1": "text-amber-400  bg-amber-500/10  border-amber-500/30",
    "Tier 2": "text-sky-400    bg-sky-500/10    border-sky-500/30",
    "Tier 3": "text-slate-400  bg-slate-500/10  border-slate-500/30",
  };
  return (
    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${map[tier] || map["Tier 3"]}`}>
      {tier}
    </span>
  );
}

// ── Add Bank Modal ────────────────────────────────────────────────────────────
function AddBankModal({ onClose, onAdded }) {
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async () => {
    if (!bankName.trim() || !bankCode.trim()) return setError("Both fields are required.");
    setLoading(true);
    setError("");
    try {
      await api.addBank(bankName.trim(), bankCode.trim().toUpperCase());
      onAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-lg">Register New Bank</h3>
            <p className="text-slate-400 text-xs font-mono mt-0.5">Add institution to RBI network</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-all p-1">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-mono uppercase tracking-wide block mb-2">Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. Punjab National Bank"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-mono uppercase tracking-wide block mb-2">Bank Code</label>
            <input
              type="text"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value.toUpperCase())}
              placeholder="e.g. PNB"
              maxLength={6}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertTriangle size={14} className="text-rose-400 shrink-0" />
              <p className="text-rose-400 text-xs font-mono">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-mono text-sm transition-all border border-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl font-mono text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Revoke Confirm Modal ──────────────────────────────────────────────────────
function RevokeModal({ bank, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-rose-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Revoke License?</h3>
            <p className="text-slate-400 text-xs font-mono">{bank.name}</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          This will immediately suspend <span className="text-white font-semibold">{bank.name}</span>'s operating license.
          All transactions will be blocked.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-mono text-sm transition-all border border-slate-700">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl font-mono text-sm transition-all flex items-center justify-center gap-2">
            <Lock size={14} /> Revoke
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InstitutionManagement() {
  const [banks,       setBanks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState("");
  const [showAddModal,setShowAddModal]= useState(false);
  const [revokeTarget,setRevokeTarget]= useState(null);
  const [actionMsg,   setActionMsg]   = useState("");

  const fetchBanks = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    api.getBanks()
      .then((data) => {
        // Support both { banks: [...] } and { institutions: [...] } shapes
        const list = data.banks || data.institutions || [];
        setBanks(list.map((b) => ({
          id:      b.bank_id   || b.id,
          name:    b.bank_name || b.name,
          code:    b.bank_code || b.code || "—",
          tier:    b.tier      || "Tier 2",
          users:   b.users     || b.user_count || 0,
          flagged: b.flagged   || b.flagged_count || 0,
          active:  b.active    ?? b.is_active ?? true,
        })));
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { fetchBanks(); }, [fetchBanks]);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await api.revokeBank(revokeTarget.id);
      setActionMsg(`${revokeTarget.name} license revoked.`);
      setRevokeTarget(null);
      fetchBanks();
      setTimeout(() => setActionMsg(""), 4000);
    } catch (err) {
      setError(err.message);
      setRevokeTarget(null);
    }
  };

  const activeCount   = banks.filter((b) => b.active).length;
  const revokedCount  = banks.filter((b) => !b.active).length;
  const highFlagCount = banks.filter((b) => b.flagged > 5).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="text-amber-400 animate-spin" />
    </div>
  );

  return (
    <>
      {showAddModal && (
        <AddBankModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { fetchBanks(); setActionMsg("New institution registered successfully."); setTimeout(() => setActionMsg(""), 4000); }}
        />
      )}
      {revokeTarget && (
        <RevokeModal
          bank={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onConfirm={handleRevoke}
        />
      )}

      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 text-[10px] font-mono uppercase tracking-widest">RBI · License Registry</span>
            </div>
            <h2 className="text-white text-2xl font-bold tracking-tight">Institution Management</h2>
            <p className="text-slate-400 text-sm">Manage bank licenses and compliance status</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchBanks(true)}
              disabled={refreshing}
              className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 text-xs font-mono text-black bg-amber-500 hover:bg-amber-400 px-4 py-2 rounded-lg transition-all font-bold"
            >
              <Plus size={13} /> Register Bank
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <p className="text-rose-400 text-sm font-mono">{error}</p>
          </div>
        )}
        {actionMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <p className="text-emerald-400 text-sm font-mono">✓ {actionMsg}</p>
          </div>
        )}

        {/* Summary chips */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-xs font-mono text-slate-400">Total: <span className="text-white font-bold">{banks.length}</span></span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-emerald-400">Active: <span className="font-bold">{activeCount}</span></span>
          </div>
          {revokedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-xs font-mono text-rose-400">Revoked: <span className="font-bold">{revokedCount}</span></span>
            </div>
          )}
          {highFlagCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono text-amber-400">High flags: <span className="font-bold">{highFlagCount}</span></span>
            </div>
          )}
        </div>

        {/* Bank list */}
        <Panel>
          <SectionHeader
            title="Registered Institutions"
            subtitle={`${activeCount} active licenses · ${banks.length} total`}
          />

          {banks.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-mono">No institutions registered yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg hover:bg-amber-500/20 transition-all"
              >
                + Register First Bank
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {banks.map((bank) => (
                <div
                  key={bank.id}
                  className={`border rounded-xl p-4 transition-all
                    ${bank.active
                      ? "border-slate-700 bg-slate-800/40 hover:bg-slate-800/60"
                      : "border-rose-500/20 bg-rose-500/5"}`}
                >
                  <div className="flex items-center gap-4">

                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border
                      ${bank.active ? "bg-slate-700 border-slate-600" : "bg-rose-500/10 border-rose-500/20"}`}>
                      <Building2 size={18} className={bank.active ? "text-amber-400" : "text-rose-400"} />
                    </div>

                    {/* Name & code */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-white text-sm font-semibold">{bank.name}</p>
                        <TierBadge tier={bank.tier} />
                        {!bank.active && (
                          <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                            REVOKED
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs font-mono">{bank.code}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-xs font-mono shrink-0">
                      <div className="text-center">
                        <p className="text-slate-500 text-[10px] mb-0.5">Users</p>
                        <p className="text-white font-bold">{bank.users.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500 text-[10px] mb-0.5">Flagged</p>
                        <p className={`font-bold ${bank.flagged > 5 ? "text-rose-400" : bank.flagged > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {bank.flagged}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500 text-[10px] mb-0.5">License</p>
                        {bank.active ? (
                          <button
                            onClick={() => setRevokeTarget(bank)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg border transition-all font-mono bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400"
                          >
                            <Unlock size={11} /> Active
                          </button>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg border font-mono bg-rose-500/10 border-rose-500/30 text-rose-400">
                            <Lock size={11} /> Revoked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}