"use client";
import { useState } from "react";
import { Wallet, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WalletConnectModalProps {
  onSuccess: (address: string) => void;
  onClose: () => void;
}

export function WalletConnectModal({ onSuccess, onClose }: WalletConnectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linked, setLinked] = useState(false);
  const [address, setAddress] = useState("");

  const connectWallet = async () => {
    setLoading(true);
    setError("");

    try {
      // Check MetaMask is installed
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setError("MetaMask not detected. Please install the MetaMask browser extension.");
        setLoading(false);
        return;
      }

      // Request accounts — this triggers the MetaMask popup
      const accounts: string[] = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      const addr = accounts[0];
      if (!addr) {
        setError("No account returned from MetaMask.");
        setLoading(false);
        return;
      }

      // Link to backend
      const res = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: addr }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to link wallet to your account.");
        setLoading(false);
        return;
      }

      setAddress(addr);
      setLinked(true);

      // Notify parent and auto-close after success
      setTimeout(() => onSuccess(addr), 1500);
    } catch (err: any) {
      // User rejected the MetaMask request
      if (err?.code === 4001) {
        setError("You rejected the MetaMask connection request. Please try again.");
      } else {
        setError(err?.message || "Wallet connection failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 relative"
        style={{
          background: "#0D0D0D",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/30 hover:text-white/60 transition-colors"
        >
          <X size={18} />
        </button>

        {!linked ? (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center">
                <Wallet size={28} className="text-white/60" />
              </div>
            </div>

            <h2 className="text-lg font-bold text-white text-center mb-2">
              Connect MetaMask
            </h2>
            <p className="text-sm text-white/40 text-center mb-6">
              Link your wallet to enable AMOY payments. Your wallet is uniquely tied to your account.
            </p>

            {/* Info points */}
            <div className="space-y-2 mb-6">
              {[
                "MetaMask popup will appear — approve to connect",
                "One wallet per SWYFTPAY account",
                "We never access your private keys",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2.5 py-1.5 px-3 rounded-lg bg-white/[0.03]">
                  <CheckCircle2 size={13} className="text-white/25 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-white/40">{text}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={connectWallet}
              loading={loading}
            >
              <Wallet size={16} />
              {loading ? "Waiting for MetaMask..." : "Connect MetaMask"}
            </Button>

            {error && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] mt-4">
                <AlertTriangle size={13} className="text-white/40 mt-0.5 shrink-0" />
                <p className="text-xs text-white/50">{error}</p>
              </div>
            )}
          </>
        ) : (
          /* Success state */
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/[0.08] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-white/80" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2">Wallet Linked!</h2>
            <p className="text-xs text-white/30 font-mono break-all">{address}</p>
            <p className="text-xs text-white/20 mt-3">Refreshing your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
