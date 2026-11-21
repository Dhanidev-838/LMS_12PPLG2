"use client";

import { useLanguage } from "@/lib/i18n";

export type CreatorScope = "ALL" | "MINE";

export default function CreatorScopeFilter({
  value,
  onChange,
  mineDisabled = false,
}: {
  value: CreatorScope;
  onChange: (value: CreatorScope) => void;
  mineDisabled?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div role="group" aria-label={t("Filter pembuat")} className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-control)] border border-border bg-surface p-1">
      {(["ALL", "MINE"] as const).map((scope) => (
        <button
          key={scope}
          type="button"
          aria-pressed={value === scope}
          disabled={scope === "MINE" && mineDisabled}
          onClick={() => onChange(scope)}
          className={`min-h-8 rounded-[var(--radius-control)] px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${value === scope ? "bg-accent-subtle text-accent-text" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"}`}
        >
          {t(scope === "ALL" ? "Semua" : "Dibuat Saya")}
        </button>
      ))}
    </div>
  );
}
