// app/siswa/kelas/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PengumumanCard from "@/components/PengumumanCard";
import TugasCard from "@/components/TugasCard";
import MateriCard from "@/components/MateriCard";
import KelasFeedFilter, { KelasFeedFilterValue } from "@/components/KelasFeedFilter";
import { useLanguage } from "@/lib/i18n";
import ClassMemberPresence from "@/components/kelas/ClassMemberPresence";
import TranslateContent from "@/components/TranslateContent";

interface SiswaDiKelas {
  siswaId: string;
  siswa: { id: string; nama: string; nis: string | null; fotoProfil: string | null; isActive?: boolean; kelasReferensi: { label: string } | null };
}
interface GuruDiKelas {
  id: string;
  guru: { id: string; nama: string; nik: string | null; fotoProfil: string | null; isActive?: boolean };
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
  siswa: SiswaDiKelas[];
  guruMapel: GuruDiKelas[];
  feed: FeedItem[];
}

export default function SiswaKelasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id as string;
  const { t } = useLanguage();

  const [kelas, setKelas] = useState<KelasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [error, setError] = useState("");

  const [section, setSection] = useState<"SISWA" | "GURU" | null>(null);
  const [expandedRombel, setExpandedRombel] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<KelasFeedFilterValue>("SEMUA");
  const filteredFeed = kelas?.feed.filter((item) => feedFilter === "SEMUA" || item.tipe === feedFilter) ?? [];

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
    setError("");
    try {
      const res = await fetch(`/api/kelas/${kelasId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(t(data.error ?? "Gagal memuat kelas."));
        setLoading(false);
        return;
      }
      setKelas(data.data);
    } catch {
      setError(t("Terjadi kesalahan."));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("Memuat...")}</p>;

  if (error || !kelas) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-muted-foreground">{t(error || "Kelas tidak ditemukan.")}</p>
        <Button variant="outline" onClick={() => router.push("/siswa")}>
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
    <div className="mx-auto w-full max-w-5xl">
      <section className="grid overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(15rem,34%)]">
        <div className="min-w-0 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-accent-text">{t("Detail Kelas")}</p>
          <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-foreground sm:text-[1.8rem]">
            <TranslateContent text={kelas.judul} textClassName="block" />
          </h1>
          <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {kelas.deskripsi ? (
              <TranslateContent text={kelas.deskripsi} textClassName="block" />
            ) : (
              t("Pengumuman, materi, tugas, dan asesmen dari kelas ini.")
            )}
          </p>
        </div>
        <div className="grid gap-2 border-t border-border bg-surface-muted p-4 sm:grid-cols-2 lg:grid-cols-1 lg:border-l lg:border-t-0">
          {(["SISWA", "GURU"] as const).map((type) => {
            const isStudent = type === "SISWA";
            const isActive = section === type;
            const count = isStudent ? kelas.siswa.length : new Set(kelas.guruMapel.map((assignment) => assignment.guru.id)).size;
            return (
              <button
                key={type}
                type="button"
                aria-expanded={isActive}
                onClick={() => setSection(isActive ? null : type)}
                className={`flex min-h-16 min-w-0 cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-control)] border px-4 py-3 text-left transition-colors ${isActive ? "border-accent bg-accent-subtle" : "border-border bg-surface hover:border-accent hover:bg-accent-subtle"}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{t(isStudent ? "Siswa" : "Guru")}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{t("Lihat daftar")}</span>
                </span>
                <span className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] px-2 text-sm font-bold ${isActive ? "bg-accent text-accent-foreground" : "bg-surface-muted text-foreground"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {section === "SISWA" && (
        <div className="mt-4 space-y-3">
          {Object.keys(siswaGrouped).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("Belum ada siswa di kelas ini.")}</p>
          ) : (
            Object.entries(siswaGrouped).map(([label, list]) => {
              const isOpen = expandedRombel === label;
              return (
                <div key={label} className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
                  <button onClick={() => setExpandedRombel(isOpen ? null : label)} className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{label}</p>
                      <Badge tone="brand">{list.length} {t("Siswa")}</Badge>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-border p-4">
                      {list.map((ks) => (
                        <button
                          key={ks.siswaId}
                          onClick={() => router.push(`/profil/${ks.siswa.id}`)}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-card)] border border-border p-3 text-left transition-colors hover:border-accent hover:bg-accent-subtle"
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
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {section === "GURU" && (
        <div className="mt-4">
          {Object.keys(guruGrouped).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("Belum ada guru mengajar di kelas ini.")}</p>
          ) : (
            Object.entries(guruGrouped).map(([mapel, list]) => (
              <div key={mapel} className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{mapel}</p>
                <div className="space-y-2">
                  {list.map((gm) => (
                    <button
                      key={gm.id}
                      onClick={() => router.push(`/profil/${gm.guru.id}`)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3 text-left transition-colors hover:border-accent hover:bg-accent-subtle"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-xs font-bold text-muted-foreground">
                        {gm.guru.fotoProfil ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={gm.guru.fotoProfil} alt={gm.guru.nama} className="h-full w-full object-cover" />
                        ) : (
                          gm.guru.nama.charAt(0)
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{gm.guru.nama}</p><ClassMemberPresence isActive={gm.guru.isActive ?? false} t={t} />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === null && (
          <section className="mt-7 border-t border-border pt-5">
          <div className="mb-3"><h2 className="text-base font-bold text-foreground">{t("Aktivitas Kelas")}</h2><p className="mt-1 text-xs text-muted-foreground">{t("Pengumuman, materi, tugas, dan asesmen dari kelas ini.")}</p></div>
          <KelasFeedFilter value={feedFilter} onChange={setFeedFilter} />
          <div className="mt-3 space-y-3">
            {filteredFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t(kelas.feed.length === 0 ? "Belum ada aktivitas di kelas ini." : "Tidak ada konten untuk filter ini.")}</p>
            ) : (
              filteredFeed.map((item, i) => {
                if (item.tipe === "PENGUMUMAN") {
                  // gak dikasih onEdit/onDelete -> tombol itu otomatis gak muncul buat siswa
                  return <PengumumanCard key={`p-${i}`} data={item.data} currentUserId={me?.id ?? ""} />;
                }
                if (item.tipe === "TUGAS") {
                  return <TugasCard key={`t-${i}`} data={item.data} currentUserId={me?.id ?? ""} role="SISWA" />;
                }
                if (item.tipe === "MATERI") {
                  return <MateriCard key={`m-${i}`} data={item.data} />;
                }
                // ASESMEN: murni tampilan, gak diklik dari feed -- siswa ngerjain dari tab Asesmen
                const a = item.data;
                return (
                  <div key={`a-${i}`} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="brand">{t(a.tipe === "KUIS" ? "Kuis" : "Ujian Online")}</Badge>
                        {a.mapel && <Badge tone="gray"><TranslateContent text={a.mapel.nama} textClassName="inline" /></Badge>}
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/siswa/asesmen/${a.id}`)}
                        className="flex-shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent-hover"
                      >
                        {t(a.statusSubmission === "SUDAH" ? "Sudah Dikerjakan" : "Kerjakan")}
                      </button>
                    </div>
                    <TranslateContent text={a.judul} className="mt-2 block" textClassName="text-sm font-bold text-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">{t("oleh")} {a.guru?.nama}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
