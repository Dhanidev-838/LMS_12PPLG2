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

export default function MobileDashboardSummary({ items, theme }: MobileDashboardSummaryProps) {
  const [open, setOpen] = useState(true);

  return (
    <section data-admin-theme={theme} className="overflow-hidden rounded-xl border border-border bg-surface text-foreground sm:hidden">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-bold text-foreground">Ringkasan</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={`h-4 w-4 text-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="divide-y divide-border border-t border-border">
          {items.map((item) => (
            <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="truncate text-xs font-semibold text-muted-foreground">{item.label}</span>
                <span className="tabular-nums text-sm font-semibold text-foreground">{item.value}</span>
              </div>
              {item.actionLabel && item.onAction ? (
                <button
                  type="button"
                  onClick={item.onAction}
                  className="inline-flex min-h-9 max-w-[120px] cursor-pointer items-center justify-center rounded-md border border-accent bg-accent px-2.5 py-1 text-center text-xs font-semibold leading-tight text-accent-foreground transition-colors duration-150 hover:bg-accent-subtle"
                >
                  {item.actionLabel}
                </button>
              ) : null}
              {item.caption && !item.actionLabel && (
                <span className="max-w-[120px] text-right text-[11px] leading-tight text-muted-foreground">{item.caption}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
