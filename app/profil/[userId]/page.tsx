// app/profil/[userId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ModalEditProfil from "@/components/ModalEditProfil";
import { useAdminTheme } from "@/lib/use-admin-theme";
import ThemeToggle from "@/components/shared/theme-toggle";
import styles from "@/app/admin/admin.module.css";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/i18n";


type Role = "ADMIN" | "SUPER_ADMIN" | "KEPSEK" | "KURIKULUM" | "GURU" | "SISWA";

interface ProfilData {
  id: string;
  nama: string;
  role: Role;
  fotoProfil: string | null;
  deskripsi: string | null;
  jenisKelamin: string | null;
  rombel: string | null;
  jurusan: string | null;
  mapel: string[];
  nis: string | null;
  nik: string | null;
  bolehLihatIdentitas: boolean;
  isSelf: boolean;
}

const roleLabel: Record<Role, string> = {
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
  KEPSEK: "Kepsek",
  KURIKULUM: "Kurikulum",
  GURU: "Guru",
  SISWA: "Siswa",
};

// ---- sidebar nav per role viewer ----
type AdminTab = "DASHBOARD" | "KELAS" | "AKUN" | "MAPEL" | "LAPORAN" | "PERFORMA";
type GuruSiswaNav = "DASHBOARD" | "KELAS" | "ASESMEN" | "TUGAS" | "MATERI" | "PERFORMA" | "PROFILE";

const ADMIN_TABS: { key: AdminTab; label: string }[] = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "KELAS", label: "Buat Kelas" },
  { key: "AKUN", label: "Daftar Akun" },
  { key: "MAPEL", label: "Mata Pelajaran" },
  { key: "LAPORAN", label: "Laporan" },
  { key: "PERFORMA", label: "Performa Akademik" },
];
const KEPSEK_TABS: { key: string; label: string; href: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kepsek" },
  { key: "KELAS", label: "Kelas", href: "/kepsek?tab=KELAS" },
  { key: "AKUN", label: "Daftar Akun", href: "/kepsek?tab=AKUN" },
  { key: "ASESMEN", label: "Asesmen", href: "/kepsek?tab=ASESMEN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kepsek?tab=PERFORMA" },
];
const KURIKULUM_TABS: { key: string; label: string; href: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kurikulum" },
  { key: "KELAS", label: "Kelas", href: "/kurikulum?tab=KELAS" },
  { key: "AKUN", label: "Daftar Akun", href: "/kurikulum?tab=AKUN" },
  { key: "ASESMEN", label: "Asesmen", href: "/kurikulum?tab=ASESMEN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kurikulum?tab=PERFORMA" },
];

type KepsekNav = "DASHBOARD" | "KELAS" | "AKUN" | "ASESMEN" | "PERFORMA";

function KepsekIcon({ nav }: { nav: KepsekNav }) {
  const paths: Record<KepsekNav, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    AKUN: <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.87a4 4 0 0 1 0 7.75" />,
    ASESMEN: <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 4h4m-4 4h4m-4 4h4" />,
    PERFORMA: <path d="M4 19V5M4 19h17M8 16v-4M13 16V8M18 16V4" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[nav]}
    </svg>
  );
}

function GuruSiswaIcon({ nav }: { nav: GuruSiswaNav }) {
  const paths: Record<GuruSiswaNav, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    ASESMEN: <path d="M12 2l3 6 6.5.9-4.7 4.6L18 20l-6-3.4L6 20l1.2-6.5L2.5 8.9 9 8l3-6Z" />,
    TUGAS: <path d="M9 3h6l1 3H8l1-3ZM6 6h12v15H6zM9 11h6M9 15h6" />,
    MATERI: <path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6M9 17h6" />,
    PERFORMA: <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16V4" />,
    PROFILE: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[nav]}
    </svg>
  );
}
function AdminIcon({ tab }: { tab: AdminTab }) {
  const paths: Record<AdminTab, React.ReactNode> = {
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

export default function ProfilPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { t } = useLanguage();

  const [me, setMe] = useState<{ id: string; nama: string; role: Role; fotoProfil: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useAdminTheme();

  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-admin-theme", theme);
    return () => document.documentElement.removeAttribute("data-admin-theme");
  }, [theme]);

  async function loadProfil() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/profil/${userId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(t(data.error ?? "Gagal memuat profil."));
        setLoading(false);
        return;
      }
      setProfil(data.data);
    } catch {
      setError(t("Terjadi kesalahan."));
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
    setSidebarOpen((value) => !value);
  }

  const dashboardLabel = me
    ? me.role === "ADMIN"
      ? "Dashboard Admin"
      : me.role === "SUPER_ADMIN"
      ? "Dashboard Super Admin"
      : me.role === "KEPSEK"
      ? "Dashboard Kepsek"
      : me.role === "KURIKULUM"
      ? "Dashboard Kurikulum"
      : me.role === "GURU"
      ? "Dashboard Guru"
      : "Dashboard Siswa"
    : "Dashboard";

  const isSiswa = profil?.role === "SISWA";
  const isGuru = profil?.role === "GURU";
  const canViewStudentPerformance = Boolean(
    isSiswa && !profil?.isSelf && me && ["ADMIN", "SUPER_ADMIN", "KEPSEK", "KURIKULUM", "GURU"].includes(me.role),
  );
  const dashboardHref = me?.role === "SUPER_ADMIN" ? "/super-admin" : me?.role === "ADMIN" ? "/admin" : me?.role === "KEPSEK" ? "/kepsek" : me?.role === "KURIKULUM" ? "/kurikulum" : me?.role === "GURU" ? "/guru" : "/siswa";

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(dashboardHref);
  }

  return (
    <div data-admin-theme={theme} className={`admin-shell ${styles.root} flex min-h-screen flex-col bg-background text-foreground`}>
      <header className="no-print sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
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
          <div className="relative h-8 w-8 flex-shrink-0">
            <Image src="/Logo1.png" alt="Classify" fill sizes="32px" className="rounded-[9px] object-contain" />
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
              <p className="text-sm font-semibold text-foreground">{me.nama}</p>
              <p className="text-xs text-muted-foreground">{t(roleLabel[me.role])}</p>
            </div>
          )}
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-surface text-xs font-bold text-muted-foreground">
            {me?.fotoProfil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.fotoProfil} alt={me.nama} className="h-full w-full object-cover" />
            ) : (
              me?.nama?.charAt(0) ?? "?"
            )}
          </div>
          <Button size="sm" variant="outline" onClick={goBack} className="hidden sm:inline-flex">{t("Kembali")}</Button>
        </div>
      </header>

      <div className="flex w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="no-print fixed inset-0 z-40 bg-overlay lg:hidden" />
        )}

        <aside
          className={`no-print fixed inset-y-0 left-0 z-50 w-[min(88vw,22.5rem)] shrink-0 overflow-x-hidden overflow-y-auto bg-background p-0 shadow-lg transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "visible translate-x-0" : "invisible -translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:invisible lg:w-0 lg:border-0 lg:p-0" : "lg:visible lg:w-80"}`}
          aria-label={t("Navigasi")}
        >
          <div className="flex min-h-full min-w-0 flex-col rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <button type="button" aria-label={t("Tutup navigasi")} onClick={() => setSidebarOpen(false)} className="mb-2 flex h-10 w-10 self-end items-center justify-center rounded-lg border border-border text-xl text-foreground hover:bg-surface-muted lg:hidden">×</button>
            <p className="mb-3 px-2 pt-2 text-sm font-bold text-foreground">
              {dashboardLabel}
              <br />
              <span className="text-accent-text">- {t("Profile")}</span>
            </p>
            <nav className="flex flex-col gap-1">
              {(me?.role === "ADMIN" || me?.role === "SUPER_ADMIN") &&
                ADMIN_TABS.map((tab) => (
                  <Link
                    key={tab.key}
                    href={me.role === "SUPER_ADMIN" ? tab.key === "DASHBOARD" ? "/super-admin" : `/super-admin?tab=${tab.key}` : `/admin?tab=${tab.key}`}
                    onClick={() => setSidebarOpen(false)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                  >
                    <AdminIcon tab={tab.key} />
                    <span>{t(tab.label)}</span>
                  </Link>
                ))}

              {me?.role === "SUPER_ADMIN" && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t("Ruang Pembelajaran")}</p>
                  {(["ASESMEN", "TUGAS", "MATERI"] as GuruSiswaNav[]).map((nav) => (
                    <Link key={nav} href={`/super-admin/${nav.toLowerCase()}`} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground">
                      <GuruSiswaIcon nav={nav} />
                      {t(nav === "ASESMEN" ? "Asesmen" : nav === "TUGAS" ? "Tugas" : "Materi")}
                    </Link>
                  ))}
                </div>
              )}

              {(me?.role === "KEPSEK" ? KEPSEK_TABS : me?.role === "KURIKULUM" ? KURIKULUM_TABS : []).map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  {me?.role === "ADMIN" ? <AdminIcon tab={tab.key as AdminTab} /> : <KepsekIcon nav={tab.key as KepsekNav} />}
                  {t(tab.label)}
                </Link>
              ))}

              {(me?.role === "GURU" || me?.role === "SISWA") &&
                (
                  [
                    ["DASHBOARD", "Dashboard", me.role === "GURU" ? "/guru" : "/siswa"],
                    ["KELAS", "Kelas", me.role === "GURU" ? "/guru/kelas" : "/siswa/kelas"],
                    ["ASESMEN", "Asesmen", me.role === "GURU" ? "/guru/asesmen" : "/siswa/asesmen"],
                    ["TUGAS", "Tugas", me.role === "GURU" ? "/guru/tugas" : "/siswa/tugas"],
                    ["MATERI", "Materi", me.role === "GURU" ? "/guru/materi" : "/siswa/materi"],
                    ["PERFORMA", "Performa Akademik", me.role === "GURU" ? "/guru/performa-akademik" : "/siswa/performa-akademik"],
                    ["PROFILE", "Profile", `/profil/${me.id}`],
                  ] as [GuruSiswaNav, string, string][]
                ).map(([nav, label, href]) => (
                  <Link
                    key={nav}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-muted ${nav === "PROFILE" ? "bg-surface-muted text-accent-text shadow-[inset_3px_0_0_var(--accent)]" : "text-muted-foreground"}`}
                  >
                    <GuruSiswaIcon nav={nav} />
                    {t(label)}
                  </Link>
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
          <div className="profile-print-area mx-auto w-full max-w-5xl">
            <div className="no-print mb-4 flex items-center justify-between gap-3 sm:hidden">
              <Button size="sm" variant="outline" onClick={goBack}>← {t("Kembali")}</Button>
              <Link href={dashboardHref} className="text-xs font-semibold text-accent-text">{t("Dashboard")}</Link>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">{t("Memuat...")}</p>
            ) : error || !profil ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm text-muted-foreground">{t(error || "Profil tidak ditemukan.")}</p>
              </div>
            ) : (
              <>
                {canViewStudentPerformance && profil && (
                  <Link
                    href={`/performa-siswa/${profil.id}`}
                    className="no-print mb-4 inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-subtle px-4 py-3 text-sm font-semibold text-accent-text transition-colors hover:border-accent hover:bg-accent/10"
                  >
                    <span>{t("Lihat")}</span> {t("Performa Akademik")} <span aria-hidden="true">→</span>
                  </Link>
                )}
                <div className="profile-card grid gap-4 lg:grid-cols-[1.12fr_.88fr]">
                  <div className="profile-card-header relative overflow-hidden rounded-[28px] bg-accent p-6 text-white shadow-[0_20px_50px_rgba(48,64,145,0.18)] sm:p-8">
                    <div className="relative flex items-start justify-between gap-3">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-white/90">
                        {t("Profil")} {t(roleLabel[profil.role])}
                      </span>
                      <div className="no-print flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          title={t("Cetak profil")}
                          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#435ac2] shadow-sm hover:bg-white/90"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                            <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <path d="M6 14h12v7H6z" />
                          </svg>
                          {t("Cetak")}
                        </button>
                        {profil.isSelf && (
                          <button
                            onClick={() => setShowEdit(true)}
                            className="cursor-pointer rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#435ac2] hover:bg-white/90"
                          >
                            {t("Edit Profile")}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative mt-16">
                      <div className="h-36 w-36 overflow-hidden rounded-[24px] border border-white/30 bg-white/15 shadow-lg">
                        {profil.fotoProfil ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profil.fotoProfil} alt={profil.nama} className="h-full w-full object-cover" />
                        ) : (
                              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                            {profil.nama.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="mt-6 max-w-md break-words text-3xl font-bold tracking-[-.04em] text-white sm:text-4xl">{profil.nama}</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">{t("Profil pengguna Classify untuk informasi akademik dan identitas dasar.")}</p>
                    </div>
                  </div>

                  <div className="profile-card-details rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
                    <div className="border-b border-border pb-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{t("Ringkasan")}</p>
                        <p className="mt-1 text-lg font-bold text-foreground">{t("Informasi utama")}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {profil.isSelf && <Badge tone="brand">{t("Aktif")}</Badge>}
                      {profil.rombel && <Badge tone="gray">{profil.rombel}</Badge>}
                      <Badge tone="gray">{t(roleLabel[profil.role])}</Badge>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {isSiswa && (
                        <div className="profile-info-card w-full min-w-0 rounded-lg border border-border bg-surface-muted p-3.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {profil.bolehLihatIdentitas ? t("NIS") : t("Status")}
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-foreground">
                            {profil.bolehLihatIdentitas ? profil.nis ?? "-" : t("Aktif")}
                          </p>
                        </div>
                      )}
                      {isGuru && (
                        <div className="profile-info-card w-full min-w-0 rounded-lg border border-border bg-surface-muted p-3.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {profil.bolehLihatIdentitas ? t("NIK") : t("Status")}
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-foreground">
                            {profil.bolehLihatIdentitas ? profil.nik ?? "-" : t("Aktif")}
                          </p>
                        </div>
                      )}

                      <div className="profile-info-card w-full min-w-0 rounded-lg border border-border bg-surface-muted p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("Peran")}</p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">{t(roleLabel[profil.role])}</p>
                      </div>

                      {isSiswa && (
                        <div className="profile-info-card w-full min-w-0 rounded-lg border border-border bg-surface-muted p-3.5 sm:col-span-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("Jurusan")}</p>
                          <p className="mt-0.5 text-sm font-bold text-foreground">{profil.jurusan ?? "-"}</p>
                        </div>
                      )}
                      {isGuru && (
                        <div className="profile-info-card w-full min-w-0 rounded-lg border border-border bg-surface-muted p-3.5 sm:col-span-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("Mapel")}</p>
                          <p className="mt-0.5 text-sm font-bold text-foreground">
                            {profil.mapel.length > 0 ? profil.mapel.join(", ") : "-"}
                          </p>
                        </div>
                      )}

                      <div className="profile-info-card w-full min-w-0 rounded-lg border border-border bg-surface-muted p-3.5 sm:col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("Jenis Kelamin")}</p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">
                          {profil.jenisKelamin ? t(profil.jenisKelamin) : "-"}
                        </p>
                      </div>

                      <div className="profile-info-card w-full min-w-0 rounded-lg border border-border bg-surface-muted p-3.5 sm:col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("Deskripsi")}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{profil.deskripsi || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="print-only-card">
                  <div className="print-card-identity">
                    <span className="print-card-label">CLASSIFY · {t("Profil").toUpperCase()} {t(roleLabel[profil.role]).toUpperCase()}</span>
                    <div className="print-card-photo">
                      {profil.fotoProfil ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profil.fotoProfil} alt={profil.nama} />
                      ) : (
                        <span>{profil.nama.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                  <div className="print-card-information">
                    <div className="print-card-heading">
                      <p className="print-card-eyebrow">{t("KARTU PROFIL")}</p>
                      <p className="print-card-title">{profil.nama}</p>
                    </div>
                    <div className="print-card-fields">
                      <div>
                        <span>{t(isSiswa ? "NIS" : "NIK")}</span>
                        <strong>{isSiswa ? profil.nis ?? "-" : profil.nik ?? "-"}</strong>
                      </div>
                      <div>
                        <span>{t("Status")}</span>
                        <strong>{t(roleLabel[profil.role])}</strong>
                      </div>
                      <div>
                        <span>{t(isSiswa ? "Jurusan" : "Mata Pelajaran")}</span>
                        <strong>{isSiswa ? profil.jurusan ?? "-" : profil.mapel.join(", ") || "-"}</strong>
                      </div>
                      <div>
                        <span>{t("Jenis Kelamin")}</span>
                        <strong>{profil.jenisKelamin ? t(profil.jenisKelamin) : "-"}</strong>
                      </div>
                    </div>
                    <div className="print-card-description">
                      <span>{t("Deskripsi")}</span>
                      <strong>{profil.deskripsi || "-"}</strong>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {profil?.isSelf && (
        <ModalEditProfil
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSuccess={loadProfil}
          userId={profil.id}
          initialNama={profil.nama}
          initialFoto={profil.fotoProfil}
          initialDeskripsi={profil.deskripsi}
        />
      )}

      <footer className="no-print mt-10 border-t border-border bg-surface">
        <p className="px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">© 2026 Classify. {t("Sistem pembelajaran yang lebih terarah.")}</p>
      </footer>
    </div>
  );
}
