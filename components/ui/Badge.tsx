"use client";

import { ReactNode } from "react";

type Tone = "brand" | "gray" | "green" | "red" | "amber";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  brand: "bg-accent text-accent-foreground",
  gray: "border border-border bg-surface-muted text-muted-foreground",
  green: "bg-accent-subtle text-foreground",
  red: "bg-danger-subtle text-danger",
  amber: "border border-border bg-surface-muted text-muted-foreground",
};

export default function Badge({ children, tone = "brand", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold leading-none ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}
