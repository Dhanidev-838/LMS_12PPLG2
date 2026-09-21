"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import ModalKelas from "@/components/ModalKelas";
import PengumumanCard from "@/components/PengumumanCard";
import TugasCard from "@/components/TugasCard";
import { showConfirm } from "@/lib/dialog";

const BRAND = "#6B85F6";
type AdminTab = "KELAS" | "AKUN" | "SISWA" | "GURU" | "LAPORAN";
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
    KELAS: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
    AKUN: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />,
    SISWA: <path d="M12 3 2 8l10 5 8-4v6M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />,
    GURU: <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 8h7 M9 12h7 M9 16h4" />,
    LAPORAN: <path d="M6 2h9l5 5v15H6V2Zm9 0v5h5M9 13h6M9 17h4" />,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-shrink-0">
      {paths[tab]}
    </svg>
  );
}

const ADMIN_TABS: { key: AdminTab; label: string }[] = [
  { key: "KELAS", label: "Buat Kelas" },
  { key: "AKUN", label: "Buat Akun" },
  { key: "SISWA", label: "Daftar Siswa" },
  { key: "GURU", label: "Daftar Guru" },
  { key: "LAPORAN", label: "Laporan" },
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
  tipe: "PENGUMUMAN" | "ASESMEN" | "TUGAS";
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

  const [section, setSection] = useState<"SISWA" | "GURU" | null>(null);
  const [expandedRombel, setExpandedRombel] = useState<string | null>(null);

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
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <p className="text-sm text-[#9CA3AF]">Memuat...</p>
      </div>
    );
  }

  if (!kelas) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F9FAFB]">
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
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]" style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((value) => !value)}
              aria-label="Toggle sidebar"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image src="/Logo1.png" alt="Logo Classify" fill sizes="32px" className="rounded-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Classify
            </span>
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
            <Button size="sm" variant="outline" onClick={() => router.push(canManageClass ? "/admin" : "/guru")}>
              Back
            </Button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" />
      )}

      <aside
        aria-label={canManageClass ? "Navigasi admin" : "Navigasi guru"}
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-[#F9FAFB] p-4 shadow-[8px_0_24px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-full flex-col border-r border-black/5 bg-white p-4 shadow-sm">
          <p className="mb-3 px-2 pt-2 text-sm font-bold text-[#111827]">
            {canManageClass ? "Dashboard Admin" : "Dashboard Guru"}
            <br />
            <span style={{ color: BRAND }}>{canManageClass ? "- Detail Kelas" : "- Kelas"}</span>
          </p>
          <nav className="flex flex-col gap-1">
            {canManageClass ? ADMIN_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => navigateToAdminTab(tab.key)}
                title={tab.label}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-semibold ${
                  tab.key === "KELAS" ? "text-[#6B85F6]" : "text-[#374151] hover:bg-black/5"
                }`}
                style={tab.key === "KELAS" ? { background: `${BRAND}1A` } : undefined}
              >
                <TabIcon tab={tab.key} />
                <span>{tab.label}</span>
              </button>
            )) : ([
              ["KELAS", "Kelas", "/guru"],
              ["ASESMEN", "Asesmen", "/guru/asesmen"],
              ["TUGAS", "Tugas", "/guru/tugas"],
              ["PROFILE", "Profile", me ? `/profil/${me.id}` : "#"],
            ] as [GuruNav, string, string][]).map(([nav, label, href]) => (
              <Link
                key={nav}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
                style={nav === "KELAS" ? { background: `${BRAND}1A`, color: BRAND } : { color: "#374151" }}
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

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        <div className="overflow-hidden rounded-2xl text-white shadow-sm" style={{ background: BRAND }}>
          <div className="flex flex-wrap items-start justify-between gap-3 p-5">
            <div>
              <p className="text-lg font-bold">{kelas.judul}</p>
              {kelas.deskripsi && <p className="mt-1 text-sm text-white/85">&quot;{kelas.deskripsi}&quot;</p>}
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/80">Kode Kelas</p>
              <p className="text-sm font-bold">{kelas.inviteToken}</p>
              <button
                onClick={handleCopyInvite}
                className="mt-1 flex items-center gap-1 text-[11px] font-medium text-white/90 hover:underline"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
                  <rect x="9" y="9" width="12" height="12" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
                {copied ? "Tersalin!" : "Salin Link Undangan"}
              </button>
            </div>
          </div>
          <div className="border-t border-white/20 px-5 py-2.5">
            {canManageClass && <button onClick={() => setShowEditKelas(true)} className="cursor-pointer text-xs font-semibold text-white hover:underline">
              Edit Kelas
            </button>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant={section === "SISWA" ? "primary" : "outline"} onClick={() => setSection(section === "SISWA" ? null : "SISWA")}>
            Lihat Deretan Siswa
          </Button>
          <Button variant={section === "GURU" ? "primary" : "outline"} onClick={() => setSection(section === "GURU" ? null : "GURU")}>
            Lihat Deretan Guru
          </Button>
        </div>

        {section === "SISWA" && (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#111827]">Deretan Siswa</p>
              <div className="flex items-center gap-2">
                {canManageClass && <Button size="sm" onClick={() => setShowTambahSiswa(true)}>
                  + Tambah Siswa
                </Button>}
                <button
                  type="button"
                  aria-label="Tutup deretan siswa"
                  onClick={() => setSection(null)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-black/10 text-lg text-[#6B7280] hover:bg-black/5"
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
                    <div key={label} className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
                      <button
                        onClick={() => setExpandedRombel(isOpen ? null : label)}
                        className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#111827]">{label}</p>
                          <Badge tone="brand">{list.length} Siswa</Badge>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="space-y-2 border-t border-black/5 p-4">
                          {list.map((ks) => (
                            <div key={ks.siswaId} className="flex items-center gap-3 rounded-xl border border-black/5 p-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                                {ks.siswa.fotoProfil ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={ks.siswa.fotoProfil} alt={ks.siswa.nama} className="h-full w-full object-cover" />
                                ) : (
                                  ks.siswa.nama.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[#111827]">{ks.siswa.nama}</p>
                                <p className="text-xs text-[#9CA3AF]">NIS: {ks.siswa.nis}</p>
                              </div>
                              {canManageClass && <button
                                  onClick={() => handleHapusSiswa(ks.siswa.id, [kelasId])}
                                  className="cursor-pointer text-xs font-medium text-red-500 hover:underline"
                                >
                                  Hapus
                                </button>}
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
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#111827]">Deretan Guru</p>
              <div className="flex items-center gap-2">
                {canManageClass && <Button size="sm" onClick={() => setShowTambahGuru(true)}>
                  + Tambah Guru
                </Button>}
                <button
                  type="button"
                  aria-label="Tutup deretan guru"
                  onClick={() => setSection(null)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-black/10 text-lg text-[#6B7280] hover:bg-black/5"
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
                      <div key={gm.id} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                          {gm.guru.fotoProfil ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={gm.guru.fotoProfil} alt={gm.guru.nama} className="h-full w-full object-cover" />
                          ) : (
                            gm.guru.nama.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#111827]">{gm.guru.nama}</p>
                          <p className="text-xs text-[#9CA3AF]">NIK: {gm.guru.nik}</p>
                        </div>
                        {canManageClass && <button
                            onClick={() => handleHapusGuru(gm.guru.id, gm.mapel.id, [kelasId])}
                            className="cursor-pointer text-xs font-medium text-red-500 hover:underline"
                          >
                            Hapus
                          </button>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {section === null && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-[#111827]">Aktivitas Hari Ini</p>
            <div className="space-y-3">
              {kelas.feed.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Belum ada aktivitas di kelas ini.</p>
              ) : (
                kelas.feed.map((item, i) => {
                  if (item.tipe === "PENGUMUMAN") {
                    return <PengumumanCard key={`p-${i}`} data={item.data} currentUserId={me?.id ?? ""} />;
                  }
                  if (item.tipe === "TUGAS") {
                    return <TugasCard key={`t-${i}`} data={item.data} currentUserId={me?.id ?? ""} role="ADMIN" />;
                  }
                  const a = item.data;
                  return (
                    <div key={`a-${i}`} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                        {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                      </div>
                      <p className="mt-2 text-sm font-bold text-[#111827]">{a.judul}</p>
                      <p className="mt-1 text-xs text-[#9CA3AF]">
                        {a._count?.soal ?? 0} soal · oleh {a.guru?.nama}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {canManageClass && <ModalKelas open={showEditKelas} onClose={() => setShowEditKelas(false)} onSuccess={loadKelas} mode="edit" initialData={kelas} />}

      {canManageClass && <ModalTambahSiswa
        open={showTambahSiswa}
        onClose={() => setShowTambahSiswa(false)}
        onSuccess={loadKelas}
        kelasId={kelasId}
        siswaSudahAda={kelas.siswa.map((ks) => ks.siswaId)}
      />}

      {canManageClass && <ModalTambahGuru
        open={showTambahGuru}
        onClose={() => setShowTambahGuru(false)}
        onSuccess={loadKelas}
        kelasId={kelasId}
        guruSudahAda={kelas.guruMapel.map((gm) => gm.guru.id)}
      />}
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

  useEffect(() => {
    if (!open) return;
    setRombelId("");
    setKandidat([]);
    setSelectedIds([]);
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
              <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-black/5">
                <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggle(s.id)} />
                <span className="text-sm text-[#374151]">
                  {s.nama} — {s.nis}
                </span>
              </label>
            ))}
          </div>
        )}

        <Button className="w-full" loading={submitting} disabled={selectedIds.length === 0} onClick={handleSubmit}>
          Tambah {selectedIds.length > 0 ? `(${selectedIds.length})` : ""} Siswa
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