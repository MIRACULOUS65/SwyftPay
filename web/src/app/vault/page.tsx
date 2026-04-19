"use client";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSession } from "@/lib/auth-client";
import { formatINR } from "@/lib/utils";
import {
  Shield, Users, Plus, Settings, CheckCircle2, Clock, AlertTriangle
} from "lucide-react";

export default function VaultPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";

  // Real data would come from a vault API — for now, show empty state
  const [vaults, setVaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Family Vault</h1>
            <p className="text-sm text-white/35">Shared savings with multi-member controls</p>
          </div>
          <Button variant="secondary" size="sm"><Plus size={14} /> Create Vault</Button>
        </div>

        {vaults.length > 0 ? (
          <div className="space-y-4">
            {/* Real vault cards would render here */}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Shield size={24} className="text-white/20" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No Vaults Yet</h2>
            <p className="text-sm text-white/35 max-w-sm mx-auto mb-6">
              Create a shared vault to manage family or group savings with spending limits, multi-member approvals, and transparent activity logs.
            </p>
            <Button><Plus size={14} /> Create Your First Vault</Button>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
              {[
                { icon: Shield, title: "Spending Limits", desc: "Set per-transaction limits for each member" },
                { icon: Users, title: "Multi-Member", desc: "Invite family members with role-based access" },
                { icon: CheckCircle2, title: "Activity Tracking", desc: "Every action is logged and visible" },
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
