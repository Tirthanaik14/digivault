// src/components/layout/Sidebar.jsx

import { ChevronRight, Shield, Menu, LogOut } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { PORTALS, PORTAL_COLORS } from "../../utils/constants";

export default function Sidebar() {
  const {
    activePortal,
    activeSection,
    setActivePortal,
    setActiveSection,
    collapsed,
    setCollapsed,
    currentUser,
    logout,
  } = useApp();

  const filteredPortals = PORTALS.filter((portal) => {
  const role = currentUser?.role?.toLowerCase() || "";

  if (role.includes("analyst") || role.includes("bank")) {
    return portal.id === "bank";
  }

  if (role.includes("rbi") || role.includes("regulator") || role.includes("central")) {
    return portal.id === "rbi";
  }

  return portal.id === "user";
});

  // Final Safety Check: If filtering resulted in 0 items, show all (prevents the black void)
  const displayPortals = filteredPortals.length > 0 ? filteredPortals : PORTALS;

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-slate-950 border-r border-slate-800
        flex flex-col transition-all duration-300 z-50
        ${collapsed ? "w-16" : "w-64"}`}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white text-sm font-bold tracking-tight leading-none">DigiVault</p>
            <p className="text-slate-500 text-[10px] font-mono leading-none mt-0.5">Identity & AML</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-slate-500 hover:text-white">
          {collapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {displayPortals.map((portal) => {
          const PortalIcon = portal.icon;
          const c = PORTAL_COLORS[portal.color] || PORTAL_COLORS.blue;
          const isActive = activePortal === portal.id;

          return (
            <div key={portal.id}>
              <button
                onClick={() => setActivePortal(portal.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                  ${isActive ? `${c.bg} border ${c.border}` : "hover:bg-slate-800"}`}
              >
                <PortalIcon size={17} className={isActive ? c.text : "text-slate-500"} />
                {!collapsed && (
                  <span className={`text-sm font-medium flex-1 text-left ${isActive ? "text-white" : "text-slate-400"}`}>
                    {portal.label}
                  </span>
                )}
              </button>

              {/* THIS PART RENDERS YOUR MISSING SECTIONS */}
              {isActive && !collapsed && portal.sections && (
                <div className="ml-4 mt-1 pl-3 border-l border-slate-800 space-y-0.5">
                  {portal.sections.map((sec) => {
                    const SecIcon = sec.icon;
                    const isSec = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setActiveSection(sec.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left
                          ${isSec ? `${c.bg} ${c.text}` : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                      >
                        <SecIcon size={14} />
                        <span className="text-xs font-mono">{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{currentUser?.full_name}</p>
              <p className="text-slate-500 text-[10px] font-mono uppercase">{currentUser?.role}</p>
            </div>
          )}
          <button onClick={logout} className="text-slate-500 hover:text-rose-400">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}