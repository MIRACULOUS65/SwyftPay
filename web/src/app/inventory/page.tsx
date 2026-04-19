"use client";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth-client";
import { formatINR, formatDate } from "@/lib/utils";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Plus,
  CreditCard, Banknote, RefreshCcw, X, CheckCircle2, AlertCircle
} from "lucide-react";

interface UserProfile { id: string; name: string; inrBalance: number; }

// ─── Withdraw Modal ───────────────────────────────────────────────────────────
function WithdrawModal({
  balance,
  onClose,
  onSuccess,
}: {
  balance: number;
  onClose: () => void;
  onSuccess: (newBal: number, upi: string, amount: number) => void;
}) {
  const [upiId, setUpiId]     = useState("");
  const [amount, setAmount]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleWithdraw = async () => {
    setError("");
    const amt = parseFloat(amount);
    if (!upiId.trim()) { setError("Please enter a UPI ID"); return; }
    if (!amt || amt <= 0) { setError("Enter a valid amount"); return; }
    if (amt > balance) { setError(`Max ₹${balance.toFixed(2)} available`); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/withdraw", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ upiId: upiId.trim(), amount: amt }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Withdrawal failed"); return; }
      onSuccess(data.newBalance, upiId.trim(), amt);
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-white mb-1">Withdraw to UPI</h2>
        <p className="text-xs text-white/35 mb-6">
          Admin UPI <span className="font-mono text-white/50">8336885355@upi</span> →  your UPI
        </p>

        {/* Balance */}
        <div className="bg-white/[0.04] rounded-xl p-4 mb-6 flex justify-between items-center">
          <span className="text-sm text-white/40">Available</span>
          <span className="text-lg font-bold text-white">{formatINR(balance)}</span>
        </div>

        {/* UPI ID */}
        <label className="block text-xs text-white/40 mb-2">Your UPI ID</label>
        <input
          type="text"
          placeholder="yourname@upi"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 mb-4"
        />

        {/* Amount */}
        <label className="block text-xs text-white/40 mb-2">Amount (₹)</label>
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">₹</span>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={1}
            max={balance}
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
          />
          <button
            onClick={() => setAmount(balance.toFixed(2))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 hover:text-white/60 border border-white/[0.08] rounded px-2 py-0.5"
          >
            MAX
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs mb-4">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <Button
          onClick={handleWithdraw}
          disabled={loading}
          size="lg"
          className="w-full bg-white hover:bg-white/90 text-black"
        >
          {loading ? "Processing..." : "Withdraw"}
        </Button>

        <p className="text-[10px] text-white/20 text-center mt-3">
          Powered by Razorpay • Demo payout in test mode
        </p>
      </Card>
    </div>
  );
}

// ─── Success Toast ────────────────────────────────────────────────────────────
function SuccessToast({ upi, amount, onClose }: { upi: string; amount: number; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white text-black rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <CheckCircle2 size={20} className="text-green-600 shrink-0" />
      <div>
        <p className="text-sm font-semibold">₹{amount.toFixed(2)} sent!</p>
        <p className="text-xs text-black/50">{upi}</p>
      </div>
      <button onClick={onClose} className="ml-2 text-black/30 hover:text-black"><X size={14}/></button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { data: session } = useSession();
  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [toast, setToast]             = useState<{ upi: string; amount: number } | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/transactions"),
      ]);
      if (pRes.ok) { const d = await pRes.json(); setProfile(d.user); }
      if (tRes.ok) {
        const d = await tRes.json();
        // Show INR txns + WITHDRAWAL txns on inventory page
        setTransactions(
          (d.transactions || []).filter((tx: any) =>
            tx.currency === "INR" || tx.type === "WITHDRAWAL" || tx.type === "RECEIVED"
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSuccess = (newBal: number, upi: string, amount: number) => {
    setProfile(prev => prev ? { ...prev, inrBalance: newBal } : prev);
    setShowWithdraw(false);
    setToast({ upi, amount });
    // Refresh transactions
    fetch("/api/transactions")
      .then(r => r.json())
      .then(d => setTransactions(
        (d.transactions || []).filter((tx: any) =>
          tx.currency === "INR" || tx.type === "WITHDRAWAL" || tx.type === "RECEIVED"
        )
      ));
  };

  if (loading) {
    return (
      <div className="flex">
        <AppSidebar />
        <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-4xl flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const inrBal = Number(profile?.inrBalance || 0);

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-2">Inventory</h1>
        <p className="text-sm text-white/35 mb-8">Your SWYFTPAY INR wallet — receives converted payments</p>

        {/* Balance Card */}
        <Card className="p-8 mb-8" glow>
          <div className="flex items-center gap-2 mb-2 text-white/50 text-sm font-medium">
            <Banknote size={16} />
            <span>INR Application Balance</span>
          </div>
          <p className="text-5xl font-bold text-white mb-6 tracking-tight">{formatINR(inrBal)}</p>

          <div className="flex gap-3">
            <Button
              size="lg"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowWithdraw(true)}
              disabled={inrBal <= 0}
            >
              <ArrowUpRight size={16} /> Withdraw to UPI
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" disabled>
              <CreditCard size={16} /> Cards (soon)
            </Button>
          </div>

          {inrBal <= 0 && (
            <p className="text-xs text-white/25 mt-4 text-center">
              INR balance is credited when someone sends you AMOY via SwyftPay
            </p>
          )}
        </Card>

        {/* How it works */}
        <Card className="p-4 mb-8 border border-white/[0.04]">
          <p className="text-xs text-white/40 font-medium mb-2">How this works</p>
          <div className="space-y-1.5">
            <p className="text-xs text-white/25">1. Someone sends you AMOY via SwyftPay</p>
            <p className="text-xs text-white/25">2. AMOY → locked in escrow → released to admin treasury</p>
            <p className="text-xs text-white/25">3. INR equivalent credited here (₹7500/AMOY rate)</p>
            <p className="text-xs text-white/25">4. Withdraw to your UPI ID anytime</p>
          </div>
        </Card>

        {/* Transactions */}
        <h2 className="text-base font-semibold text-white mb-4">INR Activity</h2>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx: any) => (
              <Card key={tx.id} hover className="p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.06]">
                  {tx.type === "WITHDRAWAL"
                    ? <ArrowUpRight size={16} className="text-white/50" />
                    : <ArrowDownLeft size={16} className="text-white/60" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 font-medium truncate">
                    {tx.type === "WITHDRAWAL" ? `To: ${tx.counterpartyName}` : tx.counterpartyName || "Received"}
                  </p>
                  <p className="text-[11px] text-white/25">
                    {tx.type === "WITHDRAWAL" ? "UPI Withdrawal" : "Payment received"} • {tx.createdAt ? formatDate(tx.createdAt) : "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white/60">
                    {tx.type === "WITHDRAWAL" ? "−" : "+"} {formatINR(tx.inrEquivalent || tx.amount || 0)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <RefreshCcw size={18} className="mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/40 mb-1">No INR activity yet</p>
            <p className="text-xs text-white/20">Ask someone to send you AMOY via SwyftPay</p>
          </Card>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <WithdrawModal
          balance={inrBal}
          onClose={() => setShowWithdraw(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}

      {/* Success Toast */}
      {toast && (
        <SuccessToast
          upi={toast.upi}
          amount={toast.amount}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
