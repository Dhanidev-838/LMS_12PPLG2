"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import KelasCard, { KelasData } from "@/components/KelasCard";
import ModalKelas from "@/components/ModalKelas";
import { AkunData } from "@/components/AkunCard";
import ModalAkun from "@/components/ModalAkun";
import LaporanCard, { LaporanData } from "@/components/LaporanCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { showAlert, showConfirm } from "@/lib/dialog";
import { useAdminTheme } from "@/lib/use-admin-theme";
import ThemeToggle from "@/components/shared/theme-toggle";
import ActiveUsersAreaChart from "@/components/ActiveUsersAreaChart";
import TwoSlicePieChart from "@/components/TwoSlicePieChart";
import MapelManager from "@/components/MapelManager";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/i18n";
import { intlLocaleCodes } from "@/lib/i18n";

const BRAND = "#6B85F6";

type StaffRole = "ADMIN" | "KEPSEK" | "KURIKULUM";
type AccountRole = "SISWA" | "GURU" | StaffRole | "SUPER_ADMIN";
type StaffAccount = { id: string; role: StaffRole | "SUPER_ADMIN"; nama: string; email: string; fotoProfil: string | null; passwordSementara: boolean; createdAt: string };
const ACCOUNT_ROLES: { value: AccountRole; label: string }[] = [
  { value: "SISWA", label: "Siswa" }, { value: "GURU", label: "Guru" },
  { value: "ADMIN", label: "Admin" }, { value: "KEPSEK", label: "Kepala Sekolah" },
  { value: "KURIKULUM", label: "Kurikulum" }, { value: "SUPER_ADMIN", label: "Super Admin" },
];
type Tab = "DASHBOARD" | "KELAS" | "AKUN" | "MAPEL" | "LAPORAN" | "PERFORMA" | "ASESMEN" | "TUGAS" | "MATERI";

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
    ASESMEN: <path d="M9 12l2 2 4-4m5 2a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
    TUGAS: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    MATERI: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />,
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

const FIELD_CLASS = "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-accent";
const FIELD_LABEL_CLASS = "block text-xs font-semibold text-muted-foreground";

export default function AdminDashboard() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useAdminTheme();
  const [activeTab, setActiveTab] = useState<Tab>("DASHBOARD");
  const [accountRole, setAccountRole] = useState<AccountRole>("SISWA");
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [learningSectionOpen, setLearningSectionOpen] = useState(true);
  const [me, setMe] = useState<{ nama: string; role: string; fotoProfil: string | null } | null>(null);

  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [siswaList, setSiswaList] = useState<AkunData[]>([]);
  const [guruList, setGuruList] = useState<AkunData[]>([]);
  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [staffLoadError, setStaffLoadError] = useState("");
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffNama, setStaffNama] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffError, setStaffError] = useState("");
  const [savingStaff, setSavingStaff] = useState(false);
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
    if (ACCOUNT_ROLES.some(({ value }) => value === requestedTab)) {
      setAccountRole(requestedTab as AccountRole);
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
        const [siswaRes, referensiRes, guruRes, mapelRes, kelasRes, staffRes] = await Promise.all([
          fetch("/api/akun?role=SISWA"),
          fetch("/api/kelas-referensi"),
          fetch("/api/akun?role=GURU"),
          fetch("/api/mapel"),
          fetch("/api/kelas"),
          fetch("/api/super-admin/akun"),
        ]);
        const [siswaData, referensiData, guruData, mapelData, kelasData, staffData] = await Promise.all([
          siswaRes.json(), referensiRes.json(), guruRes.json(), mapelRes.json(), kelasRes.json(), staffRes.json(),
        ]);
        setSiswaList(siswaData.data ?? []);
        setKelasReferensiList(referensiData.data ?? []);
        setGuruList(guruData.data ?? []);
        setMapelList(mapelData.data ?? []);
        setKelasList(kelasData.data ?? []);
        setStaffList(staffData.data ?? []);
        setStaffLoadError(staffRes.ok ? "" : staffData.error ?? "Gagal memuat akun pengelola.");
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
  function openBuatStaff() {
    setStaffNama("");
    setStaffEmail("");
    setStaffPassword("");
    setStaffError("");
    setShowStaffModal(true);
  }

  async function handleCreateStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (accountRole !== "ADMIN" && accountRole !== "KEPSEK" && accountRole !== "KURIKULUM") return;
    setSavingStaff(true);
    setStaffError("");
    try {
      const response = await fetch("/api/super-admin/akun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: accountRole, nama: staffNama, email: staffEmail, password: staffPassword }),
      });
      const result = await response.json();
      if (!response.ok) {
        setStaffError(result.error ?? "Gagal membuat akun.");
        return;
      }
      setShowStaffModal(false);
      await loadTabData("AKUN");
    } catch {
      setStaffError("Gagal membuat akun. Coba lagi.");
    } finally {
      setSavingStaff(false);
    }
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
    if (ACCOUNT_ROLES.some(({ value }) => value === tab)) {
      setAccountRole(tab as AccountRole);
      setActiveTab("AKUN");
    } else {
      setActiveTab(tab as Tab);
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
    <div data-admin-theme={theme} className="admin-shell flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="flex h-[68px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              aria-label={t("Toggle sidebar")}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-foreground">
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
                <p className="text-xs text-muted-foreground">{t("Super Admin")}</p>
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
          className={`fixed inset-y-0 left-0 z-50 w-[min(88vw,22.5rem)] overflow-hidden bg-background p-0 shadow-lg transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:w-0 lg:border-0 lg:p-0" : "lg:w-80"}`}
        >
          <div className="sidebar-scrollbar flex h-full min-w-0 w-full flex-col overflow-x-hidden overflow-y-auto rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <button type="button" aria-label={t("Tutup navigasi")} onClick={() => setSidebarOpen(false)} className="mb-2 flex h-10 w-10 self-end items-center justify-center rounded-lg border border-border text-xl text-foreground hover:bg-surface-muted lg:hidden">×</button>
            <p className="mb-4 px-2 pt-2 text-sm font-bold text-foreground">
              {t("Dashboard Super Admin")}
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
            <div className="mt-4 border-t border-border pt-3">
              <button
                type="button"
                aria-expanded={learningSectionOpen}
                aria-controls="super-admin-learning-links"
                onClick={() => setLearningSectionOpen((open) => !open)}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <span>{t("Ruang Pembelajaran")}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 transition-transform ${learningSectionOpen ? "" : "-rotate-90"}`}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div id="super-admin-learning-links" className={`mt-1 ${learningSectionOpen ? "flex flex-col gap-1" : "hidden"}`}>
                {[
                  { key: "ASESMEN" as const, label: "Asesmen", href: "/super-admin/asesmen" },
                  { key: "TUGAS" as const, label: "Tugas", href: "/super-admin/tugas" },
                  { key: "MATERI" as const, label: "Materi", href: "/super-admin/materi" },
                ].map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                  >
                    <TabIcon tab={item.key} />
                    {t(item.label)}
                  </button>
                ))}
              </div>
            </div>
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
              <section className="grid overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface lg:grid-cols-[1.35fr_.65fr]">
                <div className="p-6 sm:p-7"><p className="text-xs font-bold uppercase tracking-[.14em] text-accent-text">{t("Dashboard Super Admin")}</p><h1 className="mt-3 text-2xl font-bold tracking-[-.045em] text-foreground sm:text-3xl">{t("Selamat datang")}, {me?.nama ?? t("Super Admin")}.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{t("Kelola akun dan data sekolah, lalu pantau aktivitas pembelajaran dari satu ruang kerja.")}</p><div className="mt-6 flex flex-wrap gap-2"><button type="button" onClick={() => openAdminTab("AKUN")} className="min-h-10 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground hover:bg-accent-hover">{t("Kelola akun")}</button><button type="button" onClick={() => openAdminTab("KELAS")} className="min-h-10 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted">{t("Kelola kelas")}</button></div></div>
                <div className="border-t border-border bg-surface-muted p-6 lg:border-l lg:border-t-0"><p className="text-xs font-semibold text-muted-foreground">{t("Menunggu tindak lanjut")}</p><p className="mt-3 text-4xl font-bold tracking-[-.06em] text-foreground">{dashboardData.statistik.laporanPending}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{t("Laporan perubahan password perlu ditinjau.")}</p><button type="button" onClick={() => openAdminTab("LAPORAN")} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-accent-text">{t("Buka laporan")} <span aria-hidden="true">→</span></button></div>
              </section>

              <section className="rounded-[var(--radius-card)] border border-border bg-surface sm:hidden">
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
                          <span className="truncate text-xs font-semibold text-muted-foreground">{t(item.label)}</span>
                          <span className="text-sm font-bold text-foreground">{item.value}</span>
                        </div>
                        <button type="button" onClick={() => openAdminTab(item.tab)} className="inline-flex min-h-10 max-w-[120px] cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-center text-xs font-semibold leading-tight text-foreground hover:bg-surface-muted">
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

              <section className="rounded-[var(--radius-card)] border border-border bg-surface"><div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="text-sm font-bold text-foreground">{t("Akun terbaru")}</h2><p className="mt-1 text-xs text-muted-foreground">{t("Lima akun siswa dan guru terakhir dibuat.")}</p></div><Button size="sm" variant="outline" onClick={() => openAdminTab("SISWA")}>{t("Kelola Akun")}</Button></div><div className="divide-y divide-border">{dashboardData.akunTerbaru.length === 0 ? <p className="p-5 text-sm text-muted-foreground">{t("Belum ada akun.")}</p> : dashboardData.akunTerbaru.map((akun) => <button key={akun.id} type="button" onClick={() => router.push(`/profil/${akun.id}`)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-muted"><span><span className="block text-sm font-semibold text-foreground">{akun.nama}</span><span className="mt-0.5 block text-xs text-muted-foreground">{akun.email}</span></span><span className="text-right"><Badge tone={akun.role === "GURU" ? "brand" : "gray"}>{t(akun.role === "GURU" ? "Guru" : "Siswa")}</Badge><span className="mt-1 block text-[11px] text-muted-foreground">              {new Date(akun.createdAt).toLocaleDateString(intlLocaleCodes[locale])}</span></span></button>)}</div></section>
            </div>
          )}

          {!loading && activeTab === "PERFORMA" && dashboardData && (
            <div className="space-y-5">
              <PageHeader
                eyebrow={t("Analitik LMS")}
                title={t("Performa Akademik & Data")}
                desc={t("Pantau nilai, aktivitas pembelajaran, dan pengguna aktif berdasarkan data nyata sistem.")}
                action={<div className="flex flex-wrap items-center gap-2"><span className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground">{t("Aktivitas 14 hari terakhir")}</span><Link href="/super-admin/performa-akademik" className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-accent-text hover:border-accent hover:bg-accent-subtle">{t("Detail")} →</Link></div>}
              />

              <section className="grid gap-3 lg:grid-cols-[.7fr_1.3fr]">
                <div className="flex flex-col justify-between gap-8 rounded-[var(--radius-card)] border border-accent bg-surface p-6">
                  <p className="text-xs font-semibold text-muted-foreground">{t("Rata-rata nilai")}</p>
                  <div>
                    <p className="text-5xl font-bold tracking-[-.06em] text-foreground">{dashboardData.statistik.rataRataNilai}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("Nilai asesmen dinilai")}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    [t("Asesmen dinilai"), dashboardData.statistik.submissionDinilai, t("Submission dengan nilai")],
                    [t("Tugas dibuat"), dashboardData.statistik.tugasDibuat, t("Seluruh sekolah")],
                    [t("Tugas dikumpulkan"), dashboardData.statistik.tugasDikumpulkan, t("Submission siswa")],
                  ].map(([label, value, caption]) => (
                    <div key={label as string} className="flex flex-col justify-between gap-8 rounded-[var(--radius-card)] border border-border bg-surface p-4">
                      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                      <div>
                        <p className="text-3xl font-bold tracking-[-.055em] text-foreground">{value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[var(--radius-card)] border border-border bg-surface">
                <div className="grid grid-cols-2 divide-x divide-y divide-[#edf0f5] border-b border-border lg:grid-cols-4 lg:divide-y-0">
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
                  <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                    <h2 className="text-sm font-bold text-foreground">{t("Kuis dan ujian")}</h2>
                    <TwoSlicePieChart first={{ label: t("Kuis"), value: dashboardData.statistik.kuis }} second={{ label: t("Ujian online"), value: dashboardData.statistik.ujian }} />
                  </section>
                  <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                    <h2 className="text-sm font-bold text-foreground">{t("Tugas dibuat vs dikumpulkan")}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{t("Seluruh sekolah")}</p>
                    <TwoSlicePieChart first={{ label: t("Tugas dibuat"), value: dashboardData.statistik.tugasDibuat }} second={{ label: t("Dikumpulkan siswa"), value: dashboardData.statistik.tugasDikumpulkan }} />
                  </section>
                </div>

                <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
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
                <section className="rounded-[var(--radius-card)] border border-border bg-surface">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="text-sm font-bold text-foreground">{t("Rincian data sistem")}</h2>
                  </div>
                  <div className="divide-y divide-[#edf0f5]">
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

                <section className="rounded-[var(--radius-card)] border border-border bg-surface-muted p-5">
                  <h2 className="text-sm font-bold text-foreground">{t("Definisi user aktif")}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t("User aktif menghitung siswa dan guru yang login atau melakukan aktivitas pembelajaran dalam 14 hari terakhir. Setiap pengguna dihitung sekali per hari.")}
                  </p>
                  <dl className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("Periode")}</dt>
                      <dd className="mt-0.5 font-semibold text-foreground">{t("14 hari terakhir")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("Sumber")}</dt>
                      <dd className="mt-0.5 font-semibold text-foreground">{t("Login, asesmen, tugas, dan pengumpulan siswa")}</dd>
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
                      basePath="/super-admin/kelas"
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
                desc="Akun siswa, guru, dan pengelola sekolah dalam satu tempat."
                action={accountRole === "SISWA" || accountRole === "GURU"
                  ? <Button size="sm" onClick={() => openBuatAkun(accountRole)}>{accountRole === "SISWA" ? `+ ${t("Tambah Siswa")}` : `+ ${t("Tambah Guru")}`}</Button>
                  : accountRole !== "SUPER_ADMIN" && !staffLoadError && !staffList.some((account) => account.role === accountRole)
                    ? <Button size="sm" onClick={openBuatStaff}>+ {t("Tambah")} {t(ACCOUNT_ROLES.find(({ value }) => value === accountRole)?.label ?? "Pengelola")}</Button>
                    : undefined}
              />
              <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-card)] border border-border bg-surface p-1 sm:grid-cols-3 xl:grid-cols-6" role="group" aria-label={t("Pilih jenis akun")}>
                {ACCOUNT_ROLES.map(({ value: role, label }) => (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={accountRole === role}
                    onClick={() => {
                      setAccountRole(role);
                      setOpenAkunMenuId(null);
                    }}
                    className={`flex min-h-11 min-w-0 cursor-pointer items-center justify-center rounded-lg px-2 py-2 text-center text-xs font-semibold leading-tight transition-colors sm:text-sm ${accountRole === role ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"}`}
                  >
                    {t(label)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && activeTab === "AKUN" && accountRole === "SISWA" && (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3 md:grid-cols-[180px_150px_190px_minmax(220px,1fr)_auto] md:items-end">
                <label className={FIELD_LABEL_CLASS}>
                  {t("Jurusan")}
                  <select value={jurusanFilter} onChange={(event) => { setJurusanFilter(event.target.value); setRombelFilter(""); }} className={FIELD_CLASS}>
                    <option value="">{t("Semua Jurusan")}</option>
                    {jurusanOptions.map((jurusan) => <option key={jurusan} value={jurusan}>{jurusan}</option>)}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  {t("Kelas")}
                  <select value={kelasFilter} onChange={(event) => { setKelasFilter(event.target.value); setRombelFilter(""); }} className={FIELD_CLASS}>
                    <option value="">{t("Semua Kelas")}</option>
                    {kelasOptions.map((kelas) => <option key={kelas} value={kelas}>{kelas}</option>)}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  {t("Rombel")}
                  <select value={rombelFilter} onChange={(event) => setRombelFilter(event.target.value)} className={FIELD_CLASS}>
                    <option value="">{t("Semua Rombel")}</option>
                    {filteredRombelOptions.map((rombel) => <option key={rombel.id} value={rombel.id}>{rombel.label}</option>)}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  {t("Cari")}
                  <input value={siswaSearch} onChange={(event) => setSiswaSearch(event.target.value)} placeholder={t("Nama, email, atau NIS...")} className={FIELD_CLASS} />
                </label>
                <button type="button" onClick={() => { setJurusanFilter(""); setKelasFilter(""); setRombelFilter(""); setSiswaSearch(""); setBulkTargetClassId(""); }}                 className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-[#f8f9fc]">{t("Reset")}</button>
              </div>
              {hasSiswaFilter && filteredSiswaList.length > 0 && (
                <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{t("Kirim hasil filter ke kelas")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{filteredSiswaList.length} {t("siswa terpilih dari filter aktif.")}</p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <label className={`${FIELD_LABEL_CLASS} sm:min-w-64`}>
                      {t("Kelas tujuan")}
                      <select value={bulkTargetClassId} onChange={(event) => setBulkTargetClassId(event.target.value)} className={FIELD_CLASS}>
                        <option value="">{t("Pilih kelas tujuan")}</option>
                        {kelasList.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.judul}</option>)}
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
                <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="border-b border-border text-xs text-muted-foreground"><tr>
                      <th className="pb-3 font-semibold">{t("No")}</th><th className="pb-3 font-semibold">{t("Profil")}</th><th className="pb-3 font-semibold">{t("Nama")}</th><th className="pb-3 font-semibold">{t("Email")}</th><th className="pb-3 font-semibold">{t("NIS")}</th><th className="pb-3 font-semibold">{t("Status Siswa")}</th><th className="pb-3 font-semibold">{t("Kelas/Rombel")}</th><th className="pb-3 font-semibold">{t("Jurusan")}</th><th className="pb-3 text-right font-semibold">{t("Aksi")}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#edf0f5]">{filteredSiswaList.map((s, index) => (
                      <tr key={s.id} onClick={() => router.push(`/profil/${s.id}`)} className="cursor-pointer hover:bg-[#6B85F6]/10">
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
                        <td className="relative whitespace-nowrap py-3 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); toggleAkunMenu(s.id, event.currentTarget); }} aria-label={t("Menu aksi")} className="rounded-lg p-2 text-lg font-bold text-muted-foreground hover:bg-[#6B85F6]/10">⋮</button>{openAkunMenuId === s.id && <div style={{ top: akunMenuPos.top, right: akunMenuPos.right }} className="fixed z-50 w-28 overflow-hidden rounded-lg border border-border bg-surface py-1 text-left shadow-md"><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); openEditAkun(s); }} className="block w-full px-3 py-2 text-xs hover:bg-[#6B85F6]/10">{t("Edit")}</button><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); void handleDeleteAkun(s.id); }} className="block w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50">{t("Hapus")}</button></div>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "AKUN" && accountRole === "GURU" && (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3 md:grid-cols-[240px_minmax(220px,1fr)_auto] md:items-end">
                <label className={FIELD_LABEL_CLASS}>
                  {t("Mapel")}
                  <select value={mapelFilter} onChange={(event) => setMapelFilter(event.target.value)} className={FIELD_CLASS}>
                    <option value="">{t("Semua Mapel")}</option>
                    {mapelOptions.map((mapel) => <option key={mapel} value={mapel}>{mapel}</option>)}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  {t("Cari")}
                  <input value={guruSearch} onChange={(event) => setGuruSearch(event.target.value)} placeholder={t("Nama, email, atau NIK...")} className={FIELD_CLASS} />
                </label>
                <button type="button" onClick={() => { setMapelFilter(""); setGuruSearch(""); }}                 className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-[#f8f9fc]">{t("Reset")}</button>
              </div>
              {filteredGuruList.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("Belum ada guru terdaftar.")}</p>
              ) : (
                <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-border text-xs text-muted-foreground"><tr>
                      <th className="pb-3 font-semibold">{t("No")}</th><th className="pb-3 font-semibold">{t("Profil")}</th><th className="pb-3 font-semibold">{t("Nama")}</th><th className="pb-3 font-semibold">{t("Email")}</th><th className="pb-3 font-semibold">{t("NIK")}</th><th className="pb-3 font-semibold">{t("Status Guru")}</th><th className="pb-3 font-semibold">{t("Mapel")}</th><th className="pb-3 text-right font-semibold">{t("Aksi")}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#edf0f5]">{filteredGuruList.map((g, index) => (
                      <tr key={g.id} onClick={() => router.push(`/profil/${g.id}`)} className="cursor-pointer hover:bg-[#6B85F6]/10">
                        <td className="py-3 text-xs text-muted-foreground">{index + 1}</td>
                        <td className="py-3"><Avatar foto={g.fotoProfil} nama={g.nama} /></td>
                        <td className="py-3 font-semibold text-foreground">{g.nama}</td><td className="py-3 text-xs text-muted-foreground">{g.email}</td><td className="py-3 text-xs text-muted-foreground">{g.nik ?? "-"}</td>
                        <td className="py-3"><Badge tone="green">{t("Aktif")}</Badge></td>
                        <td className="py-3 text-xs text-muted-foreground">{Array.from(new Set(g.kelasGuruMapel?.map((item) => item.mapel.nama) ?? [])).join(", ") || t("Belum ada mapel")}</td>
                        <td className="relative whitespace-nowrap py-3 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); toggleAkunMenu(g.id, event.currentTarget); }} aria-label={t("Menu aksi")} className="rounded-lg p-2 text-lg font-bold text-muted-foreground hover:bg-[#6B85F6]/10">⋮</button>{openAkunMenuId === g.id && <div style={{ top: akunMenuPos.top, right: akunMenuPos.right }} className="fixed z-50 w-28 overflow-hidden rounded-lg border border-border bg-surface py-1 text-left shadow-md"><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); openEditAkun(g); }} className="block w-full px-3 py-2 text-xs hover:bg-[#6B85F6]/10">{t("Edit")}</button><button type="button" onClick={(event) => { event.stopPropagation(); setOpenAkunMenuId(null); void handleDeleteAkun(g.id); }} className="block w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50">{t("Hapus")}</button></div>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "AKUN" && accountRole !== "SISWA" && accountRole !== "GURU" && (
            <section className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-semibold text-foreground">{t(ACCOUNT_ROLES.find(({ value }) => value === accountRole)?.label ?? "")}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(accountRole === "SUPER_ADMIN" ? "Akun Super Admin yang terdaftar di database." : "Satu akun untuk role ini. Akun yang sudah ada akan langsung tampil di sini.")}
                </p>
              </div>
              {staffLoadError ? <p role="alert" className="p-5 text-sm text-danger">{staffLoadError}</p> : (
                <div className="divide-y divide-border">
                  {staffList.filter((account) => account.role === accountRole).map((account) => (
                    <button key={account.id} type="button" onClick={() => router.push(`/profil/${account.id}`)} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-muted sm:px-5">
                      <Avatar foto={account.fotoProfil} nama={account.nama} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{account.nama}</span>
                        <span className="block truncate text-xs text-muted-foreground">{account.email}</span>
                      </span>
                      {account.passwordSementara && <Badge tone="brand">{t("Password awal")}</Badge>}
                      <span className="text-xs text-accent-text">{t("Lihat profil")} →</span>
                    </button>
                  ))}
                  {!staffList.some((account) => account.role === accountRole) && <p className="p-5 text-sm text-muted-foreground">{t("Belum ada akun")} {t(ACCOUNT_ROLES.find(({ value }) => value === accountRole)?.label ?? "")}.</p>}
                </div>
              )}
            </section>
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
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-700">{t("Hapus kelas")} {deletingKelas?.judul}?</p>
            <p className="mt-2 text-sm leading-6 text-red-600">
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
      <Modal open={showStaffModal} onClose={() => setShowStaffModal(false)} title={`${t("Tambah Akun")} ${t(ACCOUNT_ROLES.find(({ value }) => value === accountRole)?.label ?? "Pengelola")}`}>
        <form onSubmit={(event) => void handleCreateStaff(event)} className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("Akun ini akan diminta mengganti password awal saat login pertama.")}</p>
          <Input label={t("Nama lengkap")} value={staffNama} onChange={(event) => setStaffNama(event.target.value)} required maxLength={120} autoComplete="name" />
          <Input label="Email" type="email" value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} required autoComplete="email" />
          <Input label={t("Password awal")} type="password" value={staffPassword} onChange={(event) => setStaffPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
          {staffError && <p role="alert" className="text-sm text-danger">{staffError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setShowStaffModal(false)}>{t("Batal")}</Button>
            <Button type="submit" loading={savingStaff}>{t("Buat Akun")}</Button>
          </div>
        </form>
      </Modal>
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
  .admin-shell[data-admin-theme="dark"] { background: var(--background) !important; color: var(--foreground); }

  /* Permukaan */
  [data-admin-theme="dark"] header,
  [data-admin-theme="dark"] .bg-white { background-color: var(--surface) !important; }
  [data-admin-theme="dark"] [class~="bg-[#F9FAFB]"],
  [data-admin-theme="dark"] [class~="bg-[#F8FAFC]"],
  [data-admin-theme="dark"] [class~="bg-[#f7f8fd]"],
  [data-admin-theme="dark"] [class~="bg-[#f6f7fb]"],
  [data-admin-theme="dark"] [class~="bg-[#f8f9fc]"],
  [data-admin-theme="dark"] [class~="bg-gray-50"],
  [data-admin-theme="dark"] [class~="bg-slate-50"] { background-color: var(--background) !important; }
  [data-admin-theme="dark"] [class~="bg-gray-100"],
  [data-admin-theme="dark"] [class~="bg-slate-100"] { background-color: var(--surface-muted) !important; }
  [data-admin-theme="dark"] [class~="bg-[#eef1f8]"] { background-color: var(--surface-muted) !important; }
  [data-admin-theme="dark"] [class~="bg-[#E5E7EB]"] { background-color: var(--border) !important; }

  /* Border (border brand #6B85F6 tetap dipertahankan) */
  [data-admin-theme="dark"] header,
  [data-admin-theme="dark"] .border:not([class~="border-[#6B85F6]"]),
  [data-admin-theme="dark"] [class~="border-[#e1e5ed]"],
  [data-admin-theme="dark"] [class~="border-[#dfe4ef]"],
  [data-admin-theme="dark"] [class~="border-[#e6e9f0]"],
  [data-admin-theme="dark"] [class~="border-[#edf0f5]"],
  [data-admin-theme="dark"] [class~="border-[#e5e8ef]"],
  [data-admin-theme="dark"] [class~="border-[#E2E8F0]"],
  [data-admin-theme="dark"] [class~="border-[#F1F5F9]"] { border-color: var(--border) !important; }
  [data-admin-theme="dark"] .divide-y > :not([hidden]) ~ :not([hidden]),
  [data-admin-theme="dark"] .divide-x > :not([hidden]) ~ :not([hidden]) { border-color: var(--border) !important; }

  /* Teks utama */
  [data-admin-theme="dark"] :is(
    [class*="text-[#111827]" i], [class*="text-[#182033]" i], [class*="text-[#0F172A]" i],
    [class*="text-[#1E293B]" i], [class*="text-[#1F2937]" i], [class*="text-[#334155]" i],
    [class*="text-[#374151]" i], [class*="text-black"],
    [class~="text-gray-900"], [class~="text-gray-800"], [class~="text-gray-700"],
    [class~="text-slate-900"], [class~="text-slate-800"], [class~="text-slate-700"]
  ) { color: var(--foreground) !important; }

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
  ) { color: var(--muted-foreground) !important; }

  /* Hover: selalu ungu transparan, teks tidak berubah */
  [data-admin-theme="dark"] [class*="hover:bg-"]:hover:not([class~="hover:bg-[#5974ed]"]):not([class~="hover:bg-red-50"]) { background-color: rgba(107, 133, 246, .14) !important; }
  [data-admin-theme="dark"] [class~="hover:bg-red-50"]:hover { background-color: rgba(239, 68, 68, .14) !important; }
  [data-admin-theme="dark"] [class~="hover:border-[#bdc8f8]"]:hover { border-color: #6B85F6 !important; }
  [data-admin-theme="dark"] .admin-shell main table tbody tr:hover,
  .admin-shell[data-admin-theme="dark"] main table tbody tr:hover { background-color: rgba(107, 133, 246, .12) !important; }

  /* Form */
  [data-admin-theme="dark"] input:not([type="checkbox"]):not([type="radio"]):not([type="file"]),
  [data-admin-theme="dark"] select,
  [data-admin-theme="dark"] textarea { background-color: var(--surface) !important; border-color: var(--border) !important; color: var(--foreground) !important; }
  [data-admin-theme="dark"] input::placeholder,
  [data-admin-theme="dark"] textarea::placeholder { color: var(--muted-foreground) !important; }
  [data-admin-theme="dark"] option { background-color: var(--surface); color: var(--foreground); }

  /* Tabel */
  .admin-shell[data-admin-theme="dark"] main table thead { background-color: var(--surface-muted) !important; }
  .admin-shell[data-admin-theme="dark"] main table tbody td { color: var(--muted-foreground); }

  /* Grafik SVG */
  [data-admin-theme="dark"] svg line[stroke="#e6e9f0"] { stroke: var(--border); }
  [data-admin-theme="dark"] svg circle[fill="#ffffff"] { fill: var(--surface); }
  [data-admin-theme="dark"] svg text[fill="#8490a3"] { fill: var(--muted-foreground); }

  /* Kotak peringatan (modal hapus) */
  [data-admin-theme="dark"] [class~="bg-red-50"] { background-color: rgba(239, 68, 68, .12) !important; }
  [data-admin-theme="dark"] [class~="border-red-100"] { border-color: rgba(239, 68, 68, .35) !important; }
  [data-admin-theme="dark"] :is([class~="text-red-700"], [class~="text-red-600"]) { color: #fca5a5 !important; }

  [data-admin-theme="dark"] footer { background: var(--surface) !important; border-color: var(--border) !important; }
`}</style>
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
    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-muted-foreground">
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
        <span className="font-semibold text-muted-foreground">{t(label)}</span>
        <span className="font-bold text-foreground">{value}</span>
      </div>
      <div className="h-2 bg-surface-muted">
        <div className="h-2" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}
