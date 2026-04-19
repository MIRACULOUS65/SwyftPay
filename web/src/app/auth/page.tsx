"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import {
  Zap, ArrowRight, Wallet, CheckCircle2, AlertTriangle,
  Mail, Lock, Eye, EyeOff, User
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<"auth" | "wallet">("auth");

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletLinked, setWalletLinked] = useState(false);

  // If already signed in, check wallet
  useEffect(() => {
    if (session?.user) {
      checkWallet();
    }
  }, [session]);

  const checkWallet = async () => {
    try {
      const res = await fetch("/api/wallet/link");
      const data = await res.json();
      if (data.walletAddress) {
        router.push("/dashboard");
      } else {
        setStep("wallet");
      }
    } catch {
      setStep("wallet");
    }
  };

  // ─── Google Sign In ───
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/auth",
      });
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  // ─── Email Sign In / Sign Up ───
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        const result = await signUp.email({
          email,
          password,
          name,
        });
        if (result.error) {
          setError(result.error.message || "Sign up failed");
        }
      } else {
        const result = await signIn.email({
          email,
          password,
        });
        if (result.error) {
          setError(result.error.message || "Sign in failed");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── MetaMask Connect ───
  const connectWallet = async () => {
    setWalletLoading(true);
    setError("");

    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setError("MetaMask not detected. Please install MetaMask to continue.");
        setWalletLoading(false);
        return;
      }

      // Request accounts
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = accounts[0];

      // Link wallet to account
      const res = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to link wallet");
        setWalletLoading(false);
        return;
      }

      setWalletAddress(address);
      setWalletLinked(true);

      // Redirect to dashboard after short delay
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setError(err?.message || "Wallet connection failed");
    } finally {
      setWalletLoading(false);
    }
  };

  const skipWallet = () => {
    router.push("/dashboard");
  };

  // ─── Loading State ───
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20 pb-12">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-5">
            <Zap size={22} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === "auth" ? "Welcome to SWYFTPAY" : "Connect Your Wallet"}
          </h1>
          <p className="text-sm text-white/40">
            {step === "auth"
              ? "Sign in to start sending cross-currency payments"
              : "Link your MetaMask wallet for blockchain payments"}
          </p>
        </div>

        {/* ═══════════ STEP 1: AUTH ═══════════ */}
        {step === "auth" && (
          <Card className="p-8">
            {/* Google Sign In */}
            <Button
              className="w-full mb-6"
              size="lg"
              variant="secondary"
              onClick={handleGoogleSignIn}
              loading={googleLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-[1px] bg-white/[0.08]" />
              <span className="text-xs text-white/25">or</span>
              <div className="flex-1 h-[1px] bg-white/[0.08]" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="text-xs text-white/30 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-white/30 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/30 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full pl-9 pr-10 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {mode === "signin" ? "Sign In" : "Create Account"}
                <ArrowRight size={14} />
              </Button>
            </form>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] mt-4">
                <AlertTriangle size={14} className="text-white/40 mt-0.5 shrink-0" />
                <p className="text-xs text-white/50">{error}</p>
              </div>
            )}

            {/* Toggle mode */}
            <p className="text-center mt-6 text-xs text-white/30">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
                className="text-white/60 hover:text-white transition-colors underline underline-offset-2"
              >
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </Card>
        )}

        {/* ═══════════ STEP 2: WALLET CONNECT ═══════════ */}
        {step === "wallet" && (
          <Card className="p-8">
            {!walletLinked ? (
              <div className="space-y-6">
                {/* Wallet icon */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.06] flex items-center justify-center mb-4">
                    <Wallet size={28} className="text-white/50" />
                  </div>
                  <p className="text-sm text-white/40 max-w-xs mx-auto">
                    Link your MetaMask wallet to enable crypto payments. This wallet will be uniquely tied to your SWYFTPAY account.
                  </p>
                </div>

                {/* How it works */}
                <div className="space-y-2">
                  {[
                    "Your wallet address is linked to your account",
                    "One wallet per account — ensures uniqueness",
                    "We never access your private keys",
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.02]">
                      <CheckCircle2 size={12} className="text-white/25 shrink-0" />
                      <span className="text-[11px] text-white/35">{text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={connectWallet}
                  loading={walletLoading}
                >
                  <Wallet size={16} />
                  Connect MetaMask
                </Button>

                <button
                  onClick={skipWallet}
                  className="w-full text-center text-xs text-white/25 hover:text-white/40 transition-colors py-2"
                >
                  Skip for now →
                </button>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <AlertTriangle size={14} className="text-white/40 mt-0.5 shrink-0" />
                    <p className="text-xs text-white/50">{error}</p>
                  </div>
                )}
              </div>
            ) : (
              /* ─── Success ─── */
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.08] flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-white/70" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white mb-1">Wallet Linked!</p>
                  <p className="text-xs text-white/30 font-mono break-all">{walletAddress}</p>
                </div>
                <p className="text-xs text-white/25">Redirecting to dashboard...</p>
              </div>
            )}
          </Card>
        )}

        {/* Network note */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 mt-6">
          <span className="w-1.5 h-1.5 rounded-full bg-white/15" />
          Polygon Amoy Testnet
        </div>
      </div>
    </div>
  );
}
