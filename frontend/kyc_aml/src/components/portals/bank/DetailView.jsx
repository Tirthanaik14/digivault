// src/components/portals/bank/DetailView.jsx

import { useState, useEffect } from "react";
import { Shield, Check, Ban, Clock, Loader2, ArrowLeft, Fingerprint } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { faceMatchColor } from "../../../utils/helpers";
import { Panel, SectionHeader, CircleProgress } from "../../shared";
import { api } from "../../../utils/api";

// ── Avatar color palette ──────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
];

function getAvatarColor(name = "") {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";
}

// ── KYC Status Banner ─────────────────────────────────────────────────────────
function KycStatusBanner({ status }) {
  const map = {
    VERIFIED: {
      label: "Identity Verified",
      sub:   "Blockchain anchored & face matched",
      cls:   "border-emerald-500/30 bg-emerald-500/5",
      dot:   "bg-emerald-400",
      text:  "text-emerald-400",
    },
    PENDING: {
      label: "Verification Pending",
      sub:   "Awaiting analyst review",
      cls:   "border-amber-500/30 bg-amber-500/5",
      dot:   "bg-amber-400 animate-pulse",
      text:  "text-amber-400",
    },
    REJECTED: {
      label: "Verification Rejected",
      sub:   "Flagged by analyst",
      cls:   "border-rose-500/30 bg-rose-500/5",
      dot:   "bg-rose-400",
      text:  "text-rose-400",
    },
  };
  const cfg = map[status] || map.PENDING;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.cls}`}>
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
      <div>
        <p className={`text-sm font-mono font-bold ${cfg.text}`}>{cfg.label}</p>
        <p className="text-slate-500 text-xs font-mono">{cfg.sub}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DetailView() {
  const { selectedUser, setActiveSection } = useApp();

  const [detail,    setDetail]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actioning, setActioning] = useState(null); // "APPROVE" | "REJECT" | "DEFER"
  const [copied,    setCopied]    = useState(false);

  useEffect(() => {
    if (!selectedUser?.id) { setLoading(false); return; }
    api.getKycDetail(selectedUser.id)
      .then((data) => setDetail(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedUser]);

  const handleAction = async (action) => {
    setActioning(action);
    setError("");
    try {
      const res = await api.kycAction(selectedUser.id, action);
      setActionMsg(res.message || `${action} successful`);
      const updated = await api.getKycDetail(selectedUser.id);
      setDetail(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setActioning(null);
    }
  };

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="text-emerald-400 animate-spin" />
    </div>
  );

  if (!selectedUser) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-slate-400 text-sm font-mono">No user selected.</p>
      <button
        onClick={() => setActiveSection("queue")}
        className="text-xs font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-4 py-2 rounded-lg hover:bg-sky-500/20 transition-all"
      >
        ← Back to Queue
      </button>
    </div>
  );

  const user       = detail || selectedUser;
  const name       = user?.full_name || user?.name || "Unknown";
  const initials   = getInitials(name);
  const avatarGrad = getAvatarColor(name);
  const kycStatus  = detail?.kyc_status || selectedUser?.kyc_status || "PENDING";
  const faceMatch  = detail?.face_match_pct ?? selectedUser?.faceMatch ?? 0;
  const matchColor = faceMatchColor(faceMatch);
  const txHash     = detail?.blockchain_tx_hash;

  return (
    <div className="space-y-6">

      {/* Back nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveSection("queue")}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-all font-mono text-sm bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg hover:bg-slate-700"
        >
          <ArrowLeft size={14} /> Queue
        </button>
        <div className="h-4 w-px bg-slate-700" />
        <h2 className="text-white text-2xl font-bold tracking-tight">Detail View</h2>
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

      {/* Identity header card */}
      <Panel>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-2xl font-bold text-white font-mono shrink-0 border-2 border-white/10`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-xl font-bold">{name}</h3>
            <p className="text-slate-500 text-xs font-mono">
              User ID #{selectedUser?.id} {detail?.email ? `· ${detail.email}` : ""}
            </p>
          </div>
          <KycStatusBanner status={kycStatus} />
        </div>
      </Panel>

      {/* Photo comparison */}
      <div className="grid grid-cols-2 gap-6">

        {/* Aadhaar photo */}
        <Panel>
          <SectionHeader title="Aadhaar Photo" subtitle="Official UIDAI record" />
          <div className="aspect-square bg-slate-900 rounded-xl flex flex-col items-center justify-center border border-slate-700 gap-3 overflow-hidden">
            {detail?.aadhaar_photo_b64 ? (
              <img src={detail.aadhaar_photo_b64} alt="Aadhaar" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-3xl font-bold text-white font-mono`}>
                  {initials}
                </div>
                <p className="text-slate-500 text-xs font-mono">No photo on record</p>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            <Shield size={12} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-mono">UIDAI Authenticated</span>
          </div>
        </Panel>

        {/* Live selfie */}
        <Panel>
          <SectionHeader title="Live Selfie" subtitle="Captured during KYC session" />
          <div className="aspect-square bg-slate-900 rounded-xl flex flex-col items-center justify-center border border-slate-700 gap-3 overflow-hidden">
            {detail?.selfie_photo_b64 ? (
              <img src={detail.selfie_photo_b64} alt="Selfie" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-3xl font-bold text-white font-mono opacity-60`}>
                  {initials}
                </div>
                <p className="text-slate-500 text-xs font-mono">No selfie on record</p>
              </>
            )}
          </div>
          <div
            className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 border"
            style={{ background: `${matchColor}1a`, borderColor: `${matchColor}33` }}
          >
            <CircleProgress value={faceMatch} size={32} />
            <span className="text-xs font-mono font-bold" style={{ color: matchColor }}>
              {faceMatch}% Face Match
            </span>
            <span className="ml-auto text-[10px] font-mono text-slate-500">
              {faceMatch >= 80 ? "✓ Strong" : faceMatch >= 60 ? "⚠ Moderate" : "✗ Weak"}
            </span>
          </div>
        </Panel>
      </div>

      {/* Extracted details */}
      {detail && (
        <Panel>
          <SectionHeader title="Extracted Details" subtitle="Parsed from Aadhaar XML" />
          <div className="grid grid-cols-3 gap-3 text-sm font-mono">
            {[
              ["Full Name",   detail.full_name               || "—"],
              ["Date of Birth", detail.dob                   || "—"],
              ["Address",    detail.address                  || "—"],
              ["KYC Status", detail.kyc_status               || "—"],
              ["Face Score", faceMatch ? `${faceMatch}%`     : "—"],
              ["Signature",  detail.signature_valid ? "Valid" : detail.signature_valid === false ? "Failed" : "—"],
            ].map(([label, value]) => (
              <div key={label} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">{label}</p>
                <p className="text-white text-xs truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* XML Hash */}
          {detail.aadhaar_xml_hash && (
            <div className="mt-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">XML Hash</p>
              <p className="text-slate-300 text-xs font-mono break-all">{detail.aadhaar_xml_hash}</p>
            </div>
          )}

          {/* Blockchain TX */}
          {txHash && (
            <div className="mt-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-emerald-400 text-[10px] uppercase tracking-wide font-bold">Blockchain TX Hash</p>
                </div>
                <button
                  onClick={() => handleCopyHash(txHash)}
                  className="text-[10px] font-mono text-slate-400 hover:text-emerald-400 transition-all flex items-center gap-1"
                >
                  <Fingerprint size={10} />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-white text-xs font-mono break-all">{txHash}</p>
            </div>
          )}
        </Panel>
      )}

      {/* Analyst decision */}
      <Panel>
        <SectionHeader title="Analyst Decision" subtitle="Action will update the user's KYC status" />
        <div className="flex gap-4">
          <button
            onClick={() => handleAction("APPROVE")}
            disabled={!!actioning}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-xl font-mono text-sm transition-all flex items-center justify-center gap-2"
          >
            {actioning === "APPROVE"
              ? <Loader2 size={15} className="animate-spin" />
              : <Check size={15} />}
            Approve KYC
          </button>
          <button
            onClick={() => handleAction("REJECT")}
            disabled={!!actioning}
            className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 text-rose-400 border border-rose-500/30 rounded-xl font-mono text-sm transition-all flex items-center justify-center gap-2"
          >
            {actioning === "REJECT"
              ? <Loader2 size={15} className="animate-spin" />
              : <Ban size={15} />}
            Reject & Flag
          </button>
          <button
            onClick={() => handleAction("DEFER")}
            disabled={!!actioning}
            className="py-3 px-6 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-xl font-mono text-sm transition-all flex items-center gap-2"
          >
            {actioning === "DEFER"
              ? <Loader2 size={15} className="animate-spin" />
              : <Clock size={15} />}
            Defer
          </button>
        </div>
      </Panel>

    </div>
  );
}