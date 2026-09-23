"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import KelasCard, { KelasData } from "@/components/KelasCard";
import ModalKelas from "@/components/ModalKelas";
import { AkunData } from "@/components/AkunCard";
import ModalAkun from "@/components/ModalAkun";
import LaporanCard, { LaporanData } from "@/components/LaporanCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { showConfirm } from "@/lib/dialog";

const BRAND = "#6B85F6";

type Tab = "DASHBOARD" | "KELAS" | "SISWA" | "GURU" | "LAPORAN" | "PERFORMA";

interface AdminDashboardData {
  statistik: { kelas: number; siswa: number; guru: number; asesmen: number; tugas: number; mapel: number; laporanPending: number; kuis: number; ujian: number; rataRataNilai: number; submissionDinilai: number; tugasDibuat: number; tugasDikumpulkan: number };
  akunTerbaru: { id: string; nama: string; email: string; role: "SISWA" | "GURU"; createdAt: string }[];
  aktivitas: { periodeHari: number; userAktif: number; siswaAktif: number; guruAktif: number; aktivitasHarian: { tanggal: string; asesmen: number; tugas: number; submission: number; userAktif: number }[] };
}

function normalizeDashboardData(data: (Omit<AdminDashboardData, "aktivitas"> & { aktivitas?: AdminDashboardData["aktivitas"] }) | null | undefined): AdminDashboardData | null {
  if (!data) return null;
  return {
    ...data,
    aktivitas: data.aktivitas ?? {
      periodeHari: 14,
      userAktif: 0,
      siswaAktif: 0,
      guruAktif: 0,
      aktivitasHarian: [],
    },
  };
}

function TabIcon({ tab }: { tab: Tab }) {
  const paths: Record<Tab, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    SISWA: <path d="M12 3 2 8l10 5 8-4v6M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />,
    GURU: <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 8h7 M9 12h7 M9 16h4" />,
    LAPORAN: <path d="M6 2h9l5 5v15H6V2Zm9 0v5h5M9 13h6M9 17h4" />,
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
  { key: "KELAS", label: "Buat Kelas" },
  { key: "SISWA", label: "Daftar Siswa" },
  { key: "GURU", label: "Daftar Guru" },
  { key: "LAPORAN", label: "Laporan" },
  { key: "PERFORMA", label: "Performa Akademik" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");
  const [me, setMe] = useState<{ nama: string; role: string; fotoProfil: string | null } | null>(null);

  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [siswaList, setSiswaList] = useState<AkunData[]>([]);
  const [guruList, setGuruList] = useState<AkunData[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasReferensiList, setKelasReferensiList] = useState<{ label: string; jenjang: string; tingkat: number | null; jurusan: { nama: string } | null }[]>([]);
  const [laporanList, setLaporanList] = useState<LaporanData[]>([]);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const [openAkunMenuId, setOpenAkunMenuId] = useState<string | null>(null);
  const [jurusanFilter, setJurusanFilter] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [siswaSearch, setSiswaSearch] = useState("");
  const [mapelFilter, setMapelFilter] = useState("");
  const [guruSearch, setGuruSearch] = useState("");

  const [showModalKelas, setShowModalKelas] = useState(false);
  const [editingKelas, setEditingKelas] = useState<KelasData | null>(null);
  const [deletingKelas, setDeletingKelas] = useState<KelasData | null>(null);

  const [showModalAkun, setShowModalAkun] = useState(false);
  const [akunMode, setAkunMode] = useState<"create" | "edit">("create");
  const [akunDefaultRole, setAkunDefaultRole] = useState<"SISWA" | "GURU">("SISWA");
  const [editingAkun, setEditingAkun] = useState<any>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some((tab) => tab.key === requestedTab)) setActiveTab(requestedTab as Tab);
  }, []);

  useEffect(() => {
    loadTabData(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadTabData(tab: Tab) {
    setLoading(true);
    try {
      if (tab === "DASHBOARD") {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        setDashboardData(normalizeDashboardData(data.data));
      } else if (tab === "KELAS") {
        const res = await fetch("/api/kelas");
        const data = await res.json();
        setKelasList(data.data ?? []);
      } else if (tab === "SISWA") {
        const [res, referensiRes] = await Promise.all([fetch("/api/akun?role=SISWA"), fetch("/api/kelas-referensi")]);
        const [data, referensiData] = await Promise.all([res.json(), referensiRes.json()]);
        setSiswaList(data.data ?? []);
        setKelasReferensiList(referensiData.data ?? []);
      } else if (tab === "GURU") {
        const [res, mapelRes] = await Promise.all([fetch("/api/akun?role=GURU"), fetch("/api/mapel")]);
        const [data, mapelData] = await Promise.all([res.json(), mapelRes.json()]);
        setGuruList(data.data ?? []);
        setMapelList(data.data ? mapelData.data ?? [] : []);
      } else if (tab === "LAPORAN") {
        const res = await fetch("/api/lupa-password");
        const data = await res.json();
        setLaporanList(data.data ?? []);
      } else if (tab === "PERFORMA") {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        setDashboardData(normalizeDashboardData(data.data));
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
    setSidebarOpen((value) => !value);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function openBuatKelas() {
    setEditingKelas(null);
    setShowModalKelas(true);
  }
  function openEditKelas(kelas: KelasData) {
    setEditingKelas(kelas);
    setShowModalKelas(true);
  }
  async function handleDeleteKelas() {
    if (!deletingKelas) return;
    const res = await fetch(`/api/kelas/${deletingKelas.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeletingKelas(null);
      loadTabData("KELAS");
    }
  }

  function openBuatAkun(role: "SISWA" | "GURU") {
    setAkunMode("create");
    setAkunDefaultRole(role);
    setEditingAkun(null);
    setShowModalAkun(true);
  }
  function openEditAkun(akun: AkunData) {
    setAkunMode("edit");
    setAkunDefaultRole(akun.role);

    const a = akun as any;
    setEditingAkun({
      id: akun.id,
      role: akun.role,
      email: akun.email,
      nama: akun.nama,
      nis: akun.nis,
      nik: akun.nik,
      deskripsi: akun.deskripsi,
      fotoProfil: akun.fotoProfil,
      tanggalLahir: a.tanggalLahir,
      jenisKelamin: a.jenisKelamin,
      kelasReferensiId: a.kelasReferensi?.id,
      mapelId: a.kelasGuruMapel?.[0]?.mapel?.id,
      kelasIds:
        akun.role === "SISWA"
          ? (a.kelasSiswa ?? []).map((ks: any) => ks.kelas.id)
          : (a.kelasGuruMapel ?? []).map((kg: any) => kg.kelas.id),
      // walasKelasId dihapus -- fitur walas gak ada lagi
    });
    setShowModalAkun(true);
  }
  async function handleDeleteAkun(id: string, tab: "SISWA" | "GURU") {
    if (!(await showConfirm("Hapus akun ini?"))) return;
    const res = await fetch(`/api/akun/${id}`, { method: "DELETE" });
    if (res.ok) loadTabData(tab);
  }

  function toggleAkunMenu(id: string) {
    setOpenAkunMenuId((current) => (current === id ? null : id));
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

  function openAdminTab(tab: Tab) {
    setActiveTab(tab);
    setSidebarOpen(false);
  }

  return (
    <div data-admin-theme={theme} className="admin-shell flex min-h-screen flex-col bg-[#f6f7fb]" style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <header className="sticky top-0 z-40 border-b border-[#e6e9f0] bg-white">
        <div className="flex h-[68px] items-center justify-between px-4 sm:px-6 lg:px-8">
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
            <div className="flex items-center gap-2">
              <Image src="/Logo1.png" alt="Logo Classify" width={32} height={32} className="rounded-[9px] object-contain" />
              <span className="text-[17px] font-bold tracking-[-.04em]">Classify</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setTheme((value) => value === "light" ? "dark" : "light")} aria-label={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"} title={theme === "light" ? "Mode gelap" : "Mode terang"} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#dfe4ef] text-[#576277] transition-colors hover:bg-[#f7f8fb]">
              {theme === "light" ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]"><path d="M12 3v2m0 14v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M3 12h2m14 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" /><circle cx="12" cy="12" r="4" /></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]"><path d="M20 15.4A8 8 0 0 1 8.6 4 8 8 0 1 0 20 15.4Z" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
            {me && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[#111827]">{me.nama}</p>
                <p className="text-xs text-[#9CA3AF]">{me.role}</p>
              </div>
            )}
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
              {me?.fotoProfil ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.fotoProfil} alt={me.nama} className="h-full w-full object-cover" />
              ) : (
                me?.nama?.charAt(0) ?? "A"
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden"
          />
        )}

        <aside
          aria-label="Navigasi admin"
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-hidden bg-[#f6f7fb] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:w-0 lg:border-0 lg:p-0" : "lg:w-72"}`}
        >
          <div className="flex min-h-full min-w-64 flex-col border border-[#e1e5ed] bg-white p-4">
            <p className="mb-4 px-2 pt-2 text-sm font-bold text-[#182033]">
              Dashboard Admin
              <br />
              <span style={{ color: BRAND }}>- {TABS.find((t) => t.key === activeTab)?.label}</span>
            </p>
            <nav className="flex flex-col gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSidebarOpen(false);
                  }}
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
          {loading && <p className="text-sm text-[#9CA3AF]">Memuat...</p>}

          {!loading && activeTab === "DASHBOARD" && dashboardData && (
            <div className="space-y-5">
              <section className="grid overflow-hidden border border-[#dfe4ef] bg-white lg:grid-cols-[1.35fr_.65fr]">
                <div className="p-6 sm:p-7"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#6B85F6]">Dashboard Admin</p><h1 className="mt-3 text-2xl font-bold tracking-[-.045em] text-[#182033] sm:text-3xl">Selamat datang, {me?.nama ?? "Admin"}.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#697589]">Kelola data sekolah dan pantau aktivitas pembelajaran dari satu ruang kerja yang terstruktur.</p><div className="mt-6 flex flex-wrap gap-2"><button type="button" onClick={() => openAdminTab("KELAS")} className="rounded-lg bg-[#6B85F6] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#5974ed]">Kelola kelas</button><button type="button" onClick={() => openAdminTab("SISWA")} className="rounded-lg border border-[#dfe4ef] px-3.5 py-2 text-xs font-semibold text-[#536076] hover:bg-[#f8f9fc]">Kelola akun</button></div></div>
                <div className="border-t border-[#e5e8ef] bg-[#f7f8fd] p-6 lg:border-l lg:border-t-0"><p className="text-xs font-semibold text-[#748096]">Menunggu tindak lanjut</p><p className="mt-3 text-4xl font-bold tracking-[-.06em] text-[#182033]">{dashboardData.statistik.laporanPending}</p><p className="mt-1 text-sm leading-5 text-[#707b8d]">Laporan perubahan password perlu ditinjau.</p><button type="button" onClick={() => openAdminTab("LAPORAN")} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#6B85F6]">Buka laporan <span aria-hidden="true">→</span></button></div>
              </section>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Kelas", dashboardData.statistik.kelas, "Kelola kelas", "KELAS"],
                  ["Siswa", dashboardData.statistik.siswa, "Daftar siswa", "SISWA"],
                  ["Guru", dashboardData.statistik.guru, "Daftar guru", "GURU"],
                  ["Asesmen", dashboardData.statistik.asesmen, "Kuis dan ujian", "KELAS"],
                  ["Tugas", dashboardData.statistik.tugas, "Tugas dibuat", "KELAS"],
                  ["Mata Pelajaran", dashboardData.statistik.mapel, "Mapel tersedia", "GURU"],
                  ["Laporan Pending", dashboardData.statistik.laporanPending, "Perlu ditinjau", "LAPORAN"],
                  ["Rata-rata Nilai", dashboardData.statistik.rataRataNilai, "Dari asesmen dinilai", "PERFORMA"],
                ].map(([label, value, caption, tab], index) => (
                  <button key={label as string} type="button" onClick={() => openAdminTab(tab as Tab)} className={`group border p-4 text-left transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff] ${index === 0 ? "border-[#6B85F6] bg-white" : "border-[#e1e5ed] bg-white"}`}>
                    <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.1em] text-[#8490a3]">{label}</p><span className="text-xs font-bold text-[#6B85F6] group-hover:translate-x-0.5">↗</span></div>
                    <p className="mt-5 text-3xl font-bold tracking-[-.055em] text-[#182033]">{value}</p>
                    <p className="mt-1 text-xs text-[#6f7b8d]">{caption}</p>
                  </button>
                ))}
              </div>

              <section className="border border-[#e1e5ed] bg-white"><div className="flex items-center justify-between gap-3 border-b border-[#edf0f5] px-5 py-4"><div><h2 className="text-sm font-bold text-[#182033]">Akun terbaru</h2><p className="mt-1 text-xs text-[#748096]">Lima akun siswa dan guru terakhir dibuat.</p></div><Button size="sm" variant="outline" onClick={() => openAdminTab("SISWA")}>Kelola Akun</Button></div><div className="divide-y divide-[#edf0f5]">{dashboardData.akunTerbaru.length === 0 ? <p className="p-5 text-sm text-[#94A3B8]">Belum ada akun.</p> : dashboardData.akunTerbaru.map((akun) => <button key={akun.id} type="button" onClick={() => router.push(`/profil/${akun.id}`)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#6B85F6]/10"><span><span className="block text-sm font-semibold text-[#182033]">{akun.nama}</span><span className="mt-0.5 block text-xs text-[#748096]">{akun.email}</span></span><span className="text-right"><Badge tone={akun.role === "GURU" ? "brand" : "gray"}>{akun.role === "GURU" ? "Guru" : "Siswa"}</Badge><span className="mt-1 block text-[11px] text-[#94A3B8]">{new Date(akun.createdAt).toLocaleDateString("id-ID")}</span></span></button>)}</div></section>
            </div>
          )}

          {!loading && activeTab === "PERFORMA" && dashboardData && (
            <div className="space-y-6">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Analitik LMS</p><h1 className="mt-1 text-2xl font-bold text-[#111827]">Performa Akademik & Data</h1><p className="mt-1 text-sm text-[#64748B]">Pantau nilai, aktivitas pembelajaran, dan pengguna aktif berdasarkan data nyata sistem.</p></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[["Rata-rata Nilai", dashboardData.statistik.rataRataNilai, "Nilai asesmen dinilai"], ["Asesmen Dinilai", dashboardData.statistik.submissionDinilai, "Submission dengan nilai"], ["Tugas Dibuat", dashboardData.statistik.tugasDibuat, "Total tugas guru"], ["Tugas Dikumpulkan", dashboardData.statistik.tugasDikumpulkan, "Submission siswa"]].map(([label, value, caption]) => <div key={label as string} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p><p className="mt-2 text-3xl font-bold text-[#111827]">{value}</p><p className="mt-1 text-xs text-[#64748B]">{caption}</p></div>)}
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-[#111827]">Kuis dan Ujian</h2><div className="mt-5 space-y-4">{[["Kuis", dashboardData.statistik.kuis, "#6B85F6"], ["Ujian Online", dashboardData.statistik.ujian, "#8B5CF6"]].map(([label, value, color]) => { const max = Math.max(dashboardData.statistik.kuis, dashboardData.statistik.ujian, 1); return <div key={label as string}><div className="mb-1 flex justify-between text-xs font-semibold text-[#475569]"><span>{label}</span><span>{value}</span></div><div className="h-3 rounded-full bg-[#EEF2FF]"><div className="h-3 rounded-full" style={{ width: `${((value as number) / max) * 100}%`, background: color as string }} /></div></div>; })}</div></div>
                <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-[#111827]">Tugas Dibuat vs Dikumpulkan</h2><div className="mt-5 space-y-4">{[["Tugas dibuat", dashboardData.statistik.tugasDibuat, "#6B85F6"], ["Dikumpulkan siswa", dashboardData.statistik.tugasDikumpulkan, "#16A34A"]].map(([label, value, color]) => { const max = Math.max(dashboardData.statistik.tugasDibuat, dashboardData.statistik.tugasDikumpulkan, 1); return <div key={label as string}><div className="mb-1 flex justify-between text-xs font-semibold text-[#475569]"><span>{label}</span><span>{value}</span></div><div className="h-3 rounded-full bg-[#F1F5F9]"><div className="h-3 rounded-full" style={{ width: `${Math.min(((value as number) / max) * 100, 100)}%`, background: color as string }} /></div></div>; })}</div></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[["User aktif 14 hari", dashboardData.aktivitas.userAktif, "User dengan aktivitas nyata"], ["Siswa aktif", dashboardData.aktivitas.siswaAktif, "Mengerjakan atau mengumpulkan"], ["Guru aktif", dashboardData.aktivitas.guruAktif, "Membuat asesmen atau tugas"], ["Total user", dashboardData.statistik.siswa + dashboardData.statistik.guru, "Siswa dan guru terdaftar"]].map(([label, value, caption]) => <div key={label as string} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p><p className="mt-2 text-3xl font-bold text-[#111827]">{value}</p><p className="mt-1 text-xs text-[#64748B]">{caption}</p></div>)}
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-[#111827]">Grafik Linear User Aktif</h2><p className="mt-1 text-xs text-[#64748B]">Jumlah user yang melakukan aktivitas nyata setiap hari.</p><ActiveUsersLineChart items={dashboardData.aktivitas.aktivitasHarian} /></div>
                <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-[#111827]">Grafik Batang Distribusi Data</h2><p className="mt-1 text-xs text-[#64748B]">Perbandingan data utama yang tersimpan di sistem.</p><div className="mt-5 space-y-3">{[["Siswa", dashboardData.statistik.siswa, "#6B85F6"], ["Guru", dashboardData.statistik.guru, "#8B5CF6"], ["Kelas", dashboardData.statistik.kelas, "#14B8A6"], ["Asesmen", dashboardData.statistik.asesmen, "#F59E0B"], ["Tugas", dashboardData.statistik.tugas, "#F97316"]].map(([label, value, color]) => { const max = Math.max(dashboardData.statistik.siswa, dashboardData.statistik.guru, dashboardData.statistik.kelas, dashboardData.statistik.asesmen, dashboardData.statistik.tugas, 1); return <div key={label as string}><div className="mb-1 flex justify-between text-xs font-semibold text-[#475569]"><span>{label}</span><span>{value}</span></div><div className="h-3 rounded-full bg-[#F1F5F9]"><div className="h-3 rounded-full" style={{ width: `${((value as number) / max) * 100}%`, background: color as string }} /></div></div>; })}</div></div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-[#111827]">Rincian Data Sistem</h2><div className="mt-4 divide-y divide-[#F1F5F9]">{[["Mata pelajaran", dashboardData.statistik.mapel, "Mapel tersedia"], ["Kuis", dashboardData.statistik.kuis, "Asesmen tipe kuis"], ["Ujian online", dashboardData.statistik.ujian, "Asesmen tipe ujian"], ["Submission dinilai", dashboardData.statistik.submissionDinilai, "Memiliki nilai akhir"], ["Tugas dikumpulkan", dashboardData.statistik.tugasDikumpulkan, "Status submission sudah"]].map(([label, value, detail]) => <div key={label as string} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold text-[#334155]">{label}</p><p className="text-xs text-[#94A3B8]">{detail}</p></div><strong className="text-lg text-[#111827]">{value}</strong></div>)}</div></div><div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-[#111827]">Definisi User Aktif</h2><p className="mt-3 text-sm leading-6 text-[#475569]">User aktif bukan dihitung dari login karena sistem belum menyimpan log login. Angka ini menghitung siswa yang mengerjakan asesmen atau mengumpulkan tugas, serta guru yang membuat asesmen atau tugas dalam 14 hari terakhir.</p><div className="mt-4 rounded-xl bg-[#F8FAFC] p-4 text-sm text-[#475569]"><p><strong className="text-[#111827]">Periode:</strong> 14 hari terakhir</p><p className="mt-2"><strong className="text-[#111827]">Sumber:</strong> asesmen, tugas, submission asesmen, dan submission tugas</p></div></div></div>
            </div>
          )}

          {!loading && activeTab === "KELAS" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e1e5ed] pb-5"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#6B85F6]">Manajemen kelas</p><h1 className="mt-2 text-2xl font-bold tracking-[-.04em] text-[#182033]">Kelas pembelajaran</h1><p className="mt-1 text-sm text-[#6e798b]">Buat dan atur ruang belajar untuk setiap kelompok.</p></div><Button onClick={openBuatKelas}>Buat Kelas</Button></div>
              {kelasList.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Belum ada kelas dibuat.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {kelasList.map((k) => (
                    <KelasCard
                      key={k.id}
                      data={k}
                      isEditable
                      basePath="/admin/kelas"
                      onEdit={openEditKelas}
                      onDelete={() => setDeletingKelas(k)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "SISWA" && (
            <div className="border border-[#e1e5ed] bg-white p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#111827]">Daftar Siswa</h2>
                  <p className="mt-1 text-xs text-[#64748B]">Kelola akun dan kelas siswa.</p>
                </div>
                <Button size="sm" onClick={() => openBuatAkun("SISWA")}>+ Buat Akun</Button>
              </div>
              <div className="mb-5 grid gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 md:grid-cols-[180px_220px_minmax(220px,1fr)_auto] md:items-end">
                <label className="block text-xs font-semibold text-[#64748B]">
                  Jurusan
                  <select value={jurusanFilter} onChange={(event) => setJurusanFilter(event.target.value)} className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-normal text-[#334155] outline-none focus:border-[#6B85F6]">
                    <option value="">Semua Jurusan</option>
                    {jurusanOptions.map((jurusan) => <option key={jurusan} value={jurusan}>{jurusan}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-[#64748B]">
                  Kelas
                  <select value={kelasFilter} onChange={(event) => setKelasFilter(event.target.value)} className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-normal text-[#334155] outline-none focus:border-[#6B85F6]">
                    <option value="">Semua Kelas</option>
                    {kelasOptions.map((kelas) => <option key={kelas} value={kelas}>{kelas}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-[#64748B]">
                  Search
                  <input value={siswaSearch} onChange={(event) => setSiswaSearch(event.target.value)} placeholder="Nama, email, atau NIS..." className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-normal text-[#334155] outline-none focus:border-[#6B85F6]" />
                </label>
                <button type="button" onClick={() => { setJurusanFilter(""); setKelasFilter(""); setSiswaSearch(""); }} className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-[#64748B] hover:bg-white hover:text-[#111827]">Reset</button>
              </div>
              {filteredSiswaList.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Belum ada siswa terdaftar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="border-b border-[#E2E8F0] text-xs text-[#94A3B8]"><tr>
                      <th className="pb-3 font-semibold">No</th><th className="pb-3 font-semibold">Profil</th><th className="pb-3 font-semibold">Nama</th><th className="pb-3 font-semibold">Email</th><th className="pb-3 font-semibold">NIS</th><th className="pb-3 font-semibold">Status Siswa</th><th className="pb-3 font-semibold">Kelas/Rombel</th><th className="pb-3 font-semibold">Jurusan</th><th className="pb-3 text-right font-semibold">Aksi</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#F1F5F9]">{filteredSiswaList.map((s, index) => (
                      <tr key={s.id} onClick={() => router.push(`/profil/${s.id}`)} className="cursor-pointer hover:bg-[#6B85F6]/10">
                        <td className="py-3 text-xs text-[#64748B]">{index + 1}</td>
                        <td className="py-3"><div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#64748B]">{s.fotoProfil ? <img src={s.fotoProfil} alt={s.nama} className="h-full w-full object-cover" /> : s.nama.charAt(0)}</div></td>
                        <td className="py-3 font-semibold text-[#111827]">{s.nama}</td><td className="py-3 text-xs text-[#64748B]">{s.email}</td><td className="py-3 text-xs text-[#64748B]">{s.nis ?? "-"}</td>
                        <td className="py-3"><Badge tone="green">Aktif</Badge></td>
                        <td
                          className="py-3 text-xs text-[#64748B]"
                          title={s.kelasSiswa?.map((item) => item.kelas.judul).join(", ") || "Belum ada kelas"}
                        >
                          {s.kelasSiswa?.length ?? 0} Kelas
                        </td>
                        <td className="py-3 text-xs text-[#64748B]">{s.kelasReferensi?.label ?? "-"}</td>
                        <td className="relative whitespace-nowrap py-3 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); toggleAkunMenu(s.id); }} className="rounded-lg p-2 text-lg font-bold text-[#64748B] hover:bg-[#6B85F6]/10">⋮</button>{openAkunMenuId === s.id && <div className="absolute right-2 top-11 z-20 w-28 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-1 text-left shadow-lg"><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); openEditAkun(s); }} className="block w-full px-3 py-2 text-xs hover:bg-[#6B85F6]/10">Edit</button><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); void handleDeleteAkun(s.id, "SISWA"); }} className="block w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50">Hapus</button></div>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "GURU" && (
            <div className="border border-[#e1e5ed] bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-[#111827]">Daftar Guru</h2><p className="mt-1 text-xs text-[#64748B]">Kelola akun guru dan mapel yang diampu.</p></div><Button size="sm" onClick={() => openBuatAkun("GURU")}>+ Tambah Guru</Button></div>
              <div className="mb-5 grid gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 md:grid-cols-[240px_minmax(220px,1fr)_auto] md:items-end">
                <label className="block text-xs font-semibold text-[#64748B]">
                  Mapel
                  <select value={mapelFilter} onChange={(event) => setMapelFilter(event.target.value)} className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-normal text-[#334155] outline-none focus:border-[#6B85F6]">
                    <option value="">Semua Mapel</option>
                    {mapelOptions.map((mapel) => <option key={mapel} value={mapel}>{mapel}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-[#64748B]">
                  Search
                  <input value={guruSearch} onChange={(event) => setGuruSearch(event.target.value)} placeholder="Nama, email, atau NIK..." className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-normal text-[#334155] outline-none focus:border-[#6B85F6]" />
                </label>
                <button type="button" onClick={() => { setMapelFilter(""); setGuruSearch(""); }} className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-[#64748B] hover:bg-white hover:text-[#111827]">Reset</button>
              </div>
              {filteredGuruList.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Belum ada guru terdaftar.</p>
              ) : (
                <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[#E2E8F0] text-xs text-[#94A3B8]"><tr><th className="pb-3 font-semibold">No</th><th className="pb-3 font-semibold">Profil</th><th className="pb-3 font-semibold">Nama</th><th className="pb-3 font-semibold">Email</th><th className="pb-3 font-semibold">NIK</th><th className="pb-3 font-semibold">Status Guru</th><th className="pb-3 font-semibold">Mapel</th><th className="pb-3 text-right font-semibold">Aksi</th></tr></thead><tbody className="divide-y divide-[#F1F5F9]">{filteredGuruList.map((g, index) => (<tr key={g.id} onClick={() => router.push(`/profil/${g.id}`)} className="cursor-pointer hover:bg-[#F8FAFC]"><td className="py-3 text-xs text-[#64748B]">{index + 1}</td><td className="py-3"><div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#64748B]">{g.fotoProfil ? <img src={g.fotoProfil} alt={g.nama} className="h-full w-full object-cover" /> : g.nama.charAt(0)}</div></td><td className="py-3 font-semibold text-[#111827]">{g.nama}</td><td className="py-3 text-xs text-[#64748B]">{g.email}</td><td className="py-3 text-xs text-[#64748B]">{g.nik ?? "-"}</td><td className="py-3"><Badge tone="green">Aktif</Badge></td><td className="py-3 text-xs text-[#64748B]">{Array.from(new Set(g.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [])).join(", ") || "Belum ada mapel"}</td><td className="relative whitespace-nowrap py-3 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); toggleAkunMenu(g.id); }} className="rounded-lg p-2 text-lg font-bold text-[#64748B] hover:bg-[#F1F5F9]">⋮</button>{openAkunMenuId === g.id && <div className="absolute right-2 top-11 z-20 w-28 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-1 text-left shadow-lg"><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); openEditAkun(g); }} className="block w-full px-3 py-2 text-xs hover:bg-[#F8FAFC]">Edit</button><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); void handleDeleteAkun(g.id, "GURU"); }} className="block w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50">Hapus</button></div>}</td></tr>))}</tbody></table></div>
              )}
            </div>
          )}

          {!loading && activeTab === "LAPORAN" && (
            <div className="space-y-3"><div className="border-b border-[#e1e5ed] pb-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#6B85F6]">Tindak lanjut</p><h1 className="mt-2 text-2xl font-bold tracking-[-.04em] text-[#182033]">Laporan password</h1><p className="mt-1 text-sm text-[#6e798b]">Tinjau laporan dan proses permintaan perubahan password.</p></div>
              {laporanList.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Tidak ada laporan lupa password saat ini.</p>
              ) : (
                laporanList.map((l) => <LaporanCard key={l.id} data={l} onUpdated={() => loadTabData("LAPORAN")} />)
              )}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-[#e1e5ed] bg-white px-4 py-5 text-center text-xs text-[#8290a3] sm:px-6">© 2026 Classify. Sistem pembelajaran yang lebih terarah.</footer>

      <ModalKelas
        open={showModalKelas}
        onClose={() => setShowModalKelas(false)}
        onSuccess={() => loadTabData("KELAS")}
        mode={editingKelas ? "edit" : "create"}
        initialData={editingKelas}
      />

      <Modal
        open={Boolean(deletingKelas)}
        onClose={() => setDeletingKelas(null)}
        title="Hapus Kelas"
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-700">Hapus kelas {deletingKelas?.judul}?</p>
            <p className="mt-2 text-sm leading-6 text-red-600">
              Data hubungan siswa dan guru dengan kelas ini akan ikut terlepas. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingKelas(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={() => void handleDeleteKelas()}>
              Hapus Kelas
            </Button>
          </div>
        </div>
      </Modal>

      <ModalAkun
        open={showModalAkun}
        onClose={() => setShowModalAkun(false)}
        onSuccess={() => loadTabData(akunDefaultRole === "SISWA" ? "SISWA" : "GURU")}
        mode={akunMode}
        defaultRole={akunDefaultRole}
        initialData={editingAkun}
      />
      <style jsx global>{`
        .admin-shell main .rounded-2xl { border-radius: 12px; }
        .admin-shell main .shadow-sm { box-shadow: none; }
        .admin-shell main table thead { background: #f8f9fc; }
        .admin-shell main table th { padding: 12px 10px; }
        .admin-shell main table td { padding-left: 10px; padding-right: 10px; }
        .admin-shell main input:focus,
        .admin-shell main select:focus { box-shadow: 0 0 0 3px rgba(107, 133, 246, .12); }
        .admin-shell[data-admin-theme="dark"] { background: #10141d !important; color: #eef2f8; }
        .admin-shell[data-admin-theme="dark"] header,
        .admin-shell[data-admin-theme="dark"] .bg-white { background-color: #171d28 !important; }
        .admin-shell[data-admin-theme="dark"] header,
        .admin-shell[data-admin-theme="dark"] aside > div,
        .admin-shell[data-admin-theme="dark"] .border { border-color: #2a3343 !important; }
        .admin-shell[data-admin-theme="dark"] .bg-\[\#F9FAFB\],
        .admin-shell[data-admin-theme="dark"] .bg-\[\#F8FAFC\],
        .admin-shell[data-admin-theme="dark"] .bg-\[\#f7f8fd\],
        .admin-shell[data-admin-theme="dark"] .bg-\[\#f6f7fb\] { background-color: #10141d !important; }
        .admin-shell[data-admin-theme="dark"] input,
        .admin-shell[data-admin-theme="dark"] select { background-color: #111722 !important; border-color: #344054 !important; color: #e9eef8 !important; }
        .admin-shell[data-admin-theme="dark"] main table thead { background-color: #1b2230 !important; }
        .admin-shell[data-admin-theme="dark"] main table tbody { color: #e9eef8 !important; }
        .admin-shell[data-admin-theme="dark"] main table tbody tr:hover { background-color: rgba(107, 133, 246, .12) !important; }
        .admin-shell[data-admin-theme="dark"] main table tbody td { color: #aeb8c9; }
        .admin-shell[data-admin-theme="dark"] main table tbody td.text-\[\#111827\] { color: #f3f6fb !important; }
        .admin-shell[data-admin-theme="dark"] main table tbody button:hover { background-color: rgba(107, 133, 246, .12) !important; }
        .admin-shell[data-admin-theme="dark"] [class*="text-[#748096]"],
        .admin-shell[data-admin-theme="dark"] [class*="text-[#707b8d]"] { color: #aeb8c9 !important; }
        .admin-shell[data-admin-theme="dark"] [class*="text-[#111827]"],
        .admin-shell[data-admin-theme="dark"] [class*="text-[#182033]"] { color: #f3f6fb !important; }
        .admin-shell[data-admin-theme="dark"] [class*="text-[#64748B]"],
        .admin-shell[data-admin-theme="dark"] [class*="text-[#6B7280]"],
        .admin-shell[data-admin-theme="dark"] [class*="text-[#94A3B8]"] { color: #aeb8c9 !important; }
        .admin-shell[data-admin-theme="dark"] footer { background: #121824 !important; border-color: #2a3343 !important; }
      `}</style>
    </div>
  );
}

type ActivityDay = AdminDashboardData["aktivitas"]["aktivitasHarian"][number];

function ActiveUsersLineChart({ items }: { items: ActivityDay[] }) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-[#94A3B8]">Data user aktif belum tersedia.</p>;
  }

  const width = 640;
  const height = 250;
  const left = 48;
  const right = 16;
  const top = 16;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maximum = Math.max(Math.ceil(Math.max(...items.map((item) => item.userAktif), 0) / 100) * 100, 1000);
  const xFor = (index: number) => left + (items.length === 1 ? chartWidth / 2 : (index / (items.length - 1)) * chartWidth);
  const yFor = (value: number) => top + chartHeight - (value / maximum) * chartHeight;
  const points = items.map((item, index) => `${xFor(index)},${yFor(item.userAktif)}`).join(" ");
  const gridValues = [0, 250, 500, 750, 1000].filter((value) => value <= maximum);

  return (
    <div className="mt-4 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[560px]" role="img" aria-label="Jumlah user aktif per hari">
        {gridValues.map((value) => (
          <g key={value}>
            <line x1={left} x2={width - right} y1={yFor(value)} y2={yFor(value)} stroke="#E2E8F0" strokeDasharray="4 4" />
            <text x={left - 8} y={yFor(value) + 4} textAnchor="end" fontSize="11" fill="#94A3B8">{value}</text>
          </g>
        ))}
        <polyline points={points} fill="none" stroke="#6B85F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {items.map((item, index) => (
          <g key={item.tanggal}>
            <circle cx={xFor(index)} cy={yFor(item.userAktif)} r="4" fill="#ffffff" stroke="#6B85F6" strokeWidth="3">
              <title>{`${item.tanggal}: ${item.userAktif} user aktif`}</title>
            </circle>
            <text x={xFor(index)} y={height - 14} textAnchor="middle" fontSize="10" fill="#94A3B8">{item.tanggal.slice(5)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
