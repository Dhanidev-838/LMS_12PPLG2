"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/shared/theme-toggle";
import styles from "@/app/admin/admin.module.css";
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
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/i18n";
import ClassMemberPresence from "@/components/kelas/ClassMemberPresence";
import TranslateContent, { TranslatedOption } from "@/components/TranslateContent";

type AdminTab = "DASHBOARD" | "KELAS" | "AKUN" | "MAPEL" | "LAPORAN" | "PERFORMA";
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

const ADMIN_TABS: { key: AdminTab; label: string }[] = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "KELAS", label: "Buat Kelas" },
  { key: "AKUN", label: "Daftar Akun" },
  { key: "MAPEL", label: "Mata Pelajaran" },
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
    isActive?: boolean;
    deskripsi: string | null;
    kelasReferensi: { id: string; label: string } | null;
  };
}
interface GuruDiKelas {
  id: string;
  guru: { id: string; nama: string; nik: string | null; fotoProfil: string | null; isActive?: boolean; deskripsi: string | null };
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
  const { t } = useLanguage();

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
    if (!(await showConfirm(t("Keluarkan siswa ini dari kelas?")))) return;
    await fetch(`/api/akun/${siswaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kelasIds: kelasIdsLama.filter((id) => id !== kelasId) }),
    });
    loadKelas();
  }

  async function handleHapusGuru(guruId: string, mapelId: string, kelasIdsLama: string[]) {
    if (!(await showConfirm(t("Keluarkan guru ini dari kelas?")))) return;
    await fetch(`/api/akun/${guruId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kelasIds: kelasIdsLama.filter((id) => id !== kelasId), mapelId }),
    });
    loadKelas();
  }

  if (loading) {
    return (
      <div data-admin-theme={theme} className={`${styles.root} flex min-h-screen items-center justify-center bg-surface-muted`}>
        <p className="text-sm text-muted-foreground">{t("Memuat...")}</p>
      </div>
    );
  }

  if (!kelas) {
    return (
      <div data-admin-theme={theme} className={`${styles.root} flex min-h-screen flex-col items-center justify-center gap-3 bg-surface-muted`}>
        <p className="text-sm text-muted-foreground">{t("Kelas tidak ditemukan.")}</p>
        <Button variant="outline" onClick={() => router.push("/admin")}>
          {t("Kembali")}
        </Button>
      </div>
    );
  }

  const siswaGrouped = kelas.siswa.reduce((acc: Record<string, SiswaDiKelas[]>, ks) => {
    const label = ks.siswa.kelasReferensi?.label ?? t("Belum Ada Kelas");
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
    <div data-admin-theme={theme} className={`${styles.root} flex min-h-screen flex-col bg-background text-foreground`} style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
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
              <p className="text-xs text-muted-foreground">{t(canManageClass ? "Admin" : "Guru")}</p>
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
          <Button size="sm" variant="outline" onClick={() => router.push(canManageClass ? "/admin" : "/guru")}>
            {t("Kembali")}
          </Button>
        </div>
      </header>

      <div className="flex w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-overlay lg:hidden" />
        )}

        <aside
          aria-label={t(canManageClass ? "Navigasi admin" : "Navigasi guru")}
          className={`fixed inset-y-0 left-0 z-50 w-[min(88vw,22.5rem)] shrink-0 overflow-x-hidden overflow-y-auto bg-background p-0 shadow-lg transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "visible translate-x-0" : "invisible -translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:invisible lg:w-0 lg:border-0 lg:p-0" : "lg:visible lg:w-80"}`}
        >
          <div className={`flex min-h-full min-w-0 w-full flex-col border border-border bg-surface p-4 rounded-[var(--radius-card)]`}>
            <button type="button" aria-label={t("Tutup navigasi")} onClick={() => setSidebarOpen(false)} className="mb-2 flex h-10 w-10 self-end items-center justify-center rounded-lg border border-border text-xl text-foreground hover:bg-surface-muted lg:hidden">×</button>
            <p className="mb-3 px-2 pt-2 text-sm font-bold text-foreground">
              {t(canManageClass ? "Dashboard Admin" : "Dashboard Guru")}
              <br />
              <span className="text-accent-text">{canManageClass ? `- ${t("Detail Kelas")}` : `- ${t("Kelas")}`}</span>
            </p>
            <nav className="flex flex-col gap-1">
              {canManageClass
                ? ADMIN_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => navigateToAdminTab(tab.key)}
                      title={t(tab.label)}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-surface-muted ${tab.key === "KELAS" ? "bg-surface-muted text-accent-text shadow-[inset_3px_0_0_var(--accent)]" : "text-muted-foreground"}`}
                    >
                      <TabIcon tab={tab.key} />
                      <span>{t(tab.label)}</span>
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
                            ? { background: "var(--surface-muted)", color: "var(--accent-text)", boxShadow: "inset 3px 0 0 var(--accent)" }
                            : { background: "var(--surface)", color: "var(--accent-text)", boxShadow: "inset 3px 0 0 var(--accent)" }
                          : { background: "transparent", color: "var(--muted-foreground)" }
                      }
                    >
                      <GuruNavIcon nav={nav} />
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
          <div className="mx-auto w-full max-w-5xl">
            <section className="border border-border border-l-4 border-l-accent bg-surface p-4 sm:p-6 rounded-[var(--radius-card)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-accent-text">{t("Detail Kelas")}</p>
                  <h1 className="mt-1 break-words text-xl font-bold text-foreground sm:text-2xl">
                    <TranslateContent text={kelas.judul} textClassName="block" />
                  </h1>
                  {kelas.deskripsi && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      <TranslateContent text={kelas.deskripsi} textClassName="block" />
                    </p>
                  )}
                </div>
                {canManageClass && (
                  <Button variant="outline" onClick={() => setShowEditKelas(true)} className="w-full flex-shrink-0 sm:w-auto">
                    {t("Edit Kelas")}
                  </Button>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{t("Kode Kelas")}</p>
                  <p className="mt-1 break-all text-sm font-semibold text-foreground">{kelas.inviteToken}</p>
                </div>
                <button
                  onClick={handleCopyInvite}
                  className="inline-flex min-h-10 w-full flex-shrink-0 cursor-pointer items-center justify-center gap-2 border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted sm:w-auto rounded-[var(--radius-card)]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <rect x="9" y="9" width="12" height="12" rx="2" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                  </svg>
                  {copied ? t("Tersalin!") : t("Salin Link Undangan")}
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
                    className={`flex min-h-[72px] min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-card)] border px-3 py-3 text-left transition-colors sm:px-4 ${isActive ? "border-accent bg-surface-muted" : "border-border bg-surface hover:border-accent hover:bg-surface-muted"}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-foreground">{t(isStudent ? "Siswa" : "Guru")}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{t("Lihat daftar")}</span>
                    </span>
                    <span className={`flex h-9 min-w-9 flex-shrink-0 items-center justify-center rounded-lg px-2 text-sm font-bold ${isActive ? "bg-accent text-accent-foreground" : "bg-surface-muted text-foreground"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {section === "SISWA" && (
              <div className="mt-3 border border-border bg-surface p-3 sm:p-4 rounded-[var(--radius-card)]">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{t("Deretan Siswa")}</p>
                  <div className="flex items-center gap-2">
                    {canManageClass && (
                      <Button size="sm" onClick={() => setShowTambahSiswa(true)}>
                        + {t("Tambah Siswa")}
                      </Button>
                    )}
                    <button
                      type="button"
                      aria-label={t("Tutup deretan siswa")}
                      onClick={() => setSection(null)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-lg text-muted-foreground hover:bg-surface-muted"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {Object.keys(siswaGrouped).length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("Belum ada siswa di kelas ini.")}</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(siswaGrouped).map(([label, list]) => {
                      const isOpen = expandedRombel === label;
                      return (
                        <div key={label} className="border border-border bg-surface rounded-[var(--radius-card)]">
                          <button
                            onClick={() => setExpandedRombel(isOpen ? null : label)}
                            className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-foreground">{label}</p>
                              <Badge tone="brand">{list.length} {t("Siswa")}</Badge>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>
                          {isOpen && (
                            <div className="space-y-2 border-t border-border p-4">
                              {list.map((ks) => (
                                <div key={ks.siswaId} className="flex items-center gap-3 border border-border p-3 rounded-[var(--radius-card)]">
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/profil/${ks.siswa.id}`)}
                                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                                  >
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-xs font-bold text-muted-foreground">
                                      {ks.siswa.fotoProfil ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={ks.siswa.fotoProfil} alt={ks.siswa.nama} className="h-full w-full object-cover" />
                                      ) : (
                                        ks.siswa.nama.charAt(0)
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-foreground">{ks.siswa.nama}</p><ClassMemberPresence isActive={ks.siswa.isActive ?? false} t={t} />
                                    </div>
                                  </button>
                                  {canManageClass && (
                                    <button
                                      onClick={() => handleHapusSiswa(ks.siswa.id, [kelasId])}
                                      className="cursor-pointer text-xs font-medium text-danger hover:underline"
                                    >
                                      {t("Hapus")}
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
              <div className="mt-3 border border-border bg-surface p-3 sm:p-4 rounded-[var(--radius-card)]">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{t("Deretan Guru")}</p>
                  <div className="flex items-center gap-2">
                    {canManageClass && (
                      <Button size="sm" onClick={() => setShowTambahGuru(true)}>
                        + {t("Tambah Guru")}
                      </Button>
                    )}
                    <button
                      type="button"
                      aria-label={t("Tutup deretan guru")}
                      onClick={() => setSection(null)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-lg text-muted-foreground hover:bg-surface-muted"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {Object.keys(guruGrouped).length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("Belum ada guru mengajar di kelas ini.")}</p>
                ) : (
                  Object.entries(guruGrouped).map(([mapel, list]) => (
                    <div key={mapel} className="mb-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{mapel}</p>
                      <div className="space-y-2">
                        {list.map((gm) => (
                          <div key={gm.id} className="flex items-center gap-3 border border-border bg-surface p-3 rounded-[var(--radius-card)]">
                            <button
                              type="button"
                              onClick={() => router.push(`/profil/${gm.guru.id}`)}
                              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-xs font-bold text-muted-foreground">
                                {gm.guru.fotoProfil ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={gm.guru.fotoProfil} alt={gm.guru.nama} className="h-full w-full object-cover" />
                                ) : (
                                  gm.guru.nama.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">{gm.guru.nama}</p><ClassMemberPresence isActive={gm.guru.isActive ?? false} t={t} />
                              </div>
                            </button>
                            {canManageClass && (
                              <button
                                onClick={() => handleHapusGuru(gm.guru.id, gm.mapel.id, [kelasId])}
                                className="cursor-pointer text-xs font-medium text-danger hover:underline"
                              >
                                {t("Hapus")}
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
              <section className="mt-7 border-t border-border pt-5">
                <div className="mb-3">
                  <h2 className="text-base font-bold text-foreground">{t("Aktivitas Kelas")}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{t("Pengumuman, materi, tugas, dan asesmen di kelas ini.")}</p>
                </div>
                <KelasFeedFilter value={feedFilter} onChange={setFeedFilter} />
                <div className="mt-3 space-y-3">
                  {filteredFeed.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t(kelas.feed.length === 0 ? "Belum ada aktivitas di kelas ini." : "Tidak ada konten untuk filter ini.")}</p>
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
                        <div key={`a-${i}`} className="border border-border bg-surface p-4 rounded-[var(--radius-card)]">
                          <div className="flex items-center gap-2">
                            <Badge tone="brand">{t(a.tipe === "KUIS" ? "Kuis" : "Ujian Online")}</Badge>
                            {a.mapel && <Badge tone="gray"><TranslateContent text={a.mapel.nama} textClassName="inline" /></Badge>}
                          </div>
                          <TranslateContent text={a.judul} className="mt-2 block" textClassName="text-sm font-bold text-foreground" />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {a._count?.soal ?? 0} {t("soal")} · {t("oleh")} {a.guru?.nama}
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

      <footer className="no-print mt-10 border-t border-border bg-surface">
        <p className="px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">© 2026 Classify. {t("Sistem pembelajaran yang lebih terarah.")}</p>
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
  const { t } = useLanguage();
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
    if (!(await showConfirm(t("Tambahkan semua {count} siswa dari rombel ini ke kelas?").replace("{count}", String(kandidat.length))))) return;

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
        setBulkError(t(data.error ?? "Siswa gagal ditambahkan."));
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setBulkError(t("Siswa gagal ditambahkan. Coba lagi."));
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("Tambah Siswa")}>
      <div className="space-y-4">
        <Select label={t("Pilih Kelas/Rombel")} placeholder={t("Pilih rombel dulu")} value={rombelId} onChange={(e) => setRombelId(e.target.value)}>
          {rombelList.map((r) => (
            <TranslatedOption key={r.id} value={r.id} text={r.label} />
          ))}
        </Select>

        {loading && <p className="text-xs text-muted-foreground">{t("Memuat...")}</p>}

        {!loading && rombelId && kandidat.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("Semua siswa di rombel ini sudah ada di kelas.")}</p>
        )}

        {kandidat.length > 0 && (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {kandidat.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-surface-muted">
                <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggle(s.id)} />
                <span className="text-sm text-foreground">{s.nama}</span>
              </label>
            ))}
          </div>
        )}

        {bulkError && <p className="text-xs font-medium text-danger">{bulkError}</p>}

        {kandidat.length > 0 && (
          <Button type="button" variant="outline" className="w-full" loading={bulkSubmitting} disabled={submitting} onClick={() => void handleAddAll()}>
            {t("Tambah semua siswa rombel ({count})").replace("{count}", String(kandidat.length))}
          </Button>
        )}
        <Button type="button" className="w-full" loading={submitting} disabled={selectedIds.length === 0 || bulkSubmitting} onClick={handleSubmit}>
          {t("Tambah")} {selectedIds.length > 0 ? `(${selectedIds.length})` : t("siswa terpilih")}
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
  const { t } = useLanguage();
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
    <Modal open={open} onClose={onClose} title={t("Tambah Guru")}>
      <div className="space-y-4">
        <Select label={t("Pilih Guru")} placeholder={t("Pilih guru")} value={guruId} onChange={(e) => setGuruId(e.target.value)}>
          {guruList.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </Select>

        <Select label={t("Mapel")} placeholder={t("Pilih mapel")} value={mapelId} onChange={(e) => setMapelId(e.target.value)}>
          {mapelList.map((m) => (
            <TranslatedOption key={m.id} value={m.id} text={m.nama} />
          ))}
        </Select>

        <Button className="w-full" loading={submitting} disabled={!guruId || !mapelId} onClick={handleSubmit}>
          {t("Tambah Guru")}
        </Button>
      </div>
    </Modal>
  );
}
