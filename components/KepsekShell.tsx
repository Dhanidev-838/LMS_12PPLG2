"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { useAdminTheme } from "@/lib/use-admin-theme";
import ThemeToggle from "@/components/shared/theme-toggle";
import { useLanguage } from "@/lib/i18n";
import LanguageSelector from "@/components/LanguageSelector";

const BRAND = "#6B85F6";
type KepsekTab = "DASHBOARD" | "KELAS" | "AKUN" | "ASESMEN" | "PERFORMA";

const TABS: { key: KepsekTab; label: string; href: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kepsek" },
  { key: "KELAS", label: "Kelas", href: "/kepsek?tab=KELAS" },
  { key: "AKUN", label: "Daftar Akun", href: "/kepsek?tab=AKUN" },
  { key: "ASESMEN", label: "Asesmen", href: "/kepsek?tab=ASESMEN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kepsek?tab=PERFORMA" },
];

function TabIcon({ tab }: { tab: KepsekTab }) {
  const paths: Record<KepsekTab, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    AKUN: <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.87a4 4 0 0 1 0 7.75" />,
    ASESMEN: <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 4h4m-4 4h4m-4 4h4" />,
    PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[tab]}
    </svg>
  );
}

export default function KepsekShell({ children, activeTab = "KELAS" }: { children: React.ReactNode; activeTab?: KepsekTab }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useAdminTheme();
  const [me, setMe] = useState<{ nama: string; fotoProfil: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-admin-theme", theme);
    return () => document.documentElement.removeAttribute("data-admin-theme");
  }, [theme]);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function toggleSidebar() {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed((value) => !value);
      return;
    }
    setSidebarOpen((value) => !value);
  }

  return (
    <div data-admin-theme={theme} className="admin-shell flex min-h-screen flex-col bg-background" style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            aria-label={t("Toggle sidebar")}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border border-border bg-surface text-muted-foreground transition-colors hover:border-border hover:bg-surface-muted"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="relative h-8 w-8 flex-shrink-0">
            <Image src="/Logo1.png" alt="Classify" fill sizes="32px" className="rounded-[9px] object-contain" />
          </div>
          <span className="text-[17px] font-bold tracking-[-.04em]">Classify</span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
          />
          {me && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">{me.nama}</p>
              <p className="text-xs text-muted-foreground">{t("Kepala Sekolah")}</p>
            </div>
          )}
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-xs font-bold text-muted-foreground">
            {me?.fotoProfil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.fotoProfil} alt={me.nama} className="h-full w-full object-cover" />
            ) : (
              me?.nama?.charAt(0) ?? "K"
            )}
          </div>
        </div>
      </header>

      <div className="flex w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden" />
        )}

        <aside
          aria-label={t("Navigasi kepsek")}
          className={`fixed inset-y-0 left-0 z-50 w-[min(88vw,22.5rem)] overflow-hidden bg-background p-0 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:w-0 lg:border-0 lg:p-0" : "lg:w-80"}`}
        >
          <div className="flex min-h-full min-w-0 w-full flex-col rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <button type="button" onClick={() => setSidebarOpen(false)} aria-label={t("Tutup navigasi")} className="mb-2 ml-auto flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border text-muted-foreground lg:hidden">×</button>
            <p className="mb-3 px-2 pt-2 text-sm font-bold text-foreground">
              {t("Dashboard Kepsek")}
              <br />
              <span style={{ color: BRAND }}>- {t(TABS.find((tab) => tab.key === activeTab)?.label ?? "Dashboard")}</span>
            </p>
            <nav className="flex flex-col gap-1">
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                    style={
                      active
                        ? theme === "dark"
                          ? { background: "var(--accent-subtle)", color: "var(--accent-text)", boxShadow: "inset 3px 0 0 var(--accent)" }
                          : { background: "var(--accent-subtle)", color: "var(--accent-text)", boxShadow: "inset 3px 0 0 var(--accent)" }
                        : { background: "transparent", color: "var(--muted-foreground)" }
                    }
                  >
                    <TabIcon tab={tab.key} />
                    <span>{t(tab.label)}</span>
                  </Link>
                );
              })}
            </nav>
            <LanguageSelector className="mt-auto mb-3" />
            <Button size="md" variant="outline" onClick={handleLogout} className="w-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M10 17l5-5-5-5M15 12H3M21 4v16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("Keluar")}
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 lg:pl-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <footer className="border-t border-border bg-surface px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
        © 2026 Classify. {t("Sistem pembelajaran yang lebih terarah.")}
      </footer>

      <style jsx global>{`
        [data-admin-theme="dark"] { color-scheme: dark; }
        .admin-shell[data-admin-theme="dark"] { background: var(--background) !important; color: var(--foreground); }

        [data-admin-theme="dark"] header,
        [data-admin-theme="dark"] .bg-white { background-color: var(--surface) !important; }
        [data-admin-theme="dark"] [class~="bg-[#f6f7fb]"],
        [data-admin-theme="dark"] [class~="bg-[#F9FAFB]"],
        [data-admin-theme="dark"] [class~="bg-[#F8FAFC]"],
        [data-admin-theme="dark"] [class~="bg-gray-50"],
        [data-admin-theme="dark"] [class~="bg-slate-50"] { background-color: var(--background) !important; }
        [data-admin-theme="dark"] [class~="bg-gray-100"],
        [data-admin-theme="dark"] [class~="bg-slate-100"] { background-color: var(--surface-muted) !important; }
        [data-admin-theme="dark"] [class~="bg-[#E5E7EB]"] { background-color: var(--border) !important; }

        [data-admin-theme="dark"] header,
        [data-admin-theme="dark"] .border:not([class~="border-[#6B85F6]"]):not([class~="border-accent"]):not([class~="border-danger"]),
        [data-admin-theme="dark"] [class~="border-[#e1e5ed]"],
        [data-admin-theme="dark"] [class~="border-[#dfe4ef]"],
        [data-admin-theme="dark"] [class~="border-[#e6e9f0]"],
        [data-admin-theme="dark"] [class~="border-[#edf0f5]"],
        [data-admin-theme="dark"] [class~="border-[#E2E8F0]"],
        [data-admin-theme="dark"] [class~="border-[#F1F5F9]"] { border-color: var(--border) !important; }
        [data-admin-theme="dark"] .divide-y > :not([hidden]) ~ :not([hidden]) { border-color: var(--border) !important; }

        [data-admin-theme="dark"] :is(
          [class*="text-[#111827]" i], [class*="text-[#182033]" i], [class*="text-[#374151]" i],
          [class~="text-gray-900"], [class~="text-gray-800"], [class~="text-gray-700"]
        ) { color: var(--foreground) !important; }

        [data-admin-theme="dark"] :is(
          [class*="text-[#64748B]" i], [class*="text-[#6B7280]" i], [class*="text-[#94A3B8]" i],
          [class*="text-[#9CA3AF]" i], [class*="text-[#748096]" i], [class*="text-[#435064]" i],
          [class~="text-gray-600"], [class~="text-gray-500"], [class~="text-gray-400"]
        ) { color: var(--muted-foreground) !important; }

        [data-admin-theme="dark"] [class*="hover:bg-"]:hover:not([class~="hover:bg-red-50"]) {
          background-color: rgba(107, 133, 246, .14) !important;
        }
        [data-admin-theme="dark"] [class~="hover:bg-red-50"]:hover { background-color: rgba(239, 68, 68, .14) !important; }

        [data-admin-theme="dark"] input,
        [data-admin-theme="dark"] select { background-color: var(--surface) !important; border-color: var(--border) !important; color: var(--foreground) !important; }
        [data-admin-theme="dark"] option { background-color: var(--surface); color: var(--foreground); }

        [data-admin-theme="dark"] footer { background: var(--surface) !important; border-color: var(--border) !important; }
      `}</style>
    </div>
  );
}
