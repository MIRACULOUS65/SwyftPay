"use client";
import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

// Pages that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/wallet",
  "/inventory",
  "/scan",
  "/send",
  "/receive",
  "/vault",
  "/social",
  "/settings",
  "/transaction",
];

// Pages only for unauthenticated users
const AUTH_ROUTES = ["/auth"];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isPending) return;

    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
    const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

    // Not logged in + trying to access protected route → redirect to auth
    if (!session?.user && isProtected) {
      router.replace("/auth");
      return;
    }

    // Logged in + on auth page → redirect to dashboard
    if (session?.user && isAuthRoute) {
      router.replace("/dashboard");
      return;
    }
  }, [session, isPending, pathname, router]);

  // Show loading spinner during auth check on protected pages
  if (isPending) {
    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
    const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

    if (isProtected || isAuthRoute) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
            <p className="text-xs text-white/25">Loading...</p>
          </div>
        </div>
      );
    }
  }

  // Block rendering of protected content if not authed
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (!session?.user && isProtected && !isPending) {
    return null;
  }

  return <>{children}</>;
}
