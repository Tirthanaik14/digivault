// src/components/portals/user/UserDashboard.jsx

import { useEffect, useState } from "react";
import { Volume2, Check, CheckCircle, Clock, Shield, Activity, CreditCard, Fingerprint } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { KYC_STEPS } from "../../../utils/constants";
import { Panel, SectionHeader, StatCard } from "../../shared";
import { api } from "../../../utils/api";

// ── KYC Stepper ──────────────────────────────────────────────────────────────
function KYCStepper({ step, onStepClick }) {
  return (
    <div className="flex items-center w-full">
      {KYC_STEPS.map((s, i) => {
        const Icon   = s.icon;
        const done   = i < step;
        const active = i === step;
        return (
          <div
            key={i}
            className="flex items-center flex-1 last:flex-none cursor-pointer group"
            onClick={() => onStepClick(i)}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${done   ? "bg-emerald-500 border-emerald-500"
                  : active ? "bg-slate-700 border-emerald-400 ring-4 ring-emerald-500/20"
                           : "bg-slate-800 border-slate-600 group-hover:border-slate-400"}`}
              >
                {done
                  ? <Check size={16} className="text-white" />
                  : <Icon  size={16} className={active ? "text-emerald-400" : "text-slate-500"} />
                }
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider whitespace-nowrap
                  ${done ? "text-emerald-400" : active ? "text-white" : "text-slate-500"}`}
              >
                {s.label}
              </span>
            </div>
            {i < KYC_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 transition-all duration-500
                  ${done ? "bg-emerald-500" : "bg-slate-700"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { kycStep, dashboardData, currentUser, setDashboardData, setKycStep, setActiveSection } = useApp();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getDashboard()
      .then((data) => {
        setDashboardData(data);
        const steps = data.kyc_steps;
        const vals = [
          steps.profile_created,
          steps.document_uploaded,
          steps.signature_verified,
          steps.face_matched,
          steps.blockchain_anchored,
        ];
        const lastDone = vals.lastIndexOf(true);
        setKycStep(lastDone === 4 ? 4 : lastDone + 1);
      })
      .catch(() => {});
  }, [setDashboardData, setKycStep]);

  const displayName = dashboardData?.full_name || currentUser?.full_name || "User";
  const riskScore   = dashboardData?.anomaly_score ?? 0.12;
  const kycStatus   = dashboardData?.kyc_status || "PENDING";
  const txHash      = dashboardData?.blockchain_tx_hash;

  const handleStepJump = (index) => {
    if (index >= 1) setActiveSection("kyc");
  };

  const handleVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const stepLabels = [
      "Profile setup",
      "Document upload",
      "Signature verification",
      "Face matching",
      "Blockchain anchoring",
    ];
    const currentStepLabel = stepLabels[Math.min(kycStep, 4)];

    const message = kycStatus === "VERIFIED"
      ? `Welcome back ${displayName}. Your identity is fully verified and anchored on the blockchain. Your transaction limit is 5 lakh rupees per day.`
      : `Welcome ${displayName}. Your KYC is in progress. You are on step ${kycStep + 1} of 5: ${currentStepLabel}. Please complete all steps to unlock full access.`;

    const u = new window.SpeechSynthesisUtterance(message);
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-2xl font-bold tracking-tight">Identity Dashboard</h2>
          <p className="text-slate-400 text-sm">
            Welcome back, <span className="text-emerald-400">{displayName}</span>
          </p>
        </div>
        <button
          onClick={handleVoice}
          className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl hover:bg-emerald-500/20 transition-all group"
        >
          <Volume2 size={16} className="group-hover:animate-pulse" />
          <span className="text-sm font-mono">Voice Guide</span>
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Shield}     label="KYC Status" value={kycStatus}              sub={`Step ${kycStep + 1} of 5`}                                    color="emerald" />
        <StatCard icon={Activity}   label="Risk Score"  value={riskScore.toFixed(2)}   sub={riskScore > 0.7 ? "High risk" : "Low risk profile"}             color="sky"     />
        <StatCard icon={CreditCard} label="Txn Limit"   value={kycStatus === "VERIFIED" ? "₹5L/day" : "₹0/day"} sub={kycStatus === "VERIFIED" ? "Full access" : "Complete KYC"} color="amber"   />
      </div>

      {/* ── KYC Stepper ── */}
      <Panel>
        <SectionHeader title="KYC Verification Progress" subtitle="Click any step to jump to verification" />
        <KYCStepper step={kycStep} onStepClick={handleStepJump} />
      </Panel>

      {/* ── Blockchain Proof (only shown once verified) ── */}
      {txHash && (
        <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 transition-all hover:bg-emerald-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-[10px] font-mono uppercase tracking-widest font-bold">
                On-Chain Identity Anchor
              </span>
            </div>
            <span className="text-slate-500 text-[10px] font-mono">Network: Hardhat Localhost</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-[10px] font-mono mb-1">Transaction Hash:</p>
              <p className="text-white text-xs font-mono break-all leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                {txHash}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="mt-5 p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-slate-700 hover:border-emerald-500/30 shrink-0"
              title="Copy Transaction Hash"
            >
              {copied
                ? <CheckCircle size={18} className="text-emerald-400" />
                : <Fingerprint size={18} />
              }
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 font-mono italic">
            <Shield size={12} className="text-emerald-500/50" />
            Cryptographic proof of identity is immutably stored on the distributed ledger.
          </div>
        </div>
      )}

      {/* ── Current Step Details ── */}
      <Panel>
        <SectionHeader title="Current Step Details" />
        <div className="flex items-center gap-4 p-4 bg-slate-900/60 rounded-xl border border-emerald-500/20">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            {(() => {
              const Icon = KYC_STEPS[Math.min(kycStep, 4)].icon;
              return <Icon size={24} className="text-emerald-400" />;
            })()}
          </div>
          <div>
            <p className="text-white font-semibold">{KYC_STEPS[Math.min(kycStep, 4)].label}</p>
            <p className="text-slate-400 text-sm">
              Step {kycStep + 1} of {KYC_STEPS.length} —{" "}
              {kycStep === KYC_STEPS.length - 1 ? "Verification complete!" : "Action required"}
            </p>
          </div>
          <div className="ml-auto">
            {kycStatus === "VERIFIED" ? (
              <span className="text-emerald-400 text-sm font-mono flex items-center gap-1">
                <CheckCircle size={14} /> Verified
              </span>
            ) : (
              <span className="text-amber-400 text-sm font-mono flex items-center gap-1">
                <Clock size={14} /> In Progress
              </span>
            )}
          </div>
        </div>
      </Panel>

    </div>
  );
}