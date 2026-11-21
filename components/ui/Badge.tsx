"use client";

import { ReactNode } from "react";

type Tone = "brand" | "gray" | "green" | "red" | "amber";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  brand: "bg-accent-subtle text-accent-text",
  gray: "border border-border bg-surface-muted text-muted-foreground",
  green: "bg-success-subtle text-success",
  red: "bg-danger-subtle text-danger",
  amber: "bg-warning-subtle text-warning",
};

export default function Badge({ children, tone = "brand", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold leading-none ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}
