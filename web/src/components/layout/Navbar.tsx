"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";
import {
  Zap, LayoutDashboard, QrCode, Wallet, Shield,
  Users, ArrowLeftRight, Menu, X, ChevronRight, LogOut, User
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        className="mx-auto px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
            <Zap size={16} className="text-black" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">SWYFTPAY</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors duration-200",
                pathname === link.href
                  ? "text-white"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA / User actions */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-all duration-200"
              >
                Dashboard <ChevronRight size={14} />
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 px-3 py-2 rounded-full hover:bg-white/[0.04] transition-all"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-all duration-200"
              >
                Get Started <ChevronRight size={14} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white/60 hover:text-white transition-colors p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6 pt-2 flex flex-col gap-4"
          style={{
            background: "rgba(0,0,0,0.95)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            animation: "slideDown 0.2s ease both",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-white/70 hover:text-white text-base py-1 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black font-medium text-sm"
              >
                Dashboard <ChevronRight size={14} />
              </Link>
              <button
                onClick={() => { setMenuOpen(false); handleSignOut(); }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-white/50 font-medium text-sm"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black font-medium text-sm"
            >
              Get Started <ChevronRight size={14} />
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

// Sidebar for app pages
const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/inventory", label: "Inventory", icon: Zap },
  { href: "/scan", label: "Scan QR", icon: QrCode },
  { href: "/send", label: "Send", icon: ArrowLeftRight },
  { href: "/vault", label: "Family Vault", icon: Shield },
  { href: "/social", label: "Social Pay", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 pt-20 pb-8 px-4"
      style={{
        background: "#0A0A0A",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <nav className="flex flex-col gap-1 flex-1">
        {sidebarLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              pathname === href
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div
        className="px-3 py-3 rounded-xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1">Network</p>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
          <span className="text-white/60 text-xs">Polygon Amoy Testnet</span>
        </div>
      </div>
    </aside>
  );
}
