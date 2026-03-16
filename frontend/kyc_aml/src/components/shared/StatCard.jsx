// src/components/shared/StatCard.jsx

const STYLES = {
  emerald: { card: "bg-emerald-500/10 border-emerald-500/20", icon: "text-emerald-400" },
  rose:    { card: "bg-rose-500/10    border-rose-500/20",    icon: "text-rose-400"    },
  sky:     { card: "bg-sky-500/10     border-sky-500/20",     icon: "text-sky-400"     },
  amber:   { card: "bg-amber-500/10   border-amber-500/20",   icon: "text-amber-400"   },
};

export default function StatCard({ icon: Icon, label, value, sub, color = "emerald" }) {
  const s = STYLES[color] ?? STYLES.emerald;
  return (
    <div className={`${s.card} border rounded-xl p-5 flex items-start gap-4`}>
      <div className="p-2 rounded-lg bg-slate-800 shrink-0">
        <Icon size={20} className={s.icon} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl font-bold font-mono ${s.icon}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
