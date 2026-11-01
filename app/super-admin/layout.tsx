"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/shared/theme-toggle";
import { useAdminTheme } from "@/lib/use-admin-theme";

type NavKey = "DASHBOARD" | "KELAS" | "AKUN" | "LAPORAN" | "PERFORMA" | "ASESMEN" | "TUGAS" | "MATERI";

const MAIN_NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/super-admin" },
  { key: "KELAS", label: "Buat Kelas", href: "/super-admin/kelas" },
  { key: "AKUN", label: "Daftar Akun", href: "/super-admin?tab=AKUN" },
  { key: "LAPORAN", label: "Laporan", href: "/super-admin?tab=LAPORAN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/super-admin/performa-akademik" },
];

const LEARNING_NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "ASESMEN", label: "Asesmen", href: "/super-admin/asesmen" },
  { key: "TUGAS", label: "Tugas", href: "/super-admin/tugas" },
  { key: "MATERI", label: "Materi", href: "/super-admin/materi" },
];

const NAV_ICONS: Record<NavKey, React.ReactNode> = {
  DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
  KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
  AKUN: <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.87a4 4 0 0 1 0 7.75" />,
  LAPORAN: <path d="M6 2h9l5 5v15H6V2Zm9 0v5h5M9 13h6M9 17h4" />,
  PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
  ASESMEN: <path d="M9 12l2 2 4-4m5 2a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
  TUGAS: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  MATERI: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />,
};

function NavIcon({ item }: { item: NavKey }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {NAV_ICONS[item]}
    </svg>
  );
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useAdminTheme();
  const [name, setName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Gagal memuat profil.");
        setName(result.data?.nama ?? "");
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat profil Super Admin:", error);
      });
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

  function isActive(href: string) {
    const path = href.split("?")[0];
    return pathname === path || (path !== "/super-admin" && pathname.startsWith(`${path}/`));
  }

  function renderNavItem(item: { key: NavKey; label: string; href: string }) {
    const active = isActive(item.href);
    return (
      <Link
        key={item.key}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        title={item.label}
        aria-current={active ? "page" : undefined}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors"
        style={
          active
            ? theme === "dark"
              ? { background: "#202b47", color: "#91a5ff", boxShadow: "inset 3px 0 0 #6B85F6" }
              : { background: "#ffffff", color: "#6B85F6", boxShadow: "inset 3px 0 0 #6B85F6" }
            : { background: "transparent", color: theme === "dark" ? "#aeb8c9" : "#435064" }
        }
      >
        <NavIcon item={item.key} />
        <span>{item.label}</span>
      </Link>
    );
  }

  if (pathname === "/super-admin") return children;

  return (
    <div data-admin-theme={theme} className="admin-shell flex min-h-screen flex-col bg-[#f6f7fb]" style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <header className="sticky top-0 z-40 border-b border-[#e6e9f0] bg-white">
        <div className="flex h-[68px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-transparent text-[#4f5b70] transition-colors hover:border-[#dfe4ef] hover:bg-[#f7f8fb]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/super-admin" className="flex items-center gap-2 text-[#182033]">
              <Image src="/Logo1.png" alt="Logo Classify" width={32} height={32} className="rounded-[9px] object-contain" />
              <span className="text-[17px] font-bold tracking-[-.04em]">Classify</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={() => setTheme((value) => (value === "light" ? "dark" : "light"))} />
            {name && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[#111827]">{name}</p>
                <p className="text-xs text-[#9CA3AF]">SUPER ADMIN</p>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden" />
        )}
        <aside
          aria-label="Navigasi Super Admin"
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-hidden bg-[#f6f7fb] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:w-0 lg:border-0 lg:p-0" : "lg:w-72"}`}
        >
          <div className="flex min-h-full min-w-64 flex-col border border-[#e1e5ed] bg-white p-4">
            <p className="mb-4 px-2 pt-2 text-sm font-bold text-[#182033]">
              Dashboard Super Admin
              <br />
              <span className="text-[#6B85F6]">- {[...MAIN_NAV, ...LEARNING_NAV].find((item) => isActive(item.href))?.label ?? "Menu"}</span>
            </p>
            <nav className="flex flex-col gap-1">
              {MAIN_NAV.map(renderNavItem)}
            </nav>
            <div className="mt-4 border-t border-[#edf0f5] pt-3">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Ruang Pembelajaran</p>
              <nav className="flex flex-col">
                {LEARNING_NAV.map(renderNavItem)}
              </nav>
            </div>
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
        <main className="min-w-0 flex-1 lg:pl-6">{children}</main>
      </div>
      <style jsx global>{`
        .admin-shell[data-admin-theme="dark"] { color-scheme: dark; background: #10141d !important; color: #eef2f8; }
        .admin-shell[data-admin-theme="dark"] header,
        .admin-shell[data-admin-theme="dark"] .bg-white,
        .admin-shell[data-admin-theme="dark"] aside > div { background-color: #171d28 !important; }
        .admin-shell[data-admin-theme="dark"] :is(
          [class~="bg-[#f6f7fb]"], [class~="bg-[#f7f8fd]"], [class~="bg-[#f8f9fc]"],
          [class~="bg-[#F9FAFB]"], [class~="bg-[#F8FAFC]"], [class~="bg-gray-50"], [class~="bg-slate-50"]
        ) { background-color: #10141d !important; }
        .admin-shell[data-admin-theme="dark"] :is(
          [class~="bg-[#F3F4F6]"], [class~="bg-[#eef1f8]"], [class~="bg-gray-100"], [class~="bg-slate-100"]
        ) { background-color: #232c3d !important; }
        .admin-shell[data-admin-theme="dark"] :is(
          [class~="bg-[#eef2ff]"], [class~="bg-[#EEF2FF]"], [class~="bg-indigo-50"]
        ) { background-color: #202b47 !important; }
        .admin-shell[data-admin-theme="dark"] :is(
          .border, [class~="border-[#e1e5ed]"], [class~="border-[#dfe4ef]"],
          [class~="border-[#e6e9f0]"], [class~="border-[#edf0f5]"], [class~="border-[#e5e8ef]"]
        ):not([class~="border-[#6B85F6]"]) { border-color: #2a3343 !important; }
        .admin-shell[data-admin-theme="dark"] :is(
          [class~="border-[#c7d2fe]"], [class~="border-indigo-200"]
        ) { border-color: #34415d !important; }
        .admin-shell[data-admin-theme="dark"] .divide-y > :not([hidden]) ~ :not([hidden]),
        .admin-shell[data-admin-theme="dark"] .divide-x > :not([hidden]) ~ :not([hidden]) { border-color: #2a3343 !important; }
        .admin-shell[data-admin-theme="dark"] :is(
          [class*="text-[#111827]" i], [class*="text-[#182033]" i], [class*="text-[#0F172A]" i],
          [class*="text-[#1E293B]" i], [class*="text-[#1F2937]" i], [class*="text-[#334155]" i],
          [class*="text-[#374151]" i], [class~="text-gray-900"], [class~="text-gray-800"],
          [class~="text-gray-700"], [class~="text-slate-900"], [class~="text-slate-800"], [class~="text-slate-700"]
        ) { color: #f3f6fb !important; }
        .admin-shell[data-admin-theme="dark"] :is(
          [class*="text-[#64748B]" i], [class*="text-[#6B7280]" i], [class*="text-[#94A3B8]" i],
          [class*="text-[#9CA3AF]" i], [class*="text-[#475569]" i], [class*="text-[#4B5563]" i],
          [class*="text-[#748096]" i], [class*="text-[#707b8d]" i], [class*="text-[#435064]" i],
          [class*="text-[#536076]" i], [class*="text-[#4f5b70]" i], [class*="text-[#8290a3]" i],
          [class~="text-gray-600"], [class~="text-gray-500"], [class~="text-gray-400"],
          [class~="text-slate-600"], [class~="text-slate-500"], [class~="text-slate-400"]
        ) { color: #aeb8c9 !important; }
        .admin-shell[data-admin-theme="dark"] [class*="hover:bg-"]:hover:not([class~="hover:bg-[#5974ed]"]):not([class~="hover:bg-red-50"]) {
          background-color: rgba(107, 133, 246, .14) !important;
        }
        .admin-shell[data-admin-theme="dark"] input:not([type="checkbox"]):not([type="radio"]):not([type="file"]),
        .admin-shell[data-admin-theme="dark"] select,
        .admin-shell[data-admin-theme="dark"] textarea {
          background-color: #111722 !important; border-color: #344054 !important; color: #e9eef8 !important;
        }
        .admin-shell[data-admin-theme="dark"] input::placeholder,
        .admin-shell[data-admin-theme="dark"] textarea::placeholder { color: #7d889b !important; }
        .admin-shell[data-admin-theme="dark"] option { background-color: #111722; color: #e9eef8; }
        .admin-shell[data-admin-theme="dark"] main table thead { background-color: #1b2230 !important; }
        .admin-shell[data-admin-theme="dark"] main table tbody td { color: #aeb8c9; }
        .admin-shell[data-admin-theme="dark"] [class~="bg-red-50"] { background-color: rgba(239, 68, 68, .12) !important; }
        .admin-shell[data-admin-theme="dark"] [class~="border-red-100"] { border-color: rgba(239, 68, 68, .35) !important; }
        .admin-shell[data-admin-theme="dark"] :is([class~="text-red-700"], [class~="text-red-600"]) { color: #fca5a5 !important; }
      `}</style>
    </div>
  );
}
