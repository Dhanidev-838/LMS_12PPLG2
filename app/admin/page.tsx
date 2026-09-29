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
import { useAdminTheme } from "@/lib/use-admin-theme";

const BRAND = "#6B85F6";

type AccountRole = "SISWA" | "GURU";
type Tab = "DASHBOARD" | "KELAS" | "AKUN" | "LAPORAN" | "PERFORMA";

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

const TABS: { key: Tab; label: string }[] = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "KELAS", label: "Buat Kelas" },
  { key: "AKUN", label: "Daftar Akun" },
  { key: "LAPORAN", label: "Laporan" },
  { key: "PERFORMA", label: "Performa Akademik" },
];

const FIELD_CLASS = "mt-1 w-full rounded-lg border border-[#dfe4ef] bg-white px-3 py-2 text-sm font-normal text-[#182033] outline-none focus:border-[#6B85F6]";
const FIELD_LABEL_CLASS = "block text-xs font-semibold text-[#748096]";

export default function AdminDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useAdminTheme();
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");
  const [accountRole, setAccountRole] = useState<AccountRole>("SISWA");
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
  const [akunMenuPos, setAkunMenuPos] = useState({ top: 0, right: 0 });
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
    if (requestedTab === "SISWA" || requestedTab === "GURU") {
      setAccountRole(requestedTab);
      setActiveTab("AKUN");
    } else if (TABS.some((tab) => tab.key === requestedTab)) {
      setActiveTab(requestedTab as Tab);
    }
  }, []);

  useEffect(() => {
  if (!openAkunMenuId) return;
  const close = () => setOpenAkunMenuId(null);
  window.addEventListener("scroll", close, true);
  window.addEventListener("resize", close);
  window.addEventListener("click", close);
  return () => {
    window.removeEventListener("scroll", close, true);
    window.removeEventListener("resize", close);
    window.removeEventListener("click", close);
  };
}, [openAkunMenuId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-admin-theme", theme);
    return () => document.documentElement.removeAttribute("data-admin-theme");
  }, [theme]);

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
  async function handleDeleteAkun(id: string) {
    if (!(await showConfirm("Hapus akun ini?"))) return;
    const res = await fetch(`/api/akun/${id}`, { method: "DELETE" });
    if (res.ok) loadTabData("AKUN");
  }

  function toggleAkunMenu(id: string, trigger: HTMLElement) {
  const rect = trigger.getBoundingClientRect();
  const menuHeight = 80;
  const openUp = rect.bottom + menuHeight > window.innerHeight;
  setAkunMenuPos({
    top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
    right: window.innerWidth - rect.right,
  });
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

  function openAdminTab(tab: Tab | AccountRole) {
    if (tab === "SISWA" || tab === "GURU") {
      setAccountRole(tab);
      setActiveTab("AKUN");
    } else {
      setActiveTab(tab);
    }
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
            <div className="hidden h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280] sm:flex">
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
            <div className="space-y-5">
              <PageHeader
                eyebrow="Analitik LMS"
                title="Performa Akademik & Data"
                desc="Pantau nilai, aktivitas pembelajaran, dan pengguna aktif berdasarkan data nyata sistem."
                action={<span className="border border-[#dfe4ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#536076]">Aktivitas 14 hari terakhir</span>}
              />

              <section className="grid gap-3 lg:grid-cols-[.7fr_1.3fr]">
                <div className="flex flex-col justify-between gap-8 border border-[#6B85F6] bg-white p-6">
                  <p className="text-xs font-semibold text-[#748096]">Rata-rata nilai</p>
                  <div>
                    <p className="text-5xl font-bold tracking-[-.06em] text-[#182033]">{dashboardData.statistik.rataRataNilai}</p>
                    <p className="mt-1 text-xs text-[#6f7b8d]">Nilai asesmen dinilai</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Asesmen dinilai", dashboardData.statistik.submissionDinilai, "Submission dengan nilai"],
                    ["Tugas dibuat", dashboardData.statistik.tugasDibuat, "Total tugas guru"],
                    ["Tugas dikumpulkan", dashboardData.statistik.tugasDikumpulkan, "Submission siswa"],
                  ].map(([label, value, caption]) => (
                    <div key={label as string} className="flex flex-col justify-between gap-8 border border-[#e1e5ed] bg-white p-4">
                      <p className="text-xs font-semibold text-[#748096]">{label}</p>
                      <div>
                        <p className="text-3xl font-bold tracking-[-.055em] text-[#182033]">{value}</p>
                        <p className="mt-1 text-xs text-[#6f7b8d]">{caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border border-[#e1e5ed] bg-white">
                <div className="grid grid-cols-2 divide-x divide-y divide-[#edf0f5] border-b border-[#edf0f5] lg:grid-cols-4 lg:divide-y-0">
                  {[
                    ["User aktif 14 hari", dashboardData.aktivitas.userAktif, "User dengan aktivitas nyata"],
                    ["Siswa aktif", dashboardData.aktivitas.siswaAktif, "Mengerjakan atau mengumpulkan"],
                    ["Guru aktif", dashboardData.aktivitas.guruAktif, "Membuat asesmen atau tugas"],
                    ["Total user", dashboardData.statistik.siswa + dashboardData.statistik.guru, "Siswa dan guru terdaftar"],
                  ].map(([label, value, caption]) => (
                    <div key={label as string} className="p-4 sm:p-5">
                      <p className="text-xs font-semibold text-[#748096]">{label}</p>
                      <p className="mt-3 text-2xl font-bold tracking-[-.05em] text-[#182033]">{value}</p>
                      <p className="mt-1 text-xs leading-5 text-[#6f7b8d]">{caption}</p>
                    </div>
                  ))}
                </div>
                <div className="p-5">
                  <h2 className="text-sm font-bold text-[#182033]">User aktif per hari</h2>
                  <p className="mt-1 text-xs text-[#748096]">Jumlah user yang melakukan aktivitas nyata setiap hari.</p>
                  <ActiveUsersLineChart items={dashboardData.aktivitas.aktivitasHarian} />
                </div>
              </section>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-3">
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

                <section className="border border-[#e1e5ed] bg-white p-5">
                  <h2 className="text-sm font-bold text-[#182033]">Distribusi data</h2>
                  <p className="mt-1 text-xs text-[#748096]">Perbandingan data utama yang tersimpan di sistem.</p>
                  <div className="mt-5 space-y-4">
                    {(() => {
                      const s = dashboardData.statistik;
                      const max = Math.max(s.siswa, s.guru, s.kelas, s.asesmen, s.tugas, 1);
                      return (
                        <>
                          <BarRow label="Siswa" value={s.siswa} max={max} />
                          <BarRow label="Guru" value={s.guru} max={max} />
                          <BarRow label="Kelas" value={s.kelas} max={max} />
                          <BarRow label="Asesmen" value={s.asesmen} max={max} />
                          <BarRow label="Tugas" value={s.tugas} max={max} />
                        </>
                      );
                    })()}
                  </div>
                </section>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
                <section className="border border-[#e1e5ed] bg-white">
                  <div className="border-b border-[#edf0f5] px-5 py-4">
                    <h2 className="text-sm font-bold text-[#182033]">Rincian data sistem</h2>
                  </div>
                  <div className="divide-y divide-[#edf0f5]">
                    {[
                      ["Mata pelajaran", dashboardData.statistik.mapel, "Mapel tersedia"],
                      ["Kuis", dashboardData.statistik.kuis, "Asesmen tipe kuis"],
                      ["Ujian online", dashboardData.statistik.ujian, "Asesmen tipe ujian"],
                      ["Submission dinilai", dashboardData.statistik.submissionDinilai, "Memiliki nilai akhir"],
                      ["Tugas dikumpulkan", dashboardData.statistik.tugasDikumpulkan, "Status submission sudah"],
                    ].map(([label, value, detail]) => (
                      <div key={label as string} className="flex items-center justify-between gap-4 px-5 py-3">
                        <div>
                          <p className="text-sm font-semibold text-[#182033]">{label}</p>
                          <p className="text-xs text-[#748096]">{detail}</p>
                        </div>
                        <span className="text-lg font-bold tracking-[-.04em] text-[#182033]">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border border-[#e1e5ed] bg-[#f7f8fd] p-5">
                  <h2 className="text-sm font-bold text-[#182033]">Definisi user aktif</h2>
                  <p className="mt-3 text-sm leading-6 text-[#697589]">
                    User aktif bukan dihitung dari login karena sistem belum menyimpan log login. Angka ini menghitung siswa yang mengerjakan asesmen atau mengumpulkan tugas, serta guru yang membuat asesmen atau tugas dalam 14 hari terakhir.
                  </p>
                  <dl className="mt-4 space-y-3 border-t border-[#e5e8ef] pt-4 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-[#748096]">Periode</dt>
                      <dd className="mt-0.5 font-semibold text-[#182033]">14 hari terakhir</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-[#748096]">Sumber</dt>
                      <dd className="mt-0.5 font-semibold text-[#182033]">Asesmen, tugas, submission asesmen, dan submission tugas</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </div>
          )}

          {!loading && activeTab === "KELAS" && (
            <div className="space-y-5">
              <PageHeader
                eyebrow="Manajemen kelas"
                title="Kelas pembelajaran"
                desc="Buat dan atur ruang belajar untuk setiap kelompok."
                action={<Button onClick={openBuatKelas}>Buat Kelas</Button>}
              />
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

          {!loading && activeTab === "AKUN" && (
            <div className="space-y-4">
              <PageHeader
                eyebrow="Manajemen akun"
                title="Daftar Akun"
                desc="Kelola akun siswa dan guru dari satu tempat."
                action={<Button size="sm" onClick={() => openBuatAkun(accountRole)}>{accountRole === "SISWA" ? "+ Tambah Siswa" : "+ Tambah Guru"}</Button>}
              />
              <div className="inline-flex rounded-lg border border-[#dfe4ef] bg-white p-1" role="group" aria-label="Pilih jenis akun">
                {(["SISWA", "GURU"] as AccountRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={accountRole === role}
                    onClick={() => {
                      setAccountRole(role);
                      setOpenAkunMenuId(null);
                    }}
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
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="border-b border-[#e1e5ed] text-xs text-[#748096]"><tr>
                      <th className="pb-3 font-semibold">No</th><th className="pb-3 font-semibold">Profil</th><th className="pb-3 font-semibold">Nama</th><th className="pb-3 font-semibold">Email</th><th className="pb-3 font-semibold">NIS</th><th className="pb-3 font-semibold">Status Siswa</th><th className="pb-3 font-semibold">Kelas/Rombel</th><th className="pb-3 font-semibold">Jurusan</th><th className="pb-3 text-right font-semibold">Aksi</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#edf0f5]">{filteredSiswaList.map((s, index) => (
                      <tr key={s.id} onClick={() => router.push(`/profil/${s.id}`)} className="cursor-pointer hover:bg-[#6B85F6]/10">
                        <td className="py-3 text-xs text-[#748096]">{index + 1}</td>
                        <td className="py-3"><Avatar foto={s.fotoProfil} nama={s.nama} /></td>
                        <td className="py-3 font-semibold text-[#111827]">{s.nama}</td><td className="py-3 text-xs text-[#748096]">{s.email}</td><td className="py-3 text-xs text-[#748096]">{s.nis ?? "-"}</td>
                        <td className="py-3"><Badge tone="green">Aktif</Badge></td>
                        <td
                          className="py-3 text-xs text-[#748096]"
                          title={s.kelasSiswa?.map((item) => item.kelas.judul).join(", ") || "Belum ada kelas"}
                        >
                          {s.kelasSiswa?.length ?? 0} Kelas
                        </td>
                        <td className="py-3 text-xs text-[#748096]">{s.kelasReferensi?.label ?? "-"}</td>
                        <td className="relative whitespace-nowrap py-3 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); toggleAkunMenu(s.id, event.currentTarget); }} aria-label="Menu aksi" className="rounded-lg p-2 text-lg font-bold text-[#748096] hover:bg-[#6B85F6]/10">⋮</button>{openAkunMenuId === s.id && <div style={{ top: akunMenuPos.top, right: akunMenuPos.right }} className="fixed z-50 w-28 overflow-hidden rounded-lg border border-[#dfe4ef] bg-white py-1 text-left shadow-md"><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); openEditAkun(s); }} className="block w-full px-3 py-2 text-xs hover:bg-[#6B85F6]/10">Edit</button><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); void handleDeleteAkun(s.id); }} className="block w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50">Hapus</button></div>}</td>
                      </tr>
                    ))}</tbody>
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
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-[#e1e5ed] text-xs text-[#748096]"><tr>
                      <th className="pb-3 font-semibold">No</th><th className="pb-3 font-semibold">Profil</th><th className="pb-3 font-semibold">Nama</th><th className="pb-3 font-semibold">Email</th><th className="pb-3 font-semibold">NIK</th><th className="pb-3 font-semibold">Status Guru</th><th className="pb-3 font-semibold">Mapel</th><th className="pb-3 text-right font-semibold">Aksi</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#edf0f5]">{filteredGuruList.map((g, index) => (
                      <tr key={g.id} onClick={() => router.push(`/profil/${g.id}`)} className="cursor-pointer hover:bg-[#6B85F6]/10">
                        <td className="py-3 text-xs text-[#748096]">{index + 1}</td>
                        <td className="py-3"><Avatar foto={g.fotoProfil} nama={g.nama} /></td>
                        <td className="py-3 font-semibold text-[#111827]">{g.nama}</td><td className="py-3 text-xs text-[#748096]">{g.email}</td><td className="py-3 text-xs text-[#748096]">{g.nik ?? "-"}</td>
                        <td className="py-3"><Badge tone="green">Aktif</Badge></td>
                        <td className="py-3 text-xs text-[#748096]">{Array.from(new Set(g.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [])).join(", ") || "Belum ada mapel"}</td>
                        <td className="relative whitespace-nowrap py-3 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); toggleAkunMenu(g.id, event.currentTarget); }} aria-label="Menu aksi" className="rounded-lg p-2 text-lg font-bold text-[#748096] hover:bg-[#6B85F6]/10">⋮</button>{openAkunMenuId === g.id && <div style={{ top: akunMenuPos.top, right: akunMenuPos.right }} className="fixed z-50 w-28 overflow-hidden rounded-lg border border-[#dfe4ef] bg-white py-1 text-left shadow-md"><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); openEditAkun(g); }} className="block w-full px-3 py-2 text-xs hover:bg-[#6B85F6]/10">Edit</button><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); void handleDeleteAkun(g.id); }} className="block w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50">Hapus</button></div>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "LAPORAN" && (
            <div className="space-y-3">
              <PageHeader
                eyebrow="Tindak lanjut"
                title="Laporan password"
                desc="Tinjau laporan dan proses permintaan perubahan password."
              />
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
        onSuccess={() => loadTabData("AKUN")}
        mode={akunMode}
        defaultRole={akunDefaultRole}
        initialData={editingAkun}
      />
      <style jsx global>{`
  /* ---------- Light: sisa aturan lama ---------- */
  .admin-shell main .rounded-2xl { border-radius: 12px; }
  .admin-shell main .shadow-sm { box-shadow: none; }
  .admin-shell main table thead { background: #f8f9fc; }
  .admin-shell main table th { padding: 12px 10px; }
  .admin-shell main table td { padding-left: 10px; padding-right: 10px; }
  .admin-shell main input:focus,
  .admin-shell main select:focus { box-shadow: 0 0 0 3px rgba(107, 133, 246, .12); }

  /* ---------- Dark ---------- */
  [data-admin-theme="dark"] { color-scheme: dark; }
  .admin-shell[data-admin-theme="dark"] { background: #10141d !important; color: #eef2f8; }

  /* Permukaan */
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
  [data-admin-theme="dark"] [class~="bg-slate-100"] { background-color: #1b2230 !important; }
  [data-admin-theme="dark"] [class~="bg-[#eef1f8]"] { background-color: #232c3d !important; }
  [data-admin-theme="dark"] [class~="bg-[#E5E7EB]"] { background-color: #2a3343 !important; }

  /* Border (border brand #6B85F6 tetap dipertahankan) */
  [data-admin-theme="dark"] header,
  [data-admin-theme="dark"] .border:not([class~="border-[#6B85F6]"]),
  [data-admin-theme="dark"] [class~="border-[#e1e5ed]"],
  [data-admin-theme="dark"] [class~="border-[#dfe4ef]"],
  [data-admin-theme="dark"] [class~="border-[#e6e9f0]"],
  [data-admin-theme="dark"] [class~="border-[#edf0f5]"],
  [data-admin-theme="dark"] [class~="border-[#e5e8ef]"],
  [data-admin-theme="dark"] [class~="border-[#E2E8F0]"],
  [data-admin-theme="dark"] [class~="border-[#F1F5F9]"] { border-color: #2a3343 !important; }
  [data-admin-theme="dark"] .divide-y > :not([hidden]) ~ :not([hidden]),
  [data-admin-theme="dark"] .divide-x > :not([hidden]) ~ :not([hidden]) { border-color: #2a3343 !important; }

  /* Teks utama */
  [data-admin-theme="dark"] :is(
    [class*="text-[#111827]" i], [class*="text-[#182033]" i], [class*="text-[#0F172A]" i],
    [class*="text-[#1E293B]" i], [class*="text-[#1F2937]" i], [class*="text-[#334155]" i],
    [class*="text-[#374151]" i], [class*="text-black"],
    [class~="text-gray-900"], [class~="text-gray-800"], [class~="text-gray-700"],
    [class~="text-slate-900"], [class~="text-slate-800"], [class~="text-slate-700"]
  ) { color: #f3f6fb !important; }

  /* Teks sekunder */
  [data-admin-theme="dark"] :is(
    [class*="text-[#64748B]" i], [class*="text-[#6B7280]" i], [class*="text-[#94A3B8]" i],
    [class*="text-[#9CA3AF]" i], [class*="text-[#475569]" i], [class*="text-[#4B5563]" i],
    [class*="text-[#748096]" i], [class*="text-[#707b8d]" i], [class*="text-[#435064]" i],
    [class*="text-[#6e798b]" i], [class*="text-[#6f7b8d]" i], [class*="text-[#697589]" i],
    [class*="text-[#536076]" i], [class*="text-[#4f5b70]" i], [class*="text-[#576277]" i],
    [class*="text-[#8490a3]" i], [class*="text-[#8290a3]" i],
    [class~="text-gray-600"], [class~="text-gray-500"], [class~="text-gray-400"],
    [class~="text-slate-600"], [class~="text-slate-500"], [class~="text-slate-400"]
  ) { color: #aeb8c9 !important; }

  /* Hover: selalu ungu transparan, teks tidak berubah */
  [data-admin-theme="dark"] [class*="hover:bg-"]:hover:not([class~="hover:bg-[#5974ed]"]):not([class~="hover:bg-red-50"]) { background-color: rgba(107, 133, 246, .14) !important; }
  [data-admin-theme="dark"] [class~="hover:bg-red-50"]:hover { background-color: rgba(239, 68, 68, .14) !important; }
  [data-admin-theme="dark"] [class~="hover:border-[#bdc8f8]"]:hover { border-color: #6B85F6 !important; }
  [data-admin-theme="dark"] .admin-shell main table tbody tr:hover,
  .admin-shell[data-admin-theme="dark"] main table tbody tr:hover { background-color: rgba(107, 133, 246, .12) !important; }

  /* Form */
  [data-admin-theme="dark"] input:not([type="checkbox"]):not([type="radio"]):not([type="file"]),
  [data-admin-theme="dark"] select,
  [data-admin-theme="dark"] textarea { background-color: #111722 !important; border-color: #344054 !important; color: #e9eef8 !important; }
  [data-admin-theme="dark"] input::placeholder,
  [data-admin-theme="dark"] textarea::placeholder { color: #7d889b !important; }
  [data-admin-theme="dark"] option { background-color: #111722; color: #e9eef8; }

  /* Tabel */
  .admin-shell[data-admin-theme="dark"] main table thead { background-color: #1b2230 !important; }
  .admin-shell[data-admin-theme="dark"] main table tbody td { color: #aeb8c9; }

  /* Grafik SVG */
  [data-admin-theme="dark"] svg line[stroke="#e6e9f0"] { stroke: #2a3343; }
  [data-admin-theme="dark"] svg circle[fill="#ffffff"] { fill: #171d28; }
  [data-admin-theme="dark"] svg text[fill="#8490a3"] { fill: #aeb8c9; }

  /* Kotak peringatan (modal hapus) */
  [data-admin-theme="dark"] [class~="bg-red-50"] { background-color: rgba(239, 68, 68, .12) !important; }
  [data-admin-theme="dark"] [class~="border-red-100"] { border-color: rgba(239, 68, 68, .35) !important; }
  [data-admin-theme="dark"] :is([class~="text-red-700"], [class~="text-red-600"]) { color: #fca5a5 !important; }

  [data-admin-theme="dark"] footer { background: #121824 !important; border-color: #2a3343 !important; }
`}</style>
    </div>
  );
}

function PageHeader({ eyebrow, title, desc, action }: { eyebrow: string; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e1e5ed] pb-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6B85F6]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-.04em] text-[#182033]">{title}</h1>
        <p className="mt-1 text-sm text-[#6e798b]">{desc}</p>
      </div>
      {action}
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
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-[#435064]">{label}</span>
        <span className="font-bold text-[#182033]">{value}</span>
      </div>
      <div className="h-2 bg-[#eef1f8]">
        <div className="h-2" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

type ActivityDay = AdminDashboardData["aktivitas"]["aktivitasHarian"][number];

function ActiveUsersLineChart({ items }: { items: ActivityDay[] }) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-[#748096]">Data user aktif belum tersedia.</p>;
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
            <line x1={left} x2={width - right} y1={yFor(value)} y2={yFor(value)} stroke="#e6e9f0" />
            <text x={left - 8} y={yFor(value) + 4} textAnchor="end" fontSize="11" fill="#8490a3">{value}</text>
          </g>
        ))}
        <polyline points={points} fill="none" stroke="#6B85F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {items.map((item, index) => (
          <g key={item.tanggal}>
            <circle cx={xFor(index)} cy={yFor(item.userAktif)} r="3.5" fill="#ffffff" stroke="#6B85F6" strokeWidth="2">
              <title>{`${item.tanggal}: ${item.userAktif} user aktif`}</title>
            </circle>
            <text x={xFor(index)} y={height - 14} textAnchor="middle" fontSize="10" fill="#8490a3">{item.tanggal.slice(5)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}