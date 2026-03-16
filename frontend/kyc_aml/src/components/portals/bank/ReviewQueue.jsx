// src/components/portals/bank/ReviewQueue.jsx

import { useState, useEffect, useCallback } from "react";
import { Filter, Eye, Loader2, RefreshCw } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { Panel, SectionHeader, Badge, CircleProgress } from "../../shared";
import { api } from "../../../utils/api";

// ── Avatar color palette based on initials ────────────────────────────────────
const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
];

function getAvatarColor(name = "") {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";
}

// ── KYC Status Badge ──────────────────────────────────────────────────────────
function KycBadge({ status }) {
  const map = {
    VERIFIED: { label: "Verified",  cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    PENDING:  { label: "Pending",   cls: "text-amber-400  bg-amber-500/10  border-amber-500/30"  },
    REJECTED: { label: "Rejected",  cls: "text-rose-400   bg-rose-500/10   border-rose-500/30"   },
  };
  const { label, cls } = map[status] || map.PENDING;
  return (
    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

// ── Risk Badge ────────────────────────────────────────────────────────────────
function RiskBadge({ score }) {
  if (score >= 80) return <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">Low</span>;
  if (score >= 60) return <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border text-amber-400 bg-amber-500/10 border-amber-500/30">Medium</span>;
  return               <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border text-rose-400 bg-rose-500/10 border-rose-500/30">High</span>;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReviewQueue() {
  const { openUserDetail } = useApp();
  const [queue,     setQueue]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState("");

  const fetchQueue = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    api.getKycQueue()
      .then((data) => {
        const mapped = (data.queue || []).map((u) => ({
          id:            u.user_id,
          name:          u.full_name || "Unknown",
          initials:      getInitials(u.full_name),
          avatarColor:   getAvatarColor(u.full_name),
          faceMatch:     u.face_match_pct ?? 0,
          sigValid:      u.signature_valid,
          kyc_status:    u.kyc_status || "PENDING",
          email:         u.email || "—",
          submittedAt:   u.submitted_at
                           ? new Date(u.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                           : "—",
        }));
        setQueue(mapped);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const verifiedCount = queue.filter((u) => u.kyc_status === "VERIFIED").length;
  const pendingCount  = queue.filter((u) => u.kyc_status === "PENDING").length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="text-emerald-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-2xl font-bold tracking-tight">Review Queue</h2>
          <p className="text-slate-400 text-sm">KYC submissions requiring analyst review</p>
        </div>
        <button
          onClick={() => fetchQueue(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && <p className="text-rose-400 text-sm font-mono bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">{error}</p>}

      {/* Summary chips */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-xs font-mono text-slate-400">Total: <span className="text-white font-bold">{queue.length}</span></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-mono text-emerald-400">Verified: <span className="font-bold">{verifiedCount}</span></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono text-amber-400">Pending: <span className="font-bold">{pendingCount}</span></span>
        </div>
      </div>

      {/* Table */}
      <Panel>
        <SectionHeader
          title="All Submissions"
          subtitle={`${queue.length} users in database`}
          actions={
            <button className="text-xs font-mono text-slate-400 bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-600 transition-all">
              <Filter size={12} /> Filter
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {["User", "Face Match", "Signature", "KYC Status", "Risk", "Submitted", "Action"].map((h) => (
                  <th key={h} className="text-left text-xs font-mono uppercase tracking-wider text-slate-500 pb-3 pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm font-mono">
                    No KYC submissions yet
                  </td>
                </tr>
              ) : queue.map((u) => (
                <tr key={u.id} className="hover:bg-slate-700/20 transition-all group">

                  {/* User */}
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${u.avatarColor} flex items-center justify-center text-xs font-bold text-white font-mono shrink-0`}>
                        {u.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{u.name}</p>
                        <p className="text-slate-500 text-[10px] font-mono">ID #{u.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Face Match */}
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <CircleProgress value={u.faceMatch} />
                      <span className={`text-sm font-mono font-bold
                        ${u.faceMatch >= 80 ? "text-emerald-400"
                        : u.faceMatch >= 60 ? "text-amber-400"
                        : "text-rose-400"}`}>
                        {u.faceMatch}%
                      </span>
                    </div>
                  </td>

                  {/* Signature */}
                  <td className="py-4 pr-4">
                    {u.sigValid === true  && <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">Valid</span>}
                    {u.sigValid === false && <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border text-rose-400 bg-rose-500/10 border-rose-500/30">Failed</span>}
                    {u.sigValid == null   && <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border text-slate-400 bg-slate-500/10 border-slate-500/30">N/A</span>}
                  </td>

                  {/* KYC Status */}
                  <td className="py-4 pr-4">
                    <KycBadge status={u.kyc_status} />
                  </td>

                  {/* Risk */}
                  <td className="py-4 pr-4">
                    <RiskBadge score={u.faceMatch} />
                  </td>

                  {/* Submitted */}
                  <td className="py-4 pr-4">
                    <span className="text-xs font-mono text-slate-400">{u.submittedAt}</span>
                  </td>

                  {/* Action */}
                  <td className="py-4">
                    <button
                      onClick={() => openUserDetail(u)}
                      className="text-xs font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-lg hover:bg-sky-500/20 transition-all flex items-center gap-1"
                    >
                      <Eye size={12} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}