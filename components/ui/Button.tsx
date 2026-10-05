"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const sizeClasses: Record<Size, string> = {
  sm: "px-3 text-xs",
  md: "px-4 text-sm",
  lg: "px-6 text-sm",
};

const variantClasses: Record<Variant, string> = {
  primary: "border border-accent bg-accent text-accent-foreground hover:bg-accent-subtle",
  outline: "border border-border bg-surface text-foreground hover:bg-surface-muted",
  danger: "border border-danger bg-surface text-danger hover:bg-danger-subtle",
  ghost: "border border-transparent text-foreground hover:bg-surface-muted",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Memproses...
        </>
      ) : (
        children
      )}
    </button>
  );
}
