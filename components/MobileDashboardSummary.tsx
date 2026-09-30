"use client";

import { useState } from "react";

export interface MobileDashboardSummaryItem {
  label: string;
  value: string | number;
  caption?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface MobileDashboardSummaryProps {
  items: MobileDashboardSummaryItem[];
  theme?: "light" | "dark";
}

export default function MobileDashboardSummary({ items, theme = "light" }: MobileDashboardSummaryProps) {
  const [open, setOpen] = useState(true);

  return (
    <section className="border border-[#e1e5ed] bg-white sm:hidden">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-bold text-[#182033]">Ringkasan</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 text-[#6B85F6] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="divide-y divide-[#edf0f5] border-t border-[#edf0f5]">
          {items.map((item) => (
            <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="truncate text-xs font-semibold text-[#536076]">{item.label}</span>
                <span className="text-sm font-bold text-[#182033]">{item.value}</span>
              </div>
              {item.actionLabel && item.onAction ? (
                <button
                  type="button"
                  onClick={item.onAction}
                  style={theme === "dark"
                    ? { background: "rgba(107, 133, 246, 0.22)", borderColor: "rgba(107, 133, 246, 0.38)", color: "#ffffff" }
                    : { background: "#6B85F6", borderColor: "#6B85F6", color: "#ffffff" }}
                  className="inline-flex min-h-9 max-w-[120px] cursor-pointer items-center justify-center border px-2.5 py-1 text-center text-xs font-semibold leading-tight transition-[background-color,border-color,filter] hover:brightness-110"
                >
                  {item.actionLabel}
                </button>
              ) : null}
              {item.caption && !item.actionLabel && (
                <span className="max-w-[120px] text-right text-[11px] leading-tight text-[#748096]">{item.caption}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
