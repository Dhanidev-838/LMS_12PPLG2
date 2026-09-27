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

const BRAND = "#6B85F6";

type Role = "ADMIN" | "KEPSEK" | "KURIKULUM" | "GURU" | "SISWA";

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
  isSelf: boolean;
}

const roleLabel: Record<Role, string> = {
  ADMIN: "Admin",
  KEPSEK: "Kepsek",
  KURIKULUM: "Kurikulum",
  GURU: "Guru",
  SISWA: "Siswa",
};

// ---- sidebar nav per role viewer ----
type AdminTab = "DASHBOARD" | "KELAS" | "SISWA" | "GURU" | "LAPORAN" | "PERFORMA";
type GuruSiswaNav = "DASHBOARD" | "KELAS" | "ASESMEN" | "TUGAS" | "PERFORMA" | "PROFILE";

const ADMIN_TABS: { key: AdminTab; label: string }[] = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "KELAS", label: "Buat Kelas" },
  { key: "SISWA", label: "Daftar Siswa" },
  { key: "GURU", label: "Daftar Guru" },
  { key: "LAPORAN", label: "Laporan" },
  { key: "PERFORMA", label: "Performa Akademik" },
];
const KEPSEK_TABS: { key: string; label: string; href: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kepsek" },
  { key: "KELAS", label: "Kelas", href: "/kepsek?tab=KELAS" },
  { key: "SISWA", label: "Daftar Siswa", href: "/kepsek?tab=SISWA" },
  { key: "GURU", label: "Daftar Guru", href: "/kepsek?tab=GURU" },
  { key: "ASESMEN", label: "Asesmen", href: "/kepsek?tab=ASESMEN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kepsek?tab=PERFORMA" },
];
const KURIKULUM_TABS: { key: string; label: string; href: string }[] = [
  { key: "DASHBOARD", label: "Dashboard", href: "/kurikulum" },
  { key: "KELAS", label: "Kelas", href: "/kurikulum?tab=KELAS" },
  { key: "SISWA", label: "Daftar Siswa", href: "/kurikulum?tab=SISWA" },
  { key: "GURU", label: "Daftar Guru", href: "/kurikulum?tab=GURU" },
  { key: "ASESMEN", label: "Asesmen", href: "/kurikulum?tab=ASESMEN" },
  { key: "PERFORMA", label: "Performa Akademik", href: "/kurikulum?tab=PERFORMA" },
];

type KepsekNav = "DASHBOARD" | "KELAS" | "SISWA" | "GURU" | "ASESMEN" | "PERFORMA";

type KurikulumNav = KepsekNav;

function KepsekIcon({ nav }: { nav: KepsekNav }) {
  const paths: Record<KepsekNav, React.ReactNode> = {
    DASHBOARD: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    SISWA: <path d="M12 3 2 8l10 5 8-4v6M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />,
    GURU: <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 8h7 M9 12h7 M9 16h4" />,
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

export default function ProfilPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

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
        setError(data.error ?? "Gagal memuat profil.");
        setLoading(false);
        return;
      }
      setProfil(data.data);
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

  function navigateAdminTab(tab: AdminTab) {
    router.push(`/admin?tab=${tab}`);
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

  return (
    <div data-admin-theme={theme} className="admin-shell flex min-h-screen flex-col bg-[#f6f7fb]" style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="no-print sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-[#e6e9f0] bg-white px-4 sm:px-6">
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
          {me && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#182033]">{me.nama}</p>
              <p className="text-xs text-[#9CA3AF]">{me.role}</p>
            </div>
          )}
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
            {me?.fotoProfil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.fotoProfil} alt={me.nama} className="h-full w-full object-cover" />
            ) : (
              me?.nama?.charAt(0) ?? "?"
            )}
          </div>
          {profil && !profil.isSelf && (
            <Button size="sm" variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          )}
        </div>
      </header>

      <div className="flex w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="no-print fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden" />
        )}

        <aside
          className={`no-print fixed inset-y-0 left-0 z-50 w-72 overflow-hidden bg-[#f6f7fb] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-[transform,width,padding] duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-[88px] lg:z-0 lg:h-[calc(100vh-108px)] lg:translate-x-0 lg:self-start lg:shadow-none ${sidebarCollapsed ? "lg:w-0 lg:border-0 lg:p-0" : "lg:w-72"}`}
          aria-label="Navigasi"
        >
          <div className="flex min-h-full min-w-64 flex-col border border-[#e1e5ed] bg-white p-4">
            <p className="mb-3 px-2 pt-2 text-sm font-bold text-[#182033]">
              {dashboardLabel}
              <br />
              <span style={{ color: BRAND }}>- Profile</span>
            </p>
            <nav className="flex flex-col gap-1">
              {me?.role === "ADMIN" &&
                ADMIN_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => navigateAdminTab(tab.key)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#435064] hover:bg-[#6B85F6]/10"
                  >
                    <AdminIcon tab={tab.key} />
                    <span>{tab.label}</span>
                  </button>
                ))}

              {(me?.role === "KEPSEK" ? KEPSEK_TABS : me?.role === "KURIKULUM" ? KURIKULUM_TABS : []).map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#435064] hover:bg-[#6B85F6]/10"
                >
                  {me?.role === "KEPSEK" ? <KepsekIcon nav={tab.key as KepsekNav} /> : me?.role === "KURIKULUM" ? <KurikulumIcon nav={tab.key as KurikulumNav} /> : <AdminIcon tab={tab.key as AdminTab} />}
                  {tab.label}
                </Link>
              ))}

              {(me?.role === "GURU" || me?.role === "SISWA") &&
                (
                  [
                    ["DASHBOARD", "Dashboard", me.role === "GURU" ? "/guru" : "/siswa"],
                    ["KELAS", "Kelas", me.role === "GURU" ? "/guru/kelas" : "/siswa/kelas"],
                    ["ASESMEN", "Asesmen", me.role === "GURU" ? "/guru/asesmen" : "/siswa/asesmen"],
                    ["TUGAS", "Tugas", me.role === "GURU" ? "/guru/tugas" : "/siswa/tugas"],
                    ["PERFORMA", "Performa Akademik", me.role === "GURU" ? "/guru/performa-akademik" : "/siswa/performa-akademik"],
                    ["PROFILE", "Profile", `/profil/${me.id}`],
                  ] as [GuruSiswaNav, string, string][]
                ).map(([nav, label, href]) => (
                  <Link
                    key={nav}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                    style={
                      nav === "PROFILE"
                        ? theme === "dark"
                          ? { background: "#202b47", color: "#91a5ff", boxShadow: "inset 3px 0 0 #6B85F6" }
                          : { background: "#ffffff", color: BRAND, boxShadow: "inset 3px 0 0 #6B85F6" }
                        : { background: "transparent", color: theme === "dark" ? "#aeb8c9" : "#435064" }
                    }
                  >
                    <GuruSiswaIcon nav={nav} />
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
          <div className="profile-print-area mx-auto w-full max-w-5xl">
            {loading ? (
              <p className="text-sm text-[#9CA3AF]">Memuat...</p>
            ) : error || !profil ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm text-[#9CA3AF]">{error || "Profil tidak ditemukan."}</p>
              </div>
            ) : (
              <>
                <div className="profile-card grid gap-4 lg:grid-cols-[1.12fr_.88fr]">
                  <div className="profile-card-header relative overflow-hidden rounded-[28px] p-6 text-white shadow-[0_20px_50px_rgba(48,64,145,0.18)] sm:p-8" style={{ background: BRAND }}>
                    <div className="relative flex items-start justify-between gap-3">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-white/90">
                        Profil {roleLabel[profil.role]}
                      </span>
                      <div className="no-print flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          title="Cetak profil"
                          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#526ce4] shadow-sm hover:bg-white/90"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                            <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <path d="M6 14h12v7H6z" />
                          </svg>
                          Cetak
                        </button>
                        {profil.isSelf && (
                          <button
                            onClick={() => setShowEdit(true)}
                            className="cursor-pointer rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#526ce4] hover:bg-white/90"
                          >
                            Edit Profile
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
                      <p className="mt-6 max-w-md text-3xl font-bold tracking-[-.04em] text-white sm:text-4xl">{profil.nama}</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">Profil pengguna Classify untuk informasi akademik dan identitas dasar.</p>
                    </div>
                  </div>

                  <div className="profile-card-details rounded-[28px] border border-[#e1e5ed] bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-6">
                    <div className="flex items-center justify-between gap-3 border-b border-[#edf0f5] pb-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#9CA3AF]">Ringkasan</p>
                        <p className="mt-1 text-lg font-bold text-[#182033]">Informasi utama</p>
                      </div>
                      <span className="h-2.5 w-2.5 rounded-full bg-[#43c59e] shadow-[0_0_0_5px_rgba(67,197,158,0.12)]" />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {profil.isSelf && <Badge tone="brand">Aktif</Badge>}
                      {profil.rombel && <Badge tone="gray">{profil.rombel}</Badge>}
                      <Badge tone="gray">{roleLabel[profil.role]}</Badge>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {isSiswa && (
                        <div className="rounded-2xl border border-[#edf0f5] bg-[#f7f8fd] p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                            {profil.isSelf ? "NIS" : "Status"}
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-[#182033]">
                            {profil.isSelf ? profil.nis ?? "-" : "Aktif"}
                          </p>
                        </div>
                      )}
                      {isGuru && (
                        <div className="rounded-2xl border border-[#edf0f5] bg-[#f7f8fd] p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                            {profil.isSelf ? "NIK" : "Status"}
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-[#182033]">
                            {profil.isSelf ? profil.nik ?? "-" : "Aktif"}
                          </p>
                        </div>
                      )}

                      <div className="rounded-2xl border border-[#edf0f5] bg-[#f7f8fd] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Peran</p>
                        <p className="mt-0.5 text-sm font-bold text-[#182033]">{roleLabel[profil.role]}</p>
                      </div>

                      {isSiswa && (
                        <div className="rounded-2xl border border-[#edf0f5] bg-[#f7f8fd] p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Jurusan</p>
                          <p className="mt-0.5 text-sm font-bold text-[#182033]">{profil.jurusan ?? "-"}</p>
                        </div>
                      )}
                      {isGuru && (
                        <div className="rounded-2xl border border-[#edf0f5] bg-[#f7f8fd] p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Mapel</p>
                          <p className="mt-0.5 text-sm font-bold text-[#182033]">
                            {profil.mapel.length > 0 ? profil.mapel.join(", ") : "-"}
                          </p>
                        </div>
                      )}

                      <div className="col-span-2 rounded-2xl border border-[#edf0f5] bg-[#f7f8fd] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Jenis Kelamin</p>
                        <p className="mt-0.5 text-sm font-bold text-[#182033]">{profil.jenisKelamin ?? "-"}</p>
                      </div>

                      <div className="col-span-2 rounded-2xl border border-[#edf0f5] bg-[#f7f8fd] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Deskripsi</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-[#435064]">{profil.deskripsi || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="print-only-card">
                  <div className="print-card-identity">
                    <span className="print-card-label">CLASSIFY · PROFIL {roleLabel[profil.role].toUpperCase()}</span>
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
                      <p className="print-card-eyebrow">KARTU PROFIL</p>
                      <p className="print-card-title">{profil.nama}</p>
                    </div>
                    <div className="print-card-fields">
                      <div>
                        <span>{isSiswa ? "NIS" : "NIK"}</span>
                        <strong>{isSiswa ? profil.nis ?? "-" : profil.nik ?? "-"}</strong>
                      </div>
                      <div>
                        <span>Status</span>
                        <strong>{roleLabel[profil.role]}</strong>
                      </div>
                      <div>
                        <span>{isSiswa ? "Jurusan" : "Mata Pelajaran"}</span>
                        <strong>{isSiswa ? profil.jurusan ?? "-" : profil.mapel.join(", ") || "-"}</strong>
                      </div>
                      <div>
                        <span>Jenis Kelamin</span>
                        <strong>{profil.jenisKelamin ?? "-"}</strong>
                      </div>
                    </div>
                    <div className="print-card-description">
                      <span>Deskripsi</span>
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

      <footer className="no-print mt-10 border-t border-[#e1e5ed] bg-white">
        <p className="px-4 py-5 text-center text-xs text-[#8290a3] sm:px-6">© 2026 Classify. Sistem pembelajaran yang lebih terarah.</p>
      </footer>

      <style jsx global>{`
        [data-admin-theme="dark"] { color-scheme: dark; }
        .admin-shell[data-admin-theme="dark"] { background: #10141d !important; color: #eef2f8; }

        [data-admin-theme="dark"] header,
        [data-admin-theme="dark"] .bg-white { background-color: #171d28 !important; }
        [data-admin-theme="dark"] [class~="bg-[#f6f7fb]"],
        [data-admin-theme="dark"] [class~="bg-[#F9FAFB]"] { background-color: #10141d !important; }
        [data-admin-theme="dark"] [class~="bg-[#f7f8fd]"] { background-color: #1b2230 !important; }
        [data-admin-theme="dark"] [class~="bg-[#E5E7EB]"] { background-color: #2a3343 !important; }

        [data-admin-theme="dark"] header,
        [data-admin-theme="dark"] [class~="border-[#e1e5ed]"],
        [data-admin-theme="dark"] [class~="border-[#dfe4ef]"],
        [data-admin-theme="dark"] [class~="border-[#e6e9f0]"] { border-color: #2a3343 !important; }

        [data-admin-theme="dark"] :is(
          [class*="text-[#111827]" i], [class*="text-[#182033]" i]
        ) { color: #f3f6fb !important; }

        [data-admin-theme="dark"] :is(
          [class*="text-[#64748B]" i], [class*="text-[#6B7280]" i], [class*="text-[#94A3B8]" i],
          [class*="text-[#9CA3AF]" i], [class*="text-[#748096]" i], [class*="text-[#435064]" i]
        ) { color: #aeb8c9 !important; }

        [data-admin-theme="dark"] [class*="hover:bg-"]:hover:not([class~="hover:bg-white/90"]) {
          background-color: rgba(107, 133, 246, .14) !important;
        }

        @media print {
          [data-admin-theme="dark"] { color-scheme: light; background: #fff !important; color: #111827 !important; }
        }
      `}</style>
    </div>
  );
}

function KurikulumIcon({ nav }: { nav: KurikulumNav }) {
  return <KepsekIcon nav={nav} />;
}