// app/siswa/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { showConfirm } from "@/lib/dialog";

const BRAND = "#6B85F6";

type NavKey = "DASHBOARD" | "KELAS" | "ASESMEN" | "TUGAS" | "PERFORMA" | "PROFILE";

function NavIcon({ nav }: { nav: NavKey }) {
  const paths: Record<NavKey, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    ASESMEN: <path d="M12 2l3 6 6.5.9-4.7 4.6L18 20l-6-3.4L6 20l1.2-6.5L2.5 8.9 9 8l3-6Z" />,
    TUGAS: <path d="M9 3h6l1 3H8l1-3ZM6 6h12v15H6zM9 11h6M9 15h6" />,
    PERFORMA: <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16V4" />,
    PROFILE: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[nav]}
    </svg>
  );
}

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState<{ id: string; nama: string; role: string; fotoProfil: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    if (isAssessmentPage()) {
      const lanjut = await showConfirm("Kamu sedang mengerjakan asesmen. Keluar dari asesmen?");
      if (!lanjut) return;
      await reportAssessmentExit();
    }
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function isAssessmentPage() {
    return pathname.startsWith("/siswa/asesmen/");
  }

  async function reportAssessmentExit() {
    const match = pathname.match(/^\/siswa\/asesmen\/([^/]+)/);
    if (!match) return;
    await fetch(`/api/asesmen/${encodeURIComponent(match[1])}/pelanggaran`, { method: "POST" });
  }

  async function handleNavClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!isAssessmentPage() || href.startsWith("/siswa/asesmen/")) return;
    event.preventDefault();
    const lanjut = await showConfirm("Kamu sedang mengerjakan asesmen. Keluar dari asesmen?");
    if (!lanjut) return;
    await reportAssessmentExit();
    router.push(href);
  }

  const NAV_ITEMS: { key: NavKey; label: string; href: string }[] = [
    { key: "DASHBOARD", label: "Dashboard", href: "/siswa" },
    { key: "KELAS", label: "Kelas", href: "/siswa/kelas" },
    { key: "ASESMEN", label: "Asesmen", href: "/siswa/asesmen" },
    { key: "TUGAS", label: "Tugas", href: "/siswa/tugas" },
    { key: "PERFORMA", label: "Performa Akademik", href: "/siswa/performa-akademik" },
    { key: "PROFILE", label: "Profile", href: me ? `/profil/${me.id}` : "#" },
  ];

  function isActive(href: string) {
    if (href === "/siswa") return pathname === "/siswa";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]" style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isAssessmentPage() && !sidebarOpen) {
                  window.dispatchEvent(new Event("assessment-exit-request"));
                }
                setSidebarOpen((v) => !v);
              }}
              aria-label="Toggle sidebar"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image src="/Logo1.png" alt="Logo Classify" fill sizes="32px" className="rounded-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Classify
            </span>
          </div>

          <div className="flex items-center gap-3">
            {me && <span className="hidden text-sm font-semibold text-[#111827] sm:block">{me.nama}</span>}
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
              {me?.fotoProfil ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.fotoProfil} alt={me.nama} className="h-full w-full object-cover" />
              ) : (
                me?.nama?.charAt(0) ?? "S"
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" />
        )}

        <aside
          aria-label="Navigasi siswa"
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-[#F9FAFB] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex min-h-full flex-col border-r border-black/5 bg-white p-4 shadow-sm">
            <p className="mb-3 px-2 pt-2 text-sm font-bold text-[#111827]">
              Dashboard Siswa
              <br />
              <span style={{ color: BRAND }}>
                - {NAV_ITEMS.find((n) => isActive(n.href))?.label ?? "Kelas"}
              </span>
            </p>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={(event) => {
                      setSidebarOpen(false);
                      void handleNavClick(event, item.href);
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
                    style={active ? { background: `${BRAND}1A`, color: BRAND } : { color: "#374151" }}
                  >
                    <NavIcon nav={item.key} />
                    {item.label}
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

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>

      <footer className="py-10 text-white" style={{ background: BRAND }}>
        <div className="mx-auto grid max-w-5xl gap-8 px-6 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold">Classify</p>
            <p className="mt-2 text-sm">Belajar Lebih Mudah, Mengajar Lebih Terarah.</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Social Media</p>
            <ul className="mt-3 space-y-2 text-sm text-white/90">
              <li>Instagram : @chronion999</li>
              <li>Github : Dhanidev-838</li>
              <li>LinkedIn : Dhani Triadi Saputra</li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-white/20 pt-6 text-center text-xs text-white/80">
          © 2026 Classify. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}