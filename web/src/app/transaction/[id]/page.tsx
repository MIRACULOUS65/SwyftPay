import { AppSidebar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { StatusBadge, CurrencyBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_ORDER } from "@/lib/mockData";
import { formatINR, truncateAddress, formatDate } from "@/lib/utils";
import {
  ArrowRight, Lock, Shield, CheckCircle2,
  Clock, ExternalLink, Copy, ArrowLeftRight
} from "lucide-react";
import Link from "next/link";

const timelineSteps = [
  { label: "Order Created", time: "19:12:45", done: true },
  { label: "Rate Locked at ₹7,500/AMOY", time: "19:12:46", done: true },
  { label: "Escrow Deposit Confirmed", time: "19:12:52", done: true },
  { label: "Blockchain Verified", time: "19:13:01", done: true },
  { label: "Settlement Complete", time: "19:13:02", done: true },
];

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const order = MOCK_ORDER;

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-60 pt-20 pb-12 px-4 sm:px-8 max-w-3xl">
        <Link href="/wallet" className="text-xs text-white/30 hover:text-white/50 transition-colors mb-6 inline-block">
          ← Back to Wallet
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Transaction Detail</h1>
          <StatusBadge status={order.status} />
        </div>

        {/* Amount Card */}
        <Card className="p-8 text-center mb-6" glow>
          <p className="text-xs text-white/30 mb-2">Amount Sent</p>
          <p className="text-4xl font-bold text-white mb-2">{order.amountFrom} AMOY</p>
          <div className="flex items-center justify-center gap-2 text-sm text-white/35">
            <ArrowLeftRight size={14} />
            <span>{formatINR(order.amountTo)}</span>
          </div>
        </Card>

        {/* Parties */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-2 text-sm font-bold text-white/50">
                {order.senderName.charAt(0)}
              </div>
              <p className="text-sm text-white/70">{order.senderName}</p>
              <p className="text-[10px] text-white/25">Sender</p>
            </div>
            <ArrowRight size={20} className="text-white/15 mx-4" />
            <div className="text-center flex-1">
              <div className="w-11 h-11 rounded-full bg-white/[0.08] flex items-center justify-center mx-auto mb-2 text-sm font-bold text-white/60">
                {order.receiverName.charAt(0)}
              </div>
              <p className="text-sm text-white/70">{order.receiverName}</p>
              <p className="text-[10px] text-white/25">Receiver</p>
            </div>
          </div>
        </Card>

        {/* Details */}
        <Card variant="flat" className="p-6 mb-6 space-y-4">
          {[
            { label: "Order ID", value: order.orderId },
            { label: "Tx Hash", value: order.txHash ? truncateAddress(order.txHash, 12) : "—", mono: true },
            { label: "Escrow", value: order.escrowAddress ? truncateAddress(order.escrowAddress, 8) : "—", mono: true },
            { label: "Locked Rate", value: `1 AMOY = ${formatINR(order.lockedRate)}` },
            { label: "From → To", value: `${order.fromCurrency} → ${order.toCurrency}` },
            { label: "Created", value: formatDate(order.createdAt) },
            { label: "Expires", value: formatDate(order.expiresAt) },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-white/30">{label}</span>
              <span className={`text-xs text-white/60 ${mono ? "font-mono" : ""}`}>{value}</span>
            </div>
          ))}
        </Card>

        {/* Status Timeline */}
        <h2 className="text-base font-semibold text-white mb-4">Status Timeline</h2>
        <Card className="p-6 mb-6">
          <div className="space-y-0">
            {timelineSteps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.done ? "bg-white/[0.12]" : "bg-white/[0.04]"}`}>
                    <CheckCircle2 size={12} className={step.done ? "text-white/60" : "text-white/15"} />
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div className="w-[1px] h-8 bg-white/[0.06]" />
                  )}
                </div>
                <div className="pb-6">
                  <p className={`text-sm ${step.done ? "text-white/70" : "text-white/25"}`}>{step.label}</p>
                  <p className="text-[10px] text-white/20 font-mono">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1">
            <ExternalLink size={14} /> View on Explorer
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full">Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
