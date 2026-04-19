"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { useSession } from "@/lib/auth-client";
import { truncateAddress, formatINR, formatRelativeTime } from "@/lib/utils";
import {
  ArrowUpRight, ArrowDownLeft, QrCode, Plus, Wallet,
  RefreshCcw, ChevronRight, Copy
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { WalletConnectModal } from "@/components/WalletConnectModal";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  walletAddress: string | null;
  preferredCurrency: string;
  inrBalance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  counterpartyName: string;
  status: string;
  createdAt: string;
}

const quickActions = [
  { label: "Send", icon: ArrowUpRight, href: "/send", accent: true },
  { label: "Receive", icon: ArrowDownLeft, href: "/receive" },
  { label: "Scan QR", icon: QrCode, href: "/scan" },
  { label: "Add Money", icon: Plus, href: "#" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amoyBalance, setAmoyBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const profileRes = await fetch("/api/user/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.user);

        // Fetch AMOY balance from Polygon if wallet is connected
        if (profileData.user.walletAddress) {
          fetchAmoyBalance(profileData.user.walletAddress);
        }
      }

      // Fetch transactions
      const txRes = await fetch("/api/transactions");
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmoyBalance = async (address: string) => {
    try {
      const res = await fetch(
        `https://rpc-amoy.polygon.technology`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [address, "latest"],
            id: 1,
          }),
        }
      );
      const data = await res.json();
      if (data.result) {
        const balanceWei = BigInt(data.result);
        const balanceEth = Number(balanceWei) / 1e18;
        setAmoyBalance(balanceEth.toFixed(4));
      }
    } catch {
      setAmoyBalance("0.0000");
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <AppSidebar />
        <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-5xl flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const userName = profile?.name || session?.user?.name || "User";
  const userEmail = profile?.email || session?.user?.email || "";
  const walletAddr = profile?.walletAddress || null;
  const inrBal = profile?.inrBalance || 0;
  const amoyBal = parseFloat(amoyBalance) || 0;

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-5xl">
        {/* Greeting */}
        <div className="mb-8">
          <p className="text-sm text-white/30 mb-1">Welcome back,</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{userName}</h1>
        </div>

        {/* ─── Balance Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="p-6" glow>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">INR Balance</p>
            <p className="text-3xl sm:text-4xl font-bold text-white">{formatINR(inrBal)}</p>
            <p className="text-xs text-white/25">Internal wallet</p>
          </Card>
          <Card className="p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">AMOY Balance</p>
            <p className="text-3xl sm:text-4xl font-bold text-white">
              {amoyBalance} <span className="text-lg text-white/40">AMOY</span>
            </p>
            <p className="text-xs text-white/25">
              {amoyBal > 0 ? `≈ ${formatINR(amoyBal * 7500)}` : "Connect wallet to view"}
            </p>
          </Card>
        </div>

        {/* ─── Wallet Badge ─── */}
        <Card className="p-4 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">
              <Wallet size={16} className="text-white/50" />
            </div>
            <div>
              <p className="text-xs text-white/30">Connected Wallet</p>
              <p className="text-sm text-white/70 font-mono">
                {walletAddr ? truncateAddress(walletAddr, 6) : "No wallet linked"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {walletAddr ? (
              <>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                  Amoy
                </span>
                <button
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
                  onClick={() => navigator.clipboard.writeText(walletAddr)}
                >
                  <Copy size={14} />
                </button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setShowWalletModal(true)}>
                Link Wallet
              </Button>
            )}
          </div>
        </Card>

        {/* ─── Quick Actions ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {quickActions.map(({ label, icon: Icon, href, accent }) => (
            <Link key={label} href={href}>
              <Card hover className="p-4 flex flex-col items-center gap-3 text-center">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${accent ? "bg-white text-black" : "bg-white/[0.06] text-white/50"}`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs font-medium text-white/60">{label}</span>
              </Card>
            </Link>
          ))}
        </div>

        {/* ─── My QR Code ─── */}
        {walletAddr && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-white">Your QR Code</p>
                <p className="text-xs text-white/30">Share to receive payments</p>
              </div>
              <Link href="/receive">
                <Button variant="secondary" size="sm">
                  Full View <ChevronRight size={12} />
                </Button>
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG
                  value={JSON.stringify({
                    userId: profile?.id,
                    walletAddress: walletAddr,
                    preferredCurrency: profile?.preferredCurrency || "INR",
                    name: userName,
                  })}
                  size={140}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
            </div>
          </Card>
        )}

        {/* ─── Transaction Feed ─── */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Recent Activity</h2>
          <Link href="/wallet" className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Link key={tx.id} href={`/transaction/${tx.id}`}>
                <Card hover className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.06]">
                      {tx.type === "SENT" ? <ArrowUpRight size={16} className="text-white/50" /> :
                       tx.type === "RECEIVED" ? <ArrowDownLeft size={16} className="text-white/60" /> :
                       <RefreshCcw size={16} className="text-white/40" />}
                    </div>
                    <div>
                      <p className="text-sm text-white/80 font-medium">{tx.counterpartyName}</p>
                      <p className="text-xs text-white/30">{formatRelativeTime(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white/60">
                      {tx.type === "SENT" ? "−" : "+"}{" "}
                      {tx.currency === "INR" ? formatINR(tx.amount) : `${tx.amount} AMOY`}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
              <RefreshCcw size={18} className="text-white/20" />
            </div>
            <p className="text-sm text-white/40 mb-1">No transactions yet</p>
            <p className="text-xs text-white/20">Your payment history will appear here</p>
          </Card>
        )}
      </div>

      {/* Wallet Connect Modal */}
      {showWalletModal && (
        <WalletConnectModal
          onSuccess={(addr) => {
            setShowWalletModal(false);
            fetchData(); // refresh profile so wallet shows up immediately
          }}
          onClose={() => setShowWalletModal(false)}
        />
      )}
    </div>
  );
}
