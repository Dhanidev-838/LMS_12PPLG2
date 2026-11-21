"use client";

import { intlLocaleCodes, useLanguage } from "@/lib/i18n";

interface DeadlineLabelProps {
  deadlineAt?: string | null;
  publishedAt?: string | null;
  fallbackStart?: string | null;
  durationMinutes?: number | null;
  now: number | null;
  durationStartsWhen: "task" | "assessment";
}

export default function DeadlineLabel({
  deadlineAt,
  publishedAt,
  fallbackStart,
  durationMinutes,
  now,
  durationStartsWhen,
}: DeadlineLabelProps) {
  const { locale, t } = useLanguage();

  if (!deadlineAt && !durationMinutes) return null;

  let label: string;
  let expired = false;
  if (!deadlineAt) {
    const isDays = durationMinutes! % 1440 === 0;
    const amount = isDays ? durationMinutes! / 1440 : durationMinutes! / 60;
    const unit = isDays ? "Hari" : "Jam";
    const prefix = durationStartsWhen === "assessment" ? "Deadline setelah diterbitkan" : "Deadline setelah dikirim";
    label = `${t(prefix)}: ${amount} ${t(unit)}`;
  } else if (now === null) {
    label = new Intl.DateTimeFormat(intlLocaleCodes[locale], {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(deadlineAt));
  } else {
    const remaining = new Date(deadlineAt).getTime() - now;
    if (remaining <= 0) {
      expired = true;
      label = t("Deadline lewat");
    } else if (remaining <= 24 * 60 * 60 * 1000) {
      const minutes = Math.ceil(remaining / 60_000);
      label = `${t("Sisa")} · ${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    } else {
      const formatter = new Intl.DateTimeFormat(intlLocaleCodes[locale], {
        day: "numeric",
        month: "long",
        timeZone: "Asia/Jakarta",
      });
      label = `${formatter.format(new Date(publishedAt ?? fallbackStart ?? deadlineAt))} - ${formatter.format(new Date(deadlineAt))}`;
    }
  }

  return (
    <p className={`mt-2 text-[11px] ${expired ? "font-semibold text-danger" : "text-muted-foreground"}`}>
      <span className="font-semibold">{t("Deadline")}:</span> {label}
    </p>
  );
}
