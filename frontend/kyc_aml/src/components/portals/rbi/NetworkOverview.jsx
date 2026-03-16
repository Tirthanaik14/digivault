// src/components/portals/rbi/NetworkOverview.jsx

import { useState, useEffect, useRef } from "react";
import { Users, Building2, Flag, Activity, Shield, AlertTriangle, Globe, RefreshCw, Volume2 } from "lucide-react";
import { Panel, SectionHeader, StatCard } from "../../shared";
import { api } from "../../../utils/api";

// ── Animated map node ─────────────────────────────────────────────────────────
const MAP_NODES = [
  { id: 1,  x: 18, y: 30, label: "Mumbai",    risk: "high",   size: 14 },
  { id: 2,  x: 28, y: 22, label: "Delhi",     risk: "medium", size: 12 },
  { id: 3,  x: 42, y: 55, label: "Chennai",   risk: "low",    size: 10 },
  { id: 4,  x: 35, y: 38, label: "Hyderabad", risk: "medium", size: 11 },
  { id: 5,  x: 22, y: 48, label: "Pune",      risk: "low",    size: 9  },
  { id: 6,  x: 55, y: 28, label: "Kolkata",   risk: "high",   size: 12 },
  { id: 7,  x: 14, y: 18, label: "Chandigarh",risk: "low",    size: 8  },
  { id: 8,  x: 48, y: 42, label: "Bengaluru", risk: "medium", size: 10 },
  { id: 9,  x: 62, y: 45, label: "Bhubaneswar",risk:"low",    size: 8  },
  { id: 10, x: 30, y: 60, label: "Coimbatore",risk: "low",    size: 7  },
  { id: 11, x: 8,  y: 40, label: "Ahmedabad", risk: "medium", size: 10 },
  { id: 12, x: 70, y: 20, label: "Guwahati",  risk: "low",    size: 7  },
];

const RISK_COLOR = { high: "#f87171", medium: "#fbbf24", low: "#34d399" };

function MapNode({ node, active, onClick }) {
  const color = RISK_COLOR[node.risk];
  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={() => onClick(node)}
    >
      {/* Outer pulse ring */}
      {node.risk === "high" && (
        <circle
          cx={node.x + "%"}
          cy={node.y + "%"}
          r={node.size + 6}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
          style={{ animation: `pulseRing 2s ease-out infinite` }}
        />
      )}
      {/* Main dot */}
      <circle
        cx={node.x + "%"}
        cy={node.y + "%"}
        r={active ? node.size + 2 : node.size}
        fill={color}
        opacity={active ? 1 : 0.7}
        style={{ transition: "r 0.2s, opacity 0.2s", filter: active ? `drop-shadow(0 0 8px ${color})` : "none" }}
      />
      {/* Label */}
      {active && (
        <text
          x={node.x + "%"}
          y={(node.y - 3) + "%"}
          textAnchor="middle"
          fill="white"
          fontSize="3.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {node.label}
        </text>
      )}
    </g>
  );
}

// ── Ticker item ───────────────────────────────────────────────────────────────
function TickerItem({ text, color }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 whitespace-nowrap">
      <span style={{ color, fontSize: "10px" }}>◆</span>
      <span className="text-slate-400 text-xs font-mono">{text}</span>
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NetworkOverview() {
  const [overview,     setOverview]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [activeNode,   setActiveNode]   = useState(null);
  const [speaking,     setSpeaking]     = useState(false);
  const tickerRef = useRef(null);

  const fetchOverview = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    api.getOverview()
      .then((data) => setOverview(data))
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { fetchOverview(); }, []);

  const handleVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const banks   = overview?.active_banks   ?? 47;
    const alerts  = overview?.aml_alerts     ?? 156;
    const flagged = overview?.flagged_entities ?? 31;
    const msg = `RBI Command Center status. ${banks} banks are currently active. ${alerts} AML alerts are open. ${flagged} entities are flagged for review. System-wide KYC verification rate is above 98 percent.`;
    const u = new window.SpeechSynthesisUtterance(msg);
    u.rate = 0.95;
    u.onstart = () => setSpeaking(true);
    u.onend   = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const d = overview;

  const TICKER_ITEMS = [
    { text: "SYSTEM NOMINAL · All nodes reporting",                      color: "#34d399" },
    { text: `${d?.active_banks ?? 47} ACTIVE INSTITUTIONS`,             color: "#fbbf24" },
    { text: `${d?.aml_alerts ?? 156} OPEN AML CASES`,                   color: "#f87171" },
    { text: `KYC VERIFICATION RATE ${d?.kyc_rate ?? "98.1%"}`,          color: "#34d399" },
    { text: `TXN VOLUME ₹${d?.txn_volume ?? "84.2Cr"} LAST 24H`,        color: "#38bdf8" },
    { text: `${d?.flagged_entities ?? 31} ENTITIES UNDER REVIEW`,       color: "#f87171" },
    { text: "BLOCKCHAIN ANCHORING ACTIVE · UIDAI CONNECTED",            color: "#34d399" },
  ];

  return (
    <>
      <style>{`
        @keyframes pulseRing {
          0%   { r: 14; opacity: 0.5; }
          100% { r: 28; opacity: 0; }
        }
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rbi-stat {
          animation: fadeInUp 0.5s ease both;
        }
        .ticker-track {
          display: flex;
          animation: tickerScroll 28s linear infinite;
          width: max-content;
        }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>

      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 text-[10px] font-mono uppercase tracking-widest">RBI Command Center</span>
            </div>
            <h2 className="text-white text-2xl font-bold tracking-tight">Network Overview</h2>
            <p className="text-slate-400 text-sm">System-wide financial surveillance · Central Bank visibility</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleVoice}
              className={`flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg border transition-all
                ${speaking
                  ? "text-amber-400 bg-amber-500/20 border-amber-500/30 animate-pulse"
                  : "text-slate-400 bg-slate-800 border-slate-700 hover:bg-slate-700"}`}
            >
              <Volume2 size={13} /> Briefing
            </button>
            <button
              onClick={() => fetchOverview(true)}
              disabled={refreshing}
              className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Live ticker ── */}
        <div className="overflow-hidden border border-amber-500/20 rounded-xl bg-amber-500/5 py-2.5 relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <TickerItem key={i} text={item.text} color={item.color} />
            ))}
          </div>
        </div>

        {/* ── Primary stats ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rbi-stat" style={{ animationDelay: "0.05s" }}>
            <StatCard icon={Users}     label="Total Users"      value={d?.total_users      ?? "1.24M"} sub="+2.3% this week"   color="emerald" />
          </div>
          <div className="rbi-stat" style={{ animationDelay: "0.1s" }}>
            <StatCard icon={Building2} label="Active Banks"     value={d?.active_banks     ?? 47}      sub="of 52 registered"  color="sky"     />
          </div>
          <div className="rbi-stat" style={{ animationDelay: "0.15s" }}>
            <StatCard icon={Flag}      label="Flagged Entities" value={d?.flagged_entities ?? 31}      sub="Requires review"   color="rose"    />
          </div>
        </div>

        {/* ── Secondary stats ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rbi-stat" style={{ animationDelay: "0.2s" }}>
            <StatCard icon={Activity}      label="Txn Volume"   value={d?.txn_volume   ?? "₹84.2Cr"} sub="Last 24 hours"    color="amber"   />
          </div>
          <div className="rbi-stat" style={{ animationDelay: "0.25s" }}>
            <StatCard icon={Shield}        label="KYC Verified" value={d?.kyc_rate     ?? "98.1%"}   sub="System-wide rate" color="emerald" />
          </div>
          <div className="rbi-stat" style={{ animationDelay: "0.3s" }}>
            <StatCard icon={AlertTriangle} label="AML Alerts"   value={d?.aml_alerts   ?? 156}       sub="Open cases"       color="rose"    />
          </div>
        </div>

        {/* ── India Bank Activity Map ── */}
        <Panel>
          <SectionHeader
            title="Bank Activity Map"
            subtitle="Click a node to inspect · Red = high risk · Amber = medium · Green = low"
          />
          <div className="relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden" style={{ aspectRatio: "16/7" }}>

            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`v${i}`} x1={`${i * 11}%`} y1="0" x2={`${i * 11}%`} y2="100%" stroke="#94a3b8" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={`${i * 20}%`} x2="100%" y2={`${i * 20}%`} stroke="#94a3b8" strokeWidth="0.5" />
              ))}
            </svg>

            {/* India outline suggestion — decorative arc */}
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M 10 5 Q 40 2 65 8 Q 78 14 75 30 Q 72 45 55 55 Q 40 62 28 56 Q 10 48 8 30 Z" fill="none" stroke="#fbbf24" strokeWidth="0.5" />
            </svg>

            {/* Connection lines between nodes */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              {MAP_NODES.slice(0, 8).map((node, i) => {
                const next = MAP_NODES[(i + 2) % 8];
                return (
                  <line
                    key={i}
                    x1={node.x + "%"} y1={node.y + "%"}
                    x2={next.x + "%"} y2={next.y + "%"}
                    stroke="#334155" strokeWidth="0.4"
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              {MAP_NODES.map((node) => (
                <MapNode
                  key={node.id}
                  node={node}
                  active={activeNode?.id === node.id}
                  onClick={setActiveNode}
                />
              ))}
            </svg>

            {/* Node detail tooltip */}
            {activeNode && (
              <div className="absolute bottom-3 left-3 bg-slate-900/95 border border-slate-700 rounded-xl px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLOR[activeNode.risk] }} />
                  <span className="text-white text-sm font-bold">{activeNode.label}</span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                    style={{
                      color: RISK_COLOR[activeNode.risk],
                      background: `${RISK_COLOR[activeNode.risk]}15`,
                      borderColor: `${RISK_COLOR[activeNode.risk]}30`,
                    }}
                  >
                    {activeNode.risk.toUpperCase()} RISK
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-mono">Click another node to compare</p>
              </div>
            )}

            {/* Legend */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-slate-900/80 border border-slate-700 rounded-lg p-2.5 backdrop-blur-sm">
              {Object.entries(RISK_COLOR).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: v }} />
                  <span className="text-[10px] font-mono text-slate-400 capitalize">{k}</span>
                </div>
              ))}
            </div>

            {/* Bottom label */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
              <Globe size={12} className="text-slate-600" />
              <span className="text-[10px] font-mono text-slate-600">India Financial Network</span>
            </div>
          </div>
        </Panel>

      </div>
    </>
  );
}