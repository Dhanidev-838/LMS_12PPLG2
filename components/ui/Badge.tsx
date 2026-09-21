"use client";

import { ReactNode } from "react";

type Tone = "brand" | "gray" | "green" | "red" | "amber";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  brand: "bg-[#6B85F6]/10 text-[#6B85F6]",
  gray: "bg-gray-100 text-gray-600",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-600",
  amber: "bg-amber-100 text-amber-700",
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