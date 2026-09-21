"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

const BRAND = "#6B85F6";

type Variant = "primary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60";

  const variantStyle: Record<Variant, { className: string; style?: React.CSSProperties }> = {
    primary: {
      className: "text-white hover:scale-[1.02] active:scale-[0.98]",
      style: { background: BRAND },
    },
    outline: {
      className: "border text-[#374151] hover:bg-black/5",
      style: { borderColor: "#D1D5DB" },
    },
    danger: {
      className: "bg-red-500 text-white hover:bg-red-600",
    },
    ghost: {
      className: "text-[#6B7280] hover:bg-black/5",
    },
  };

  const v = variantStyle[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizeClasses[size]} ${v.className} ${className}`}
      style={{ ...v.style, ...style }}
      {...props}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Memproses...
        </>
      ) : (
        children
      )}
    </button>
  );
}