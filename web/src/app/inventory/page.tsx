"use client";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth-client";
import { formatINR, formatDate } from "@/lib/utils";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Plus,
  CreditCard, Banknote, RefreshCcw
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  inrBalance: number;
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const profileRes = await fetch("/api/user/profile");
      if (profileRes.ok) {
        const d = await profileRes.json();
        setProfile(d.user);
      }
      
      const txRes = await fetch("/api/transactions");
      if (txRes.ok) {
        const d = await txRes.json();
        // Filter only INR transactions for the inventory page
        setTransactions(d.transactions?.filter((tx: any) => tx.currency === "INR") || []);
      }
    } finally {
      setLoading(false);
    }
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

  const inrBal = profile?.inrBalance || 0;

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-2">Inventory</h1>
        <p className="text-sm text-white/35 mb-8">Your internal SWYFTPAY INR wallet</p>

        {/* Balance Card */}
        <Card className="p-8 mb-8" glow>
          <div className="flex items-center gap-2 mb-2 text-white/50 text-sm font-medium">
            <Banknote size={16} /> 
            <span>INR Application Balance</span>
          </div>
          <p className="text-5xl font-bold text-white mb-6 tracking-tight">{formatINR(inrBal)}</p>
          
          <div className="flex gap-4">
            <Button size="lg" className="flex-1 bg-white hover:bg-white/90 text-black">
              <Plus size={16} /> Add Money
            </Button>
            <Button size="lg" variant="secondary" className="flex-1">
              <ArrowUpRight size={16} /> Withdraw
            </Button>
            <Button size="lg" variant="secondary" className="flex-1">
              <CreditCard size={16} /> Cards
            </Button>
          </div>
        </Card>

        <h2 className="text-base font-semibold text-white mb-4">INR Activity</h2>
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
                    {tx.type === "SENT" ? "−" : "+"} {formatINR(tx.amount || 0)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <RefreshCcw size={18} className="mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/40 mb-1">No INR transactions yet</p>
            <p className="text-xs text-white/20">Add money to your inventory to get started</p>
          </Card>
        )}
      </div>
    </div>
  );
}
