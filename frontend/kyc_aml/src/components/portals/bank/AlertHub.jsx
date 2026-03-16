// src/components/portals/bank/AlertHub.jsx

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, AlertCircle, CheckCircle, Check, Lock, Clock, Loader2, RefreshCw, Volume2 } from "lucide-react";
import { Panel, SectionHeader, StatCard } from "../../shared";
import { api } from "../../../utils/api";

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const pct   = Math.round(score * 100);
  const color = score > 0.7 ? "#f87171" : score > 0.4 ? "#fbbf24" : "#34d399";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>{score.toFixed(2)}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AlertHub() {
  const [alerts,     setAlerts]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");
  const [speaking,   setSpeaking]   = useState(false);

  // ── Voice: browser speech synthesis (no backend call) ────────────────────
  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.onstart = () => setSpeaking(true);
    u.onend   = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  // ── Fetch alerts ──────────────────────────────────────────────────────────
  const fetchAlerts = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    api.getAmlAlerts()
      .then((data) => {
        const mapped = (data.alerts || []).map((a) => ({
          id:         a.transaction_id,
          entity:     a.full_name      || "Unknown",
          amount:     a.amount         ?? 0,
          time:       a.created_at
                        ? new Date(a.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                        : "—",
          score:      a.anomaly_score  ?? 0,
          is_flagged: a.is_flagged,
          status:     a.status         || "PENDING",
          _action:    a.status !== "PENDING" ? a.status.toLowerCase() : null,
        }));
        setAlerts(mapped);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  // Fetch on mount + auto-poll every 10 seconds
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(), 10000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAction = async (id, type) => {
    try {
      await api.analystAction(id, type.toUpperCase());

      // Speak alert for high-severity actions
      if (type === "freeze") speak("Account frozen. Suspicious transaction has been blocked.");
      if (type === "report") speak("Transaction reported to the Financial Intelligence Unit.");

      fetchAlerts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVoiceGuide = () => {
    const highCount = alerts.filter((a) => a.score > 0.7 && !a._action).length;
    const total     = alerts.length;
    const actioned  = alerts.filter((a) => a._action).length;

    if (total === 0) {
      speak("No transactions in the system yet. Use the AML simulator to generate test transactions.");
    } else if (highCount > 0) {
      speak(`Alert. You have ${highCount} high risk transaction${highCount > 1 ? "s" : ""} requiring immediate attention out of ${total} total. ${actioned} have been actioned.`);
    } else {
      speak(`All clear. ${total} transactions monitored, ${actioned} actioned. No high risk alerts at this time.`);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const highCount     = alerts.filter((a) => a.score > 0.7 && !a._action).length;
  const mediumCount   = alerts.filter((a) => a.score > 0.4 && a.score <= 0.7).length;
  const actionedCount = alerts.filter((a) => a._action).length;

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
          <h2 className="text-white text-2xl font-bold tracking-tight">Alert Hub</h2>
          <p className="text-slate-400 text-sm">Real-time AML anomaly detection · auto-refreshes every 10s</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleVoiceGuide}
            className={`flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg border transition-all
              ${speaking
                ? "text-emerald-400 bg-emerald-500/20 border-emerald-500/30 animate-pulse"
                : "text-slate-400 bg-slate-800 border-slate-700 hover:bg-slate-700"}`}
          >
            <Volume2 size={13} /> Voice Brief
          </button>
          <button
            onClick={() => fetchAlerts(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
          <p className="text-rose-400 text-sm font-mono">{error}</p>
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={AlertCircle}  label="High Risk"   value={highCount}     sub="Score > 0.7 · unresolved" color="rose"    />
        <StatCard icon={AlertTriangle} label="Medium Risk" value={mediumCount}   sub="Score 0.4 – 0.7"          color="amber"   />
        <StatCard icon={CheckCircle}  label="Actioned"    value={actionedCount}  sub="Resolved this session"    color="emerald" />
      </div>

      {/* Live feed */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Panel>
            <div className="py-12 text-center">
              <AlertTriangle size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-mono">No transactions yet</p>
              <p className="text-slate-600 text-xs font-mono mt-1">Use the AML Simulator to generate test data</p>
            </div>
          </Panel>
        ) : alerts.map((alert) => {
          const isHigh   = alert.score > 0.7;
          const resolved = Boolean(alert._action);

          return (
            <div
              key={alert.id}
              className={`relative border rounded-xl p-4 transition-all overflow-hidden
                ${isHigh && !resolved
                  ? "border-rose-500/40 bg-rose-500/5"
                  : resolved && alert._action === "approved"
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : resolved
                      ? "border-slate-600/30 bg-slate-800/30"
                      : "border-slate-700 bg-slate-800/40"}`}
            >
              {/* Pulse overlay for unresolved high risk */}
              {isHigh && !resolved && (
                <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" style={{ animationDuration: "2s" }} />
              )}

              <div className="relative flex items-center gap-4">

                {/* Icon */}
                <div className={`p-2.5 rounded-xl shrink-0 ${isHigh ? "bg-rose-500/20" : "bg-amber-500/10"}`}>
                  {isHigh
                    ? <AlertCircle  size={18} className="text-rose-400" />
                    : <AlertTriangle size={18} className="text-amber-400" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-white text-sm font-semibold">{alert.entity}</p>
                    {isHigh && !resolved && (
                      <span className="text-[10px] font-mono text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse inline-block" />
                        HIGH RISK
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-500 flex-wrap">
                    <span>₹{alert.amount.toLocaleString("en-IN")}</span>
                    <span>·</span>
                    <span>{alert.time}</span>
                    <span>·</span>
                    <span>TX #{alert.id}</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="hidden sm:block">
                  <ScoreBar score={alert.score} />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 shrink-0">
                  {!resolved ? (
                    <>
                      <button
                        onClick={() => handleAction(alert.id, "approve")}
                        className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                      >
                        <Check size={12} /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(alert.id, "freeze")}
                        className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition-all flex items-center gap-1"
                      >
                        <Lock size={12} /> Freeze
                      </button>
                      <button
                        onClick={() => handleAction(alert.id, "report")}
                        className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-all flex items-center gap-1"
                      >
                        <Clock size={12} /> Report
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs font-mono px-3 py-1.5 rounded-lg border
                      ${alert._action === "approved"
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : alert._action === "frozen" || alert._action === "freeze"
                          ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                          : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}
                    >
                      {alert._action === "approved"                           ? "✓ Approved"
                       : alert._action === "frozen" || alert._action === "freeze" ? "⬡ Frozen"
                       : "⚑ Reported"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}