"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/shared/theme-toggle";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import ModalKelas from "@/components/ModalKelas";
import PengumumanCard from "@/components/PengumumanCard";
import TugasCard from "@/components/TugasCard";
import MateriCard from "@/components/MateriCard";
import KelasFeedFilter, { KelasFeedFilterValue } from "@/components/KelasFeedFilter";
import { showConfirm } from "@/lib/dialog";

const BRAND = "#6B85F6";
type AdminTab = "DASHBOARD" | "KELAS" | "AKUN" | "LAPORAN" | "PERFORMA";
type GuruNav = "KELAS" | "ASESMEN" | "TUGAS" | "PROFILE";

function GuruNavIcon({ nav }: { nav: GuruNav }) {
  const paths: Record<GuruNav, React.ReactNode> = {
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    ASESMEN: <path d="M12 2l3 6 6.5.9-4.7 4.6L18 20l-6-3.4L6 20l1.2-6.5L2.5 8.9 9 8l3-6Z" />,
    TUGAS: <path d="M9 3h6l1 3H8l1-3ZM6 6h12v15H6zM9 11h6M9 15h6" />,
    PROFILE: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[nav]}
    </svg>
  );
}

function TabIcon({ tab }: { tab: AdminTab }) {
  const paths: Record<AdminTab, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    AKUN: <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.87a4 4 0 0 1 0 7.75" />,
    LAPORAN: <path d="M6 2h9l5 5v15H6V2Zm9 0v5h5M9 13h6M9 17h4" />,
    PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[tab]}
    </svg>
  );
}

const ADMIN_TABS: { key: AdminTab; label: string }[] = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "KELAS", label: "Buat Kelas" },
  { key: "AKUN", label: "Daftar Akun" },
  { key: "LAPORAN", label: "Laporan" },
  { key: "PERFORMA", label: "Performa Akademik" },
];

interface SiswaDiKelas {
  siswaId: string;
  siswa: {
    id: string;
    nama: string;
    nis: string | null;
    fotoProfil: string | null;
    deskripsi: string | null;
    kelasReferensi: { id: string; label: string } | null;
  };
}
interface GuruDiKelas {
  id: string;
  guru: { id: string; nama: string; nik: string | null; fotoProfil: string | null; deskripsi: string | null };
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
  inviteToken: string;
  siswa: SiswaDiKelas[];
  guruMapel: GuruDiKelas[];
  feed: FeedItem[];
}

export default function AdminKelasDetailPage() {
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
  const [feedFilter, setFeedFilter] = useState<KelasFeedFilterValue>("SEMUA");
  const filteredFeed = kelas?.feed.filter((item) => feedFilter === "SEMUA" || item.tipe === feedFilter) ?? [];

  const [showEditKelas, setShowEditKelas] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showTambahSiswa, setShowTambahSiswa] = useState(false);
  const [showTambahGuru, setShowTambahGuru] = useState(false);
  const canManageClass = me?.role === "ADMIN";

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
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
    try {
      const res = await fetch(`/api/kelas/${kelasId}`);
      const data = await res.json();
      if (res.ok) setKelas(data.data);
    } catch {}
    setLoading(false);
  }

  function handleCopyInvite() {
    if (!kelas) return;
    const link = `${window.location.origin}/join/${kelas.inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function navigateToAdminTab(tab: AdminTab) {
    router.push(`/admin?tab=${tab}`);
  }

  function toggleSidebar() {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed((value) => !value);
      return;
    }
    setSidebarOpen((value) => !value);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  async function handleHapusSiswa(siswaId: string, kelasIdsLama: string[]) {
    if (!(await showConfirm("Keluarkan siswa ini dari kelas?"))) return;
    await fetch(`/api/akun/${siswaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kelasIds: kelasIdsLama.filter((id) => id !== kelasId) }),
    });
    loadKelas();
  }

  async function handleHapusGuru(guruId: string, mapelId: string, kelasIdsLama: string[]) {
    if (!(await showConfirm("Keluarkan guru ini dari kelas?"))) return;
    await fetch(`/api/akun/${guruId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kelasIds: kelasIdsLama.filter((id) => id !== kelasId), mapelId }),
    });
    loadKelas();
  }

  if (loading) {
    return (
      <div data-admin-theme={theme} className="admin-shell flex min-h-screen items-center justify-center bg-[#f6f7fb]">
        <p className="text-sm text-[#9CA3AF]">Memuat...</p>
      </div>
    );
  }

  if (!kelas) {
    return (
      <div data-admin-theme={theme} className="admin-shell flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f7fb]">
        <p className="text-sm text-[#9CA3AF]">Kelas tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push("/admin")}>
          Kembali
        </Button>
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
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
          />
          {me && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#182033]">{me.nama}</p>
              <p className="text-xs text-[#9CA3AF]">{me.role}</p>
            </div>
          )}
          <div className="hidden h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280] sm:flex">
            {me?.fotoProfil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.fotoProfil} alt={me.nama} className="h-full w-full object-cover" />
            ) : (
              me?.nama?.charAt(0) ?? "A"
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => router.push(canManageClass ? "/admin" : "/guru")}>
            Kembali
          </Button>
        </div>
      </header>

      <div className="flex w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden" />
        )}

        <aside
          aria-label={canManageClass ? "Navigasi admin" : "Navigasi guru"}
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-hidden bg-[#f6f7fb] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:w-20 lg:border-0 lg:p-2" : "lg:w-72"}`}
        >
          <div className={`flex min-h-full ${sidebarCollapsed ? "min-w-0 w-full" : "min-w-64"} flex-col border border-[#e1e5ed] bg-white p-4`}>
            <p className="mb-3 px-2 pt-2 text-sm font-bold text-[#182033]">
              {canManageClass ? "Dashboard Admin" : "Dashboard Guru"}
              <br />
              <span style={{ color: BRAND }}>{canManageClass ? "- Detail Kelas" : "- Kelas"}</span>
            </p>
            <nav className="flex flex-col gap-1">
              {canManageClass
                ? ADMIN_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => navigateToAdminTab(tab.key)}
                      title={tab.label}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors"
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
                    </button>
                  ))
                : ([
                    ["KELAS", "Kelas", "/guru"],
                    ["ASESMEN", "Asesmen", "/guru/asesmen"],
                    ["TUGAS", "Tugas", "/guru/tugas"],
                    ["PROFILE", "Profile", me ? `/profil/${me.id}` : "#"],
                  ] as [GuruNav, string, string][]).map(([nav, label, href]) => (
                    <Link
                      key={nav}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                      style={
                        nav === "KELAS"
                          ? theme === "dark"
                            ? { background: "#202b47", color: "#91a5ff", boxShadow: "inset 3px 0 0 #6B85F6" }
                            : { background: "#ffffff", color: BRAND, boxShadow: "inset 3px 0 0 #6B85F6" }
                          : { background: "transparent", color: theme === "dark" ? "#aeb8c9" : "#435064" }
                      }
                    >
                      <GuruNavIcon nav={nav} />
                      {label}
                    </Link>
                  ))}
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
          <div className="mx-auto w-full max-w-5xl">
            <section className="border border-[#dfe4ef] border-l-4 border-l-[#6B85F6] bg-white p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#6B85F6]">Detail Kelas</p>
                  <h1 className="mt-1 break-words text-xl font-bold text-[#182033] sm:text-2xl">{kelas.judul}</h1>
                  {kelas.deskripsi && <p className="mt-1 whitespace-pre-wrap text-sm text-[#64748B]">{kelas.deskripsi}</p>}
                </div>
                {canManageClass && (
                  <Button variant="outline" onClick={() => setShowEditKelas(true)} className="w-full flex-shrink-0 sm:w-auto">
                    Edit Kelas
                  </Button>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-[#edf0f5] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#8290a3]">Kode Kelas</p>
                  <p className="mt-1 break-all text-sm font-semibold text-[#182033]">{kelas.inviteToken}</p>
                </div>
                <button
                  onClick={handleCopyInvite}
                  className="inline-flex min-h-10 w-full flex-shrink-0 cursor-pointer items-center justify-center gap-2 border border-[#dfe4ef] px-3 text-sm font-semibold text-[#435064] transition-colors hover:bg-[#f7f8fb] sm:w-auto"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <rect x="9" y="9" width="12" height="12" rx="2" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                  </svg>
                  {copied ? "Tersalin!" : "Salin Link Undangan"}
                </button>
              </div>
            </section>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
              {(["SISWA", "GURU"] as const).map((type) => {
                const isStudent = type === "SISWA";
                const isActive = section === type;
                const count = isStudent
                  ? kelas.siswa.length
                  : new Set(kelas.guruMapel.map((assignment) => assignment.guru.id)).size;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-expanded={isActive}
                    onClick={() => setSection(isActive ? null : type)}
                    className={`flex min-h-[72px] min-w-0 cursor-pointer items-center justify-between gap-2 border px-3 py-3 text-left transition-colors sm:px-4 ${isActive ? "border-[#6B85F6] bg-[#eef1ff]" : "border-[#dfe4ef] bg-white hover:border-[#bdc8f8] hover:bg-[#fafbff]"}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#182033]">{isStudent ? "Siswa" : "Guru"}</span>
                      <span className="mt-0.5 block text-xs text-[#8290a3]">Lihat daftar</span>
                    </span>
                    <span className={`flex h-9 min-w-9 flex-shrink-0 items-center justify-center px-2 text-sm font-bold ${isActive ? "bg-[#6B85F6] text-white" : "bg-[#f1f3f8] text-[#536076]"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {section === "SISWA" && (
              <div className="mt-3 border border-[#e1e5ed] bg-white p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#182033]">Deretan Siswa</p>
                  <div className="flex items-center gap-2">
                    {canManageClass && (
                      <Button size="sm" onClick={() => setShowTambahSiswa(true)}>
                        + Tambah Siswa
                      </Button>
                    )}
                    <button
                      type="button"
                      aria-label="Tutup deretan siswa"
                      onClick={() => setSection(null)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#dfe4ef] text-lg text-[#748096] hover:bg-[#6B85F6]/10"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {Object.keys(siswaGrouped).length === 0 ? (
                  <p className="text-sm text-[#9CA3AF]">Belum ada siswa di kelas ini.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(siswaGrouped).map(([label, list]) => {
                      const isOpen = expandedRombel === label;
                      return (
                        <div key={label} className="border border-[#e1e5ed] bg-white">
                          <button
                            onClick={() => setExpandedRombel(isOpen ? null : label)}
                            className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-[#182033]">{label}</p>
                              <Badge tone="brand">{list.length} Siswa</Badge>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>
                          {isOpen && (
                            <div className="space-y-2 border-t border-[#edf0f5] p-4">
                              {list.map((ks) => (
                                <div key={ks.siswaId} className="flex items-center gap-3 border border-[#edf0f5] p-3">
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/profil/${ks.siswa.id}`)}
                                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                                  >
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                                      {ks.siswa.fotoProfil ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={ks.siswa.fotoProfil} alt={ks.siswa.nama} className="h-full w-full object-cover" />
                                      ) : (
                                        ks.siswa.nama.charAt(0)
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-[#182033]">{ks.siswa.nama}</p>
                                    </div>
                                  </button>
                                  {canManageClass && (
                                    <button
                                      onClick={() => handleHapusSiswa(ks.siswa.id, [kelasId])}
                                      className="cursor-pointer text-xs font-medium text-red-500 hover:underline"
                                    >
                                      Hapus
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {section === "GURU" && (
              <div className="mt-3 border border-[#e1e5ed] bg-white p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#182033]">Deretan Guru</p>
                  <div className="flex items-center gap-2">
                    {canManageClass && (
                      <Button size="sm" onClick={() => setShowTambahGuru(true)}>
                        + Tambah Guru
                      </Button>
                    )}
                    <button
                      type="button"
                      aria-label="Tutup deretan guru"
                      onClick={() => setSection(null)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#dfe4ef] text-lg text-[#748096] hover:bg-[#6B85F6]/10"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {Object.keys(guruGrouped).length === 0 ? (
                  <p className="text-sm text-[#9CA3AF]">Belum ada guru mengajar di kelas ini.</p>
                ) : (
                  Object.entries(guruGrouped).map(([mapel, list]) => (
                    <div key={mapel} className="mb-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">{mapel}</p>
                      <div className="space-y-2">
                        {list.map((gm) => (
                          <div key={gm.id} className="flex items-center gap-3 border border-[#e1e5ed] bg-white p-3">
                            <button
                              type="button"
                              onClick={() => router.push(`/profil/${gm.guru.id}`)}
                              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                                {gm.guru.fotoProfil ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={gm.guru.fotoProfil} alt={gm.guru.nama} className="h-full w-full object-cover" />
                                ) : (
                                  gm.guru.nama.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[#182033]">{gm.guru.nama}</p>
                              </div>
                            </button>
                            {canManageClass && (
                              <button
                                onClick={() => handleHapusGuru(gm.guru.id, gm.mapel.id, [kelasId])}
                                className="cursor-pointer text-xs font-medium text-red-500 hover:underline"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {section === null && (
              <section className="mt-7 border-t border-[#e1e5ed] pt-5">
                <div className="mb-3">
                  <h2 className="text-base font-bold text-[#182033]">Aktivitas Kelas</h2>
                  <p className="mt-1 text-xs text-[#8290a3]">Pengumuman, materi, tugas, dan asesmen di kelas ini.</p>
                </div>
                <KelasFeedFilter value={feedFilter} onChange={setFeedFilter} />
                <div className="mt-3 space-y-3">
                  {filteredFeed.length === 0 ? (
                    <p className="text-sm text-[#9CA3AF]">{kelas.feed.length === 0 ? "Belum ada aktivitas di kelas ini." : "Tidak ada konten untuk filter ini."}</p>
                  ) : (
                    filteredFeed.map((item, i) => {
                      if (item.tipe === "PENGUMUMAN") {
                        return <PengumumanCard key={`p-${i}`} data={item.data} currentUserId={me?.id ?? ""} />;
                      }
                      if (item.tipe === "TUGAS") {
                        return <TugasCard key={`t-${i}`} data={item.data} currentUserId={me?.id ?? ""} role="ADMIN" />;
                      }
                      if (item.tipe === "MATERI") {
                        return <MateriCard key={`m-${i}`} data={item.data} />;
                      }
                      const a = item.data;
                      return (
                        <div key={`a-${i}`} className="border border-[#e1e5ed] bg-white p-4">
                          <div className="flex items-center gap-2">
                            <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                            {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                          </div>
                          <p className="mt-2 text-sm font-bold text-[#182033]">{a.judul}</p>
                          <p className="mt-1 text-xs text-[#9CA3AF]">
                            {a._count?.soal ?? 0} soal · oleh {a.guru?.nama}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      <footer className="no-print mt-10 border-t border-[#e1e5ed] bg-white">
        <p className="px-4 py-5 text-center text-xs text-[#8290a3] sm:px-6">© 2026 Classify. Sistem pembelajaran yang lebih terarah.</p>
      </footer>

      {canManageClass && <ModalKelas open={showEditKelas} onClose={() => setShowEditKelas(false)} onSuccess={loadKelas} mode="edit" initialData={kelas} />}

      {canManageClass && (
        <ModalTambahSiswa
          open={showTambahSiswa}
          onClose={() => setShowTambahSiswa(false)}
          onSuccess={loadKelas}
          kelasId={kelasId}
          siswaSudahAda={kelas.siswa.map((ks) => ks.siswaId)}
        />
      )}

      {canManageClass && (
        <ModalTambahGuru
          open={showTambahGuru}
          onClose={() => setShowTambahGuru(false)}
          onSuccess={loadKelas}
          kelasId={kelasId}
          guruSudahAda={kelas.guruMapel.map((gm) => gm.guru.id)}
        />
      )}

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

        [data-admin-theme="dark"] :is(
          [class*="text-[#111827]" i], [class*="text-[#182033]" i]
        ) { color: #f3f6fb !important; }

        [data-admin-theme="dark"] :is(
          [class*="text-[#64748B]" i], [class*="text-[#6B7280]" i], [class*="text-[#94A3B8]" i],
          [class*="text-[#9CA3AF]" i], [class*="text-[#748096]" i], [class*="text-[#435064]" i]
        ) { color: #aeb8c9 !important; }

        [data-admin-theme="dark"] [class*="hover:bg-"]:hover:not([class~="hover:bg-[#5974ed]"]):not([class~="hover:bg-red-50"]) {
          background-color: rgba(107, 133, 246, .14) !important;
        }

        [data-admin-theme="dark"] input,
        [data-admin-theme="dark"] select { background-color: #111722 !important; border-color: #344054 !important; color: #e9eef8 !important; }
        [data-admin-theme="dark"] option { background-color: #111722; color: #e9eef8; }
      `}</style>
    </div>
  );
}

function ModalTambahSiswa({
  open,
  onClose,
  onSuccess,
  kelasId,
  siswaSudahAda,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelasId: string;
  siswaSudahAda: string[];
}) {
  const [rombelList, setRombelList] = useState<{ id: string; label: string }[]>([]);
  const [rombelId, setRombelId] = useState("");
  const [kandidat, setKandidat] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRombelId("");
    setKandidat([]);
    setSelectedIds([]);
    setBulkError("");
    fetch("/api/kelas-referensi")
      .then((res) => res.json())
      .then((data) => setRombelList(data.data ?? []))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!rombelId) {
      setKandidat([]);
      return;
    }
    setLoading(true);
    fetch("/api/akun?role=SISWA")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.data ?? []).filter(
          (s: any) => s.kelasReferensi?.id === rombelId && !siswaSudahAda.includes(s.id)
        );
        setKandidat(list);
      })
      .finally(() => setLoading(false));
  }, [rombelId, siswaSudahAda]);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(
        selectedIds.map((siswaId) => {
          const siswa = kandidat.find((k) => k.id === siswaId);
          const kelasIdsLama = (siswa?.kelasSiswa ?? []).map((ks: any) => ks.kelas.id);
          return fetch(`/api/akun/${siswaId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kelasIds: [...kelasIdsLama, kelasId] }),
          });
        })
      );
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddAll() {
    if (kandidat.length === 0) return;
    if (!(await showConfirm(`Tambahkan semua ${kandidat.length} siswa dari rombel ini ke kelas?`))) return;

    setBulkSubmitting(true);
    setBulkError("");
    try {
      const res = await fetch(`/api/kelas/${kelasId}/siswa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siswaIds: kandidat.map((siswa) => siswa.id) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBulkError(data.error ?? "Siswa gagal ditambahkan.");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setBulkError("Siswa gagal ditambahkan. Coba lagi.");
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Siswa">
      <div className="space-y-4">
        <Select label="Pilih Kelas/Rombel" placeholder="Pilih rombel dulu" value={rombelId} onChange={(e) => setRombelId(e.target.value)}>
          {rombelList.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>

        {loading && <p className="text-xs text-[#9CA3AF]">Memuat...</p>}

        {!loading && rombelId && kandidat.length === 0 && (
          <p className="text-xs text-[#9CA3AF]">Semua siswa di rombel ini sudah ada di kelas.</p>
        )}

        {kandidat.length > 0 && (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {kandidat.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-[#6B85F6]/10">
                <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggle(s.id)} />
                <span className="text-sm text-[#435064]">{s.nama}</span>
              </label>
            ))}
          </div>
        )}

        {bulkError && <p className="text-xs font-medium text-red-500">{bulkError}</p>}

        {kandidat.length > 0 && (
          <Button type="button" variant="outline" className="w-full" loading={bulkSubmitting} disabled={submitting} onClick={() => void handleAddAll()}>
            Tambah semua siswa rombel ({kandidat.length})
          </Button>
        )}
        <Button type="button" className="w-full" loading={submitting} disabled={selectedIds.length === 0 || bulkSubmitting} onClick={handleSubmit}>
          Tambah {selectedIds.length > 0 ? `(${selectedIds.length})` : "siswa terpilih"}
        </Button>
      </div>
    </Modal>
  );
}

function ModalTambahGuru({
  open,
  onClose,
  onSuccess,
  kelasId,
  guruSudahAda,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelasId: string;
  guruSudahAda: string[];
}) {
  const [guruList, setGuruList] = useState<any[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [guruId, setGuruId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setGuruId("");
    setMapelId("");
    fetch("/api/akun?role=GURU")
      .then((res) => res.json())
      .then((data) => setGuruList((data.data ?? []).filter((g: any) => !guruSudahAda.includes(g.id))))
      .catch(() => {});
    fetch("/api/mapel")
      .then((res) => res.json())
      .then((data) => setMapelList(data.data ?? []))
      .catch(() => {});
  }, [open, guruSudahAda]);

  useEffect(() => {
    const guru = guruList.find((g) => g.id === guruId);
    const mapelExisting = guru?.kelasGuruMapel?.[0]?.mapel?.id;
    if (mapelExisting) setMapelId(mapelExisting);
  }, [guruId, guruList]);

  async function handleSubmit() {
    if (!guruId || !mapelId) return;
    setSubmitting(true);
    try {
      const guru = guruList.find((g) => g.id === guruId);
      const kelasIdsLama = (guru?.kelasGuruMapel ?? []).map((kg: any) => kg.kelas.id);
      await fetch(`/api/akun/${guruId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasIds: [...kelasIdsLama, kelasId], mapelId }),
      });
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Guru">
      <div className="space-y-4">
        <Select label="Pilih Guru" placeholder="Pilih guru" value={guruId} onChange={(e) => setGuruId(e.target.value)}>
          {guruList.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </Select>

        <Select label="Mapel" placeholder="Pilih mapel" value={mapelId} onChange={(e) => setMapelId(e.target.value)}>
          {mapelList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama}
            </option>
          ))}
        </Select>

        <Button className="w-full" loading={submitting} disabled={!guruId || !mapelId} onClick={handleSubmit}>
          Tambah Guru
        </Button>
      </div>
    </Modal>
  );
}