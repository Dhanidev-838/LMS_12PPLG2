"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage, type Locale } from "@/lib/i18n";

const labels: Record<Locale, { play: string; loading: string; stop: string; unavailable: string; autoplayBlocked: string }> = {
  id: { play: "Dengarkan sambutan", loading: "Menyiapkan suara…", stop: "Hentikan suara", unavailable: "Audio belum tersedia. Coba lagi sebentar.", autoplayBlocked: "Browser memblokir putar otomatis. Klik di mana saja untuk memulai suara." },
  en: { play: "Hear the welcome", loading: "Preparing the voice…", stop: "Stop the welcome", unavailable: "Audio is unavailable right now. Please try again.", autoplayBlocked: "Your browser blocked autoplay. Click anywhere to start the welcome." },
  de: { play: "Willkommensgruß anhören", loading: "Stimme wird vorbereitet…", stop: "Stimme anhalten", unavailable: "Audio ist gerade nicht verfügbar. Bitte versuche es erneut.", autoplayBlocked: "Dein Browser blockiert die automatische Wiedergabe. Klicke irgendwo, um den Gruß zu starten." },
  ja: { play: "ウェルカム音声を聴く", loading: "音声を準備しています…", stop: "音声を停止", unavailable: "音声を再生できません。もう一度お試しください。", autoplayBlocked: "ブラウザーが自動再生をブロックしました。ページ内をクリックすると再生します。" },
};

const welcomeLanguageEvent = "classify-welcome-language-change";

export default function WelcomeAudioButton() {
  const { locale } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioLocaleRef = useRef<Locale | null>(null);
  const activeLocaleRef = useRef(locale);
  const attemptedLocaleRef = useRef<Locale | null>(null);
  const autoplayBlockedRef = useRef(false);
  const [loadingLocale, setLoadingLocale] = useState<Locale | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  activeLocaleRef.current = locale;

  const startWelcome = useCallback(async (requestedLocale: Locale) => {
    setError("");
    audioRef.current?.pause();
    setLoadingLocale(requestedLocale);
    try {
      const audio = new Audio(`/audio/welcome-${requestedLocale}.mp3`);
      audio.preload = "auto";
      audioRef.current = audio;
      audioLocaleRef.current = requestedLocale;
      audio.onended = () => {
        if (audioRef.current === audio) setPlaying(false);
      };
      audio.onpause = () => {
        if (audioRef.current === audio) setPlaying(false);
      };
      await audio.play();
      if (audioRef.current === audio) {
        autoplayBlockedRef.current = false;
        setPlaying(true);
      }
    } catch (cause) {
      if (activeLocaleRef.current === requestedLocale) {
        const errorName = typeof cause === "object" && cause !== null && "name" in cause ? cause.name : "";
        const blocked = errorName === "NotAllowedError";
        autoplayBlockedRef.current = blocked;
        setError(blocked ? labels[requestedLocale].autoplayBlocked : labels[requestedLocale].unavailable);
      }
    } finally {
      setLoadingLocale((current) => current === requestedLocale ? null : current);
    }
  }, []);

  useEffect(() => {
    if (audioLocaleRef.current !== locale) {
      audioRef.current?.pause();
      audioRef.current = null;
      audioLocaleRef.current = null;
    }

    if (attemptedLocaleRef.current === locale) return;

    // Let the saved language from localStorage settle before the first greeting.
    const timeout = window.setTimeout(() => {
      if (activeLocaleRef.current !== locale || attemptedLocaleRef.current === locale) return;
      attemptedLocaleRef.current = locale;
      void startWelcome(locale);
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [locale, startWelcome]);

  useEffect(() => () => audioRef.current?.pause(), []);

  useEffect(() => {
    function resumeAfterGesture(event: Event) {
      if (!autoplayBlockedRef.current) return;
      const target = event.target;
      if (target instanceof Element && target.closest("[data-welcome-audio-control], select")) return;

      const requestedLocale = activeLocaleRef.current;
      attemptedLocaleRef.current = requestedLocale;
      void startWelcome(requestedLocale);
    }

    window.addEventListener("pointerdown", resumeAfterGesture, true);
    window.addEventListener("keydown", resumeAfterGesture, true);
    return () => {
      window.removeEventListener("pointerdown", resumeAfterGesture, true);
      window.removeEventListener("keydown", resumeAfterGesture, true);
    };
  }, [startWelcome]);

  useEffect(() => {
    function handleLanguageChange(event: Event) {
      const requestedLocale = (event as CustomEvent<Locale>).detail;
      if (!Object.prototype.hasOwnProperty.call(labels, requestedLocale)) return;
      attemptedLocaleRef.current = requestedLocale;
      void startWelcome(requestedLocale);
    }

    window.addEventListener(welcomeLanguageEvent, handleLanguageChange);
    return () => window.removeEventListener(welcomeLanguageEvent, handleLanguageChange);
  }, [startWelcome]);

  function playWelcome() {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }
    attemptedLocaleRef.current = locale;
    void startWelcome(locale);
  }

  const copy = labels[locale];
  const loading = loadingLocale === locale;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        data-welcome-audio-control
        onClick={playWelcome}
        disabled={loading}
        aria-label={playing ? copy.stop : copy.play}
        aria-pressed={playing}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#dce1eb] bg-white px-4 py-3 text-sm font-semibold text-[#3f4a5e] transition-colors hover:bg-[#f8f9ff] disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
        ) : playing ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
        )}
        {loading ? copy.loading : playing ? copy.stop : copy.play}
      </button>
      {error && <p role="status" className="max-w-xs text-xs text-[#657084]">{error}</p>}
    </div>
  );
}
