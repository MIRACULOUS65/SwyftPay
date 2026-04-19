"use client";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CurrencyBadge } from "@/components/ui/Badge";
import { useSession } from "@/lib/auth-client";
import { formatINR, truncateAddress, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, RefreshCcw,
  Copy, ChevronRight, TrendingUp
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { WalletConnectModal } from "@/components/WalletConnectModal";

const MOCK_CHART_DATA = [
  { time: "00:00", price: 7420 },
  { time: "04:00", price: 7480 },
  { time: "08:00", price: 7450 },
  { time: "12:00", price: 7520 },
  { time: "16:00", price: 7580 },
  { time: "20:00", price: 7510 },
  { time: "24:00", price: 7540 },
];

interface UserProfile {
  id: string;
  name: string;
  walletAddress: string | null;
  inrBalance: number;
  preferredCurrency: string;
}

export default function WalletPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [amoyBalance, setAmoyBalance] = useState("0.0000");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const profileRes = await fetch("/api/user/profile");
      if (profileRes.ok) {
        const d = await profileRes.json();
        setProfile(d.user);
        if (d.user.walletAddress) fetchAmoyBalance(d.user.walletAddress);
      }
      const txRes = await fetch("/api/transactions");
      if (txRes.ok) {
        const d = await txRes.json();
        setTransactions(d.transactions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAmoyBalance = async (address: string) => {
    try {
      const res = await fetch("https://rpc-amoy.polygon.technology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBalance", params: [address, "latest"], id: 1 }),
      });
      const data = await res.json();
      if (data.result) setAmoyBalance((Number(BigInt(data.result)) / 1e18).toFixed(4));
    } catch { setAmoyBalance("0.0000"); }
  };

  if (loading) {
    return (
      <div className="flex"><AppSidebar />
        <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-4xl flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const walletAddr = profile?.walletAddress || null;
  const inrBal = profile?.inrBalance || 0;
  const amoyBal = parseFloat(amoyBalance);

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-2">Wallet</h1>
        <p className="text-sm text-white/35 mb-8">Manage your balances and view transaction history</p>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <Wallet size={18} className="text-white/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{walletAddr ? "MetaMask" : "No Wallet"}</p>
                <p className="text-xs text-white/30 font-mono">{walletAddr ? truncateAddress(walletAddr, 8) : "Not connected"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {walletAddr && (
                <>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" /> Polygon Amoy
                  </span>
                  <button onClick={() => navigator.clipboard.writeText(walletAddr)} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white/50 transition-colors">
                    <Copy size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="p-6" glow>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/30 uppercase tracking-widest">INR Balance</p>
              <CurrencyBadge currency="INR" />
            </div>
            <p className="text-3xl font-bold text-white">{formatINR(inrBal)}</p>
            <p className="text-xs text-white/25 mt-1">Internal wallet</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/30 uppercase tracking-widest">AMOY Balance</p>
              <CurrencyBadge currency="AMOY" />
            </div>
            <p className="text-3xl font-bold text-white">{amoyBalance} <span className="text-base text-white/40">AMOY</span></p>
            <p className="text-xs text-white/25 mt-1">{amoyBal > 0 ? `≈ ${formatINR(amoyBal * 7500)}` : "—"}</p>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-white/50" />
                AMOY to INR Market
              </h2>
              <p className="text-xs text-white/30 mt-1">Live exchange rate (last 24h)</p>
            </div>
            <div className="text-right">
              <p className="text-base font-medium text-white">{formatINR(7540)}</p>
              <p className="text-xs text-[#00ff9d]">+1.61% Today</p>
            </div>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_CHART_DATA} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={['dataMin - 50', 'dataMax + 50']} hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#151515] border border-white/10 p-2 rounded-lg shadow-xl">
                          <p className="text-xs text-white/50 mb-1">{payload[0].payload.time}</p>
                          <p className="text-sm font-bold text-white">{formatINR(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="price" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="flex gap-3 mb-8">
          <Link href="/send" className="flex-1"><Button variant="primary" className="w-full"><ArrowUpRight size={14} /> Send</Button></Link>
          <Link href="/receive" className="flex-1"><Button variant="secondary" className="w-full"><ArrowDownLeft size={14} /> Receive</Button></Link>
        </div>

        <h2 className="text-base font-semibold text-white mb-4">All Transactions</h2>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx: any) => (
              <Card key={tx.id} hover className="p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.06]">
                  {tx.type === "SENT" ? <ArrowUpRight size={16} className="text-white/50" /> :
                   <ArrowDownLeft size={16} className="text-white/60" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 font-medium truncate">{tx.counterpartyName || "Unknown"}</p>
                  <p className="text-[11px] text-white/25">{tx.createdAt ? formatDate(tx.createdAt) : "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white/60">
                    {tx.type === "SENT" ? "−" : "+"} {tx.currency === "INR" ? formatINR(tx.amount || 0) : `${tx.amount || 0} AMOY`}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <RefreshCcw size={18} className="mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/40 mb-1">No transactions yet</p>
            <p className="text-xs text-white/20">Start by sending or receiving a payment</p>
          </Card>
        )}
      </div>
    </div>
  );
}
