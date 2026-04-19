import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AuthGuard } from "@/components/AuthGuard";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SWYFTPAY — QR Payments. Any Currency. One Scan.",
  description:
    "A QR-based payment system that lets you pay with crypto or INR while receivers get value in their preferred form. Powered by escrow-backed blockchain verification on Polygon.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />
        <AuthGuard>
          <main className="min-h-screen">{children}</main>
        </AuthGuard>
      </body>
    </html>
  );
}
