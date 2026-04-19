import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
      primary: "bg-white text-black hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]",
      secondary: "border border-white/12 text-white/80 hover:bg-white/6 hover:border-white/20 hover:text-white",
      ghost: "text-white/60 hover:text-white hover:bg-white/6",
      danger: "border border-white/10 text-white/60 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs h-8",
      md: "px-5 py-2.5 text-sm h-10",
      lg: "px-7 py-3.5 text-base h-12",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
