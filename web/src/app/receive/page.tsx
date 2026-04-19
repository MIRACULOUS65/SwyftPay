"use client";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth-client";
import { truncateAddress } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Share2, AlertTriangle } from "lucide-react";
import { WalletConnectModal } from "@/components/WalletConnectModal";

export default function ReceivePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => { if (d.user) setProfile(d.user); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex"><AppSidebar />
        <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-2xl flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const walletAddr = profile?.walletAddress;
  const userName = profile?.name || session?.user?.name || "User";

  const qrPayload = walletAddr ? JSON.stringify({
    userId: profile?.id,
    walletAddress: walletAddr,
    preferredCurrency: profile?.preferredCurrency || "INR",
    name: userName,
  }) : "";

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Receive Payment</h1>
        <p className="text-sm text-white/35 mb-8">Share your QR code to receive payments instantly</p>

        {walletAddr ? (
          <>
            <Card className="p-8 text-center mb-6">
              <div className="inline-block p-6 bg-white rounded-3xl mb-6">
                <QRCodeSVG value={qrPayload} size={200} bgColor="#ffffff" fgColor="#000000" level="H" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">{userName}</h2>
              <p className="text-xs text-white/30 font-mono mb-4">{truncateAddress(walletAddr, 8)}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                <span className="text-[11px] text-white/40">Prefers: {profile?.preferredCurrency || "INR"}</span>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <Button variant="secondary" className="w-full" onClick={() => navigator.clipboard.writeText(walletAddr)}>
                <Copy size={14} /> Copy
              </Button>
              <Button variant="secondary" className="w-full"><Download size={14} /> Save</Button>
              <Button variant="secondary" className="w-full"><Share2 size={14} /> Share</Button>
            </div>
          </>
        ) : (
          <Card className="p-8 text-center">
            <AlertTriangle size={24} className="mx-auto text-white/25 mb-4" />
            <p className="text-sm text-white/50 mb-2">No wallet linked</p>
            <p className="text-xs text-white/25 mb-4">Link your MetaMask wallet to generate a QR code for receiving payments.</p>
            <a href="/auth"><Button>Link Wallet</Button></a>
          </Card>
        )}
      </div>
    </div>
  );
}
