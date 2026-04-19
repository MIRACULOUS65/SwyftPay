"use client";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth-client";
import { truncateAddress } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Share2, AlertTriangle, Check } from "lucide-react";

export default function ReceivePage() {
  const { data: session } = useSession();
  const [profile, setProfile]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);

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
  const userName   = profile?.name || session?.user?.name || "User";

  // ─── QR encodes a direct deep-link URL ───────────────────────────────────
  // When anyone scans this QR:
  //   → Browser opens /send?to=0x...&name=Alice
  //   → Send page auto-fills the receiver address
  const appBase  = typeof window !== "undefined"
    ? window.location.origin        // e.g. https://swyftpay.vercel.app
    : "http://localhost:3000";

  const sendUrl  = walletAddr
    ? `${appBase}/send?to=${encodeURIComponent(walletAddr)}&name=${encodeURIComponent(userName)}`
    : "";

  const copyLink = () => {
    if (!sendUrl) return;
    navigator.clipboard.writeText(sendUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg  = document.querySelector("#swyftpay-qr svg") as SVGElement;
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `swyftpay-${userName.replace(/\s+/g, "-").toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!sendUrl) return;
    if (navigator.share) {
      await navigator.share({ title: `Pay ${userName} via SwyftPay`, url: sendUrl });
    } else {
      copyLink();
    }
  };

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Receive Payment</h1>
        <p className="text-sm text-white/35 mb-8">
          Share your unique QR — scanner lands on Send page with your address pre-filled
        </p>

        {walletAddr ? (
          <>
            <Card className="p-8 text-center mb-6" glow>
              {/* QR Code */}
              <div id="swyftpay-qr" className="inline-block p-5 bg-white rounded-3xl mb-6">
                <QRCodeSVG
                  value={sendUrl}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  /* embed a tiny logo center — optional, remove if it causes issues */
                />
              </div>

              <h2 className="text-lg font-semibold text-white mb-1">{userName}</h2>
              <p className="text-xs text-white/30 font-mono mb-1">{truncateAddress(walletAddr, 10)}</p>
              <p className="text-[10px] text-white/20 break-all px-4 mb-4">{sendUrl}</p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400/70 animate-pulse" />
                <span className="text-[11px] text-white/40">Unique to your wallet</span>
              </div>
            </Card>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Button variant="secondary" className="w-full" onClick={copyLink}>
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleDownload}>
                <Download size={14} /> Save QR
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleShare}>
                <Share2 size={14} /> Share
              </Button>
            </div>

            {/* How it works */}
            <Card className="p-4 border border-white/[0.04]">
              <p className="text-xs text-white/40 font-medium mb-2">How this QR works</p>
              <div className="space-y-1.5">
                <p className="text-xs text-white/25">1. Someone scans this QR with their camera</p>
                <p className="text-xs text-white/25">2. Browser opens SwyftPay Send page</p>
                <p className="text-xs text-white/25">3. Your wallet address is auto-filled as receiver</p>
                <p className="text-xs text-white/25">4. They confirm amount → AMOY sent → you get INR ✅</p>
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-8 text-center">
            <AlertTriangle size={24} className="mx-auto text-white/25 mb-4" />
            <p className="text-sm text-white/50 mb-2">No wallet linked</p>
            <p className="text-xs text-white/25 mb-4">
              Link your MetaMask wallet to generate your unique payment QR code.
            </p>
            <a href="/auth"><Button>Link Wallet</Button></a>
          </Card>
        )}
      </div>
    </div>
  );
}
