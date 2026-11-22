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
import { showAlert, showConfirm } from "@/lib/dialog";
import { useAdminTheme } from "@/lib/use-admin-theme";
import ThemeToggle from "@/components/shared/theme-toggle";
import ActiveUsersAreaChart from "@/components/ActiveUsersAreaChart";
import TwoSlicePieChart from "@/components/TwoSlicePieChart";
import MapelManager from "@/components/MapelManager";
import LanguageSelector from "@/components/LanguageSelector";
import styles from "@/app/admin/admin.module.css";
import { useLanguage } from "@/lib/i18n";
import { intlLocaleCodes } from "@/lib/i18n";
import TranslateContent, { TranslatedOption } from "@/components/TranslateContent";

const BRAND = "var(--accent)";

type AccountRole = "SISWA" | "GURU";
type Tab = "DASHBOARD" | "KELAS" | "AKUN" | "MAPEL" | "LAPORAN" | "PERFORMA";

interface AdminDashboardData {
  statistik: { kelas: number; siswa: number; guru: number; asesmen: number; tugas: number; materi: number; mapel: number; laporanPending: number; kuis: number; ujian: number; rataRataNilai: number; submissionDinilai: number; tugasDibuat: number; tugasDikumpulkan: number };
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
    MAPEL: <path d="M4 5h16v14H4zM8 9h8M8 13h5" />,
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
  { key: "MAPEL", label: "Mata Pelajaran" },
  { key: "LAPORAN", label: "Laporan" },
  { key: "PERFORMA", label: "Performa Akademik" },
];

const FIELD_CLASS = "mt-1 min-h-10 min-w-0 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-accent";
const FIELD_LABEL_CLASS = "block min-w-0 text-xs font-semibold text-muted-foreground";

export default function AdminDashboard() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useAdminTheme();
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");
  const [accountRole, setAccountRole] = useState<AccountRole>("SISWA");
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [me, setMe] = useState<{ nama: string; role: string; fotoProfil: string | null } | null>(null);

  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [siswaList, setSiswaList] = useState<AkunData[]>([]);
  const [guruList, setGuruList] = useState<AkunData[]>([]);
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasReferensiList, setKelasReferensiList] = useState<{ id: string; label: string; jenjang: string; tingkat: number | null; jurusan: { nama: string } | null }[]>([]);
  const [laporanList, setLaporanList] = useState<LaporanData[]>([]);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const [openAkunMenuId, setOpenAkunMenuId] = useState<string | null>(null);
  const [akunMenuPos, setAkunMenuPos] = useState({ top: 0, right: 0 });
  const [jurusanFilter, setJurusanFilter] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [rombelFilter, setRombelFilter] = useState("");
  const [siswaSearch, setSiswaSearch] = useState("");
  const [bulkTargetClassId, setBulkTargetClassId] = useState("");
  const [sendingFilteredSiswa, setSendingFilteredSiswa] = useState(false);
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

  useEffect(() => {
    if (activeTab !== "DASHBOARD" && activeTab !== "PERFORMA") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void fetch("/api/admin/dashboard", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => { if (data?.data) setDashboardData(normalizeDashboardData(data.data)); })
        .catch(() => {});
    }, 30_000);
    return () => window.clearInterval(timer);
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
        const [siswaRes, referensiRes, guruRes, mapelRes, kelasRes] = await Promise.all([
          fetch("/api/akun?role=SISWA"),
          fetch("/api/kelas-referensi"),
          fetch("/api/akun?role=GURU"),
          fetch("/api/mapel"),
          fetch("/api/kelas"),
        ]);
        const [siswaData, referensiData, guruData, mapelData, kelasData] = await Promise.all([
          siswaRes.json(), referensiRes.json(), guruRes.json(), mapelRes.json(), kelasRes.json(),
        ]);
        setSiswaList(siswaData.data ?? []);
        setKelasReferensiList(referensiData.data ?? []);
        setGuruList(guruData.data ?? []);
        setMapelList(mapelData.data ?? []);
        setKelasList(kelasData.data ?? []);
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
    if (!(await showConfirm(t("Hapus akun ini?")))) return;
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
  const filteredRombelOptions = kelasReferensiList.filter((rombel) => {
    const tingkat = rombel.jenjang === "SMP" || rombel.jenjang === "SMA" ? rombel.jenjang : rombel.tingkat?.toString() ?? "";
    return (!jurusanFilter || rombel.jurusan?.nama === jurusanFilter) && (!kelasFilter || tingkat === kelasFilter);
  });
  const filteredSiswaList = siswaList.filter((siswa) => {
    const jurusan = siswa.kelasReferensi?.jurusan?.nama ?? "";
    const tingkat = siswa.kelasReferensi?.jenjang === "SMP" || siswa.kelasReferensi?.jenjang === "SMA"
      ? siswa.kelasReferensi.jenjang
      : siswa.kelasReferensi?.tingkat?.toString() ?? "";
    const query = siswaSearch.trim().toLowerCase();
    const cocokJurusan = !jurusanFilter || jurusan === jurusanFilter;
    const cocokKelas = !kelasFilter || tingkat === kelasFilter;
    const cocokRombel = !rombelFilter || siswa.kelasReferensi?.id === rombelFilter;
    const cocokSearch = !query || [siswa.nama, siswa.email, siswa.nis ?? ""].some((value) => value.toLowerCase().includes(query));
    return cocokJurusan && cocokKelas && cocokRombel && cocokSearch;
  });
  const hasSiswaFilter = Boolean(jurusanFilter || kelasFilter || rombelFilter || siswaSearch.trim());

  async function sendFilteredStudentsToClass() {
    if (!bulkTargetClassId || filteredSiswaList.length === 0) return;
    const targetClass = kelasList.find((kelas) => kelas.id === bulkTargetClassId);
    if (!(await showConfirm(t("Kirim {count} siswa hasil filter ke kelas: {class}?")
      .replace("{count}", String(filteredSiswaList.length))
      .replace("{class}", targetClass?.judul ?? t("tujuan"))))) return;

    setSendingFilteredSiswa(true);
    try {
      const res = await fetch(`/api/kelas/${bulkTargetClassId}/siswa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siswaIds: filteredSiswaList.map((siswa) => siswa.id) }),
      });
      const data = await res.json();
      if (!res.ok) {
        await showAlert(t(data.error ?? "Siswa gagal dikirim ke kelas."));
        return;
      }
      await showAlert(t(data.message ?? "Siswa berhasil dikirim ke kelas."));
      await loadTabData("AKUN");
    } catch {
      await showAlert(t("Siswa gagal dikirim ke kelas. Coba lagi."));
    } finally {
      setSendingFilteredSiswa(false);
    }
  }
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

  const dashboardSummaryItems: { label: string; value: number; caption: string; tab: Tab | AccountRole }[] = dashboardData ? [
    { label: "Kelas", value: dashboardData.statistik.kelas, caption: "Kelola kelas", tab: "KELAS" },
    { label: "Siswa", value: dashboardData.statistik.siswa, caption: "Daftar siswa", tab: "SISWA" },
    { label: "Guru", value: dashboardData.statistik.guru, caption: "Daftar guru", tab: "GURU" },
    { label: "Asesmen", value: dashboardData.statistik.asesmen, caption: "Kuis dan ujian", tab: "KELAS" },
    { label: "Tugas", value: dashboardData.statistik.tugas, caption: "Tugas dibuat", tab: "KELAS" },
    { label: "Materi", value: dashboardData.statistik.materi, caption: "Materi dibagikan", tab: "KELAS" },
    { label: "Mata Pelajaran", value: dashboardData.statistik.mapel, caption: "Kelola mapel", tab: "MAPEL" },
    { label: "Laporan Pending", value: dashboardData.statistik.laporanPending, caption: "Perlu ditinjau", tab: "LAPORAN" },
    { label: "Rata-rata Nilai", value: dashboardData.statistik.rataRataNilai, caption: "Dari asesmen dinilai", tab: "PERFORMA" },
  ] : [];

  return (
    <div data-admin-theme={theme} className={`${styles.root} flex min-h-screen flex-col bg-background text-foreground`} style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="flex h-[68px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              aria-label={t("Toggle sidebar")}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-surface-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <Image src="/Logo1.png" alt="Classify" width={32} height={32} className="rounded-[9px] object-contain" />
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
                <p className="text-sm font-semibold text-foreground">{me.nama}</p>
                <p className="text-xs text-muted-foreground">{t(me.role)}</p>
              </div>
            )}
            <div className="hidden h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-xs font-bold text-muted-foreground sm:flex">
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
            className="fixed inset-0 z-40 bg-overlay lg:hidden"
          />
        )}

        <aside
          aria-label={t("Navigasi admin")}
          className={`fixed inset-y-0 left-0 z-50 w-[min(88vw,22.5rem)] shrink-0 overflow-x-hidden overflow-y-auto bg-background p-0 shadow-lg transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "visible translate-x-0" : "invisible -translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:invisible lg:w-0 lg:border-0 lg:p-0" : "lg:visible lg:w-80"}`}
        >
          <div className="flex min-h-full min-w-0 flex-col border border-border bg-surface p-4 rounded-[var(--radius-card)]">
            <button type="button" aria-label={t("Tutup navigasi")} onClick={() => setSidebarOpen(false)} className="mb-2 flex h-10 w-10 self-end items-center justify-center rounded-lg border border-border text-xl text-foreground hover:bg-surface-muted lg:hidden">×</button>
            <p className="mb-4 px-2 pt-2 text-sm font-bold text-foreground">
              {t("Dashboard Admin")}
              <br />
              <span className="text-accent-text">- {t(TABS.find((tab) => tab.key === activeTab)?.label ?? "Dashboard")}</span>
            </p>
            <nav className="flex flex-col gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSidebarOpen(false);
                  }}
                  title={t(tab.label)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-surface-muted ${activeTab === tab.key ? "bg-surface-muted text-accent-text shadow-[inset_3px_0_0_var(--accent)]" : "text-muted-foreground"}`}
                >
                  <TabIcon tab={tab.key} />
                  <span>{t(tab.label)}</span>
                </button>
              ))}
            </nav>
            <LanguageSelector className="mt-auto mb-3" />
            <Button
              size="md"
              onClick={handleLogout}
              className="w-full rounded-xl"
              variant="outline"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M10 17l5-5-5-5M15 12H3M21 4v16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("Keluar")}
            </Button>
          </div>
        </aside>

          <main className="min-w-0 flex-1 lg:pl-6">
          {loading && <p className="text-sm text-muted-foreground">{t("Memuat...")}</p>}

          {!loading && activeTab === "DASHBOARD" && dashboardData && (
            <div className="space-y-5">
              <section className="grid overflow-hidden border border-border bg-surface lg:grid-cols-[1.35fr_.65fr] rounded-[var(--radius-card)]">
                <div className="p-6 sm:p-7"><p className="text-xs font-bold uppercase tracking-[.14em] text-accent-text">{t("Dashboard Admin")}</p><h1 className="mt-3 text-2xl font-bold tracking-[-.045em] text-foreground sm:text-3xl">{t("Selamat datang")}, {me?.nama ?? t("Admin")}.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{t("Kelola data sekolah dan pantau aktivitas pembelajaran dari satu ruang kerja yang terstruktur.")}</p><div className="mt-6 flex flex-wrap gap-2"><button type="button" onClick={() => openAdminTab("KELAS")} className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground hover:bg-accent-hover">{t("Kelola kelas")}</button><button type="button" onClick={() => openAdminTab("SISWA")} className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted">{t("Kelola akun")}</button></div></div>
                <div className="border-t border-border bg-surface-muted p-6 lg:border-l lg:border-t-0"><p className="text-xs font-semibold text-muted-foreground">{t("Menunggu tindak lanjut")}</p><p className="mt-3 text-4xl font-bold tracking-[-.06em] text-foreground">{dashboardData.statistik.laporanPending}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{t("Laporan perubahan password perlu ditinjau.")}</p><button type="button" onClick={() => openAdminTab("LAPORAN")} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-accent-text">{t("Buka laporan")} <span aria-hidden="true">→</span></button></div>
              </section>

              <section className="border border-border bg-surface sm:hidden rounded-[var(--radius-card)]">
                <button type="button" aria-expanded={summaryOpen} onClick={() => setSummaryOpen((open) => !open)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                  <span className="text-sm font-bold text-foreground">{t("Ringkasan")}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 text-accent-text transition-transform ${summaryOpen ? "rotate-180" : ""}`} aria-hidden="true">
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {summaryOpen && (
                  <div className="divide-y divide-border border-t border-border">
                    {dashboardSummaryItems.map((item) => (
                      <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-baseline justify-between gap-3">
                          <span className="truncate text-xs font-semibold text-foreground">{t(item.label)}</span>
                          <span className="text-sm font-bold text-foreground">{item.value}</span>
                        </div>
                        <button type="button" onClick={() => openAdminTab(item.tab)} className="inline-flex min-h-10 max-w-[120px] cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-center text-xs font-semibold leading-tight text-foreground transition-colors hover:border-accent hover:bg-surface-muted">
                          {t(item.caption)}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-3">
                {dashboardSummaryItems.map((item, index) => (
                  <button key={item.label} type="button" onClick={() => openAdminTab(item.tab)} className={`group rounded-[var(--radius-card)] border p-4 text-left transition-colors hover:border-accent hover:bg-surface-muted ${index === 0 ? "border-accent bg-surface" : "border-border bg-surface"}`}>
                    <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.1em] text-muted-foreground">{t(item.label)}</p><span className="text-xs font-bold text-accent-text group-hover:translate-x-0.5">↗</span></div>
                    <p className="mt-5 text-3xl font-bold tracking-[-.055em] text-foreground">{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t(item.caption)}</p>
                  </button>
                ))}
              </div>

              <section className="border border-border bg-surface rounded-[var(--radius-card)]"><div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="text-sm font-bold text-foreground">{t("Akun terbaru")}</h2><p className="mt-1 text-xs text-muted-foreground">{t("Lima akun siswa dan guru terakhir dibuat.")}</p></div><Button size="sm" variant="outline" onClick={() => openAdminTab("SISWA")}>{t("Kelola Akun")}</Button></div><div className="divide-y divide-border">{dashboardData.akunTerbaru.length === 0 ? <p className="p-5 text-sm text-muted-foreground">{t("Belum ada akun.")}</p> : dashboardData.akunTerbaru.map((akun) => <button key={akun.id} type="button" onClick={() => router.push(`/profil/${akun.id}`)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-muted"><span><span className="block text-sm font-semibold text-foreground">{akun.nama}</span><span className="mt-0.5 block text-xs text-muted-foreground">{akun.email}</span></span><span className="text-right"><Badge tone={akun.role === "GURU" ? "brand" : "gray"}>{t(akun.role === "GURU" ? "Guru" : "Siswa")}</Badge><span className="mt-1 block text-[11px] text-muted-foreground">              {new Date(akun.createdAt).toLocaleDateString(intlLocaleCodes[locale])}</span></span></button>)}</div></section>
            </div>
          )}

          {!loading && activeTab === "PERFORMA" && dashboardData && (
            <div className="space-y-5">
              <PageHeader
                eyebrow={t("Analitik LMS")}
                title={t("Performa Akademik & Data")}
                desc={t("Pantau nilai, aktivitas pembelajaran, dan pengguna aktif berdasarkan data nyata sistem.")}
                action={<span className="border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground rounded-[var(--radius-card)]">{t("Aktivitas 14 hari terakhir")}</span>}
              />

              <section className="grid gap-3 lg:grid-cols-[.7fr_1.3fr]">
                <div className="flex flex-col justify-between gap-8 border border-accent bg-surface p-6 rounded-[var(--radius-card)]">
                  <p className="text-xs font-semibold text-muted-foreground">{t("Rata-rata nilai")}</p>
                  <div>
                    <p className="text-5xl font-bold tracking-[-.06em] text-foreground">{dashboardData.statistik.rataRataNilai}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("Nilai asesmen dinilai")}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    [t("Asesmen dinilai"), dashboardData.statistik.submissionDinilai, t("Submission dengan nilai")],
                    [t("Tugas dibuat"), dashboardData.statistik.tugasDibuat, t("Total tugas guru")],
                    [t("Tugas dikumpulkan"), dashboardData.statistik.tugasDikumpulkan, t("Submission siswa")],
                  ].map(([label, value, caption]) => (
                    <div key={label as string} className="flex flex-col justify-between gap-8 border border-border bg-surface p-4 rounded-[var(--radius-card)]">
                      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                      <div>
                        <p className="text-3xl font-bold tracking-[-.055em] text-foreground">{value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border border-border bg-surface rounded-[var(--radius-card)]">
                <div className="grid grid-cols-2 divide-x divide-y divide-border border-b border-border lg:grid-cols-4 lg:divide-y-0">
                  {[
                    [t("User aktif 14 hari"), dashboardData.aktivitas.userAktif, t("Siswa dan guru yang login atau belajar")],
                    [t("Siswa aktif"), dashboardData.aktivitas.siswaAktif, t("Mengerjakan atau mengumpulkan")],
                    [t("Guru aktif"), dashboardData.aktivitas.guruAktif, t("Membuat asesmen atau tugas")],
                    [t("Total user"), dashboardData.statistik.siswa + dashboardData.statistik.guru, t("Siswa dan guru terdaftar")],
                  ].map(([label, value, caption]) => (
                    <div key={label as string} className="p-4 sm:p-5">
                      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                      <p className="mt-3 text-2xl font-bold tracking-[-.05em] text-foreground">{value}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{caption}</p>
                    </div>
                  ))}
                </div>
                <div className="p-5">
                  <h2 className="text-sm font-bold text-foreground">{t("User aktif per hari")}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{t("Siswa dan guru yang login atau melakukan aktivitas pembelajaran setiap hari.")}</p>
                  <ActiveUsersAreaChart items={dashboardData.aktivitas.aktivitasHarian} />
                </div>
              </section>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-3">
                  <section className="border border-border bg-surface p-5 rounded-[var(--radius-card)]">
                    <h2 className="text-sm font-bold text-foreground">{t("Kuis dan ujian")}</h2>
                    <TwoSlicePieChart first={{ label: t("Kuis"), value: dashboardData.statistik.kuis }} second={{ label: t("Ujian online"), value: dashboardData.statistik.ujian }} />
                  </section>
                  <section className="border border-border bg-surface p-5 rounded-[var(--radius-card)]">
                    <h2 className="text-sm font-bold text-foreground">{t("Tugas dibuat vs dikumpulkan")}</h2>
                    <TwoSlicePieChart first={{ label: t("Tugas dibuat"), value: dashboardData.statistik.tugasDibuat }} second={{ label: t("Dikumpulkan siswa"), value: dashboardData.statistik.tugasDikumpulkan }} />
                  </section>
                </div>

                <section className="border border-border bg-surface p-5 rounded-[var(--radius-card)]">
                  <h2 className="text-sm font-bold text-foreground">{t("Distribusi data")}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{t("Perbandingan data utama yang tersimpan di sistem.")}</p>
                  <div className="mt-5 space-y-4">
                    {(() => {
                      const s = dashboardData.statistik;
                      const max = Math.max(s.siswa, s.guru, s.kelas, s.asesmen, s.tugas, s.materi, 1);
                      return (
                        <>
                          <BarRow label="Siswa" value={s.siswa} max={max} />
                          <BarRow label="Guru" value={s.guru} max={max} />
                          <BarRow label="Kelas" value={s.kelas} max={max} />
                          <BarRow label="Asesmen" value={s.asesmen} max={max} />
                          <BarRow label="Tugas" value={s.tugas} max={max} />
                          <BarRow label="Materi" value={s.materi} max={max} />
                        </>
                      );
                    })()}
                  </div>
                </section>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
                <section className="border border-border bg-surface rounded-[var(--radius-card)]">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="text-sm font-bold text-foreground">{t("Rincian data sistem")}</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {[
                      [t("Mata pelajaran"), dashboardData.statistik.mapel, t("Mapel tersedia")],
                      [t("Kuis"), dashboardData.statistik.kuis, t("Asesmen tipe kuis")],
                      [t("Ujian online"), dashboardData.statistik.ujian, t("Asesmen tipe ujian")],
                      [t("Submission dinilai"), dashboardData.statistik.submissionDinilai, t("Memiliki nilai akhir")],
                      [t("Tugas dikumpulkan"), dashboardData.statistik.tugasDikumpulkan, t("Status submission sudah")],
                      [t("Materi"), dashboardData.statistik.materi, t("Materi yang dibagikan guru")],
                    ].map(([label, value, detail]) => (
                      <div key={label as string} className="flex items-center justify-between gap-4 px-5 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground">{detail}</p>
                        </div>
                        <span className="text-lg font-bold tracking-[-.04em] text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border border-border bg-surface-muted p-5 rounded-[var(--radius-card)]">
                  <h2 className="text-sm font-bold text-foreground">{t("Definisi user aktif")}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t("User aktif bukan dihitung dari login karena sistem belum menyimpan log login. Angka ini menghitung siswa yang mengerjakan asesmen atau mengumpulkan tugas, serta guru yang membuat asesmen atau tugas dalam 14 hari terakhir.")}
                  </p>
                  <dl className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("Periode")}</dt>
                      <dd className="mt-0.5 font-semibold text-foreground">{t("14 hari terakhir")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("Sumber")}</dt>
                      <dd className="mt-0.5 font-semibold text-foreground">{t("Asesmen, tugas, submission asesmen, dan submission tugas")}</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </div>
          )}

          {activeTab === "MAPEL" && <MapelManager />}

          {!loading && activeTab === "KELAS" && (
            <div className="space-y-5">
              <PageHeader
                eyebrow="Manajemen kelas"
                title={t("Kelas pembelajaran")}
                desc="Buat dan atur ruang belajar untuk setiap kelompok."
                action={<Button onClick={openBuatKelas}>{t("Buat Kelas")}</Button>}
              />
              {kelasList.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("Belum ada kelas dibuat.")}</p>
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
                title={t("Daftar Akun")}
                desc="Kelola akun siswa dan guru dari satu tempat."
                action={<Button size="sm" onClick={() => openBuatAkun(accountRole)}>{accountRole === "SISWA" ? `+ ${t("Tambah Siswa")}` : `+ ${t("Tambah Guru")}`}</Button>}
              />
              <div className="inline-flex rounded-lg border border-border bg-surface p-1" role="group" aria-label={t("Pilih jenis akun")}>
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
                      ? { background: BRAND, color: "var(--accent-foreground)" }
                      : { background: "transparent", color: "var(--muted-foreground)" }}
                  >
                    {t(role === "SISWA" ? "Siswa" : "Guru")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && activeTab === "AKUN" && accountRole === "SISWA" && (
            <div className="space-y-5">
              <div className="grid gap-3 border border-border bg-surface p-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.5fr_auto] md:items-end rounded-[var(--radius-card)]">
                <label className={FIELD_LABEL_CLASS}>
                  {t("Jurusan")}
                  <select value={jurusanFilter} onChange={(event) => { setJurusanFilter(event.target.value); setRombelFilter(""); }} className={FIELD_CLASS}>
                    <option value="">{t("Semua Jurusan")}</option>
                    {jurusanOptions.map((jurusan) => <TranslatedOption key={jurusan} value={jurusan} text={jurusan} />)}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  {t("Kelas")}
                  <select value={kelasFilter} onChange={(event) => { setKelasFilter(event.target.value); setRombelFilter(""); }} className={FIELD_CLASS}>
                    <option value="">{t("Semua Kelas")}</option>
                    {kelasOptions.map((kelas) => <TranslatedOption key={kelas} value={kelas} text={kelas} />)}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  {t("Rombel")}
                  <select value={rombelFilter} onChange={(event) => setRombelFilter(event.target.value)} className={FIELD_CLASS}>
                    <option value="">{t("Semua Rombel")}</option>
                    {filteredRombelOptions.map((rombel) => <TranslatedOption key={rombel.id} value={rombel.id} text={rombel.label} />)}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  {t("Cari")}
                  <input value={siswaSearch} onChange={(event) => setSiswaSearch(event.target.value)} placeholder={t("Nama, email, atau NIS...")} className={FIELD_CLASS} />
                </label>
                <button type="button" onClick={() => { setJurusanFilter(""); setKelasFilter(""); setRombelFilter(""); setSiswaSearch(""); setBulkTargetClassId(""); }}                 className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted">{t("Reset")}</button>
              </div>
              {hasSiswaFilter && filteredSiswaList.length > 0 && (
                <div className="flex flex-col gap-3 border border-border bg-surface p-3 sm:flex-row sm:items-end sm:justify-between rounded-[var(--radius-card)]">
                  <div>
                    <p className="text-sm font-bold text-foreground">{t("Kirim hasil filter ke kelas")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{filteredSiswaList.length} {t("siswa terpilih dari filter aktif.")}</p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <label className={`${FIELD_LABEL_CLASS} sm:min-w-64`}>
                      {t("Kelas tujuan")}
                      <select value={bulkTargetClassId} onChange={(event) => setBulkTargetClassId(event.target.value)} className={FIELD_CLASS}>
                        <option value="">{t("Pilih kelas tujuan")}</option>
                        {kelasList.map((kelas) => <TranslatedOption key={kelas.id} value={kelas.id} text={kelas.judul} />)}
                      </select>
                    </label>
                    <Button size="sm" loading={sendingFilteredSiswa} disabled={!bulkTargetClassId} onClick={() => void sendFilteredStudentsToClass()}>
                      {t("Kirim ke Kelas")}
                    </Button>
                  </div>
                </div>
              )}
              {filteredSiswaList.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("Belum ada siswa terdaftar.")}</p>
              ) : (
                <div className="overflow-x-auto border border-border bg-surface rounded-[var(--radius-card)]">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="border-b border-border text-xs text-muted-foreground"><tr>
                      <th className="pb-3 font-semibold">{t("No")}</th><th className="pb-3 font-semibold">{t("Profil")}</th><th className="pb-3 font-semibold">{t("Nama")}</th><th className="pb-3 font-semibold">{t("Email")}</th><th className="pb-3 font-semibold">{t("NIS")}</th><th className="pb-3 font-semibold">{t("Status Siswa")}</th><th className="pb-3 font-semibold">{t("Kelas/Rombel")}</th><th className="pb-3 font-semibold">{t("Jurusan")}</th><th className="pb-3 text-right font-semibold">{t("Aksi")}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">{filteredSiswaList.map((s, index) => (
                      <tr key={s.id} onClick={() => router.push(`/profil/${s.id}`)} className="cursor-pointer hover:bg-surface-muted">
                        <td className="py-3 text-xs text-muted-foreground">{index + 1}</td>
                        <td className="py-3"><Avatar foto={s.fotoProfil} nama={s.nama} /></td>
                        <td className="py-3 font-semibold text-foreground">{s.nama}</td><td className="py-3 text-xs text-muted-foreground">{s.email}</td><td className="py-3 text-xs text-muted-foreground">{s.nis ?? "-"}</td>
                        <td className="py-3"><Badge tone="green">{t("Aktif")}</Badge></td>
                        <td
                          className="py-3 text-xs text-muted-foreground"
                          title={s.kelasSiswa?.map((item) => item.kelas.judul).join(", ") || t("Belum ada kelas")}
                        >
                          {s.kelasSiswa?.length ?? 0} {t("Kelas")}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">{s.kelasReferensi?.label ?? "-"}</td>
                        <td className="relative whitespace-nowrap py-3 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); toggleAkunMenu(s.id, event.currentTarget); }} aria-label={t("Menu aksi")} className="rounded-lg p-2 text-lg font-bold text-muted-foreground hover:bg-surface-muted">⋮</button>{openAkunMenuId === s.id && <div style={{ top: akunMenuPos.top, right: akunMenuPos.right }} className="fixed z-50 w-28 overflow-hidden rounded-lg border border-border bg-surface py-1 text-left shadow-md"><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); openEditAkun(s); }} className="block w-full px-3 py-2 text-xs hover:bg-surface-muted">{t("Edit")}</button><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); void handleDeleteAkun(s.id); }} className="block w-full px-3 py-2 text-xs text-danger hover:bg-danger-subtle">{t("Hapus")}</button></div>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "AKUN" && accountRole === "GURU" && (
            <div className="space-y-5">
              <div className="grid gap-3 border border-border bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end rounded-[var(--radius-card)]">
                <label className={FIELD_LABEL_CLASS}>
                  {t("Mapel")}
                  <select value={mapelFilter} onChange={(event) => setMapelFilter(event.target.value)} className={FIELD_CLASS}>
                    <option value="">{t("Semua Mapel")}</option>
                    {mapelOptions.map((mapel) => <TranslatedOption key={mapel} value={mapel} text={mapel} />)}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  {t("Cari")}
                  <input value={guruSearch} onChange={(event) => setGuruSearch(event.target.value)} placeholder={t("Nama, email, atau NIK...")} className={FIELD_CLASS} />
                </label>
                <button type="button" onClick={() => { setMapelFilter(""); setGuruSearch(""); }}                 className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted">{t("Reset")}</button>
              </div>
              {filteredGuruList.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("Belum ada guru terdaftar.")}</p>
              ) : (
                <div className="overflow-x-auto border border-border bg-surface rounded-[var(--radius-card)]">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-border text-xs text-muted-foreground"><tr>
                      <th className="pb-3 font-semibold">{t("No")}</th><th className="pb-3 font-semibold">{t("Profil")}</th><th className="pb-3 font-semibold">{t("Nama")}</th><th className="pb-3 font-semibold">{t("Email")}</th><th className="pb-3 font-semibold">{t("NIK")}</th><th className="pb-3 font-semibold">{t("Status Guru")}</th><th className="pb-3 font-semibold">{t("Mapel")}</th><th className="pb-3 text-right font-semibold">{t("Aksi")}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">{filteredGuruList.map((g, index) => (
                      <tr key={g.id} onClick={() => router.push(`/profil/${g.id}`)} className="cursor-pointer hover:bg-surface-muted">
                        <td className="py-3 text-xs text-muted-foreground">{index + 1}</td>
                        <td className="py-3"><Avatar foto={g.fotoProfil} nama={g.nama} /></td>
                        <td className="py-3 font-semibold text-foreground">{g.nama}</td><td className="py-3 text-xs text-muted-foreground">{g.email}</td><td className="py-3 text-xs text-muted-foreground">{g.nik ?? "-"}</td>
                        <td className="py-3"><Badge tone="green">{t("Aktif")}</Badge></td>
                        <td className="py-3 text-xs text-muted-foreground">{Array.from(new Set(g.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [])).join(", ") || t("Belum ada mapel")}</td>
                        <td className="relative whitespace-nowrap py-3 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); toggleAkunMenu(g.id, event.currentTarget); }} aria-label={t("Menu aksi")} className="rounded-lg p-2 text-lg font-bold text-muted-foreground hover:bg-surface-muted">⋮</button>{openAkunMenuId === g.id && <div style={{ top: akunMenuPos.top, right: akunMenuPos.right }} className="fixed z-50 w-28 overflow-hidden rounded-lg border border-border bg-surface py-1 text-left shadow-md"><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); openEditAkun(g); }} className="block w-full px-3 py-2 text-xs hover:bg-surface-muted">{t("Edit")}</button><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); void handleDeleteAkun(g.id); }} className="block w-full px-3 py-2 text-xs text-danger hover:bg-danger-subtle">{t("Hapus")}</button></div>}</td>
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
                title={t("Laporan password")}
                desc="Tinjau laporan dan proses permintaan perubahan password."
              />
              {laporanList.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("Tidak ada laporan lupa password saat ini.")}</p>
              ) : (
                laporanList.map((l) => <LaporanCard key={l.id} data={l} onUpdated={() => loadTabData("LAPORAN")} />)
              )}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-border bg-surface px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">      © 2026 Classify. {t("Sistem pembelajaran yang lebih terarah.")}</footer>

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
        title={t("Hapus Kelas")}
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-danger bg-danger-subtle p-4">
            <p className="text-sm font-bold text-danger">{t("Hapus kelas")} <TranslateContent text={deletingKelas?.judul ?? ""} textClassName="inline" />?</p>
            <p className="mt-2 text-sm leading-6 text-danger">
              {t("Data hubungan siswa dan guru dengan kelas ini akan ikut terlepas. Tindakan ini tidak dapat dibatalkan.")}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingKelas(null)}>
              {t("Batal")}
            </Button>
            <Button variant="danger" onClick={() => void handleDeleteKelas()}>
              {t("Hapus Kelas")}
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
    </div>
  );
}

function PageHeader({ eyebrow, title, desc, action }: { eyebrow: string; title: string; desc: string; action?: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.14em] text-accent-text">{t(eyebrow)}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-.04em] text-foreground">{t(title)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(desc)}</p>
      </div>
      {action}
    </div>
  );
}

function Avatar({ foto, nama }: { foto: string | null | undefined; nama: string }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-xs font-bold text-muted-foreground">
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
  const { t } = useLanguage();
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-foreground">{t(label)}</span>
        <span className="font-bold text-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-2 rounded-full" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}
