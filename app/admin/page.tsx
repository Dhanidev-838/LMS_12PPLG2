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
    setSidebarOpen((v) => !v);
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
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]" style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 flex-shrink-0">
                <Image src="/Logo1.png" alt="Logo Classify" fill sizes="32px" className="rounded-full object-contain" />
              </div>
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Classify
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          />
        )}

        <aside
          aria-label="Navigasi admin"
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-[#F9FAFB] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex min-h-full flex-col border-r border-black/5 bg-white p-4 shadow-sm">
            <p className="mb-3 px-2 pt-2 text-sm font-bold text-[#111827]">
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
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition-colors"
                  style={
                    activeTab === tab.key
                      ? { background: `${BRAND}1A`, color: BRAND }
                      : { background: "transparent", color: "#374151" }
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

        <main className="min-w-0 flex-1">
          {loading && <p className="text-sm text-[#9CA3AF]">Memuat...</p>}

          {!loading && activeTab === "DASHBOARD" && dashboardData && (
            <div className="space-y-6">
              <div className="rounded-2xl p-6 text-white shadow-sm" style={{ background: BRAND }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Dashboard Admin</p>
                <h1 className="mt-2 text-2xl font-bold">Selamat Datang, {me?.nama ?? "Admin"}</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/85">Kelola akun, kelas, dan aktivitas pembelajaran Classify dari satu tempat.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Kelas", dashboardData.statistik.kelas, "Kelola kelas", "KELAS"],
                  ["Siswa", dashboardData.statistik.siswa, "Daftar siswa", "SISWA"],
                  ["Guru", dashboardData.statistik.guru, "Daftar guru", "GURU"],
                  ["Asesmen", dashboardData.statistik.asesmen, "Kuis dan ujian", "KELAS"],
                  ["Tugas", dashboardData.statistik.tugas, "Tugas dibuat", "KELAS"],
                  ["Mata Pelajaran", dashboardData.statistik.mapel, "Mapel tersedia", "GURU"],
                  ["Laporan Pending", dashboardData.statistik.laporanPending, "Perlu ditinjau", "LAPORAN"],
                  ["Rata-rata Nilai", dashboardData.statistik.rataRataNilai, "Dari asesmen dinilai", "PERFORMA"],
                ].map(([label, value, caption, tab]) => (
                  <button key={label as string} type="button" onClick={() => openAdminTab(tab as Tab)} className="rounded-2xl border border-black/5 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-[#111827]">{value}</p>
                    <p className="mt-1 text-xs text-[#64748B]">{caption}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-[#111827]">Akun Terbaru</h2><p className="mt-1 text-xs text-[#64748B]">Lima akun siswa dan guru terakhir dibuat.</p></div><Button size="sm" variant="outline" onClick={() => openAdminTab("SISWA")}>Kelola Akun</Button></div>
                <div className="mt-4 divide-y divide-[#F1F5F9]">{dashboardData.akunTerbaru.length === 0 ? <p className="text-sm text-[#94A3B8]">Belum ada akun.</p> : dashboardData.akunTerbaru.map((akun) => <button key={akun.id} type="button" onClick={() => router.push(`/profil/${akun.id}`)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-[#F8FAFC]"><span><span className="block text-sm font-semibold text-[#111827]">{akun.nama}</span><span className="block text-xs text-[#64748B]">{akun.email}</span></span><span className="text-right"><Badge tone={akun.role === "GURU" ? "brand" : "gray"}>{akun.role === "GURU" ? "Guru" : "Siswa"}</Badge><span className="mt-1 block text-[11px] text-[#94A3B8]">{new Date(akun.createdAt).toLocaleDateString("id-ID")}</span></span></button>)}</div>
              </div>
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
            <div>
              <div className="mb-4 flex justify-end">
                <Button onClick={openBuatKelas}>Buat Kelas</Button>
              </div>

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
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
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
                      <tr key={s.id} onClick={() => router.push(`/profil/${s.id}`)} className="cursor-pointer hover:bg-[#F8FAFC]">
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
                        <td className="relative whitespace-nowrap py-3 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); toggleAkunMenu(s.id); }} className="rounded-lg p-2 text-lg font-bold text-[#64748B] hover:bg-[#F1F5F9]">⋮</button>{openAkunMenuId === s.id && <div className="absolute right-2 top-11 z-20 w-28 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-1 text-left shadow-lg"><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); openEditAkun(s); }} className="block w-full px-3 py-2 text-xs hover:bg-[#F8FAFC]">Edit</button><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); void handleDeleteAkun(s.id, "SISWA"); }} className="block w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50">Hapus</button></div>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "GURU" && (
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
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
            <div className="space-y-3">
              {laporanList.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Tidak ada laporan lupa password saat ini.</p>
              ) : (
                laporanList.map((l) => <LaporanCard key={l.id} data={l} onUpdated={() => loadTabData("LAPORAN")} />)
              )}
            </div>
          )}
        </main>
      </div>

      <footer className="py-10 text-white" style={{ background: BRAND }}>
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold">Classify</p>
            <p className="mt-2 text-sm">Belajar Lebih Mudah, Mengajar Lebih Terarah.</p>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/80">
              Platform Learning Management System yang mendukung proses belajar mengajar
              secara modern, efektif, dan terintegrasi.
            </p>
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