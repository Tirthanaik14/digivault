// src/components/shared/Panel.jsx

export default function Panel({ children, className = "" }) {
  return (
    <div
      className={`bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}
