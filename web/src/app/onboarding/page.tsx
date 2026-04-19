"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Zap, ArrowRight, Mail, CheckCircle2, Sparkles } from "lucide-react";

const onboardingSteps = [
  { step: "01", title: "Connect Wallet", desc: "Link your MetaMask wallet to SWYFTPAY for blockchain payments." },
  { step: "02", title: "Get Your QR", desc: "Your unique QR code is generated instantly. Share it to receive payments." },
  { step: "03", title: "Scan & Pay", desc: "Scan any SWYFTPAY QR. Choose your currency. We handle the rest." },
];

export default function OnboardingPage() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-5">
            <Zap size={22} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Get Early Access</h1>
          <p className="text-sm text-white/40">SWYFTPAY is launching on Polygon. Be among the first.</p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-10">
          {onboardingSteps.map(({ step, title, desc }) => (
            <Card key={step} variant="flat" className="p-5 flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                <span className="text-[10px] font-mono text-white/30">{step}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-0.5">{title}</p>
                <p className="text-xs text-white/30">{desc}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Waitlist Form */}
        <Card className="p-8 text-center">
          {!joined ? (
            <>
              <Sparkles size={20} className="mx-auto mb-4 text-white/30" />
              <p className="text-sm text-white/50 mb-4">Join the waitlist</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:border-white/20 focus:outline-none transition-colors"
                />
                <Button onClick={() => setJoined(true)} disabled={!email.includes("@")}>
                  <Mail size={14} /> Join
                </Button>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 size={32} className="mx-auto mb-4 text-white/60" />
              <p className="text-base font-semibold text-white mb-1">You're on the list!</p>
              <p className="text-xs text-white/30 mb-6">We'll notify you when SWYFTPAY launches.</p>
              <Link href="/auth">
                <Button>
                  Try the Preview <ArrowRight size={14} />
                </Button>
              </Link>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
