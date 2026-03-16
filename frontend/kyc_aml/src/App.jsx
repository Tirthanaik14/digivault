// src/App.jsx

import { useApp } from "./context/AppContext";
import Sidebar      from "./components/layout/Sidebar";
import TopBar       from "./components/layout/TopBar";
import PortalRouter from "./components/PortalRouter";
import Login        from "./components/auth/Login";

function AppShell() {
  const { collapsed, activePortal, activeSection, isLoggedIn } = useApp();

  // Show login page if not authenticated
  if (!isLoggedIn) return <Login />;

  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar />
      <TopBar  />
      <main
        className="pt-14 min-h-screen transition-all duration-300"
        style={{ marginLeft: collapsed ? "4rem" : "16rem" }}
      >
        <div className="max-w-6xl mx-auto p-8">
          <div key={`${activePortal}-${activeSection}`} className="page-enter">
            <PortalRouter />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
