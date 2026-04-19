import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, ArrowLeft, Home } from "lucide-react";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-md w-full text-center">
        <Card className="p-10">
          <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={28} className="text-white/40" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Transaction Failed</h1>
          <p className="text-sm text-white/35 mb-6">
            The payment could not be completed. Your funds have been safely returned to your wallet via the escrow contract.
          </p>

          <Card variant="flat" className="p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/30">Status</span>
              <span className="text-white/50">REFUNDED</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/30">Reason</span>
              <span className="text-white/50">Verification timeout</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/30">Refund</span>
              <span className="text-white/50">2.5 AMOY returned</span>
            </div>
          </Card>

          <div className="flex gap-3">
            <Link href="/send" className="flex-1">
              <Button variant="secondary" className="w-full">
                <RefreshCcw size={14} /> Try Again
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">
                <Home size={14} /> Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
