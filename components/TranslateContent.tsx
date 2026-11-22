"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { type Locale, useLanguage } from "@/lib/i18n";

const translationCache = new Map<string, string>();
const MAX_TEXT_LENGTH = 10_000;
const MAX_BATCH_ITEMS = 50;
const MAX_BATCH_LENGTH = 20_000;

interface TranslationEntry {
  key: string;
  text: string;
  locale: Locale;
  pageKey: string;
}

interface TranslationContextValue {
  register: (id: string, text: string, locale: Locale) => () => void;
  showTranslation: boolean;
  revision: number;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

function translationKey(locale: Locale, text: string) {
  return `${locale}\0${text}`;
}

export function TranslatePageProvider({ children }: { children: React.ReactNode }) {
  const { locale, t } = useLanguage();
  const pathname = usePathname();
  const [registrations, setRegistrations] = useState(new Map<string, TranslationEntry>());
  const [revision, setRevision] = useState(0);
  const [translatedPageKey, setTranslatedPageKey] = useState<string | null>(null);
  const [minimizedPageKey, setMinimizedPageKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<{ pageKey: string; message: string } | null>(null);
  const pageKey = `${pathname}\0${locale}`;
  const showTranslation = translatedPageKey === pageKey;
  const isMinimized = minimizedPageKey === pageKey;

  const register = useCallback((id: string, text: string, entryLocale: Locale) => {
    if (!text.trim()) return () => {};

    const key = translationKey(entryLocale, text);
    setRegistrations((current) => {
      const next = new Map(current);
      next.set(id, { key, text, locale: entryLocale, pageKey });
      return next;
    });

    return () => {
      setRegistrations((current) => {
        const registeredEntry = current.get(id);
        if (registeredEntry?.key !== key || registeredEntry.pageKey !== pageKey) return current;
        const next = new Map(current);
        next.delete(id);
        return next;
      });
    };
  }, [pageKey]);

  const entries = useMemo(
    () => Array.from(new Map(
      Array.from(registrations.values())
        .filter((entry) => entry.pageKey === pageKey)
        .map((entry) => [entry.key, entry])
    ).values()),
    [pageKey, registrations]
  );
  const translatableEntries = entries.filter((entry) => entry.text.length <= MAX_TEXT_LENGTH);
  const missingEntries = translatableEntries.filter((entry) => !translationCache.has(entry.key));
  const allTranslated = translatableEntries.length > 0 && missingEntries.length === 0;

  async function translatePage() {
    if (loading || entries.length === 0) return;

    if (allTranslated) {
      setTranslatedPageKey((current) => current === pageKey ? null : pageKey);
      setErrorState(
        entries.some((entry) => entry.text.length > MAX_TEXT_LENGTH)
          ? { pageKey, message: t("Sebagian konten terlalu panjang untuk diterjemahkan.") }
          : null
      );
      return;
    }

    if (missingEntries.length === 0) {
      setErrorState({ pageKey, message: t("Sebagian konten terlalu panjang untuk diterjemahkan.") });
      return;
    }

    setLoading(true);
    setErrorState(null);
    try {
      const batches: TranslationEntry[][] = [];
      let batch: TranslationEntry[] = [];
      let batchLength = 0;

      for (const entry of missingEntries) {
        if (batch.length > 0 && (batch.length >= MAX_BATCH_ITEMS || batchLength + entry.text.length > MAX_BATCH_LENGTH)) {
          batches.push(batch);
          batch = [];
          batchLength = 0;
        }
        batch.push(entry);
        batchLength += entry.text.length;
      }
      if (batch.length > 0) batches.push(batch);

      for (const requestBatch of batches) {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texts: requestBatch.map((entry) => entry.text),
            locale: requestBatch[0].locale,
          }),
        });
        const data: { translations?: unknown; error?: unknown } = await response.json();
        if (!response.ok) {
          throw new Error(typeof data.error === "string" ? t(data.error) : t("Terjemahan gagal. Coba lagi."));
        }
        const translationTexts = Array.isArray(data.translations) ? data.translations : null;
        if (
          !translationTexts ||
          translationTexts.length !== requestBatch.length ||
          !translationTexts.every((text): text is string => typeof text === "string")
        ) {
          throw new Error(t("Terjemahan gagal. Coba lagi."));
        }

        requestBatch.forEach((entry, index) => {
          translationCache.set(entry.key, translationTexts[index]);
        });
        setRevision((value) => value + 1);
      }

      setTranslatedPageKey(pageKey);
      if (entries.some((entry) => entry.text.length > MAX_TEXT_LENGTH)) {
        setErrorState({ pageKey, message: t("Sebagian konten terlalu panjang untuk diterjemahkan.") });
      }
      setRevision((value) => value + 1);
    } catch (cause) {
      setErrorState({
        pageKey,
        message: cause instanceof Error ? cause.message : t("Terjemahan gagal. Coba lagi."),
      });
    } finally {
      setLoading(false);
    }
  }

  const contextValue = useMemo(
    () => ({ register, showTranslation, revision }),
    [register, showTranslation, revision]
  );
  const buttonLabel = loading
    ? t("Menerjemahkan...")
    : allTranslated
      ? showTranslation
        ? t("Lihat teks asli")
        : t("Lihat terjemahan")
      : t("Terjemahkan halaman via DeepL");

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
      {entries.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
          {!isMinimized && errorState?.pageKey === pageKey && (
            <p role="alert" className="max-w-sm rounded-lg border border-danger bg-surface px-3 py-2 text-xs text-danger shadow-lg">
              {errorState.message}
            </p>
          )}
          {isMinimized ? (
            <button
              type="button"
              onClick={() => setMinimizedPageKey(null)}
              aria-label={t("Terjemahkan halaman via DeepL")}
              title={t("Terjemahkan halaman via DeepL")}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-lg transition-colors hover:bg-accent/90"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center rounded-full bg-accent p-1 shadow-lg">
              <button
                type="button"
                onClick={() => void translatePage()}
                disabled={loading}
                className="cursor-pointer px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:cursor-wait disabled:opacity-70"
              >
                {buttonLabel}
              </button>
              <button
                type="button"
                onClick={() => setMinimizedPageKey(pageKey)}
                aria-label={t("Sembunyikan tombol terjemahan")}
                title={t("Sembunyikan tombol terjemahan")}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-lg font-semibold text-white/85 transition-colors hover:bg-white/15 hover:text-white"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
    </TranslationContext.Provider>
  );
}

function useTranslatedText(text: string) {
  const id = useId();
  const { locale } = useLanguage();
  const context = useContext(TranslationContext);
  if (!context) throw new Error("TranslateContent must be used inside TranslatePageProvider.");

  const { register, showTranslation } = context;
  useEffect(() => register(id, text, locale), [id, locale, register, text]);

  const translatedText = translationCache.get(translationKey(locale, text));
  return showTranslation && translatedText ? translatedText : text;
}

interface TranslateContentProps {
  text: string;
  className?: string;
  textClassName?: string;
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
  const displayText = useTranslatedText(text);
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={labelClassName ?? `flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm ${selected ? "border-[#6B85F6] bg-[#6B85F6]/5" : "border-[#dfe4ef]"}`}
    >
      <input id={id} type={inputType} checked={selected} disabled={disabled || !onChange} onChange={onChange} />
      <span className="text-[#374151]">{displayText}</span>
    </label>
  );
}

export function TranslatedOption({ text, value }: { text: string; value: string }) {
  const displayText = useTranslatedText(text);
  return <option value={value}>{displayText}</option>;
}

export default function TranslateContent({ text, className = "", textClassName = "" }: TranslateContentProps) {
  const displayText = useTranslatedText(text);

  if (!text.trim()) return null;

  return (
    <span className={`min-w-0 ${className}`}>
      <span className={textClassName}>{displayText}</span>
    </span>
  );
}
