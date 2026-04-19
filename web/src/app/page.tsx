import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import {
  ChevronRight, ArrowRight, QrCode, Shield, Zap, Wallet,
  Users, ArrowLeftRight, Lock, Timer, CheckCircle2, Sparkles,
  ScanLine, Globe
} from "lucide-react";

/* ─── Stats strip data ─── */
const proofItems = [
  { metric: "< 2s", label: "Settlement Speed", icon: Timer },
  { metric: "0%", label: "Platform Fee", icon: Sparkles },
  { metric: "100%", label: "Non-Custodial", icon: Lock },
  { metric: "Escrow", label: "Protected", icon: Shield },
];

/* ─── How it works steps ─── */
const steps = [
  { step: "01", title: "Scan QR", desc: "Scan the receiver's QR code with your camera. Their payment identity is embedded.", icon: ScanLine },
  { step: "02", title: "Choose Currency", desc: "Select whether to pay in AMOY (crypto) or INR. The receiver gets value in their preferred currency.", icon: ArrowLeftRight },
  { step: "03", title: "Escrow & Lock", desc: "Rate is locked. Crypto is held in a smart contract escrow for safety.", icon: Lock },
  { step: "04", title: "Settled", desc: "Once verified, value is delivered. Receiver is credited instantly.", icon: CheckCircle2 },
];

/* ─── Feature cards ─── */
const features = [
  { title: "Smart Dashboard", desc: "View all balances, recent transactions, and quick actions at a glance.", icon: Wallet },
  { title: "Family Vault", desc: "Shared savings with multi-member controls, spending limits, and approvals.", icon: Shield },
  { title: "Social Payments", desc: "Split bills, request payments, and settle with groups seamlessly.", icon: Users },
  { title: "QR Transfers", desc: "One scan to send. The QR carries identity, address, and preferences.", icon: QrCode },
];

/* ─── Trust items ─── */
const trustItems = [
  { title: "Escrow-Backed Safety", desc: "Every crypto transaction passes through a smart contract. Funds are never at risk of partial execution." },
  { title: "Non-Custodial Architecture", desc: "You always control your wallet. SWYFTPAY never accesses your private keys or stores seed phrases." },
  { title: "Deterministic Settlement", desc: "Exchange rates are locked at initiation. What you see is what the receiver gets, every time." },
];

export default function LandingPage() {
  return (
    <div className="relative">
      {/* ═══ HERO SECTION ═══ */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)" }} />
          <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-white/10" />
          <div className="absolute bottom-40 left-32 w-1 h-1 rounded-full bg-white/15" />
          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-white/8" />
        </div>

        <div className="relative z-10 max-w-4xl text-center">
          {/* Pre-headline badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
            <span className="text-xs text-white/50 font-medium">Live on Polygon Amoy Testnet</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-6 animate-fade-up delay-100">
            <span className="gradient-text">One QR.</span>
            <br />
            <span className="text-white">Any Currency.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base sm:text-lg text-white/45 max-w-xl mx-auto mb-10 animate-fade-up delay-200 leading-relaxed">
            Pay with crypto. Receive in INR. SWYFTPAY abstracts the complexity of blockchain 
            behind a simple scan-and-pay experience.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-black font-semibold text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300"
            >
              Launch App
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-white/70 font-medium text-sm hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300"
            >
              See How It Works
            </Link>
          </div>

          {/* Product preview frame */}
          <div className="mt-16 mx-auto max-w-2xl animate-fade-up delay-500">
            <div
              className="rounded-2xl p-[1px]"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)" }}
            >
              <div className="rounded-2xl p-8 sm:p-12" style={{ background: "#0A0A0A" }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Total Balance</p>
                    <p className="text-3xl sm:text-4xl font-bold text-white">₹45,820</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
                    <span className="text-[11px] text-white/50">Connected</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {["Send", "Receive", "Scan", "Vault"].map((label) => (
                    <div key={label} className="flex flex-col items-center gap-2 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center">
                        <Zap size={14} className="text-white/60" />
                      </div>
                      <span className="text-[10px] text-white/40">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROOF STRIP ═══ */}
      <section className="px-6 py-16 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10">
          {proofItems.map(({ metric, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon size={20} className="mx-auto mb-3 text-white/30" />
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{metric}</p>
              <p className="text-xs text-white/35">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-white/30 uppercase tracking-[0.2em] mb-4">How it works</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Four steps. One experience.</h2>
            <p className="text-sm text-white/40 max-w-md mx-auto">From scan to settlement, SWYFTPAY handles conversion, escrow, and verification automatically.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ step, title, desc, icon: Icon }) => (
              <div
                key={step}
                className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-mono text-white/20">{step}</span>
                  <Icon size={18} className="text-white/40 group-hover:text-white/70 transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURE GRID ═══ */}
      <section id="features" className="px-6 py-24" style={{ background: "#0A0A0A" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-white/30 uppercase tracking-[0.2em] mb-4">Features</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Built for real payments.</h2>
            <p className="text-sm text-white/40 max-w-md mx-auto">More than a wallet. A payment operating system.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map(({ title, desc, icon: Icon }) => (
              <div
                key={title}
                className="group p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-5 group-hover:bg-white/[0.10] transition-colors">
                  <Icon size={20} className="text-white/50" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST & SAFETY ═══ */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-white/30 uppercase tracking-[0.2em] mb-4">Trust & Safety</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Money moves safely.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustItems.map(({ title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
              >
                <Shield size={20} className="text-white/30 mb-4" />
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-6 py-24" style={{ background: "#0A0A0A" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            Ready to pay without borders?
          </h2>
          <p className="text-sm text-white/40 mb-10 max-w-md mx-auto">
            Scan. Choose. Settle. SWYFTPAY makes cross-currency payments as simple as a QR code.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-black font-semibold text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300"
            >
              Get Started <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/auth"
              className="flex items-center gap-2 px-10 py-4 rounded-2xl border border-white/10 text-white/60 font-medium text-sm hover:bg-white/[0.04] hover:text-white/80 transition-all duration-300"
            >
              Connect Wallet
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
