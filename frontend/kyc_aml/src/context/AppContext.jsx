// src/context/AppContext.jsx

import { createContext, useContext, useState, useEffect } from "react";
import { PORTALS } from "../utils/constants";
import { api } from "../utils/api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Navigation ────────────────────────────────────────────────────────────
  const [activePortal,  setActivePortal]  = useState("user");
  const [activeSection, setActiveSection] = useState("dashboard");

  // ── Layout ────────────────────────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  // currentUser = { user_id, role, full_name, access_token } or null
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn,  setIsLoggedIn]  = useState(false);

  // ── User Portal ───────────────────────────────────────────────────────────
  const [kycStep,      setKycStep]      = useState(0);
  const [dashboardData,setDashboardData]= useState(null);

  // ── Bank Analyst Portal ───────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Auth: Login ───────────────────────────────────────────────────────────
  async function login(email, password, role) {
    const data = await api.login(email, password, role);
    // Store token globally so api.js picks it up on every subsequent call
    window.__authToken = data.access_token;
    setCurrentUser(data);
    setIsLoggedIn(true);
    // Navigate to the correct portal after login
    switchPortal(data.role === "analyst" ? "bank" : data.role === "regulator" ? "rbi" : "user");
    return data;
  }

  // ── Auth: Signup ──────────────────────────────────────────────────────────
  async function signup(email, password, fullName, role = "user") {
    const data = await api.signup(email, password, fullName, role);
    window.__authToken = data.access_token;
    setCurrentUser(data);
    setIsLoggedIn(true);
    switchPortal("user");
    return data;
  }

  // ── Auth: Logout ──────────────────────────────────────────────────────────
  function logout() {
    window.__authToken = null;
    setCurrentUser(null);
    setIsLoggedIn(false);
    setActivePortal("user");
    setActiveSection("dashboard");
  }

  // ── Fetch dashboard data when user logs in ────────────────────────────────
  // ── Fetch dashboard data when user logs in ────────────────────────────────
  useEffect(() => {
    if (isLoggedIn && currentUser?.role === "user") {
      api.getDashboard()
        .then((data) => {
          setDashboardData(data);
          
          // NEW: Dynamically inject the live KYC status into the currentUser object!
          // This ensures the AML Simulator unlocks instantly without needing a re-login.
          if (data.kyc_status) {
            setCurrentUser(prev => ({ ...prev, kyc_status: data.kyc_status }));
          }

          // Derive kycStep from the 5 booleans
          const steps = data.kyc_steps;
          const stepValues = [
            steps.profile_created,
            steps.document_uploaded,
            steps.signature_verified,
            steps.face_matched,
            steps.blockchain_anchored,
          ];
          // Find the last completed step index
          const lastDone = stepValues.lastIndexOf(true);
          setKycStep(lastDone === 4 ? 4 : lastDone + 1);
        })
        .catch(() => {}); // silently fail if not logged in yet
    }
  }, [isLoggedIn]);
  // ── Convenience: switch portal ────────────────────────────────────────────
  function switchPortal(portalId) {
    const portal = PORTALS.find((p) => p.id === portalId);
    setActivePortal(portalId);
    setActiveSection(portal?.sections[0].id || "dashboard");
  }

  // ── Convenience: open user detail in analyst portal ───────────────────────
  function openUserDetail(user) {
    setSelectedUser(user);
    setActiveSection("detail");
  }

  return (
    <AppContext.Provider
      value={{
        // navigation
        activePortal,
        activeSection,
        setActivePortal: switchPortal,
        setActiveSection,

        // layout
        collapsed,
        setCollapsed,

        // auth
        currentUser,
        isLoggedIn,
        login,
        signup,
        logout,

        // user portal
        kycStep,
        setKycStep,
        dashboardData,
        setDashboardData,

        // bank analyst portal
        selectedUser,
        openUserDetail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
