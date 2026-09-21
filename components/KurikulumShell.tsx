"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";

const BRAND = "#6B85F6";
type KurikulumTab = "DASHBOARD" | "KELAS" | "SISWA" | "GURU" | "ASESMEN" | "PERFORMA";

const TABS: { key: KurikulumTab; label: string; href: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kurikulum" },
  { key: "KELAS", label: "Kelas", href: "/kurikulum?tab=KELAS" },
  { key: "SISWA", label: "Daftar Siswa", href: "/kurikulum?tab=SISWA" },
  { key: "GURU", label: "Daftar Guru", href: "/kurikulum?tab=GURU" },
  { key: "ASESMEN", label: "Asesmen", href: "/kurikulum?tab=ASESMEN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kurikulum?tab=PERFORMA" },
];

function TabIcon({ tab }: { tab: KurikulumTab }) {
  const paths: Record<KurikulumTab, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    SISWA: <path d="M12 3 2 8l10 5 8-4v6M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />,
    GURU: <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 8h7 M9 12h7 M9 16h4" />,
    ASESMEN: <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 4h4m-4 4h4m-4 4h4" />,
    PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">{paths[tab]}</svg>;
}

export default function KurikulumShell({ children, activeTab = "KELAS" }: { children: React.ReactNode; activeTab?: KurikulumTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState<{ nama: string; fotoProfil: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/me").then((res) => res.json()).then((data) => setMe(data.data)).catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]" style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle sidebar" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="relative h-8 w-8 flex-shrink-0"><Image src="/Logo1.png" alt="Logo Classify" fill sizes="32px" className="rounded-full object-contain" /></div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Classify</span>
          </div>
          <div className="flex items-center gap-3">
            {me && <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-[#111827]">{me.nama}</p><p className="text-xs text-[#9CA3AF]">KURIKULUM</p></div>}
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">{me?.fotoProfil ? <img src={me.fotoProfil} alt={me.nama} className="h-full w-full object-cover" /> : me?.nama?.charAt(0) ?? "K"}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" />}
        <aside aria-label="Navigasi kurikulum" className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-[#F9FAFB] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex min-h-full flex-col border-r border-black/5 bg-white p-4 shadow-sm">
            <p className="mb-3 px-2 pt-2 text-sm font-bold text-[#111827]">Dashboard Kurikulum<br /><span style={{ color: BRAND }}>- {TABS.find((tab) => tab.key === activeTab)?.label}</span></p>
            <nav className="flex flex-col gap-1">{TABS.map((tab) => <Link key={tab.key} href={tab.href} onClick={() => setSidebarOpen(false)} className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors" style={activeTab === tab.key ? { background: `${BRAND}1A`, color: BRAND } : { color: "#374151" }}><TabIcon tab={tab.key} /><span>{tab.label}</span></Link>)}</nav>
            <Button size="md" onClick={handleLogout} className="mt-auto w-full rounded-xl" style={{ background: "#F8CDBD", color: "#7C4A3A" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M10 17l5-5-5-5M15 12H3M21 4v16" strokeLinecap="round" strokeLinejoin="round" /></svg>Keluar</Button>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <footer className="py-10 text-white" style={{ background: BRAND }}>
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3"><div><p className="text-lg font-bold">Classify</p><p className="mt-2 text-sm">Belajar Lebih Mudah, Mengajar Lebih Terarah.</p><p className="mt-3 max-w-xs text-xs leading-relaxed text-white/80">Platform Learning Management System yang mendukung proses belajar mengajar secara modern, efektif, dan terintegrasi.</p></div><div><p className="text-sm font-semibold">Social Media</p><ul className="mt-3 space-y-2 text-sm text-white/90"><li>Instagram : @chronion999</li><li>Github : Dhanidev-838</li><li>LinkedIn : Dhani Triadi Saputra</li></ul></div></div>
        <p className="mt-8 border-t border-white/20 pt-6 text-center text-xs text-white/80">© 2026 Classify. All Rights Reserved.</p>
      </footer>
    </div>
  );
}