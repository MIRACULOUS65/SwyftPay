"use client";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth-client";
import { formatINR } from "@/lib/utils";
import { Users, Plus, DollarSign, SplitSquareVertical } from "lucide-react";

export default function SocialPage() {
  const { data: session } = useSession();

  // Real data would come from a splits API — for now, show empty state
  const [splits, setSplits] = useState<any[]>([]);

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Social Payments</h1>
            <p className="text-sm text-white/35">Split bills, request payments, and settle with groups</p>
          </div>
          <Button variant="secondary" size="sm"><Plus size={14} /> New Split</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 text-center">
            <p className="text-2xl font-bold text-white">{formatINR(0)}</p>
            <p className="text-xs text-white/30">You Owe</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="text-2xl font-bold text-white">{formatINR(0)}</p>
            <p className="text-xs text-white/30">Owed to You</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-xs text-white/30">Active Groups</p>
          </Card>
        </div>

        {splits.length > 0 ? (
          <div className="space-y-4">
            {/* Real split cards would render here */}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <SplitSquareVertical size={24} className="text-white/20" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No Split Requests</h2>
            <p className="text-sm text-white/35 max-w-sm mx-auto mb-6">
              Create a split to divide expenses with friends. Everyone pays their share in their preferred currency.
            </p>
            <Button><Plus size={14} /> Create a Split</Button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
              {[
                { icon: Users, title: "Group Splits", desc: "Split among any number of members" },
                { icon: DollarSign, title: "Multi-Currency", desc: "Each person pays in INR or AMOY" },
                { icon: SplitSquareVertical, title: "Auto-Settle", desc: "One tap to settle your share" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <Icon size={16} className="text-white/25 mb-2" />
                  <p className="text-xs font-medium text-white/60 mb-1">{title}</p>
                  <p className="text-[10px] text-white/25">{desc}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
