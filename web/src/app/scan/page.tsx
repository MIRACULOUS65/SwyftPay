"use client";
import { useState } from "react";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScanLine, Camera, Keyboard, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ScanPage() {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualInput, setManualInput] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);

  const simulateScan = () => {
    setScanResult({
      userId: "usr_002",
      name: "Priya Sharma",
      walletAddress: "0xA8b9C2d3E4f5G6h7I8j9K0L1M2N3O4P5Q6R7S8T9",
      preferredCurrency: "INR",
    });
  };

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-2">Scan QR Code</h1>
        <p className="text-sm text-white/35 mb-8">Point your camera at a SWYFTPAY QR code to pay</p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <Button variant={mode === "camera" ? "primary" : "secondary"} size="sm" onClick={() => setMode("camera")}>
            <Camera size={14} /> Camera
          </Button>
          <Button variant={mode === "manual" ? "primary" : "secondary"} size="sm" onClick={() => setMode("manual")}>
            <Keyboard size={14} /> Manual
          </Button>
        </div>

        {!scanResult ? (
          <>
            {mode === "camera" ? (
              <Card className="aspect-square max-w-md mx-auto relative overflow-hidden flex items-center justify-center">
                {/* Simulated camera view */}
                <div className="absolute inset-0 bg-[#0A0A0A]" />

                {/* Scan frame */}
                <div className="relative w-56 h-56">
                  {/* Corner lines */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/30 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-lg" />

                  {/* Animated scan line */}
                  <div
                    className="absolute left-2 right-2 h-[2px] rounded-full"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                      animation: "scanLine 2.5s ease-in-out infinite",
                    }}
                  />
                </div>

                {/* Simulate scan button */}
                <button
                  onClick={simulateScan}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-white/50 hover:bg-white/15 transition-all"
                >
                  Simulate Scan
                </button>
              </Card>
            ) : (
              <Card className="p-6 max-w-md mx-auto">
                <p className="text-xs text-white/30 mb-3">Enter QR payload or User ID manually</p>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="usr_002 or paste QR payload..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:border-white/20 focus:outline-none transition-colors mb-4"
                />
                <Button className="w-full" onClick={simulateScan}>
                  <ScanLine size={14} /> Look Up
                </Button>
              </Card>
            )}

            <p className="text-xs text-white/20 text-center mt-6">
              QR codes contain public payment identity only. No sensitive data is shared.
            </p>
          </>
        ) : (
          /* ─── Scan Result ─── */
          <Card className="p-8 max-w-md mx-auto text-center">
            <div className="w-14 h-14 rounded-full bg-white/[0.08] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} className="text-white/70" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">{scanResult.name}</h2>
            <p className="text-xs text-white/30 font-mono mb-2">{scanResult.walletAddress}</p>
            <p className="text-xs text-white/25 mb-6">Prefers to receive: {scanResult.preferredCurrency}</p>

            <div className="flex gap-3">
              <Link href="/send" className="flex-1">
                <Button className="w-full">
                  Pay {scanResult.name.split(" ")[0]}
                </Button>
              </Link>
              <Button variant="secondary" onClick={() => setScanResult(null)}>
                Scan Again
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
