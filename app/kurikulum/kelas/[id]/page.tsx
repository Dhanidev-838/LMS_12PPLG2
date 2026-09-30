"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PengumumanCard from "@/components/PengumumanCard";
import TugasCard from "@/components/TugasCard";
import MateriCard from "@/components/MateriCard";
import KelasFeedFilter, { KelasFeedFilterValue } from "@/components/KelasFeedFilter";

const BRAND = "#6B85F6";
type KurikulumTab = "DASHBOARD" | "KELAS" | "AKUN" | "ASESMEN" | "PERFORMA";

function TabIcon({ tab }: { tab: KurikulumTab }) {
  const paths: Record<KurikulumTab, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    AKUN: <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.87a4 4 0 0 1 0 7.75" />,
    ASESMEN: <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 4h4m-4 4h4m-4 4h4" />,
    PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">{paths[tab]}</svg>;
}

interface SiswaDiKelas {
  siswaId: string;
  siswa: { id: string; nama: string; nis: string | null; fotoProfil: string | null; kelasReferensi: { label: string } | null };
}
interface GuruDiKelas {
  id: string;
  guru: { id: string; nama: string; nik: string | null; fotoProfil: string | null };
  mapel: { id: string; nama: string };
}
interface FeedItem {
  tipe: "PENGUMUMAN" | "ASESMEN" | "TUGAS" | "MATERI";
  timestamp: string;
  data: any;
}
interface KelasDetail {
  id: string;
  judul: string;
  deskripsi: string | null;
  siswa: SiswaDiKelas[];
  guruMapel: GuruDiKelas[];
  feed: FeedItem[];
}

const TABS: { key: KurikulumTab; label: string; href: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kurikulum" },
  { key: "KELAS", label: "Kelas", href: "/kurikulum?tab=KELAS" },
  { key: "AKUN", label: "Daftar Akun", href: "/kurikulum?tab=AKUN" },
  { key: "ASESMEN", label: "Asesmen", href: "/kurikulum?tab=ASESMEN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kurikulum?tab=PERFORMA" },
];

export default function KurikulumKelasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id as string;

  const [kelas, setKelas] = useState<KelasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; nama: string; role: string; fotoProfil: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("admin-theme") === "dark" ? "dark" : "light";
  });
  const [section, setSection] = useState<"SISWA" | "GURU" | null>(null);
  const [expandedRombel, setExpandedRombel] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [feedFilter, setFeedFilter] = useState<KelasFeedFilterValue>("SEMUA");
  const filteredFeed = kelas?.feed.filter((item) => feedFilter === "SEMUA" || item.tipe === feedFilter) ?? [];

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadKelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-admin-theme", theme);
    window.localStorage.setItem("admin-theme", theme);
    return () => document.documentElement.removeAttribute("data-admin-theme");
  }, [theme]);

  async function loadKelas() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/kelas/${kelasId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat kelas.");
        setLoading(false);
        return;
      }
      setKelas(data.data);
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

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
    setSidebarOpen((v) => !v);
  }

  if (loading) {
    return <div data-admin-theme={theme} className="admin-shell flex min-h-screen items-center justify-center bg-[#f6f7fb]"><p className="text-sm text-[#9CA3AF]">Memuat...</p></div>;
  }
  if (error || !kelas) {
    return (
      <div data-admin-theme={theme} className="admin-shell flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f7fb]">
        <p className="text-sm text-[#9CA3AF]">{error || "Kelas tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/kurikulum")}>Kembali</Button>
      </div>
    );
  }

  const siswaGrouped = kelas.siswa.reduce((acc: Record<string, SiswaDiKelas[]>, ks) => {
    const label = ks.siswa.kelasReferensi?.label ?? "Belum Ada Kelas";
    if (!acc[label]) acc[label] = [];
    acc[label].push(ks);
    return acc;
  }, {});
  const guruGrouped = kelas.guruMapel.reduce((acc: Record<string, GuruDiKelas[]>, gm) => {
    const label = gm.mapel.nama;
    if (!acc[label]) acc[label] = [];
    acc[label].push(gm);
    return acc;
  }, {});

  return (
    <div data-admin-theme={theme} className="admin-shell flex min-h-screen flex-col bg-[#f6f7fb]" style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-[#e6e9f0] bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} aria-label="Toggle sidebar" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-transparent text-[#4f5b70] transition-colors hover:border-[#dfe4ef] hover:bg-[#f7f8fb]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="relative h-8 w-8 flex-shrink-0"><Image src="/Logo1.png" alt="Logo Classify" fill sizes="32px" className="rounded-[9px] object-contain" /></div>
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
          {me && <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-[#182033]">{me.nama}</p><p className="text-xs text-[#9CA3AF]">{me.role}</p></div>}
          <div className="hidden h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280] sm:flex">
            {me?.fotoProfil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.fotoProfil} alt={me.nama} className="h-full w-full object-cover" />
            ) : (
              me?.nama?.charAt(0) ?? "K"
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => router.push("/kurikulum")}>Back</Button>
        </div>
      </header>

      <div className="flex w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden" />}
        <aside
          aria-label="Navigasi kurikulum"
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-hidden bg-[#f6f7fb] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:w-0 lg:border-0 lg:p-0" : "lg:w-72"}`}
        >
          <div className="flex min-h-full min-w-64 flex-col border border-[#e1e5ed] bg-white p-4">
            <p className="mb-3 px-2 pt-2 text-sm font-bold text-[#182033]">Dashboard Kurikulum<br /><span style={{ color: BRAND }}>- Kelas</span></p>
            <nav className="flex flex-col gap-1">
              {TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                  style={
                    tab.key === "KELAS"
                      ? theme === "dark"
                        ? { background: "#202b47", color: "#91a5ff", boxShadow: "inset 3px 0 0 #6B85F6" }
                        : { background: "#ffffff", color: BRAND, boxShadow: "inset 3px 0 0 #6B85F6" }
                      : { background: "transparent", color: theme === "dark" ? "#aeb8c9" : "#435064" }
                  }
                >
                  <TabIcon tab={tab.key} />
                  <span>{tab.label}</span>
                </Link>
              ))}
            </nav>
            <Button size="md" onClick={handleLogout} className="mt-auto w-full rounded-xl" style={{ background: "#F8CDBD", color: "#7C4A3A" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M10 17l5-5-5-5M15 12H3M21 4v16" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Keluar
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 lg:pl-6">
          <div className="mx-auto w-full max-w-5xl">
            <section className="border border-[#dfe4ef] border-l-4 border-l-[#6B85F6] bg-white p-4 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6B85F6]">Detail Kelas</p>
              <h1 className="mt-1 break-words text-xl font-bold text-[#182033] sm:text-2xl">{kelas.judul}</h1>
              {kelas.deskripsi && <p className="mt-1 whitespace-pre-wrap text-sm text-[#64748B]">{kelas.deskripsi}</p>}
            </section>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
              {(["SISWA", "GURU"] as const).map((type) => {
                const isStudent = type === "SISWA";
                const isActive = section === type;
                const count = isStudent ? kelas.siswa.length : new Set(kelas.guruMapel.map((assignment) => assignment.guru.id)).size;
                return (
                  <button key={type} type="button" aria-expanded={isActive} onClick={() => setSection(isActive ? null : type)} className={`flex min-h-[72px] min-w-0 cursor-pointer items-center justify-between gap-2 border px-3 py-3 text-left transition-colors sm:px-4 ${isActive ? "border-[#6B85F6] bg-[#eef1ff]" : "border-[#dfe4ef] bg-white hover:border-[#bdc8f8] hover:bg-[#fafbff]"}`}>
                    <span className="min-w-0"><span className="block truncate text-sm font-bold text-[#182033]">{isStudent ? "Siswa" : "Guru"}</span><span className="mt-0.5 block text-xs text-[#8290a3]">Lihat daftar</span></span>
                    <span className={`flex h-9 min-w-9 flex-shrink-0 items-center justify-center px-2 text-sm font-bold ${isActive ? "bg-[#6B85F6] text-white" : "bg-[#f1f3f8] text-[#536076]"}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {section === "SISWA" && (
              <div className="mt-3 space-y-3 border border-[#e1e5ed] bg-white p-3 sm:p-4">
                {Object.keys(siswaGrouped).length === 0 ? <p className="text-sm text-[#9CA3AF]">Belum ada siswa di kelas ini.</p> : Object.entries(siswaGrouped).map(([label, list]) => {
                  const isOpen = expandedRombel === label;
                  return (
                    <div key={label} className="border border-[#e1e5ed] bg-white">
                      <button onClick={() => setExpandedRombel(isOpen ? null : label)} className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left">
                        <div className="flex items-center gap-2"><p className="text-sm font-bold text-[#182033]">{label}</p><Badge tone="brand">{list.length} Siswa</Badge></div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                      {isOpen && (
                        <div className="space-y-2 border-t border-[#edf0f5] p-4">
                          {list.map((ks) => (
                            <button key={ks.siswaId} onClick={() => router.push(`/profil/${ks.siswa.id}`)} className="flex w-full cursor-pointer items-center gap-3 border border-[#edf0f5] p-3 text-left transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                                {ks.siswa.fotoProfil ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={ks.siswa.fotoProfil} alt={ks.siswa.nama} className="h-full w-full object-cover" />
                                ) : (
                                  ks.siswa.nama.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#182033]">{ks.siswa.nama}</p></div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {section === "GURU" && (
              <div className="mt-3 border border-[#e1e5ed] bg-white p-3 sm:p-4">
                {Object.keys(guruGrouped).length === 0 ? <p className="text-sm text-[#9CA3AF]">Belum ada guru mengajar di kelas ini.</p> : Object.entries(guruGrouped).map(([mapel, list]) => (
                  <div key={mapel} className="mb-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">{mapel}</p>
                    <div className="space-y-2">
                      {list.map((gm) => (
                        <button key={gm.id} onClick={() => router.push(`/profil/${gm.guru.id}`)} className="flex w-full cursor-pointer items-center gap-3 border border-[#e1e5ed] bg-white p-3 text-left transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                            {gm.guru.fotoProfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={gm.guru.fotoProfil} alt={gm.guru.nama} className="h-full w-full object-cover" />
                            ) : (
                              gm.guru.nama.charAt(0)
                            )}
                          </div>
                          <p className="text-sm font-semibold text-[#182033]">{gm.guru.nama}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section === null && (
              <section className="mt-7 border-t border-[#e1e5ed] pt-5">
                <div className="mb-3"><h2 className="text-base font-bold text-[#182033]">Aktivitas Kelas</h2><p className="mt-1 text-xs text-[#8290a3]">Pengumuman, materi, tugas, dan asesmen di kelas ini.</p></div>
                <KelasFeedFilter value={feedFilter} onChange={setFeedFilter} />
                <div className="mt-3 space-y-3">
                  {filteredFeed.length === 0 ? <p className="text-sm text-[#9CA3AF]">{kelas.feed.length === 0 ? "Belum ada aktivitas di kelas ini." : "Tidak ada konten untuk filter ini."}</p> : filteredFeed.map((item, i) => {
                    if (item.tipe === "PENGUMUMAN") return <PengumumanCard key={`p-${i}`} data={item.data} currentUserId={me?.id ?? ""} />;
                    if (item.tipe === "TUGAS") return <TugasCard key={`t-${i}`} data={item.data} currentUserId={me?.id ?? ""} role="KURIKULUM" />;
                    if (item.tipe === "MATERI") return <MateriCard key={`m-${i}`} data={item.data} />;
                    const a = item.data;
                    return (
                      <button
                        key={`a-${i}`}
                        onClick={() => router.push(`/kurikulum/asesmen/${a.id}`)}
                        className="block w-full cursor-pointer border border-[#e1e5ed] bg-white p-4 text-left transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]"
                      >
                        <div className="flex items-center gap-2">
                          <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                          {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                        </div>
                        <p className="mt-2 text-sm font-bold text-[#182033]">{a.judul}</p>
                        <p className="mt-1 text-xs text-[#9CA3AF]">{a._count?.soal ?? 0} soal · oleh {a.guru?.nama} — lihat ujian & jawaban siswa</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      <footer className="border-t border-[#e1e5ed] bg-white px-4 py-5 text-center text-xs text-[#8290a3] sm:px-6">© 2026 Classify. Sistem pembelajaran yang lebih terarah.</footer>

      <style jsx global>{`
        [data-admin-theme="dark"] { color-scheme: dark; }
        .admin-shell[data-admin-theme="dark"] { background: #10141d !important; color: #eef2f8; }

        [data-admin-theme="dark"] header,
        [data-admin-theme="dark"] .bg-white { background-color: #171d28 !important; }
        [data-admin-theme="dark"] [class~="bg-[#f6f7fb]"],
        [data-admin-theme="dark"] [class~="bg-[#F9FAFB]"] { background-color: #10141d !important; }
        [data-admin-theme="dark"] [class~="bg-[#E5E7EB]"] { background-color: #2a3343 !important; }

        [data-admin-theme="dark"] header,
        [data-admin-theme="dark"] [class~="border-[#e1e5ed]"],
        [data-admin-theme="dark"] [class~="border-[#dfe4ef]"],
        [data-admin-theme="dark"] [class~="border-[#e6e9f0]"],
        [data-admin-theme="dark"] [class~="border-[#edf0f5]"] { border-color: #2a3343 !important; }

        [data-admin-theme="dark"] :is([class*="text-[#111827]" i], [class*="text-[#182033]" i]) { color: #f3f6fb !important; }
        [data-admin-theme="dark"] :is(
          [class*="text-[#64748B]" i], [class*="text-[#6B7280]" i], [class*="text-[#94A3B8]" i],
          [class*="text-[#9CA3AF]" i], [class*="text-[#748096]" i], [class*="text-[#435064]" i],
          [class*="text-[#4f5b70]" i], [class*="text-[#576277]" i], [class*="text-[#8290a3]" i]
        ) { color: #aeb8c9 !important; }

        [data-admin-theme="dark"] [class*="hover:bg-"]:hover { background-color: rgba(107, 133, 246, .14) !important; }
        [data-admin-theme="dark"] [class~="hover:border-[#bdc8f8]"]:hover { border-color: #6B85F6 !important; }

        [data-admin-theme="dark"] footer { background: #121824 !important; border-color: #2a3343 !important; }
      `}</style>
    </div>
  );
}