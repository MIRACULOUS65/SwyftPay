"use client";
import { useEffect, useRef, useState } from "react";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth-client";
import { formatINR, formatDate } from "@/lib/utils";
import {
  Banknote, ArrowUpRight, ArrowDownLeft, CreditCard,
  RefreshCcw, X, CheckCircle2, AlertCircle
} from "lucide-react";

interface UserProfile { id: string; name: string; inrBalance: number; }

// Extend window for Razorpay
declare global {
  interface Window { Razorpay: any; }
}

// ─── Load Razorpay checkout.js once ──────────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script   = document.createElement("script");
    script.src     = "https://checkout.razorpay.com/v1/checkout.js";
    script.async   = true;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

// ─── Withdraw Modal ───────────────────────────────────────────────────────────
function WithdrawModal({
  balance,
  userName,
  onClose,
  onSuccess,
}: {
  balance:   number;
  userName:  string;
  onClose:   () => void;
  onSuccess: (newBal: number, upi: string, amount: number, paymentId: string) => void;
}) {
  const [upiId,   setUpiId]   = useState("");
  const [amount,  setAmount]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const openRazorpay = async () => {
    setError("");
    const amt = parseFloat(amount);
    if (!upiId.trim())                          { setError("Enter your UPI ID"); return; }
    if (!/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
      setError("Invalid UPI ID (e.g. name@upi)"); return;
    }
    if (!amt || amt <= 0)                        { setError("Enter a valid amount"); return; }
    if (amt > balance)                           { setError(`Max ₹${balance.toFixed(2)} available`); return; }
    if (amt < 1)                                 { setError("Minimum withdrawal is ₹1"); return; }

    setLoading(true);
    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      // 2. Create order on backend
      const orderRes  = await fetch("/api/razorpay/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount: amt, upiId: upiId.trim() }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      // 3. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key:         orderData.keyId,
        amount:      orderData.amount,     // paise
        currency:    "INR",
        name:        "SwyftPay",
        description: `₹${amt} withdrawal to ${upiId.trim()}`,
        order_id:    orderData.orderId,
        image:       "/logo.png",
        theme:       { color: "#000000" },
        prefill: {
          // Pre-fill UPI so user doesn't have to type it again
          vpa:     upiId.trim(),
          name:    userName,
        },
        modal: {
          ondismiss: () => { setLoading(false); },
        },
        handler: async (response: {
          razorpay_order_id:   string;
          razorpay_payment_id: string;
          razorpay_signature:  string;
        }) => {
          // 4. Verify payment on backend + deduct balance
          try {
            const verifyRes  = await fetch("/api/razorpay/verify", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                amount:  amt,
                upiId:   upiId.trim(),
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed");
            }
            onSuccess(verifyData.newBalance, upiId.trim(), amt, response.razorpay_payment_id);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setLoading(false);
          }
        },
      });

      rzp.on("payment.failed", (resp: any) => {
        setError(`Payment failed: ${resp.error?.description || "Unknown error"}`);
        setLoading(false);
      });

      rzp.open();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60">
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-white mb-1">Withdraw to UPI</h2>
        <p className="text-xs text-white/35 mb-6">
          Powered by <span className="text-white/60 font-medium">Razorpay</span> — secure instant transfer
        </p>

        {/* Balance */}
        <div className="bg-white/[0.04] rounded-xl p-4 mb-5 flex justify-between items-center">
          <span className="text-sm text-white/40">Available balance</span>
          <span className="text-lg font-bold text-white">{formatINR(balance)}</span>
        </div>

        {/* UPI ID */}
        <label className="block text-xs text-white/40 mb-2">Your UPI ID</label>
        <input
          type="text"
          placeholder="yourname@paytm / @ybl / @upi"
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
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl pl-8 pr-16 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
          />
          <button
            onClick={() => setAmount(balance.toFixed(2))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 hover:text-white/60 border border-white/[0.08] rounded px-2 py-0.5"
          >
            MAX
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs mb-4">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <Button
          onClick={openRazorpay}
          disabled={loading}
          size="lg"
          className="w-full bg-white hover:bg-white/90 text-black font-semibold"
        >
          {loading ? "Opening Razorpay..." : "Pay via Razorpay →"}
        </Button>

        <div className="flex items-center justify-center gap-2 mt-3">
          <img src="https://razorpay.com/favicon.ico" alt="" className="w-3.5 h-3.5 opacity-40" />
          <p className="text-[10px] text-white/20">Secured by Razorpay • Test Mode Active</p>
        </div>
      </Card>
    </div>
  );
}

// ─── Success Toast ────────────────────────────────────────────────────────────
function SuccessToast({ upi, amount, paymentId, onClose }: {
  upi: string; amount: number; paymentId: string; onClose: () => void;
}) {
  useEffect(() => {
    // Auto-dismiss
    const t = setTimeout(onClose, 6000);

    // 🎵 Play success sound
    const audio = new Audio("/fahhhhh.mp3");
    audio.volume = 1.0;
    audio.play().catch(() => {}); // silent fail if browser blocks autoplay

    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white text-black rounded-2xl px-5 py-4 shadow-2xl flex items-start gap-3 max-w-sm animate-in slide-in-from-bottom-4">
      <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">₹{amount.toFixed(2)} withdrawn!</p>
        <p className="text-xs text-black/50 truncate">→ {upi}</p>
        <p className="text-[10px] text-black/30 font-mono truncate">{paymentId}</p>
      </div>
      <button onClick={onClose} className="text-black/20 hover:text-black/50 shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { data: session }     = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [toast, setToast]     = useState<{ upi: string; amount: number; paymentId: string } | null>(null);

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
        setTransactions((d.transactions || []).filter((tx: any) =>
          tx.type === "WITHDRAWAL" || tx.type === "RECEIVED"
        ));
      }
    } finally { setLoading(false); }
  };

  const handleSuccess = (newBal: number, upi: string, amount: number, paymentId: string) => {
    setProfile(prev => prev ? { ...prev, inrBalance: newBal } : prev);
    setShowWithdraw(false);
    setToast({ upi, amount, paymentId });
    fetch("/api/transactions").then(r => r.json()).then(d =>
      setTransactions((d.transactions || []).filter((tx: any) =>
        tx.type === "WITHDRAWAL" || tx.type === "RECEIVED"
      ))
    );
  };

  if (loading) {
    return (
      <div className="flex"><AppSidebar />
        <div className="flex-1 lg:ml-60 pt-20 flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const inrBal  = Number(profile?.inrBalance || 0);
  const userName = profile?.name || session?.user?.name || "User";

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-2">Inventory</h1>
        <p className="text-sm text-white/35 mb-8">Your SwyftPay INR wallet</p>

        {/* Balance Card */}
        <Card className="p-8 mb-8" glow>
          <div className="flex items-center gap-2 mb-2 text-white/50 text-sm font-medium">
            <Banknote size={16} /> <span>INR Application Balance</span>
          </div>
          <p className="text-5xl font-bold text-white mb-6 tracking-tight">{formatINR(inrBal)}</p>

          <div className="flex gap-3">
            <Button
              size="lg"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowWithdraw(true)}
              disabled={inrBal < 1}
            >
              <ArrowUpRight size={16} /> Withdraw via Razorpay
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" disabled>
              <CreditCard size={16} /> Cards (soon)
            </Button>
          </div>

          {inrBal < 1 && (
            <p className="text-xs text-white/25 mt-4 text-center">
              INR is credited when someone sends you AMOY via SwyftPay
            </p>
          )}
        </Card>

        {/* How it works */}
        <Card className="p-4 mb-8 border border-white/[0.04]">
          <p className="text-xs text-white/40 font-medium mb-2">Payment flow</p>
          <div className="space-y-1.5">
            <p className="text-xs text-white/25">1. Receive AMOY → INR credited here at ₹7500/AMOY</p>
            <p className="text-xs text-white/25">2. Enter UPI + amount → Razorpay checkout opens</p>
            <p className="text-xs text-white/25">3. Confirm in Razorpay → balance deducted → ₹ transferred</p>
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
                    {tx.type === "WITHDRAWAL" ? `→ ${tx.counterpartyName}` : tx.counterpartyName || "Received"}
                  </p>
                  <p className="text-[11px] text-white/25">
                    {tx.type === "WITHDRAWAL" ? "Razorpay withdrawal" : "Payment received"}
                    {tx.createdAt ? ` • ${formatDate(tx.createdAt)}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white/60">
                    {tx.type === "WITHDRAWAL" ? "−" : "+"}{formatINR(tx.inrEquivalent || tx.amount || 0)}
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
          userName={userName}
          onClose={() => setShowWithdraw(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Success Toast */}
      {toast && (
        <SuccessToast
          upi={toast.upi}
          amount={toast.amount}
          paymentId={toast.paymentId}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
