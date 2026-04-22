import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";
import { OrderStatus, Currency } from "@/lib/types";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-white/[0.08] text-white/70 border-white/[0.10]",
    success: "bg-white/[0.06] text-white/80 border-white/[0.12]",
    warning: "bg-white/[0.06] text-white/60 border-white/[0.10]",
    error:   "bg-white/[0.04] text-white/50 border-white/[0.08]",
    info:    "bg-white/[0.06] text-white/70 border-white/[0.10]",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border", variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

const statusConfig: Record<OrderStatus, { label: string; dot: string; variant: BadgeProps["variant"] }> = {
  INIT:                 { label: "Initiated",  dot: "bg-white/40",  variant: "default" },
  RATE_LOCKED:          { label: "Rate Locked", dot: "bg-white/50",  variant: "info" },
  PENDING_EXECUTION:    { label: "Pending",     dot: "bg-white/40",  variant: "warning" },
  ESCROW_DEPOSITED:     { label: "In Escrow",   dot: "bg-white/60",  variant: "info" },
  VERIFICATION_PENDING: { label: "Verifying",   dot: "bg-white/50",  variant: "warning" },
  SETTLED:              { label: "Settled",     dot: "bg-white/80",  variant: "success" },
  REFUNDED:             { label: "Refunded",    dot: "bg-white/50",  variant: "warning" },
  FAILED:               { label: "Failed",      dot: "bg-white/30",  variant: "error" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot, status === "VERIFICATION_PENDING" && "animate-pulse")} />
      {config.label}
    </Badge>
  );
}

export function CurrencyBadge({ currency }: { currency: Currency }) {
  return (
    <Badge variant="default">
      {currency === "AMOY" ? "◆" : "₹"} {currency}
    </Badge>
  );
}
