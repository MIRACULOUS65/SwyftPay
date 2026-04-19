"use client";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSession, signOut } from "@/lib/auth-client";
import { truncateAddress } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Wallet, Shield, Bell, Eye, LogOut, ChevronRight,
  Globe, Lock, Fingerprint, User
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(d => {
      if (d.user) setProfile(d.user);
    });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const walletAddr = profile?.walletAddress;
  const userName = profile?.name || session?.user?.name || "";
  const userEmail = profile?.email || session?.user?.email || "";

  const settingsSections = [
    {
      title: "Wallet & Connection",
      items: [
        { icon: Wallet, label: "Connected Wallet", value: walletAddr ? truncateAddress(walletAddr, 6) : "Not linked", action: walletAddr ? "Disconnect" : "Link" },
        { icon: Globe, label: "Network", value: "Polygon Amoy Testnet", action: "" },
      ],
    },
    {
      title: "Security",
      items: [
        { icon: Lock, label: "Transaction Signing", value: "MetaMask", action: "" },
        { icon: Fingerprint, label: "Session Lock", value: "Enabled", action: "Configure" },
        { icon: Shield, label: "Two-Factor Auth", value: "Not Set", action: "Enable" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", value: "All enabled", action: "Manage" },
        { icon: Eye, label: "Preferred Currency", value: profile?.preferredCurrency || "INR", action: "Change" },
      ],
    },
  ];

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-sm text-white/35 mb-8">Manage your account, security, and preferences</p>

        <Card className="p-6 mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.08] flex items-center justify-center text-lg font-bold text-white/50">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-white">{userName || "User"}</p>
            <p className="text-xs text-white/30">{userEmail}</p>
          </div>
        </Card>

        <div className="space-y-8">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-4">{section.title}</p>
              <div className="space-y-2">
                {section.items.map(({ icon: Icon, label, value, action }) => (
                  <Card key={label} variant="flat" className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon size={16} className="text-white/30" />
                      <div><p className="text-sm text-white/70">{label}</p><p className="text-[10px] text-white/25">{value}</p></div>
                    </div>
                    {action && <Button variant="ghost" size="sm">{action} <ChevronRight size={12} /></Button>}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-white/20 uppercase tracking-widest mb-4">Danger Zone</p>
          <Card variant="flat" className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogOut size={16} className="text-white/25" />
              <p className="text-sm text-white/40">Sign Out</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleSignOut}>Sign Out</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
