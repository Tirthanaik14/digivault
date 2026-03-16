// src/components/portals/user/KYCCenter.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, CheckCircle, Camera, Fingerprint, Loader2, XCircle, ShieldCheck } from "lucide-react";
import { Panel, SectionHeader } from "../../shared";
import { api } from "../../../utils/api";
import { useApp } from "../../../context/AppContext";

export default function KYCCenter() {
  const { setKycStep, setDashboardData, dashboardData } = useApp();

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // cancel any previous utterance first
    const u = new window.SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  };
  // ── File State ────────────────────────────────────────────────────────
  const [dragging,      setDragging]      = useState(false);
  const [file,          setFile]          = useState(null);
  const [fileName,      setFileName]      = useState("");

  // ── PIN State ─────────────────────────────────────────────────────────
  const [pin,           setPin]           = useState(["", "", "", ""]);
  const pinRefs = [useRef(), useRef(), useRef(), useRef()];

  // ── Camera State ──────────────────────────────────────────────────────
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const [cameraOn,      setCameraOn]      = useState(false);
  const [selfieB64,     setSelfieB64]     = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  // ── Submission State ──────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(false);
  const [step,         setStep]         = useState("");
  const [verifyResult, setVerifyResult] = useState(null); // only set on fresh submission
  const [error,        setError]        = useState("");

  // ── Single source of truth ────────────────────────────────────────────
  // Fresh API result takes priority over existing dashboard data
  const isVerified =
    verifyResult?.status === "VERIFIED" ||
    dashboardData?.kyc_status === "VERIFIED";

  // ── Camera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setError("Camera access denied. Please allow camera access in your browser.");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const captureSelfie = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUri = canvas.toDataURL("image/jpeg", 0.9);
    setSelfiePreview(dataUri);
    setSelfieB64(dataUri.split(",")[1]);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      setCameraOn(false);
    }
  };

  // ── File Handlers ─────────────────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setFileName(f.name); }
  };

  const handleFileInput = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setFileName(f.name); }
  };

  // ── PIN Handler ───────────────────────────────────────────────────────
  const handlePin = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[i] = val;
    setPin(next);
    if (val && i < 3) pinRefs[i + 1].current?.focus();
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    setError("");
    const shareCode = pin.join("");
    if (!file)                return setError("Please upload your Aadhaar ZIP or XML file.");
    if (shareCode.length < 4) return setError("Please enter your complete 4-digit PIN.");
    if (!selfieB64)           return setError("Please capture your selfie first.");

    setLoading(true);
    try {
      speak("Extracting Aadhaar data");
      setStep("Extracting document...");
      await new Promise((r) => setTimeout(r, 600));

      speak("Verifying digital signature");
      setStep("Verifying UIDAI signature...");
      await new Promise((r) => setTimeout(r, 400));

      speak("Starting facial recognition");
      setStep("Matching face...");
      await new Promise((r) => setTimeout(r, 400));

      speak("Anchoring identity to blockchain");
      setStep("Anchoring to blockchain...");

      const data = await api.verifyKyc(file, shareCode, selfieB64);

      // Refresh dashboard so stepper + sidebar reflect new status
      const dashboard = await api.getDashboard();
      setDashboardData(dashboard);

      const steps = dashboard.kyc_steps;
      const vals = [
        steps.profile_created,
        steps.document_uploaded,
        steps.signature_verified,
        steps.face_matched,
        steps.blockchain_anchored,
      ];
      const lastDone = vals.lastIndexOf(true);
      setKycStep(lastDone === 4 ? 4 : lastDone + 1);

      // Set result LAST — flips the screen to success
      setVerifyResult(data);
      speak("Verification complete. Identity anchored successfully.");

    } catch (err) {
      setError(err.message);
      speak("Verification failed.");
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // SUCCESS SCREEN — verified account (existing on load OR just verified)
  // ─────────────────────────────────────────────────────────────────────
  if (isVerified) {
    const tx         = verifyResult?.blockchain_tx_hash ?? dashboardData?.blockchain_tx_hash;
    const faceScore  = verifyResult?.face_match_score   ?? dashboardData?.face_match_score;

    return (
      <div className="space-y-6">
        <Panel className="border-emerald-500/30 bg-emerald-500/5">
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/50">
              <ShieldCheck size={40} className="text-emerald-400" />
            </div>
            <h2 className="text-white text-2xl font-bold">Identity Secured</h2>
            <p className="text-slate-400 text-sm mt-2">
              Your KYC is verified and anchored to the blockchain.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm font-mono border-t border-slate-800 pt-6">
            <div className="bg-slate-900/50 p-4 rounded-xl">
              <p className="text-slate-500 text-[10px] mb-1 uppercase">Method</p>
              <p className="text-emerald-400 font-bold">Offline XML</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl">
              <p className="text-slate-500 text-[10px] mb-1 uppercase">Face Confidence</p>
              <p className="text-white font-bold">
                {faceScore ? `${(faceScore * 100).toFixed(1)}%` : "Passed"}
              </p>
            </div>
          </div>

          {tx && (
            <div className="mt-4 p-4 bg-slate-900/80 rounded-xl border border-slate-700">
              <p className="text-slate-500 text-[10px] font-mono uppercase mb-2">
                Blockchain Transaction Hash
              </p>
              <p className="text-emerald-400 text-xs font-mono break-all">{tx}</p>
            </div>
          )}
        </Panel>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // UPLOAD FORM — new / unverified account only
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-2xl font-bold tracking-tight">KYC Center</h2>
        <p className="text-slate-400 text-sm">Upload Aadhaar XML and verify with your 4-digit PIN</p>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Step 1: Upload */}
        <Panel>
          <SectionHeader title="Step 1: Aadhaar Upload" subtitle="Drag & drop or click to upload" />

          <input
            id="fileInput"
            type="file"
            accept=".xml,.zip"
            className="hidden"
            onChange={handleFileInput}
          />

          <div
            onClick={() => document.getElementById("fileInput").click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-all cursor-pointer
              ${dragging
                ? "border-emerald-400 bg-emerald-500/10"
                : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30"}`}
          >
            <div className={`p-4 rounded-full transition-all ${dragging ? "bg-emerald-500/20" : "bg-slate-700"}`}>
              <Upload size={28} className={dragging ? "text-emerald-400" : "text-slate-400"} />
            </div>
            <div className="text-center">
              <p className="text-white text-sm font-medium">Drop Aadhaar XML / ZIP here</p>
              <p className="text-slate-500 text-xs mt-1">Supports .xml and .zip files</p>
            </div>
            {fileName && (
              <div className="w-full mt-2">
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <span className="text-emerald-300 text-xs font-mono truncate">{fileName}</span>
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* Step 2 + 3: PIN & Camera */}
        <div className="space-y-4">

          <Panel>
            <SectionHeader title="Step 2: Share Code" subtitle="Enter your 4-digit UIDAI share code" />
            <div className="flex gap-3 justify-center">
              {pin.map((d, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="password"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handlePin(i, e.target.value)}
                  className="w-14 h-14 text-center text-2xl font-bold bg-slate-900 border-2 border-slate-600 rounded-xl text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                />
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeader title="Step 3: Live Selfie" subtitle="Position your face within the frame" />

            <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-slate-700">

              {/* Always in DOM — display toggled so stream renders correctly */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: cameraOn ? "block" : "none" }}
              />

              {selfiePreview && !cameraOn && (
                <img src={selfiePreview} alt="Selfie" className="absolute inset-0 w-full h-full object-cover" />
              )}

              {!cameraOn && !selfiePreview && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-32 h-32 border-2 border-emerald-400/50 rounded-full border-dashed animate-spin"
                      style={{ animationDuration: "8s" }}
                    />
                    <div className="absolute w-24 h-24 border border-emerald-500/30 rounded-full" />
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <Camera size={32} className="text-slate-500" />
                    <p className="text-slate-500 text-xs font-mono">Click Start Camera</p>
                  </div>
                </>
              )}

              {cameraOn && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full z-10">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-rose-400 text-xs font-mono">LIVE</span>
                </div>
              )}

              {selfiePreview && !cameraOn && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded-full z-10">
                  <CheckCircle size={12} className="text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-mono">Captured</span>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2 mt-3">
              {!cameraOn && !selfiePreview && (
                <button
                  onClick={startCamera}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-mono text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Camera size={14} /> Start Camera
                </button>
              )}
              {cameraOn && (
                <button
                  onClick={captureSelfie}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-mono text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Fingerprint size={14} /> Capture Selfie
                </button>
              )}
              {selfiePreview && !cameraOn && (
                <button
                  onClick={() => { setSelfiePreview(null); setSelfieB64(null); startCamera(); }}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-mono text-sm transition-all"
                >
                  Retake
                </button>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Loading progress */}
      {loading && (
        <Panel>
          <div className="flex items-center gap-3 py-2">
            <Loader2 size={18} className="text-emerald-400 animate-spin" />
            <p className="text-emerald-400 text-sm font-mono">{step}</p>
          </div>
          <div className="mt-3 space-y-1">
            {["Extracting document...", "Verifying UIDAI signature...", "Matching face...", "Anchoring to blockchain..."].map((s) => (
              <div key={s} className={`text-xs font-mono flex items-center gap-2 ${step === s ? "text-emerald-400" : "text-slate-600"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${step === s ? "bg-emerald-400 animate-pulse" : "bg-slate-700"}`} />
                {s}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
          <XCircle size={18} className="text-rose-400 mt-0.5 shrink-0" />
          <p className="text-rose-400 text-sm font-mono">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleVerify}
        disabled={loading}
        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-xl font-mono text-sm transition-all flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
          : <><Fingerprint size={16} /> Verify Identity</>
        }
      </button>
    </div>
  );
}