"use client";

import { useLanguage } from "@/lib/i18n";

export default function LocalizedLoading() {
  const { t } = useLanguage();

  return (
    <div role="status" aria-live="polite" className="p-4 text-sm text-muted-foreground">
      {t("Memuat...")}
    </div>
  );
}
