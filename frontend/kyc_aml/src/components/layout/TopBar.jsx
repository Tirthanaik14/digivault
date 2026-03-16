// src/components/layout/TopBar.jsx

import { Bell, ChevronRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { PORTALS, PORTAL_COLORS } from "../../utils/constants";

export default function TopBar() {
  const { activePortal, activeSection, collapsed } = useApp();

  const portal  = PORTALS.find((p) => p.id === activePortal);
  const section = portal?.sections.find((s) => s.id === activeSection);
  const c       = PORTAL_COLORS[portal?.color ?? "emerald"];

  return (
    <header
      className={`fixed top-0 right-0 h-14 bg-slate-950/80 backdrop-blur border-b border-slate-800
        flex items-center gap-4 px-6 z-40 transition-all duration-300
        ${collapsed ? "left-16" : "left-64"}`}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
        <span className={c.text}>{portal?.label}</span>
        <ChevronRight size={12} />
        <span className="text-white">{section?.label}</span>
      </div>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          System Online
        </div>

        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <div
          className={`text-xs font-mono px-3 py-1 rounded-full border ${c.bg} ${c.border} ${c.text}`}
        >
          {portal?.label}
        </div>
      </div>
    </header>
  );
}
