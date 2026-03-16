// src/components/shared/Badge.jsx

const STYLES = {
  safe:     "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  flagged:  "bg-rose-500/20    text-rose-400    border-rose-500/30",
  verified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending:  "bg-amber-500/20   text-amber-400   border-amber-500/30",
  failed:   "bg-rose-500/20    text-rose-400    border-rose-500/30",
  low:      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium:   "bg-amber-500/20   text-amber-400   border-amber-500/30",
  high:     "bg-rose-500/20    text-rose-400    border-rose-500/30",
};

export default function Badge({ status }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider border ${STYLES[status] ?? ""}`}
    >
      {status}
    </span>
  );
}
