"use client";

import { useId, useState } from "react";
import { useLanguage } from "@/lib/i18n";

const translationCache = new Map<string, string>();

export interface OnDemandTranslation {
  displayText: string;
  buttonLabel: string;
  loading: boolean;
  error: string | null;
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface TranslateContentProps {
  text: string;
  className?: string;
  textClassName?: string;
}

export function useOnDemandTranslation(text: string): OnDemandTranslation {
  const { locale, t } = useLanguage();
  const [result, setResult] = useState<{ key: string; text: string } | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const key = `${locale}\0${text}`;
  const isTranslated = result?.key === key;

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setError(null);

    if (isTranslated) {
      setShowTranslation((current) => !current);
      return;
    }

    const cached = translationCache.get(key);
    if (cached) {
      setResult({ key, text: cached });
      setShowTranslation(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale }),
      });
      const data: { translation?: unknown; error?: unknown } = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Terjemahan gagal. Coba lagi.");
      }
      if (typeof data.translation !== "string") {
        throw new Error("Terjemahan gagal. Coba lagi.");
      }
      translationCache.set(key, data.translation);
      setResult({ key, text: data.translation });
      setShowTranslation(true);
    } catch (cause) {
      setError({
        key,
        message: cause instanceof Error ? t(cause.message) : t("Terjemahan gagal. Coba lagi."),
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    displayText: isTranslated && showTranslation ? result.text : text,
    buttonLabel: loading
      ? t("Menerjemahkan...")
      : isTranslated
        ? showTranslation
          ? t("Lihat teks asli")
          : t("Lihat terjemahan")
        : t("Terjemahkan via DeepL"),
    loading,
    error: error?.key === key ? error.message : null,
    onToggle: handleClick,
  };
}

export function TranslationControls({ translation }: { translation: OnDemandTranslation }) {
  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
      <button
        type="button"
        onClick={translation.onToggle}
        disabled={translation.loading}
        className="cursor-pointer text-[11px] font-medium text-accent-text underline-offset-2 hover:underline disabled:cursor-wait disabled:opacity-60"
      >
        {translation.buttonLabel}
      </button>
      {translation.error && (
        <span role="alert" className="text-[11px] text-danger">
          {translation.error}
        </span>
      )}
    </span>
  );
}

export function TranslatedChoice({
  text,
  inputType,
  selected,
  onChange,
  disabled = false,
  labelClassName,
}: {
  text: string;
  inputType: "radio" | "checkbox";
  selected: boolean;
  onChange?: () => void;
  disabled?: boolean;
  labelClassName?: string;
}) {
  const id = useId();
  const translation = useOnDemandTranslation(text);

  return (
    <div>
      <label
        htmlFor={id}
        className={labelClassName ?? `flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm ${selected ? "border-[#6B85F6] bg-[#6B85F6]/5" : "border-[#dfe4ef]"}`}
      >
        <input id={id} type={inputType} checked={selected} disabled={disabled || !onChange} onChange={onChange} />
        <span className="text-[#374151]">{translation.displayText}</span>
      </label>
      <div className="ml-7">
        <TranslationControls translation={translation} />
      </div>
    </div>
  );
}

export default function TranslateContent({ text, className = "", textClassName = "" }: TranslateContentProps) {
  const translation = useOnDemandTranslation(text);

  if (!text.trim()) return null;

  return (
    <span className={`min-w-0 ${className}`}>
      <span className={textClassName}>{translation.displayText}</span>
      <TranslationControls translation={translation} />
    </span>
  );
}
