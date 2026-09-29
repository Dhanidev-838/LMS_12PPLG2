"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import KurikulumShell from "@/components/KurikulumShell";

interface OpsiJawaban {
  id: string;
  teks: string;
  isBenar: boolean;
  urutan: number;
}
interface Soal {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: OpsiJawaban[];
}
interface AsesmenDetail {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  status: "PROSES" | "SELESAI";
  durasiMenit: number | null;
  deskripsi: string | null;
  mapel: { id?: string; nama: string } | null;
  guru: { nama: string };
  kelasTujuan: { kelas: { id: string; judul: string } }[];
  soal: Soal[];
}

function pillClass(active: boolean) {
  return active ? "bg-[#6B85F6] text-white" : "bg-gray-100 text-[#374151]";
}

export default function KurikulumAsesmenDetailPage() {
  const router = useRouter();
  const params = useParams();
  const asesmenId = params.id as string;

  const [asesmen, setAsesmen] = useState<AsesmenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAsesmen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId]);

  async function loadAsesmen() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat asesmen.");
        return;
      }
      setAsesmen(data.data);
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const soalTerfilter = asesmen ? asesmen.soal.filter((s) => s.pertanyaan.toLowerCase().includes(search.toLowerCase())) : [];
  const halamanCount = soalTerfilter.length;
  const currentSoal = soalTerfilter[activeIndex] ?? null;

  if (loading) {
    return (
      <KurikulumShell activeTab="ASESMEN">
        <p className="text-sm text-[#9CA3AF]">Memuat...</p>
      </KurikulumShell>
    );
  }
  if (error || !asesmen) {
    return (
      <KurikulumShell activeTab="ASESMEN">
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-sm text-[#9CA3AF]">{error || "Asesmen tidak ditemukan."}</p>
          <Button variant="outline" onClick={() => router.push("/kurikulum")}>
            Kembali
          </Button>
        </div>
      </KurikulumShell>
    );
  }

  return (
    <KurikulumShell activeTab="ASESMEN">
      <div className="mx-auto max-w-6xl pb-10">
        <Link href="/kurikulum" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#6B85F6]">
          &larr; Kembali ke Kurikulum
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-5 border border-[#e1e5ed] border-t-4 border-t-[#6B85F6] bg-white p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#182033]">{asesmen.judul}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="brand">{asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
              {asesmen.mapel && <Badge tone="gray">{asesmen.mapel.nama}</Badge>}
              <Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>{asesmen.status === "SELESAI" ? "Selesai" : "Proses"}</Badge>
            </div>
            <p className="mt-2 text-sm text-[#64748B]">Dibuat oleh {asesmen.guru.nama}</p>
            {asesmen.deskripsi && <p className="mt-1 text-sm text-[#435064]">{asesmen.deskripsi}</p>}
            {asesmen.kelasTujuan.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {asesmen.kelasTujuan.map(({ kelas }) => (
                  <Badge key={kelas.id} tone="gray">
                    {kelas.judul}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Durasi pengerjaan</p>
            <p className="mt-1 text-sm font-bold text-[#182033]">{asesmen.durasiMenit ? `${asesmen.durasiMenit} menit` : "Belum diatur"}</p>
          </div>
        </div>

        {/* Baris 1: pencarian + link jawaban */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href={`/kurikulum/asesmen/${asesmenId}/jawaban`}
            className="inline-flex items-center justify-center rounded-lg border border-[#dfe4ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#435064] transition-colors hover:border-[#6B85F6] hover:text-[#6B85F6]"
          >
            Jawaban
          </Link>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Cari soal..."
            className="min-w-[180px] flex-1 rounded-lg border border-[#dfe4ef] bg-white px-4 py-2 text-sm text-[#182033] outline-none placeholder:text-[#94A3B8] focus:border-[#6B85F6] focus:ring-2 focus:ring-[#6B85F6]/10"
          />
        </div>

        {/* Baris 2: strip nomor soal, scroll ke samping */}
        {halamanCount > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <button
              aria-label="Soal sebelumnya"
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
              className="flex-shrink-0 cursor-pointer rounded-lg border border-[#dfe4ef] bg-white px-3 py-2 text-xs font-semibold text-[#435064] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {"<<"}
            </button>

            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="flex gap-2 pb-1">
                {soalTerfilter.map((soal, i) => (
                  <button
                    key={soal.id}
                    onClick={() => setActiveIndex(i)}
                    className={`flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition-colors ${pillClass(i === activeIndex)}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <button
              aria-label="Soal berikutnya"
              onClick={() => setActiveIndex((i) => Math.min(halamanCount - 1, i + 1))}
              disabled={activeIndex >= halamanCount - 1}
              className="flex-shrink-0 cursor-pointer rounded-lg border border-[#dfe4ef] bg-white px-3 py-2 text-xs font-semibold text-[#435064] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {">>"}
            </button>
          </div>
        )}

        {/* Card soal: tombol library di pojok kanan atas */}
        <div className="mt-4 min-h-[300px] border border-[#e1e5ed] bg-white p-6 sm:p-8">
          {halamanCount > 0 && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowGrid(true)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#dfe4ef] text-[#435064] hover:bg-[#6B85F6]/10"
                title="Buka Library Soal"
                aria-label="Buka Library Soal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
            </div>
          )}

          {asesmen.soal.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">Belum ada soal.</p>
          ) : halamanCount === 0 ? (
            <p className="text-sm text-[#9CA3AF]">Tidak ada soal yang cocok dengan pencarian.</p>
          ) : currentSoal ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <Badge tone="gray">
                  {currentSoal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : currentSoal.tipe === "CHECKBOX" ? "Checkbox" : "Essay"}
                </Badge>
              </div>

              <p className="mt-5 text-base font-semibold leading-relaxed text-[#182033]">
                {activeIndex + 1}. {currentSoal.pertanyaan}
              </p>

              {currentSoal.gambar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentSoal.gambar} alt="Gambar soal" className="mt-3 max-h-64 rounded-xl object-contain" />
              )}

              {currentSoal.tipe !== "ESSAY" ? (
                <div className="mt-4 space-y-2">
                  {currentSoal.opsi.map((o) => (
                    <div
                      key={o.id}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                        o.isBenar ? "border-[#6B85F6] bg-[#6B85F6]/5" : "border-[#dfe4ef]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input type={currentSoal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"} checked={o.isBenar} readOnly disabled />
                        <span className="text-[#374151]">{o.teks}</span>
                      </div>
                      {o.isBenar && <Badge tone="green">Kunci Jawaban</Badge>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#9CA3AF]">Soal Essay — dinilai manual oleh guru setelah siswa mengumpulkan.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[#9CA3AF]">Tampilan read-only untuk monitoring Kurikulum.</p>
          <Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>
            {asesmen.status === "SELESAI" ? "Sudah dipublikasikan ke kelas" : "Belum dipublikasikan"}
          </Badge>
        </div>

        {/* Overlay Daftar Soal: terpusat */}
        <Modal open={showGrid} onClose={() => setShowGrid(false)} title={`Daftar Soal (${halamanCount})`} maxWidth="max-w-lg">
          {halamanCount === 0 ? (
            <p className="text-xs text-[#94A3B8]">{search ? "Tidak ada soal yang cocok." : "Belum ada soal."}</p>
          ) : (
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
              {soalTerfilter.map((soal, i) => (
                <button
                  key={soal.id}
                  onClick={() => {
                    setActiveIndex(i);
                    setShowGrid(false);
                  }}
                  className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition-colors ${pillClass(i === activeIndex)}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </Modal>
      </div>
    </KurikulumShell>
  );
}