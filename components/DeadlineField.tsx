"use client";

import type { DeadlineSelection } from "@/lib/deadline";
import { useLanguage } from "@/lib/i18n";

interface DeadlineFieldProps {
  value: DeadlineSelection;
  onChange: (value: DeadlineSelection) => void;
  required?: boolean;
  startsWhen: string;
}

export default function DeadlineField({ value, onChange, required = false, startsWhen }: DeadlineFieldProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-foreground">
        {t("Deadline")}{required ? " *" : ` (${t("opsional")})`}
      </label>
      <select
        value={value.mode}
        onChange={(event) => {
          if (event.target.value === "none") onChange({ mode: "none" });
          if (event.target.value === "duration") onChange({ mode: "duration", amount: "", unit: "hours" });
          if (event.target.value === "date") onChange({ mode: "date", localDateTime: "" });
        }}
        className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {!required && <option value="none">{t("Tanpa deadline")}</option>}
        <option value="duration">{t("Durasi")}</option>
        <option value="date">{t("Tanggal & waktu")}</option>
      </select>

      {value.mode === "duration" && (
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={value.unit === "days" ? 365 : 8760}
            step={1}
            required
            value={value.amount}
            onChange={(event) => onChange({ ...value, amount: event.target.value })}
            aria-label={t("Durasi")}
            className="min-h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <select
            value={value.unit}
            onChange={(event) => onChange({ ...value, unit: event.target.value as "hours" | "days" })}
            aria-label={t("Satuan durasi")}
            className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="hours">{t("Jam")}</option>
            <option value="days">{t("Hari")}</option>
          </select>
        </div>
      )}

      {value.mode === "date" && (
        <input
          type="datetime-local"
          required
          value={value.localDateTime}
          onChange={(event) => onChange({ ...value, localDateTime: event.target.value })}
          aria-label={t("Tanggal & waktu")}
          className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      )}

      <p className="text-[11px] text-muted-foreground">{t(startsWhen)}</p>
    </div>
  );
}
