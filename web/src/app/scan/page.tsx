"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Camera, Keyboard, ScanLine, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";
import { ethers } from "ethers";

type Mode   = "camera" | "manual";
type Status = "starting" | "scanning" | "success" | "error";

// ─── Parse SwyftPay QR value ─────────────────────────────────────────────────
function parseSwyftPayQR(raw: string): { to: string; name: string } | null {
  try {
    const url  = new URL(raw);
    const to   = url.searchParams.get("to")   || "";
    const name = url.searchParams.get("name") || "";
    if (ethers.isAddress(to)) return { to, name };
  } catch {}
  const trimmed = raw.trim();
  if (ethers.isAddress(trimmed)) return { to: trimmed, name: "" };
  return null;
}

export default function ScanPage() {
  const router   = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);

  const [mode,   setMode]   = useState<Mode>("camera");
  const [status, setStatus] = useState<Status>("starting");
  const [parsed, setParsed] = useState<{ to: string; name: string } | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [manualInput, setManual] = useState("");

  // ─── Stop camera completely ───────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // ─── QR scan loop via BarcodeDetector or jsQR fallback ───────────────────
  const startScanLoop = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // BarcodeDetector is built into Chrome 83+ — no external library needed
    const detector = "BarcodeDetector" in window
      ? new (window as any).BarcodeDetector({ formats: ["qr_code"] })
      : null;

    const tick = async () => {
      if (video.readyState < 2) { rafRef.current = requestAnimationFrame(tick); return; }

      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) { rafRef.current = requestAnimationFrame(tick); return; }

      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);

      try {
        if (detector) {
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            const result = parseSwyftPayQR(barcodes[0].rawValue);
            if (result) { stopCamera(); setParsed(result); setStatus("success"); return; }
          }
        } else {
          // jsQR fallback for Firefox / older browsers
          const { default: jsQR } = await import("jsqr");
          const imageData = ctx.getImageData(0, 0, w, h);
          const code = jsQR(imageData.data, w, h);
          if (code) {
            const result = parseSwyftPayQR(code.data);
            if (result) { stopCamera(); setParsed(result); setStatus("success"); return; }
          }
        }
      } catch { /* decode miss — normal, keep looping */ }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [stopCamera]);

  // ─── Start camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setStatus("starting");
    setErrMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach(t => t.stop()); return; }

      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      await video.play();
      setStatus("scanning");
      startScanLoop();
    } catch (err: any) {
      const denied = err?.name === "NotAllowedError" || err?.message?.includes("Permission");
      setErrMsg(denied
        ? "Camera access denied. Click the camera icon in your browser's address bar to allow access."
        : `Camera error: ${err?.message || "Unknown error"}`);
      setStatus("error");
    }
  }, [startScanLoop]);

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode === "camera") startCamera();
    return () => stopCamera();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchToCamera = () => {
    stopCamera();
    setParsed(null);
    setErrMsg("");
    setMode("camera");
  };

  const switchToManual = () => {
    stopCamera();
    setParsed(null);
    setErrMsg("");
    setMode("manual");
  };

  const handleManual = () => {
    const result = parseSwyftPayQR(manualInput.trim());
    if (result) { setParsed(result); setStatus("success"); }
    else { setErrMsg("Not a valid SwyftPay link or wallet address"); setStatus("error"); }
  };

  const goToPay = () => {
    if (!parsed) return;
    const p = new URLSearchParams({ to: parsed.to });
    if (parsed.name) p.set("name", parsed.name);
    router.push(`/send?${p.toString()}`);
  };

  const reset = () => {
    stopCamera();
    setParsed(null);
    setErrMsg("");
    setManual("");
    if (mode === "camera") startCamera();
    else setStatus("scanning");
  };

  // ─── UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-2">Scan QR Code</h1>
        <p className="text-sm text-white/35 mb-8">
          Scan a SwyftPay QR — receiver fills automatically on Send page
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <Button variant={mode === "camera" ? "primary" : "secondary"} size="sm" onClick={switchToCamera}>
            <Camera size={14} /> Camera
          </Button>
          <Button variant={mode === "manual" ? "primary" : "secondary"} size="sm" onClick={switchToManual}>
            <Keyboard size={14} /> Manual
          </Button>
        </div>

        {/* ─── Success ─── */}
        {status === "success" && parsed ? (
          <Card className="p-8 max-w-md mx-auto text-center" glow>
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">
              {parsed.name || "SwyftPay User"}
            </h2>
            <p className="text-xs text-white/30 font-mono mb-6 break-all px-2">{parsed.to}</p>
            <div className="flex gap-3">
              <Button className="flex-1 bg-white text-black hover:bg-white/90" onClick={goToPay}>
                Pay {parsed.name ? parsed.name.split(" ")[0] : "Now"}
              </Button>
              <Button variant="secondary" onClick={reset}>
                <RefreshCcw size={14} />
              </Button>
            </div>
          </Card>

        ) : mode === "camera" ? (
          /* ─── Camera view ─── */
          <div className="max-w-md mx-auto">
            <div
              className="relative rounded-2xl overflow-hidden bg-black"
              style={{ aspectRatio: "4/3" }}
            >
              {/* Real video feed — directly on DOM, no library wrapping */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Hidden canvas for QR decoding */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Corner frame overlay (purely decorative) */}
              {status === "scanning" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-52 h-52">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-lg" />
                    <div
                      className="absolute left-2 right-2 h-[2px] rounded-full"
                      style={{
                        background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)",
                        animation: "scanLine 2.5s ease-in-out infinite",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Starting spinner */}
              {status === "starting" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
                </div>
              )}

              {/* Error overlay */}
              {status === "error" && errMsg && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center">
                  <AlertTriangle size={28} className="text-white/30" />
                  <p className="text-sm text-white/50">{errMsg}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={startCamera}>Retry</Button>
                    <Button variant="secondary" size="sm" onClick={switchToManual}>Manual Mode</Button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-white/20 text-center mt-4">
              Point at a SwyftPay QR code — it scans automatically
            </p>
          </div>

        ) : (
          /* ─── Manual mode ─── */
          <Card className="p-6 max-w-md mx-auto">
            <p className="text-xs text-white/30 mb-3">
              Paste a SwyftPay payment link or a wallet address
            </p>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManual()}
              placeholder="https://...swyftpay.../send?to=0x... or 0x..."
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:border-white/20 focus:outline-none mb-4 font-mono"
            />
            {status === "error" && errMsg && (
              <p className="text-xs text-red-400/70 mb-3 flex items-center gap-1">
                <AlertTriangle size={12} /> {errMsg}
              </p>
            )}
            <Button className="w-full" onClick={handleManual}>
              <ScanLine size={14} /> Confirm
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
