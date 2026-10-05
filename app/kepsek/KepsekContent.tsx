// app/kepsek/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import KelasCard, { KelasData } from "@/components/KelasCard";
import { AkunData } from "@/components/AkunCard";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import MobileDashboardSummary, { MobileDashboardSummaryItem } from "@/components/MobileDashboardSummary";
import ThemeToggle from "@/components/shared/theme-toggle";

const BRAND = "#6B85F6";

type AccountRole = "SISWA" | "GURU";
type Tab = "DASHBOARD" | "KELAS" | "AKUN" | "ASESMEN" | "PERFORMA";
type KepsekAsesmen = AsesmenData & { guru: { id: string; nama: string } };

interface AdminDashboardData {
  statistik: { kelas: number; siswa: number; guru: number; asesmen: number; tugas: number; materi: number; mapel: number; laporanPending: number; kuis: number; ujian: number; rataRataNilai: number; submissionDinilai: number; tugasDibuat: number; tugasDikumpulkan: number };
  akunTerbaru: { id: string; nama: string; email: string; role: "SISWA" | "GURU"; createdAt: string }[];
  aktivitas: { periodeHari: number; userAktif: number; siswaAktif: number; guruAktif: number; aktivitasHarian: { tanggal: string; asesmen: number; tugas: number; submission: number; userAktif: number }[] };
  akademik: { trendNilai: { tanggal: string; judul: string; nilai: number | null }[]; rataRataPerKelas: { label: string; nilai: number | null }[]; rataRataPerMapel: { label: string; nilai: number | null }[] };
  aktivitasPembelajaran: { asesmenSelesai: number; asesmenBelum: number; tugasDikumpulkan: number; tugasBelum: number };
}

function normalizeDashboardData(data: (Omit<AdminDashboardData, "aktivitas"> & { aktivitas?: AdminDashboardData["aktivitas"] }) | null | undefined): AdminDashboardData | null {
  if (!data) return null;
  return {
    ...data,
    aktivitas: data.aktivitas ?? { periodeHari: 14, userAktif: 0, siswaAktif: 0, guruAktif: 0, aktivitasHarian: [] },
    akademik: data.akademik ?? { trendNilai: [], rataRataPerKelas: [], rataRataPerMapel: [] },
    aktivitasPembelajaran: data.aktivitasPembelajaran ?? { asesmenSelesai: 0, asesmenBelum: 0, tugasDikumpulkan: 0, tugasBelum: 0 },
  };
}

function TabIcon({ tab }: { tab: Tab }) {
  const paths: Record<Tab, React.ReactNode> = {
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

const TABS: { key: Tab; label: string }[] = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "KELAS", label: "Kelas" },
  { key: "AKUN", label: "Daftar Akun" },
  { key: "ASESMEN", label: "Asesmen" },
  { key: "PERFORMA", label: "Performa Akademik" },
];

const FIELD_CLASS = "mt-1 w-full rounded-lg border border-[#dfe4ef] bg-white px-3 py-2 text-sm font-normal text-[#182033] outline-none focus:border-[#6B85F6]";
const FIELD_LABEL_CLASS = "block text-xs font-semibold text-[#748096]";

export default function KepsekDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");
  const [accountRole, setAccountRole] = useState<AccountRole>("SISWA");
  const [me, setMe] = useState<{ nama: string; role: string; fotoProfil: string | null } | null>(null);

  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [siswaList, setSiswaList] = useState<AkunData[]>([]);
  const [guruList, setGuruList] = useState<AkunData[]>([]);
  const [asesmenList, setAsesmenList] = useState<KepsekAsesmen[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasReferensiList, setKelasReferensiList] = useState<{ label: string; jenjang: string; tingkat: number | null; jurusan: { nama: string } | null }[]>([]);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const [jurusanFilter, setJurusanFilter] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [siswaSearch, setSiswaSearch] = useState("");
  const [mapelFilter, setMapelFilter] = useState("");
  const [guruSearch, setGuruSearch] = useState("");
  const [expandedGuruId, setExpandedGuruId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("admin-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "SISWA" || tab === "GURU") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccountRole(tab);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab("AKUN");
    } else if (tab && ["DASHBOARD", "KELAS", "AKUN", "ASESMEN", "PERFORMA"].includes(tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tab as Tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-admin-theme", theme);
    window.localStorage.setItem("admin-theme", theme);
    return () => document.documentElement.removeAttribute("data-admin-theme");
  }, [mounted, theme]);

  useEffect(() => {
    loadTabData(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadTabData(tab: Tab) {
    setLoading(true);
    try {
      if (tab === "DASHBOARD" || tab === "PERFORMA") {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        setDashboardData(normalizeDashboardData(data.data));
      } else if (tab === "KELAS") {
        const res = await fetch("/api/kelas");
        const data = await res.json();
        setKelasList(data.data ?? []);
      } else if (tab === "AKUN") {
        const [siswaRes, referensiRes, guruRes, mapelRes] = await Promise.all([
          fetch("/api/akun?role=SISWA"),
          fetch("/api/kelas-referensi"),
          fetch("/api/akun?role=GURU"),
          fetch("/api/mapel"),
        ]);
        const [siswaData, referensiData, guruData, mapelData] = await Promise.all([
          siswaRes.json(), referensiRes.json(), guruRes.json(), mapelRes.json(),
        ]);
        setSiswaList(siswaData.data ?? []);
        setKelasReferensiList(referensiData.data ?? []);
        setGuruList(guruData.data ?? []);
        setMapelList(mapelData.data ?? []);
      } else if (tab === "ASESMEN") {
        const res = await fetch("/api/asesmen");
        const data = await res.json();
        setAsesmenList(data.data ?? []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  function toggleSidebar() {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed((value) => !value);
      return;
    }
    setSidebarOpen((v) => !v);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function openTab(tab: Tab | AccountRole) {
    if (tab === "SISWA" || tab === "GURU") {
      setAccountRole(tab);
      setActiveTab("AKUN");
    } else {
      setActiveTab(tab);
    }
    setSidebarOpen(false);
  }

  const jurusanOptions = Array.from(new Set(kelasReferensiList.map((kelas) => kelas.jurusan?.nama).filter(Boolean))) as string[];
  const kelasOptions = ["SMP", "SMA", "10", "11", "12"];
  const filteredSiswaList = siswaList.filter((siswa) => {
    const jurusan = siswa.kelasReferensi?.jurusan?.nama ?? "";
    const tingkat = siswa.kelasReferensi?.jenjang === "SMP" || siswa.kelasReferensi?.jenjang === "SMA"
      ? siswa.kelasReferensi.jenjang
      : siswa.kelasReferensi?.tingkat?.toString() ?? "";
    const query = siswaSearch.trim().toLowerCase();
    const cocokJurusan = !jurusanFilter || jurusan === jurusanFilter;
    const cocokKelas = !kelasFilter || tingkat === kelasFilter;
    const cocokSearch = !query || [siswa.nama, siswa.email, siswa.nis ?? ""].some((value) => value.toLowerCase().includes(query));
    return cocokJurusan && cocokKelas && cocokSearch;
  });
  const mapelOptions = mapelList.map((mapel) => mapel.nama);
  const filteredGuruList = guruList.filter((guru) => {
    const mapel = guru.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [];
    const query = guruSearch.trim().toLowerCase();
    const cocokMapel = !mapelFilter || mapel.includes(mapelFilter);
    const cocokSearch = !query || [guru.nama, guru.email, guru.nik ?? ""].some((value) => value.toLowerCase().includes(query));
    return cocokMapel && cocokSearch;
  });
  const asesmenByGuru = Array.from(asesmenList.reduce((groups, asesmen) => {
    const group = groups.get(asesmen.guru.id) ?? { guru: asesmen.guru, asesmen: [] as KepsekAsesmen[] };
    group.asesmen.push(asesmen);
    groups.set(asesmen.guru.id, group);
    return groups;
  }, new Map<string, { guru: KepsekAsesmen["guru"]; asesmen: KepsekAsesmen[] }>()).values());
  const dashboardSummaryItems: MobileDashboardSummaryItem[] = dashboardData ? [
    { label: "Kelas", value: dashboardData.statistik.kelas, actionLabel: "Lihat kelas", onAction: () => openTab("KELAS") },
    { label: "Siswa", value: dashboardData.statistik.siswa, actionLabel: "Daftar siswa", onAction: () => openTab("SISWA") },
    { label: "Guru", value: dashboardData.statistik.guru, actionLabel: "Daftar guru", onAction: () => openTab("GURU") },
    { label: "Asesmen", value: dashboardData.statistik.asesmen, actionLabel: "Kuis dan ujian", onAction: () => openTab("KELAS") },
    { label: "Tugas", value: dashboardData.statistik.tugas, actionLabel: "Tugas dibuat", onAction: () => openTab("KELAS") },
    { label: "Materi", value: dashboardData.statistik.materi, actionLabel: "Materi dibagikan", onAction: () => openTab("KELAS") },
    { label: "Mata Pelajaran", value: dashboardData.statistik.mapel, actionLabel: "Mapel tersedia", onAction: () => openTab("GURU") },
    { label: "Rata-rata Nilai", value: dashboardData.statistik.rataRataNilai, actionLabel: "Dari asesmen dinilai", onAction: () => openTab("PERFORMA") },
  ] : [];

  return (
    <div data-admin-theme={mounted ? theme : "light"} className="admin-shell flex min-h-screen flex-col bg-[#f6f7fb]" style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-[#e6e9f0] bg-white px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} aria-label="Toggle sidebar" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-transparent text-[#4f5b70] transition-colors hover:border-[#dfe4ef] hover:bg-[#f7f8fb]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 flex-shrink-0"><Image src="/Logo1.png" alt="Logo Classify" fill sizes="32px" className="rounded-[9px] object-contain" /></div>
            <span className="text-[17px] font-bold tracking-[-.04em]">Classify</span>
          </div>
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
              me?.nama?.charAt(0) ?? "K"
            )}
          </div>
        </div>
      </header>

      <div className="flex w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden" />}

        <aside
          aria-label="Navigasi kepsek"
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-hidden bg-[#f6f7fb] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:w-0 lg:border-0 lg:p-0" : "lg:w-72"}`}
        >
          <div className="flex min-h-full min-w-64 flex-col border border-[#e1e5ed] bg-white p-4">
            <p className="mb-3 px-2 pt-2 text-sm font-bold text-[#182033]">
              Dashboard Kepsek
              <br />
              <span style={{ color: BRAND }}>- {TABS.find((t) => t.key === activeTab)?.label}</span>
            </p>
            <nav className="flex flex-col gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => openTab(tab.key)}
                  title={tab.label}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors"
                  style={
                    activeTab === tab.key
                      ? theme === "dark"
                        ? { background: "#202b47", color: "#91a5ff", boxShadow: "inset 3px 0 0 #6B85F6" }
                        : { background: "#ffffff", color: BRAND, boxShadow: "inset 3px 0 0 #6B85F6" }
                      : { background: "transparent", color: theme === "dark" ? "#aeb8c9" : "#435064" }
                  }
                >
                  <TabIcon tab={tab.key} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
            <Button size="md" onClick={handleLogout} className="mt-auto w-full rounded-xl" style={{ background: "#F8CDBD", color: "#7C4A3A" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M10 17l5-5-5-5M15 12H3M21 4v16" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Keluar
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 lg:pl-6">
          {loading && <p className="text-sm text-[#9CA3AF]">Memuat...</p>}

          {!loading && activeTab === "DASHBOARD" && dashboardData && (
            <div className="space-y-5">
              <div className="border border-[#dfe4ef] p-6 text-white" style={{ background: BRAND }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Dashboard Kepsek</p>
                <h1 className="mt-2 text-2xl font-bold">Selamat Datang, {me?.nama ?? "Kepsek"}</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/85">Pantau kelas, akun, dan performa akademik Classify — akses lihat saja.</p>
              </div>

              <MobileDashboardSummary items={dashboardSummaryItems} theme={theme} />
              <div className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Kelas", dashboardData.statistik.kelas, "Lihat kelas", "KELAS"],
                  ["Siswa", dashboardData.statistik.siswa, "Daftar siswa", "SISWA"],
                  ["Guru", dashboardData.statistik.guru, "Daftar guru", "GURU"],
                  ["Asesmen", dashboardData.statistik.asesmen, "Kuis dan ujian", "KELAS"],
                  ["Tugas", dashboardData.statistik.tugas, "Tugas dibuat", "KELAS"],
                  ["Materi", dashboardData.statistik.materi, "Materi dibagikan", "KELAS"],
                  ["Mata Pelajaran", dashboardData.statistik.mapel, "Mapel tersedia", "GURU"],
                  ["Rata-rata Nilai", dashboardData.statistik.rataRataNilai, "Dari asesmen dinilai", "PERFORMA"],
                ].map(([label, value, caption, tab], index) => (
                  <button key={label as string} type="button" onClick={() => openTab(tab as Tab)} className={`group border p-4 text-left transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff] ${index === 0 ? "border-[#6B85F6] bg-white" : "border-[#e1e5ed] bg-white"}`}>
                    <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.1em] text-[#8490a3]">{label}</p><span className="text-xs font-bold text-[#6B85F6] group-hover:translate-x-0.5">↗</span></div>
                    <p className="mt-5 text-3xl font-bold tracking-[-.055em] text-[#182033]">{value}</p>
                    <p className="mt-1 text-xs text-[#6f7b8d]">{caption}</p>
                  </button>
                ))}
              </div>

              <section className="border border-[#e1e5ed] bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-[#edf0f5] px-5 py-4">
                  <div>
                    <h2 className="text-sm font-bold text-[#182033]">Akun terbaru</h2>
                    <p className="mt-1 text-xs text-[#748096]">Lima akun siswa dan guru terakhir dibuat.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openTab("SISWA")}>Lihat Akun</Button>
                </div>
                <div className="divide-y divide-[#edf0f5]">
                  {dashboardData.akunTerbaru.length === 0 ? (
                    <p className="p-5 text-sm text-[#94A3B8]">Belum ada akun.</p>
                  ) : (
                    dashboardData.akunTerbaru.map((akun) => (
                      <button key={akun.id} type="button" onClick={() => router.push(`/profil/${akun.id}`)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#6B85F6]/10">
                        <span>
                          <span className="block text-sm font-semibold text-[#182033]">{akun.nama}</span>
                          <span className="mt-0.5 block text-xs text-[#748096]">{akun.email}</span>
                        </span>
                        <span className="text-right">
                          <Badge tone={akun.role === "GURU" ? "brand" : "gray"}>{akun.role === "GURU" ? "Guru" : "Siswa"}</Badge>
                          <span className="mt-1 block text-[11px] text-[#94A3B8]">{new Date(akun.createdAt).toLocaleDateString("id-ID")}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {!loading && activeTab === "PERFORMA" && dashboardData && (
            <div className="space-y-5">
              <PageHeader
                eyebrow="Analitik LMS"
                title="Performa Akademik & Data"
                desc="Pantau nilai, aktivitas pembelajaran, dan pengguna aktif berdasarkan data nyata sistem."
              />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[["Rata-rata Nilai", dashboardData.statistik.rataRataNilai, "Nilai asesmen dinilai"], ["Asesmen Dinilai", dashboardData.statistik.submissionDinilai, "Submission dengan nilai"], ["Tugas Dibuat", dashboardData.statistik.tugasDibuat, "Total tugas guru"], ["Tugas Dikumpulkan", dashboardData.statistik.tugasDikumpulkan, "Submission siswa"], ["Materi Dibagikan", dashboardData.statistik.materi, "Materi di seluruh kelas"]].map(([label, value, caption], index) => (
                  <div key={label as string} className={`flex flex-col justify-between gap-8 border bg-white p-4 ${index === 0 ? "border-[#6B85F6]" : "border-[#e1e5ed]"}`}>
                    <p className="text-xs font-semibold text-[#748096]">{label}</p>
                    <div>
                      <p className="text-3xl font-bold tracking-[-.055em] text-[#182033]">{value}</p>
                      <p className="mt-1 text-xs text-[#6f7b8d]">{caption}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <section className="border border-[#e1e5ed] bg-white p-5">
                  <h2 className="text-sm font-bold text-[#182033]">Kuis dan ujian</h2>
                  <div className="mt-4 space-y-4">
                    {(() => {
                      const max = Math.max(dashboardData.statistik.kuis, dashboardData.statistik.ujian, 1);
                      return (
                        <>
                          <BarRow label="Kuis" value={dashboardData.statistik.kuis} max={max} />
                          <BarRow label="Ujian online" value={dashboardData.statistik.ujian} max={max} color="#b7c3fb" />
                        </>
                      );
                    })()}
                  </div>
                </section>
                <section className="border border-[#e1e5ed] bg-white p-5">
                  <h2 className="text-sm font-bold text-[#182033]">Tugas dibuat vs dikumpulkan</h2>
                  <div className="mt-4 space-y-4">
                    {(() => {
                      const max = Math.max(dashboardData.statistik.tugasDibuat, dashboardData.statistik.tugasDikumpulkan, 1);
                      return (
                        <>
                          <BarRow label="Tugas dibuat" value={dashboardData.statistik.tugasDibuat} max={max} />
                          <BarRow label="Dikumpulkan siswa" value={dashboardData.statistik.tugasDikumpulkan} max={max} color="#b7c3fb" />
                        </>
                      );
                    })()}
                  </div>
                </section>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <section className="overflow-hidden border border-[#e1e5ed] bg-white p-5">
                  <h2 className="text-sm font-bold text-[#182033]">Tren rata-rata nilai akademik sekolah</h2>
                  <p className="mt-1 text-xs text-[#748096]">Perubahan rata-rata nilai seluruh siswa berdasarkan periode asesmen.</p>
                  <AcademicTrendChart items={dashboardData.akademik.trendNilai} />
                </section>
                <section className="overflow-hidden border border-[#e1e5ed] bg-white p-5">
                  <h2 className="text-sm font-bold text-[#182033]">Rata-rata nilai per kelas</h2>
                  <p className="mt-1 text-xs text-[#748096]">Perbandingan capaian akademik rata-rata setiap kelas.</p>
                  <AcademicBarChart items={dashboardData.akademik.rataRataPerKelas} label="kelas" />
                </section>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <section className="border border-[#e1e5ed] bg-white p-5">
                  <h2 className="text-sm font-bold text-[#182033]">Rata-rata nilai per mata pelajaran</h2>
                  <p className="mt-1 text-xs text-[#748096]">Perbandingan rata-rata nilai untuk setiap mata pelajaran.</p>
                  <AcademicBarChart items={dashboardData.akademik.rataRataPerMapel} label="mata pelajaran" />
                </section>
                <section className="border border-[#e1e5ed] bg-white p-5">
                  <h2 className="text-sm font-bold text-[#182033]">Progress aktivitas pembelajaran</h2>
                  <p className="mt-1 text-xs text-[#748096]">Status penyelesaian asesmen dan tugas di seluruh sekolah.</p>
                  <LearningProgressChart items={[
                    ["Asesmen sudah dikerjakan", dashboardData.aktivitasPembelajaran.asesmenSelesai, BRAND],
                    ["Asesmen belum dikerjakan", dashboardData.aktivitasPembelajaran.asesmenBelum, "#b7c3fb"],
                    ["Tugas dikumpulkan", dashboardData.aktivitasPembelajaran.tugasDikumpulkan, BRAND],
                    ["Tugas belum dikumpulkan", dashboardData.aktivitasPembelajaran.tugasBelum, "#b7c3fb"],
                  ]} />
                </section>
              </div>
            </div>
          )}

          {!loading && activeTab === "KELAS" && (
            <div className="space-y-5">
              <PageHeader eyebrow="Pengelolaan akademik" title="Daftar Kelas" desc="Pantau kelas yang tersedia dan aktivitas belajar di setiap kelas." />
              {kelasList.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Belum ada kelas dibuat.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {kelasList.map((k) => (
                    <KelasCard key={k.id} data={k} isEditable={false} basePath="/kepsek/kelas" />
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "AKUN" && (
            <div className="space-y-4">
              <PageHeader eyebrow="Data akun" title="Daftar Akun" desc="Lihat data siswa dan guru dalam satu tempat (akses lihat saja)." />
              <div className="inline-flex rounded-lg border border-[#dfe4ef] bg-white p-1" role="group" aria-label="Pilih jenis akun">
                {(["SISWA", "GURU"] as AccountRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={accountRole === role}
                    onClick={() => setAccountRole(role)}
                    className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold transition-colors"
                    style={accountRole === role
                      ? { background: BRAND, color: "#ffffff" }
                      : { background: "transparent", color: theme === "dark" ? "#aeb8c9" : "#536076" }}
                  >
                    {role === "SISWA" ? "Siswa" : "Guru"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && activeTab === "AKUN" && accountRole === "SISWA" && (
            <div className="space-y-5">
              <div className="grid gap-3 border border-[#e1e5ed] bg-white p-3 md:grid-cols-[180px_220px_minmax(220px,1fr)_auto] md:items-end">
                <label className={FIELD_LABEL_CLASS}>
                  Jurusan
                  <select value={jurusanFilter} onChange={(event) => setJurusanFilter(event.target.value)} className={FIELD_CLASS}>
                    <option value="">Semua Jurusan</option>
                    {jurusanOptions.map((jurusan) => <option key={jurusan} value={jurusan}>{jurusan}</option>)}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  Kelas
                  <select value={kelasFilter} onChange={(event) => setKelasFilter(event.target.value)} className={FIELD_CLASS}>
                    <option value="">Semua Kelas</option>
                    {kelasOptions.map((kelas) => <option key={kelas} value={kelas}>{kelas}</option>)}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  Search
                  <input value={siswaSearch} onChange={(event) => setSiswaSearch(event.target.value)} placeholder="Nama, email, atau NIS..." className={FIELD_CLASS} />
                </label>
                <button type="button" onClick={() => { setJurusanFilter(""); setKelasFilter(""); setSiswaSearch(""); }} className="cursor-pointer rounded-lg border border-[#dfe4ef] px-3 py-2 text-xs font-semibold text-[#536076] hover:bg-[#f8f9fc]">Reset</button>
              </div>
              {filteredSiswaList.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Belum ada siswa terdaftar.</p>
              ) : (
                <div className="overflow-x-auto border border-[#e1e5ed] bg-white">
                  <table className="w-full min-w-[750px] text-left text-sm">
                    <thead className="border-b border-[#e1e5ed] text-xs text-[#748096]">
                      <tr>
                        <th className="pb-3 font-semibold">No</th>
                        <th className="pb-3 font-semibold">Profil</th>
                        <th className="pb-3 font-semibold">Nama</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">NIS</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Kelas/Rombel</th>
                        <th className="pb-3 font-semibold">Jurusan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0f5]">
                      {filteredSiswaList.map((s, index) => (
                        <tr key={s.id} onClick={() => router.push(`/profil/${s.id}`)} className="cursor-pointer hover:bg-[#6B85F6]/10">
                          <td className="py-3 text-xs text-[#748096]">{index + 1}</td>
                          <td className="py-3"><Avatar foto={s.fotoProfil} nama={s.nama} /></td>
                          <td className="py-3 font-semibold text-[#111827]">{s.nama}</td>
                          <td className="py-3 text-xs text-[#748096]">{s.email}</td>
                          <td className="py-3 text-xs text-[#748096]">{s.nis ?? "-"}</td>
                          <td className="py-3"><Badge tone="green">Aktif</Badge></td>
                          <td className="py-3 text-xs text-[#748096]" title={s.kelasSiswa?.map((item) => item.kelas.judul).join(", ") || "Belum ada kelas"}>
                            {s.kelasSiswa?.length ?? 0} Kelas
                          </td>
                          <td className="py-3 text-xs text-[#748096]">{s.kelasReferensi?.label ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "AKUN" && accountRole === "GURU" && (
            <div className="space-y-5">
              <div className="grid gap-3 border border-[#e1e5ed] bg-white p-3 md:grid-cols-[240px_minmax(220px,1fr)_auto] md:items-end">
                <label className={FIELD_LABEL_CLASS}>
                  Mapel
                  <select value={mapelFilter} onChange={(event) => setMapelFilter(event.target.value)} className={FIELD_CLASS}>
                    <option value="">Semua Mapel</option>
                    {mapelOptions.map((mapel) => <option key={mapel} value={mapel}>{mapel}</option>)}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  Search
                  <input value={guruSearch} onChange={(event) => setGuruSearch(event.target.value)} placeholder="Nama, email, atau NIK..." className={FIELD_CLASS} />
                </label>
                <button type="button" onClick={() => { setMapelFilter(""); setGuruSearch(""); }} className="cursor-pointer rounded-lg border border-[#dfe4ef] px-3 py-2 text-xs font-semibold text-[#536076] hover:bg-[#f8f9fc]">Reset</button>
              </div>
              {filteredGuruList.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Belum ada guru terdaftar.</p>
              ) : (
                <div className="overflow-x-auto border border-[#e1e5ed] bg-white">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="border-b border-[#e1e5ed] text-xs text-[#748096]">
                      <tr>
                        <th className="pb-3 font-semibold">No</th>
                        <th className="pb-3 font-semibold">Profil</th>
                        <th className="pb-3 font-semibold">Nama</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">NIK</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Mapel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0f5]">
                      {filteredGuruList.map((g, index) => (
                        <tr key={g.id} onClick={() => router.push(`/profil/${g.id}`)} className="cursor-pointer hover:bg-[#6B85F6]/10">
                          <td className="py-3 text-xs text-[#748096]">{index + 1}</td>
                          <td className="py-3"><Avatar foto={g.fotoProfil} nama={g.nama} /></td>
                          <td className="py-3 font-semibold text-[#111827]">{g.nama}</td>
                          <td className="py-3 text-xs text-[#748096]">{g.email}</td>
                          <td className="py-3 text-xs text-[#748096]">{g.nik ?? "-"}</td>
                          <td className="py-3"><Badge tone="green">Aktif</Badge></td>
                          <td className="py-3 text-xs text-[#748096]">{Array.from(new Set(g.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [])).join(", ") || "Belum ada mapel"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "ASESMEN" && (
            <div className="space-y-4">
              <PageHeader eyebrow="Monitoring" title="Asesmen Guru" desc="Pilih guru untuk melihat seluruh asesmen yang dibuatnya." />
              {asesmenByGuru.length === 0 ? (
                <div className="border border-[#e1e5ed] bg-white p-5">
                  <p className="text-sm text-[#9CA3AF]">Belum ada asesmen yang dibuat guru.</p>
                </div>
              ) : (
                asesmenByGuru.map(({ guru, asesmen }) => {
                  const expanded = expandedGuruId === guru.id;
                  return (
                    <section key={guru.id} className="border border-[#e1e5ed] bg-white">
                      <button
                        type="button"
                        onClick={() => setExpandedGuruId(expanded ? null : guru.id)}
                        className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left hover:bg-[#6B85F6]/10"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-sm font-bold text-[#6B85F6]">{guru.nama.charAt(0)}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-[#182033]">{guru.nama}</span>
                            <span className="block text-xs text-[#64748B]">{asesmen.length} asesmen</span>
                          </span>
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" className={`h-5 w-5 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                      {expanded && (
                        <div className="border-t border-[#edf0f5] p-5">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {asesmen.map((item) => <AsesmenCard key={item.id} data={item} basePath="/kepsek/asesmen" />)}
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })
              )}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-[#e1e5ed] bg-white px-4 py-5 text-center text-xs text-[#8290a3] sm:px-6">© 2026 Classify. Sistem pembelajaran yang lebih terarah.</footer>

      <style jsx global>{`
        .admin-shell main table thead { background: #f8f9fc; }
        .admin-shell main table th { padding: 12px 10px; }
        .admin-shell main table td { padding-left: 10px; padding-right: 10px; }
        .admin-shell main input:focus,
        .admin-shell main select:focus { box-shadow: 0 0 0 3px rgba(107, 133, 246, .12); }

        [data-admin-theme="dark"] { color-scheme: dark; }
        .admin-shell[data-admin-theme="dark"] { background: #10141d !important; color: #eef2f8; }

        [data-admin-theme="dark"] header,
        [data-admin-theme="dark"] .bg-white { background-color: #171d28 !important; }
        [data-admin-theme="dark"] [class~="bg-[#F9FAFB]"],
        [data-admin-theme="dark"] [class~="bg-[#F8FAFC]"],
        [data-admin-theme="dark"] [class~="bg-[#f7f8fd]"],
        [data-admin-theme="dark"] [class~="bg-[#f6f7fb]"],
        [data-admin-theme="dark"] [class~="bg-[#f8f9fc]"],
        [data-admin-theme="dark"] [class~="bg-gray-50"],
        [data-admin-theme="dark"] [class~="bg-slate-50"] { background-color: #10141d !important; }
        [data-admin-theme="dark"] [class~="bg-gray-100"],
        [data-admin-theme="dark"] [class~="bg-slate-100"],
        [data-admin-theme="dark"] [class~="bg-[#EEF2FF]"] { background-color: #1b2230 !important; }
        [data-admin-theme="dark"] [class~="bg-[#eef1f8]"] { background-color: #232c3d !important; }
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
          [class*="text-[#6e798b]" i], [class*="text-[#6f7b8d]" i], [class*="text-[#536076]" i],
          [class*="text-[#4f5b70]" i], [class*="text-[#576277]" i], [class*="text-[#8490a3]" i],
          [class*="text-[#8290a3]" i],
          [class~="text-gray-600"], [class~="text-gray-500"], [class~="text-gray-400"]
        ) { color: #aeb8c9 !important; }

        [data-admin-theme="dark"] [class*="hover:bg-"]:hover:not([class~="hover:bg-red-50"]) { background-color: rgba(107, 133, 246, .14) !important; }
        [data-admin-theme="dark"] [class~="hover:border-[#bdc8f8]"]:hover { border-color: #6B85F6 !important; }
        .admin-shell[data-admin-theme="dark"] main table tbody tr:hover { background-color: rgba(107, 133, 246, .12) !important; }

        [data-admin-theme="dark"] input:not([type="checkbox"]):not([type="radio"]),
        [data-admin-theme="dark"] select,
        [data-admin-theme="dark"] textarea { background-color: #111722 !important; border-color: #344054 !important; color: #e9eef8 !important; }
        [data-admin-theme="dark"] input::placeholder { color: #7d889b !important; }
        [data-admin-theme="dark"] option { background-color: #111722; color: #e9eef8; }

        .admin-shell[data-admin-theme="dark"] main table thead { background-color: #1b2230 !important; }
        .admin-shell[data-admin-theme="dark"] main table tbody td { color: #aeb8c9; }

        [data-admin-theme="dark"] svg line[stroke="#e6e9f0"] { stroke: #2a3343; }
        [data-admin-theme="dark"] svg circle[fill="#ffffff"] { fill: #171d28; }
        [data-admin-theme="dark"] svg text[fill="#8490a3"] { fill: #aeb8c9; }

        [data-admin-theme="dark"] footer { background: #121824 !important; border-color: #2a3343 !important; }
      `}</style>
    </div>
  );
}

function PageHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="border-b border-[#e1e5ed] pb-5">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6B85F6]">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-[-.04em] text-[#182033]">{title}</h1>
      <p className="mt-1 text-sm text-[#6e798b]">{desc}</p>
    </div>
  );
}

function Avatar({ foto, nama }: { foto: string | null | undefined; nama: string }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#64748B]">
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt={nama} className="h-full w-full object-cover" />
      ) : (
        nama.charAt(0)
      )}
    </div>
  );
}

function BarRow({ label, value, max, color = BRAND }: { label: string; value: number; max: number; color?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
        <span className="truncate font-semibold text-[#435064]">{label}</span>
        <span className="font-bold text-[#182033]">{value}</span>
      </div>
      <div className="h-2 bg-[#eef1f8]">
        <div className="h-2" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

type AcademicTrend = AdminDashboardData["akademik"]["trendNilai"][number];
type AcademicAverage = AdminDashboardData["akademik"]["rataRataPerKelas"][number];

function AcademicTrendChart({ items }: { items: AcademicTrend[] }) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-[#748096]">Data tren nilai belum tersedia.</p>;
  }

  const width = 640;
  const height = 250;
  const left = 48;
  const right = 16;
  const top = 16;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maximum = 100;
  const xFor = (index: number) => left + (items.length === 1 ? chartWidth / 2 : (index / (items.length - 1)) * chartWidth);
  const yFor = (value: number) => top + chartHeight - (value / maximum) * chartHeight;
  const points = items.map((item, index) => `${xFor(index)},${yFor(item.nilai ?? 0)}`).join(" ");
  const gridValues = [0, 25, 50, 75, 100];

  return (
    <div className="mt-4 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="block min-w-[560px]" role="img" aria-label="Tren rata-rata nilai akademik sekolah">
        {gridValues.map((value) => (
          <g key={value}>
            <line x1={left} x2={width - right} y1={yFor(value)} y2={yFor(value)} stroke="#e6e9f0" />
            <text x={left - 8} y={yFor(value) + 4} textAnchor="end" fontSize="11" fill="#8490a3">{value}</text>
          </g>
        ))}
        <polyline points={points} fill="none" stroke="#6B85F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {items.map((item, index) => (
          <g key={`${item.tanggal}-${item.judul}`}>
            <circle cx={xFor(index)} cy={yFor(item.nilai ?? 0)} r="3.5" fill="#ffffff" stroke="#6B85F6" strokeWidth="2">
              <title>{`${item.tanggal}: ${item.nilai ?? 0} (${item.judul})`}</title>
            </circle>
            <text x={xFor(index)} y={height - 14} textAnchor="middle" fontSize="10" fill="#8490a3">{item.tanggal.slice(5)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function AcademicBarChart({ items, label }: { items: AcademicAverage[]; label: string }) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-[#748096]">Data nilai per {label} belum tersedia.</p>;
  }

  return (
    <div className="mt-5 space-y-4">
      {items.map((item) => (
        <BarRow key={item.label} label={item.label} value={item.nilai ?? 0} max={100} />
      ))}
    </div>
  );
}

function LearningProgressChart({ items }: { items: [string, number, string][] }) {
  const maximum = Math.max(...items.map(([, value]) => value), 1);
  return (
    <div className="mt-5 space-y-4">
      {items.map(([label, value, color]) => (
        <BarRow key={label} label={label} value={value} max={maximum} color={color} />
      ))}
    </div>
  );
}