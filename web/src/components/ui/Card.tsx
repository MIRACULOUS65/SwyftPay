import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "flat";
  hover?: boolean;
  glow?: boolean;
}

export function Card({ className, variant = "default", hover, glow, children, ...props }: CardProps) {
  const variants = {
    default: "bg-white/[0.04] border border-white/[0.08] rounded-2xl",
    strong: "bg-white/[0.07] border border-white/[0.14] rounded-2xl",
    flat: "bg-[#0A0A0A] border border-white/[0.06] rounded-2xl",
  };
  return (
    <div
      className={cn(
        variants[variant],
        hover && "transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.14] cursor-pointer",
        glow && "animate-glow-pulse",
        className
      )}
      style={{ backdropFilter: "blur(16px)" }}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return <div className={cn("p-6 pb-4", className)} {...props}>{children}</div>;
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}
export function CardBody({ className, children, ...props }: CardBodyProps) {
  return <div className={cn("px-6 pb-6", className)} {...props}>{children}</div>;
}
