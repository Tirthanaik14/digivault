import { useState, useEffect, useRef } from "react";
import { Shield, Eye, EyeOff, Loader2, ArrowLeft, Fingerprint, BarChart3, Scale } from "lucide-react";
import { useApp } from "../../context/AppContext";

const PORTALS = [
  {
    id: "user",
    role: "user",
    label: "Citizen",
    sublabel: "Identity Verification",
    icon: Fingerprint,
    color: "#00FFB2",
    glow: "rgba(0,255,178,0.4)",
    dimColor: "rgba(0,255,178,0.08)",
    borderColor: "rgba(0,255,178,0.3)",
    demo: "aditya@demo.com",
    description: "Submit & track your KYC verification status",
    grid: [
      [1,0,1,0,1],[0,1,0,1,0],[1,0,1,0,1],[0,1,0,1,0],[1,0,1,0,1]
    ],
    particles: ["⬡","◈","⬢"],
  },
  {
    id: "analyst",
    role: "analyst",
    label: "Analyst",
    sublabel: "AML Intelligence",
    icon: BarChart3,
    color: "#38BFFF",
    glow: "rgba(56,191,255,0.4)",
    dimColor: "rgba(56,191,255,0.08)",
    borderColor: "rgba(56,191,255,0.3)",
    demo: "analyst@demo.com",
    description: "Monitor transactions & flag suspicious activity",
    grid: [
      [0,1,1,1,0],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,0,1],[0,1,1,1,0]
    ],
    particles: ["△","◇","▷"],
  },
  {
    id: "regulator",
    role: "regulator",
    label: "Regulator",
    sublabel: "Compliance Oversight",
    icon: Scale,
    color: "#FFB347",
    glow: "rgba(255,179,71,0.4)",
    dimColor: "rgba(255,179,71,0.08)",
    borderColor: "rgba(255,179,71,0.3)",
    demo: "rbi@demo.com",
    description: "Audit reports, compliance enforcement & policy",
    grid: [
      [1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0]
    ],
    particles: ["■","▪","◼"],
  },
];

function FloatingParticle({ char, color, delay, duration, startX, startY }) {
  return (
    <span
      style={{
        position: "absolute",
        left: `${startX}%`,
        top: `${startY}%`,
        color,
        opacity: 0,
        fontSize: "10px",
        animation: `floatUp ${duration}s ease-in ${delay}s infinite`,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {char}
    </span>
  );
}

function PortalCard({ portal, onClick, index }) {
  const [hovered, setHovered] = useState(false);
  const [particles, setParticles] = useState([]);
  const Icon = portal.icon;

  useEffect(() => {
    const p = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      char: portal.particles[i % portal.particles.length],
      startX: 10 + Math.random() * 80,
      startY: 20 + Math.random() * 60,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    }));
    setParticles(p);
  }, []);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        cursor: "pointer",
        background: hovered ? portal.dimColor : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? portal.borderColor : "rgba(255,255,255,0.08)"}`,
        borderRadius: "20px",
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        transform: hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: hovered ? `0 20px 60px ${portal.glow}, 0 0 0 1px ${portal.borderColor}` : "none",
        overflow: "hidden",
        animation: `cardEntrance 0.6s cubic-bezier(0.23, 1, 0.32, 1) ${index * 0.15}s both`,
        minHeight: "280px",
        justifyContent: "center",
      }}
    >
      {/* Animated grid background */}
      <div style={{ position: "absolute", inset: 0, opacity: hovered ? 0.15 : 0.04, transition: "opacity 0.4s" }}>
        {portal.grid.map((row, ri) =>
          row.map((cell, ci) =>
            cell ? (
              <div
                key={`${ri}-${ci}`}
                style={{
                  position: "absolute",
                  width: "6px",
                  height: "6px",
                  borderRadius: "1px",
                  background: portal.color,
                  left: `${15 + ci * 18}%`,
                  top: `${15 + ri * 17}%`,
                  animation: hovered ? `pulse 1.5s ease-in-out ${(ri + ci) * 0.1}s infinite` : "none",
                }}
              />
            ) : null
          )
        )}
      </div>

      {/* Floating particles */}
      {hovered && particles.map((p) => (
        <FloatingParticle key={p.id} color={portal.color} {...p} />
      ))}

      {/* Glow orb */}
      <div style={{
        position: "absolute",
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        background: portal.glow,
        filter: "blur(40px)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: hovered ? 0.5 : 0,
        transition: "opacity 0.4s",
        pointerEvents: "none",
      }} />

      {/* Icon ring */}
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "18px",
        border: `2px solid ${hovered ? portal.color : "rgba(255,255,255,0.1)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: hovered ? `${portal.dimColor}` : "rgba(255,255,255,0.03)",
        transition: "all 0.4s",
        boxShadow: hovered ? `0 0 20px ${portal.glow}` : "none",
        position: "relative",
        zIndex: 1,
      }}>
        <Icon size={28} style={{ color: hovered ? portal.color : "rgba(255,255,255,0.4)", transition: "color 0.4s" }} />
      </div>

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "18px",
          fontWeight: "700",
          color: hovered ? portal.color : "rgba(255,255,255,0.85)",
          letterSpacing: "0.05em",
          transition: "color 0.4s",
          marginBottom: "4px",
        }}>
          {portal.label}
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "10px",
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          {portal.sublabel}
        </div>
        <div style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.4)",
          lineHeight: "1.5",
          fontFamily: "system-ui, sans-serif",
          maxWidth: "160px",
        }}>
          {portal.description}
        </div>
      </div>

      {/* Enter button */}
      <div style={{
        marginTop: "8px",
        padding: "8px 24px",
        borderRadius: "999px",
        border: `1px solid ${portal.borderColor}`,
        color: portal.color,
        fontFamily: "'Space Mono', monospace",
        fontSize: "11px",
        letterSpacing: "0.1em",
        opacity: hovered ? 1 : 0,
        transform: hovered ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.3s",
        position: "relative",
        zIndex: 1,
        background: portal.dimColor,
      }}>
        ENTER →
      </div>
    </div>
  );
}

function ScanLine({ color }) {
  return (
    <div style={{
      position: "absolute",
      left: 0,
      right: 0,
      height: "1px",
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      animation: "scanline 3s ease-in-out infinite",
      pointerEvents: "none",
    }} />
  );
}

export default function Login() {
  const { login, signup } = useApp();
  const [phase, setPhase] = useState("portal"); // "portal" | "auth"
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authVisible, setAuthVisible] = useState(false);

  function selectPortal(portal) {
    setSelectedPortal(portal);
    setEmail(portal.demo);
    setPassword("demo1234");
    setError("");
    setMode("login");
    setTimeout(() => setPhase("auth"), 50);
    setTimeout(() => setAuthVisible(true), 100);
  }

  function goBack() {
    setAuthVisible(false);
    setTimeout(() => {
      setPhase("portal");
      setSelectedPortal(null);
      setEmail("");
      setPassword("");
      setFullName("");
      setError("");
    }, 400);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password, selectedPortal.role);
      } else {
        await signup(email, password, fullName, selectedPortal.role);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const p = selectedPortal;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(0) rotate(0deg); }
          20%  { opacity: 0.6; }
          80%  { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(-60px) rotate(20deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.4); }
        }
        @keyframes scanline {
          0%   { top: 0%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes titleIn {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-30px); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes bgShift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes gridFade {
          0%, 100% { opacity: 0.03; }
          50%       { opacity: 0.07; }
        }
        @keyframes inputFocus {
          from { box-shadow: 0 0 0 0px var(--focus-color); }
          to   { box-shadow: 0 0 0 3px var(--focus-color); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .auth-panel {
          transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.23,1,0.32,1);
        }
        .auth-panel.visible {
          opacity: 1;
          transform: translateX(0);
        }
        .auth-panel.hidden {
          opacity: 0;
          transform: translateX(40px);
        }
        .input-field {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 16px;
          color: white;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          outline: none;
          transition: border-color 0.3s, box-shadow 0.3s;
          box-sizing: border-box;
        }
        .input-field:focus {
          border-color: var(--portal-color);
          box-shadow: 0 0 0 3px var(--portal-glow);
        }
        .input-field::placeholder { color: rgba(255,255,255,0.2); }
        .submit-btn {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 12px;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .mode-tab {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s;
        }
        .back-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          padding: 8px 14px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s;
        }
        .back-btn:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.7); }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#080B12",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Syne', sans-serif",
      }}>
        {/* Animated background grid */}
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          animation: "gridFade 4s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Corner accent lines */}
        {[
          { top: 0, left: 0, width: "200px", height: "1px" },
          { top: 0, left: 0, width: "1px", height: "200px" },
          { bottom: 0, right: 0, width: "200px", height: "1px" },
          { bottom: 0, right: 0, width: "1px", height: "200px" },
        ].map((s, i) => (
          <div key={i} style={{
            position: "fixed",
            background: "rgba(255,255,255,0.06)",
            ...s,
          }} />
        ))}

        {/* Big ambient glow blobs */}
        <div style={{
          position: "fixed", width: "600px", height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,255,178,0.04) 0%, transparent 70%)",
          top: "-100px", left: "-100px", pointerEvents: "none",
        }} />
        <div style={{
          position: "fixed", width: "500px", height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,191,255,0.04) 0%, transparent 70%)",
          bottom: "-100px", right: "-100px", pointerEvents: "none",
        }} />

        {/* PORTAL SELECTION PHASE */}
        {phase === "portal" && (
          <div style={{ width: "100%", maxWidth: "900px" }}>
            {/* Header */}
            <div style={{
              textAlign: "center",
              marginBottom: "56px",
              animation: "titleIn 0.8s cubic-bezier(0.23,1,0.32,1) both",
            }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
                padding: "6px 16px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.02)",
              }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00FFB2", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em" }}>
                  SYSTEM ONLINE
                </span>
              </div>
              <h1 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(28px, 5vw, 48px)",
                fontWeight: "800",
                color: "white",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}>
                Financial Surveillance<br />
                <span style={{ color: "rgba(255,255,255,0.3)" }}>& Identity System</span>
              </h1>
              <p style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.15em",
              }}>
                SELECT YOUR ACCESS PORTAL TO CONTINUE
              </p>
            </div>

            {/* Three portal cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}>
              {PORTALS.map((portal, i) => (
                <PortalCard
                  key={portal.id}
                  portal={portal}
                  index={i}
                  onClick={() => selectPortal(portal)}
                />
              ))}
            </div>

            <p style={{
              textAlign: "center",
              marginTop: "32px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "10px",
              color: "rgba(255,255,255,0.15)",
              letterSpacing: "0.1em",
              animation: "titleIn 1s cubic-bezier(0.23,1,0.32,1) 0.5s both",
            }}>
              SECURED BY UIDAI · BLOCKCHAIN ANCHORED · AML COMPLIANT
            </p>
          </div>
        )}

        {/* AUTH PHASE */}
        {phase === "auth" && p && (
          <div
            className={`auth-panel ${authVisible ? "visible" : "hidden"}`}
            style={{
              "--portal-color": p.color,
              "--portal-glow": p.glow,
              width: "100%",
              maxWidth: "440px",
            }}
          >
            {/* Back + portal badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
              <button className="back-btn" onClick={goBack}>
                <ArrowLeft size={12} /> PORTALS
              </button>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "999px",
                border: `1px solid ${p.borderColor}`,
                background: p.dimColor,
              }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.color, animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: p.color, letterSpacing: "0.15em" }}>
                  {p.label.toUpperCase()} PORTAL
                </span>
              </div>
            </div>

            {/* Card */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${p.borderColor}`,
              borderRadius: "24px",
              padding: "36px",
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px ${p.borderColor}`,
            }}>
              <ScanLine color={p.color} />

              {/* Glow top */}
              <div style={{
                position: "absolute",
                top: "-60px", left: "50%",
                transform: "translateX(-50%)",
                width: "200px", height: "200px",
                borderRadius: "50%",
                background: p.glow,
                filter: "blur(60px)",
                opacity: 0.3,
                pointerEvents: "none",
              }} />

              {/* Icon */}
              <div style={{ textAlign: "center", marginBottom: "28px", position: "relative", zIndex: 1 }}>
                <div style={{
                  width: "72px", height: "72px",
                  borderRadius: "20px",
                  border: `2px solid ${p.color}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: p.dimColor,
                  boxShadow: `0 0 30px ${p.glow}`,
                  marginBottom: "16px",
                }}>
                  <p.icon size={32} style={{ color: p.color }} />
                </div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "white",
                  marginBottom: "4px",
                }}>
                  {mode === "login" ? "Welcome back" : "Create account"}
                </div>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.1em",
                }}>
                  {p.sublabel}
                </div>
              </div>

              {/* Mode tabs */}
              <div style={{
                display: "flex",
                gap: "4px",
                padding: "4px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "12px",
                marginBottom: "24px",
                position: "relative",
                zIndex: 1,
              }}>
                {["login", "signup"].map((m) => (
                  <button
                    key={m}
                    className="mode-tab"
                    onClick={() => { setMode(m); setError(""); }}
                    style={{
                      flex: 1,
                      color: mode === m ? p.color : "rgba(255,255,255,0.3)",
                      background: mode === m ? p.dimColor : "transparent",
                      border: mode === m ? `1px solid ${p.borderColor}` : "1px solid transparent",
                    }}
                  >
                    {m === "login" ? "SIGN IN" : "SIGN UP"}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", zIndex: 1 }}>
                {mode === "signup" && (
                  <div>
                    <label style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", display: "block", marginBottom: "8px" }}>
                      FULL NAME
                    </label>
                    <input
                      className="input-field"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Aditya Sharma"
                    />
                  </div>
                )}

                <div>
                  <label style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", display: "block", marginBottom: "8px" }}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    className="input-field"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={p.demo}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", display: "block", marginBottom: "8px" }}>
                    PASSWORD
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input-field"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{ paddingRight: "48px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center",
                      }}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: "rgba(255,60,60,0.08)",
                    border: "1px solid rgba(255,60,60,0.25)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    animation: "shake 0.4s ease",
                  }}>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", color: "#FF6B6B", margin: 0 }}>
                      ⚠ {error}
                    </p>
                  </div>
                )}

                {/* Demo hint */}
                <div style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>
                    Demo: {p.demo} / demo1234
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="submit-btn"
                  style={{
                    background: `linear-gradient(135deg, ${p.color}22, ${p.color}44)`,
                    border: `1px solid ${p.color}`,
                    color: p.color,
                    boxShadow: loading ? "none" : `0 8px 32px ${p.glow}`,
                    marginTop: "4px",
                  }}
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" style={{ animation: "rotateSlow 1s linear infinite" }} /> AUTHENTICATING...</>
                    : mode === "login" ? `ACCESS ${p.label.toUpperCase()} PORTAL →` : "CREATE ACCOUNT →"
                  }
                </button>
              </form>
            </div>

            <p style={{
              textAlign: "center",
              marginTop: "20px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "10px",
              color: "rgba(255,255,255,0.12)",
              letterSpacing: "0.1em",
            }}>
              SECURED · ENCRYPTED · BLOCKCHAIN ANCHORED
            </p>
          </div>
        )}
      </div>
    </>
  );
}