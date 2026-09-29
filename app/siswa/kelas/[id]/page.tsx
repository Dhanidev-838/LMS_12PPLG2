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

const BRAND = "#6B85F6";

interface SiswaDiKelas {
  siswaId: string;
  siswa: { id: string; nama: string; nis: string | null; fotoProfil: string | null; kelasReferensi: { label: string } | null };
}
interface GuruDiKelas {
  id: string;
  guru: { id: string; nama: string; nik: string | null; fotoProfil: string | null };
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
        setError(data.error ?? "Gagal memuat kelas.");
        setLoading(false);
        return;
      }
      setKelas(data.data);
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-sm text-[#9CA3AF]">Memuat...</p>;

  if (error || !kelas) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-[#9CA3AF]">{error || "Kelas tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/siswa")}>
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
    <div>
      <div className="border border-[#dfe4ef] text-white" style={{ background: BRAND }}>
        <div className="p-5">
          <p className="text-lg font-bold">{kelas.judul}</p>
          {kelas.deskripsi && <p className="mt-1 text-sm text-white/85">&quot;{kelas.deskripsi}&quot;</p>}
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
        <div className="mt-4 space-y-3">
          {Object.keys(siswaGrouped).length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">Belum ada siswa di kelas ini.</p>
          ) : (
            Object.entries(siswaGrouped).map(([label, list]) => {
              const isOpen = expandedRombel === label;
              return (
                <div key={label} className="border border-[#e1e5ed] bg-white">
                  <button onClick={() => setExpandedRombel(isOpen ? null : label)} className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#182033]">{label}</p>
                      <Badge tone="brand">{list.length} Siswa</Badge>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-[#edf0f5] p-4">
                      {list.map((ks) => (
                        <button
                          key={ks.siswaId}
                          onClick={() => router.push(`/profil/${ks.siswa.id}`)}
                          className="flex w-full cursor-pointer items-center gap-3 border border-[#edf0f5] p-3 text-left transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]"
                        >
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                            {ks.siswa.fotoProfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={ks.siswa.fotoProfil} alt={ks.siswa.nama} className="h-full w-full object-cover" />
                            ) : (
                              ks.siswa.nama.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#182033]">{ks.siswa.nama}</p>
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
            <p className="text-sm text-[#9CA3AF]">Belum ada guru mengajar di kelas ini.</p>
          ) : (
            Object.entries(guruGrouped).map(([mapel, list]) => (
              <div key={mapel} className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">{mapel}</p>
                <div className="space-y-2">
                  {list.map((gm) => (
                    <button
                      key={gm.id}
                      onClick={() => router.push(`/profil/${gm.guru.id}`)}
                      className="flex w-full cursor-pointer items-center gap-3 border border-[#e1e5ed] bg-white p-3 text-left transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                        {gm.guru.fotoProfil ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={gm.guru.fotoProfil} alt={gm.guru.nama} className="h-full w-full object-cover" />
                        ) : (
                          gm.guru.nama.charAt(0)
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#182033]">{gm.guru.nama}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === null && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-bold text-[#182033]">Aktivitas Kelas</p>
          <KelasFeedFilter value={feedFilter} onChange={setFeedFilter} />
          <div className="space-y-3">
            {filteredFeed.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">{kelas.feed.length === 0 ? "Belum ada aktivitas di kelas ini." : "Tidak ada konten untuk filter ini."}</p>
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
                  <div key={`a-${i}`} className="border border-[#e1e5ed] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                        {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/siswa/asesmen/${a.id}`)}
                        className="flex-shrink-0 rounded-lg bg-[#6B85F6] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95"
                      >
                        {a.statusSubmission === "SUDAH" ? "Sudah Dikerjakan" : "Kerjakan"}
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-bold text-[#182033]">{a.judul}</p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">oleh {a.guru?.nama}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}