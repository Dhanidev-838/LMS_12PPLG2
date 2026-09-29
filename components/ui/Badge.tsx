"use client";

import { ReactNode } from "react";

type Tone = "brand" | "gray" | "green" | "red" | "amber";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  brand: "badge-brand bg-[#E0E7FF] text-[#1E3A8A]",
  gray: "badge-gray bg-[#F1F5F9] text-[#475569]",
  green: "badge-green bg-[#DCFCE7] text-[#166534]",
  red: "badge-red bg-[#FEE2E2] text-[#991B1B]",
  amber: "badge-amber bg-[#FEF3C7] text-[#92400E]",
};

export default function Badge({ children, tone = "brand", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}