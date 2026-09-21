"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import KurikulumShell from "@/components/KurikulumShell";

const BRAND = "#6B85F6";

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

  if (loading) return <KurikulumShell><p className="mx-auto max-w-7xl px-4 text-sm text-[#9CA3AF] sm:px-6">Memuat...</p></KurikulumShell>;
  if (error || !asesmen) {
    return (
      <KurikulumShell><div className="flex flex-col items-center gap-3 py-10"><p className="text-sm text-[#9CA3AF]">{error || "Asesmen tidak ditemukan."}</p><Button variant="outline" onClick={() => router.push("/kurikulum")}>Kembali</Button></div></KurikulumShell>
    );
  }

  return (
    <KurikulumShell activeTab="ASESMEN"><div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
      <Link href="/kurikulum" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#6B85F6]">
        &larr; Kembali ke Kurikulum
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-5 rounded-xl border border-black/5 border-t-4 border-t-[#6B85F6] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">{asesmen.judul}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
            {asesmen.mapel && <Badge tone="gray">{asesmen.mapel.nama}</Badge>}
            <Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>{asesmen.status === "SELESAI" ? "Selesai" : "Proses"}</Badge>
          </div>
          <p className="mt-2 text-sm text-[#64748B]">Dibuat oleh {asesmen.guru.nama}</p>
          {asesmen.deskripsi && <p className="mt-1 text-sm text-[#475569]">{asesmen.deskripsi}</p>}
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
          <p className="mt-1 text-sm font-bold text-[#111827]">{asesmen.durasiMenit ? `${asesmen.durasiMenit} menit` : "Belum diatur"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link
          href={`/kurikulum/asesmen/${asesmenId}/jawaban`}
          className="inline-flex items-center justify-center rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] transition-colors hover:border-[#6B85F6] hover:text-[#6B85F6]"
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
          className="min-w-[180px] flex-1 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm outline-none placeholder:text-[#94A3B8] focus:border-[#6B85F6] focus:ring-2 focus:ring-[#6B85F6]/10"
        />
        <div className="flex items-center gap-1">
          <button
            aria-label="Soal sebelumnya"
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className="cursor-pointer rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#475569] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {"<<"}
          </button>
          <span className="min-w-12 px-2 text-center text-xs font-bold text-[#475569]">
            {halamanCount === 0 ? "0/0" : `${activeIndex + 1}/${halamanCount}`}
          </span>
          <button
            aria-label="Soal berikutnya"
            onClick={() => setActiveIndex((i) => Math.min(halamanCount - 1, i + 1))}
            disabled={activeIndex >= halamanCount - 1}
            className="cursor-pointer rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#475569] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {">>"}
          </button>
          <button
            onClick={() => setShowGrid((v) => !v)}
            className="cursor-pointer rounded-lg border border-[#CBD5E1] bg-white p-2 text-[#475569]"
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
      </div>

      {showGrid && (
        <div className="mt-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold text-[#64748B]">Library Soal</p>
          {halamanCount === 0 ? (
            <p className="text-xs text-[#94A3B8]">{search ? "Tidak ada soal yang cocok." : "Belum ada soal."}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {soalTerfilter.map((soal, i) => (
                <button
                  key={soal.id}
                  onClick={() => {
                    setActiveIndex(i);
                    setShowGrid(false);
                  }}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold"
                  style={i === activeIndex ? { background: BRAND, color: "white" } : { background: "#F3F4F6", color: "#374151" }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 min-h-[360px] rounded-xl border border-black/5 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)] sm:p-10">
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

            <p className="mt-5 text-base font-semibold leading-relaxed text-[#111827]">
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
                      o.isBenar ? "border-[#6B85F6] bg-[#6B85F6]/5" : "border-[#E2E8F0]"
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
    </div></KurikulumShell>
  );
}