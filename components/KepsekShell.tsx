"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { useAdminTheme } from "@/lib/use-admin-theme";

const BRAND = "#6B85F6";
type KepsekTab = "DASHBOARD" | "KELAS" | "SISWA" | "GURU" | "ASESMEN" | "PERFORMA";

const TABS: { key: KepsekTab; label: string; href: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kepsek" },
  { key: "KELAS", label: "Kelas", href: "/kepsek?tab=KELAS" },
  { key: "SISWA", label: "Daftar Siswa", href: "/kepsek?tab=SISWA" },
  { key: "GURU", label: "Daftar Guru", href: "/kepsek?tab=GURU" },
  { key: "ASESMEN", label: "Asesmen", href: "/kepsek?tab=ASESMEN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kepsek?tab=PERFORMA" },
];

function TabIcon({ tab }: { tab: KepsekTab }) {
  const paths: Record<KepsekTab, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    SISWA: <path d="M12 3 2 8l10 5 8-4v6M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />,
    GURU: <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 8h7 M9 12h7 M9 16h4" />,
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
  const router = useRouter();
  const pathname = usePathname();
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
    <div data-admin-theme={theme} className="admin-shell flex min-h-screen flex-col bg-[#f6f7fb]" style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-[#e6e9f0] bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-transparent text-[#4f5b70] transition-colors hover:border-[#dfe4ef] hover:bg-[#f7f8fb]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="relative h-8 w-8 flex-shrink-0">
            <Image src="/Logo1.png" alt="Logo Classify" fill sizes="32px" className="rounded-[9px] object-contain" />
          </div>
          <span className="text-[17px] font-bold tracking-[-.04em]">Classify</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
            aria-label={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
            title={theme === "light" ? "Mode gelap" : "Mode terang"}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#dfe4ef] text-[#576277] transition-colors hover:bg-[#f7f8fb]"
          >
            {theme === "light" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
                <path d="M12 3v2m0 14v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M3 12h2m14 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
                <path d="M20 15.4A8 8 0 0 1 8.6 4 8 8 0 1 0 20 15.4Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          {me && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#182033]">{me.nama}</p>
              <p className="text-xs text-[#94A3B8]">KEPSEK</p>
            </div>
          )}
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
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
          aria-label="Navigasi kepsek"
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-hidden bg-[#f6f7fb] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:w-0 lg:border-0 lg:p-0" : "lg:w-72"}`}
        >
          <div className="flex min-h-full min-w-64 flex-col border border-[#e1e5ed] bg-white p-4">
            <p className="mb-3 px-2 pt-2 text-sm font-bold text-[#182033]">
              Dashboard Kepsek
              <br />
              <span style={{ color: BRAND }}>- {TABS.find((tab) => tab.key === activeTab)?.label}</span>
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
                          ? { background: "#202b47", color: "#91a5ff", boxShadow: "inset 3px 0 0 #6B85F6" }
                          : { background: "#ffffff", color: BRAND, boxShadow: "inset 3px 0 0 #6B85F6" }
                        : { background: "transparent", color: theme === "dark" ? "#aeb8c9" : "#435064" }
                    }
                  >
                    <TabIcon tab={tab.key} />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
            <Button
              size="md"
              onClick={handleLogout}
              className="mt-auto w-full rounded-xl"
              style={{ background: "#F8CDBD", color: "#7C4A3A" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M10 17l5-5-5-5M15 12H3M21 4v16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Keluar
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 lg:pl-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <footer className="border-t border-[#e1e5ed] bg-white px-4 py-5 text-center text-xs text-[#8290a3] sm:px-6">
        © 2026 Classify. Sistem pembelajaran yang lebih terarah.
      </footer>

      <style jsx global>{`
        [data-admin-theme="dark"] { color-scheme: dark; }
        .admin-shell[data-admin-theme="dark"] { background: #10141d !important; color: #eef2f8; }

        [data-admin-theme="dark"] header,
        [data-admin-theme="dark"] .bg-white { background-color: #171d28 !important; }
        [data-admin-theme="dark"] [class~="bg-[#f6f7fb]"],
        [data-admin-theme="dark"] [class~="bg-[#F9FAFB]"],
        [data-admin-theme="dark"] [class~="bg-[#F8FAFC]"],
        [data-admin-theme="dark"] [class~="bg-gray-50"],
        [data-admin-theme="dark"] [class~="bg-slate-50"] { background-color: #10141d !important; }
        [data-admin-theme="dark"] [class~="bg-gray-100"],
        [data-admin-theme="dark"] [class~="bg-slate-100"] { background-color: #1b2230 !important; }
        [data-admin-theme="dark"] [class~="bg-[#E5E7EB]"] { background-color: #2a3343 !important; }

        [data-admin-theme="dark"] header,
        [data-admin-theme="dark"] .border:not([class~="border-[#6B85F6]"]),
        [data-admin-theme="dark"] [class~="border-[#e1e5ed]"],
        [data-admin-theme="dark"] [class~="border-[#dfe4ef]"],
        [data-admin-theme="dark"] [class~="border-[#e6e9f0]"],
        [data-admin-theme="dark"] [class~="border-[#edf0f5]"],
        [data-admin-theme="dark"] [class~="border-[#E2E8F0]"],
        [data-admin-theme="dark"] [class~="border-[#F1F5F9]"] { border-color: #2a3343 !important; }
        [data-admin-theme="dark"] .divide-y > :not([hidden]) ~ :not([hidden]) { border-color: #2a3343 !important; }

        [data-admin-theme="dark"] :is(
          [class*="text-[#111827]" i], [class*="text-[#182033]" i], [class*="text-[#374151]" i],
          [class~="text-gray-900"], [class~="text-gray-800"], [class~="text-gray-700"]
        ) { color: #f3f6fb !important; }

        [data-admin-theme="dark"] :is(
          [class*="text-[#64748B]" i], [class*="text-[#6B7280]" i], [class*="text-[#94A3B8]" i],
          [class*="text-[#9CA3AF]" i], [class*="text-[#748096]" i], [class*="text-[#435064]" i],
          [class~="text-gray-600"], [class~="text-gray-500"], [class~="text-gray-400"]
        ) { color: #aeb8c9 !important; }

        [data-admin-theme="dark"] [class*="hover:bg-"]:hover:not([class~="hover:bg-red-50"]) {
          background-color: rgba(107, 133, 246, .14) !important;
        }
        [data-admin-theme="dark"] [class~="hover:bg-red-50"]:hover { background-color: rgba(239, 68, 68, .14) !important; }

        [data-admin-theme="dark"] input,
        [data-admin-theme="dark"] select { background-color: #111722 !important; border-color: #344054 !important; color: #e9eef8 !important; }
        [data-admin-theme="dark"] option { background-color: #111722; color: #e9eef8; }

        [data-admin-theme="dark"] footer { background: #121824 !important; border-color: #2a3343 !important; }
      `}</style>
    </div>
  );
}