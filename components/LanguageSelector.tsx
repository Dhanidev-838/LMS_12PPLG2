"use client";

import { useLanguage, type Locale } from "@/lib/i18n";

const languageNames: { value: Locale; label: string }[] = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
];

export default function LanguageSelector({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <label className={`block ${className}`}>
      <span className={compact ? "sr-only" : "mb-1.5 block text-[11px] font-semibold text-muted-foreground"}>
        {t("Bahasa")}
      </span>
      <select
        aria-label={t("Bahasa")}
        value={locale}
        onChange={(event) => {
          const selectedLanguage = languageNames.find((language) => language.value === event.target.value);
          if (selectedLanguage) {
            setLocale(selectedLanguage.value);
            window.dispatchEvent(new CustomEvent("classify-welcome-language-change", { detail: selectedLanguage.value }));
          }
        }}
        className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {languageNames.map((language) => (
          <option key={language.value} value={language.value}>{language.label}</option>
        ))}
      </select>
    </label>
  );
}
