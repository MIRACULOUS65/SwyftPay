import Link from "next/link";
import { Zap, ExternalLink, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer
      className="border-t px-6 py-12"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "#000" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white">
                <Zap size={14} className="text-black" />
              </div>
              <span className="font-bold text-white">SWYFTPAY</span>
            </Link>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              A QR-based payment system that lets you pay with crypto or INR.
              Powered by escrow-backed blockchain verification.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-3">
              {["Dashboard", "Send", "Receive", "Family Vault", "Social Pay"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Network</p>
            <ul className="space-y-3">
              {["Polygon Amoy", "Escrow Contract", "Rate Engine", "Security"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs text-white/25">
            © 2026 SWYFTPAY. Built on Polygon Amoy.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-white/30 hover:text-white/60 transition-colors">
              <ExternalLink size={16} />
            </Link>
            <Link href="#" className="text-white/30 hover:text-white/60 transition-colors">
              <Globe size={16} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
