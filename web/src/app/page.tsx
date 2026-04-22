"use client";
import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import {
  ArrowRight, QrCode, Shield, Zap, Wallet, Zap as ZapIcon,
  ArrowLeftRight, Lock, Timer, CheckCircle2, Sparkles, ScanLine, ChevronRight, LogOut,
} from "lucide-react";

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const proofItems = [
  { metric: "< 2s",   label: "Settlement Speed",  icon: Timer },
  { metric: "0%",     label: "Platform Fee",       icon: Sparkles },
  { metric: "100%",   label: "Non-Custodial",      icon: Lock },
  { metric: "Escrow", label: "Protected",          icon: Shield },
];

const steps = [
  { step: "01", title: "Scan QR",       desc: "Scan the receiver's QR code. Their wallet address is embedded — no typing needed.", icon: ScanLine },
  { step: "02", title: "Send AMOY",     desc: "Confirm the amount. Your AMOY goes through blockchain escrow — transparent and safe.", icon: ArrowLeftRight },
  { step: "03", title: "Escrow & Lock", desc: "Rate is locked at initiation. Smart contract holds funds until settlement completes.", icon: Lock },
  { step: "04", title: "INR Credited",  desc: "Receiver is credited INR instantly. Withdraw via Razorpay anytime.", icon: CheckCircle2 },
];

const features = [
  { title: "Smart Dashboard",   desc: "Real-time AMOY balance, INR wallet, recent transactions, and one-tap quick actions.",     icon: Wallet },
  { title: "Escrow Payments",   desc: "Every transaction is backed by a Solidity smart contract. Funds never touch a middleman.", icon: Shield },
  { title: "Razorpay Withdraw", desc: "Convert your INR balance to your bank or UPI — powered by Razorpay.",                    icon: Zap },
  { title: "QR Transfers",      desc: "One scan. Address auto-fills. Pay crypto — receiver gets INR.",                          icon: QrCode },
];

type Tab = "home" | "how-it-works" | "features";

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [tab, setTab] = useState<Tab>("home");
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#060606]">

      {/* ── Background Video ────────────────────────────────────────────── */}
      <video autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.20) 40%, rgba(6,6,6,0.82) 100%)" }}
      />

      {/* ── Full-page layout ────────────────────────────────────────────── */}
      <div className="relative z-10 h-full flex flex-col">

        {/* ══════════════════════════════════════════════════════════════
            OWN NAVBAR — transparent, logo left | tabs center | cta right
            ══════════════════════════════════════════════════════════════ */}
        <header className="flex items-center justify-between px-8 py-5 shrink-0">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <ZapIcon size={13} className="text-black" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">SWYFTPAY</span>
          </Link>

          {/* Center — tab pills (replacing the old "Home / How it works / Features" nav links) */}
          <nav className="absolute left-1/2 -translate-x-1/2">
            <div className="inline-flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md">
              {(["home", "how-it-works", "features"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200
                    ${tab === t
                      ? "bg-white text-black shadow-sm"
                      : "text-white/55 hover:text-white/80 hover:bg-white/5"
                    }`}
                >
                  {t === "home" ? "Home" : t === "how-it-works" ? "How it works" : "Features"}
                </button>
              ))}
            </div>
          </nav>

          {/* Right — auth buttons (same hrefs as global navbar) */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-all">
                  Dashboard <ChevronRight size={13} />
                </Link>
                <button onClick={handleSignOut}
                  className="text-white/40 hover:text-white/70 p-2 rounded-full hover:bg-white/5 transition-all">
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <>
                <Link href="/auth"
                  className="text-sm text-white/60 hover:text-white transition-colors px-2">
                  Sign in
                </Link>
                <Link href="/auth"
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-all">
                  Get Started <ChevronRight size={13} />
                </Link>
              </>
            )}
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════════
            TAB CONTENT
            ══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex items-center justify-center px-6 overflow-hidden">

          {/* ═══ HOME ═══ */}
          {tab === "home" && (
            <div className="max-w-5xl w-full text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15
                              bg-black/30 backdrop-blur-md mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white/70 font-medium tracking-wide">Live on Polygon Amoy Testnet</span>
              </div>

              <h1 className="mb-5 tracking-tight leading-[0.9]"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(3.5rem, 10vw, 8.5rem)", fontWeight: 900 }}>
                <span style={{ background: "linear-gradient(160deg,#fff 0%,rgba(255,255,255,0.7) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Pay Crypto.
                </span>
                <br />
                <span style={{ background: "linear-gradient(160deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.25) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Receive INR.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-white/55 max-w-lg mx-auto mb-10 leading-relaxed">
                SwyftPay turns blockchain complexity into a single QR scan. Send AMOY —
                your receiver sees rupees. Instant. Escrow-backed. No middleman.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                {/* Launch App → /dashboard (SAME) */}
                <Link href="/dashboard"
                  className="group flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-white text-black font-bold text-sm
                             hover:shadow-[0_0_40px_rgba(255,255,255,0.20)] hover:scale-[1.02] transition-all duration-300">
                  Launch App
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                {/* "See How It Works" switches tab (SAME intent) */}
                <button onClick={() => setTab("how-it-works")}
                  className="flex items-center gap-2 px-9 py-4 rounded-2xl border border-white/20 text-white/80 font-medium text-sm
                             backdrop-blur-sm bg-black/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300">
                  See How It Works
                </button>
              </div>

              {/* Stats strip */}
              <div className="flex flex-wrap items-center justify-center gap-8">
                {proofItems.map(({ metric, label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <Icon size={14} className="text-white/30" />
                    <span className="text-sm font-bold text-white">{metric}</span>
                    <span className="text-xs text-white/35">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ HOW IT WORKS ═══ */}
          {tab === "how-it-works" && (
            <div className="max-w-5xl w-full">
              <div className="text-center mb-10">
                <p className="text-xs text-white/25 uppercase tracking-[0.25em] mb-3">How it works</p>
                <h2 className="text-white mb-3"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 700 }}>
                  Four steps. One scan.
                </h2>
                <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
                  From QR to rupees — blockchain, conversion, escrow, and UPI payout. Automatic.
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {steps.map(({ step, title, desc, icon: Icon }) => (
                  <div key={step}
                    className="group p-6 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md
                               hover:bg-black/50 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[11px] font-mono text-white/20">{step}</span>
                      <Icon size={16} className="text-white/35 group-hover:text-white/70 transition-colors" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                    <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-8">
                <button onClick={() => setTab("home")} className="text-xs text-white/35 hover:text-white/60 transition-colors">← Back</button>
                {/* Get Started → /dashboard (SAME) */}
                <Link href="/dashboard"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-sm font-semibold
                             hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all">
                  Get Started <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* ═══ FEATURES ═══ */}
          {tab === "features" && (
            <div className="max-w-5xl w-full">
              <div className="text-center mb-10">
                <p className="text-xs text-white/25 uppercase tracking-[0.25em] mb-3">Features</p>
                <h2 className="text-white mb-3"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 700 }}>
                  Built for real payments.
                </h2>
                <p className="text-sm text-white/40 max-w-md mx-auto">More than a wallet — a cross-currency payment OS.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map(({ title, desc, icon: Icon }) => (
                  <div key={title}
                    className="group p-7 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md
                               hover:bg-black/50 hover:border-white/20 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center mb-4 group-hover:bg-white/[0.14] transition-colors">
                      <Icon size={18} className="text-white/50" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                    <p className="text-sm text-white/35 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-8">
                <button onClick={() => setTab("home")} className="text-xs text-white/35 hover:text-white/60 transition-colors">← Back</button>
                {/* Connect Wallet → /auth (SAME) */}
                <Link href="/auth"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white/70 text-sm font-medium
                             backdrop-blur-sm bg-black/20 hover:bg-white/10 transition-all">
                  Connect Wallet
                </Link>
                {/* Launch App → /dashboard (SAME) */}
                <Link href="/dashboard"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-sm font-semibold
                             hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all">
                  Launch App <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
