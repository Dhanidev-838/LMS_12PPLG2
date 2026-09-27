"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { showAlert } from "@/lib/dialog";

const BRAND = "#6B85F6";

interface OpsiSoal {
  id: string;
  teks: string;
  urutan: number;
  isBenar: boolean;
}
type StatusSoal = "BENAR" | "SALAH" | "SEBAGIAN_BENAR" | "BELUM_DIJAWAB" | "BELUM_DINILAI" | "SUDAH_DINILAI";
interface SoalDetail {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: OpsiSoal[];
  jawabanSiswa: { id: string; jawabanEssay: string | null; nilaiSoal: number | null; raguRagu: boolean; opsiDipilihIds: string[] } | null;
  status: StatusSoal;
}
interface DetailResponse {
  submissionId: string;
  siswa: { nama: string; nis: string; kelasJurusan: string };
  asesmen: { judul: string; mapel: string | null };
  kelas: string;
  mulaiPada: string;
  submittedAt: string | null;
  nilaiAkhir: number | null;
  rekap: {
    totalBenar: number;
    totalSalah: number;
    totalKosong: number;
    totalEssay: number;
    totalEssayBelumDinilai: number;
    totalObjektif: number;
    totalObjektifDijawab: number;
    totalEssayDijawab: number;
    totalRaguRagu: number;
    nilaiObjektif: number;
  };
  soal: SoalDetail[];
}

const STATUS_BADGE: Record<StatusSoal, { label: string; tone: "green" | "red" | "amber" | "gray" }> = {
  BENAR: { label: "Benar", tone: "green" },
  SALAH: { label: "Salah", tone: "red" },
  SEBAGIAN_BENAR: { label: "Sebagian Benar", tone: "amber" },
  BELUM_DIJAWAB: { label: "Belum Dijawab", tone: "gray" },
  BELUM_DINILAI: { label: "Belum Dinilai", tone: "amber" },
  SUDAH_DINILAI: { label: "Sudah Dinilai", tone: "green" },
};

function formatTanggal(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function statusTone(status: StatusSoal): string {
  if (status === "BENAR" || status === "SUDAH_DINILAI") return "#16A34A";
  if (status === "SALAH") return "#EF4444";
  if (status === "SEBAGIAN_BENAR" || status === "BELUM_DINILAI") return "#D97706";
  return "#9CA3AF";
}

export default function DetailJawabanSiswaPage() {
  const params = useParams();
  const router = useRouter();
  const asesmenId = params.id as string;
  const submissionId = params.submissionId as string;

  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [urutanSiswa, setUrutanSiswa] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  const [nilaiEssayInput, setNilaiEssayInput] = useState("");
  const [savingEssay, setSavingEssay] = useState(false);

  async function loadDetail() {
    setLoading(true);
    setError("");
    try {
      const [detailRes, nilaiRes] = await Promise.all([
        fetch(`/api/asesmen/${asesmenId}/jawaban/${submissionId}`),
        fetch(`/api/asesmen/${asesmenId}/nilai`),
      ]);
      const detailData = await detailRes.json();
      if (!detailRes.ok) {
        setError(detailData.error ?? "Gagal memuat jawaban siswa.");
        return;
      }
      setDetail(detailData.data);
      setActiveIndex(0);

      if (nilaiRes.ok) {
        const nilaiData = await nilaiRes.json();
        setUrutanSiswa((nilaiData.data?.nilai ?? []).map((r: { submissionId: string }) => r.submissionId));
      }
    } catch {
      setError("Terjadi kesalahan saat memuat jawaban siswa.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId, submissionId]);

  const currentSoal = detail?.soal[activeIndex] ?? null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNilaiEssayInput(currentSoal?.jawabanSiswa?.nilaiSoal?.toString() ?? "");
  }, [currentSoal?.id, currentSoal?.jawabanSiswa?.nilaiSoal]);

  const { prevSiswaId, nextSiswaId } = useMemo(() => {
    const idx = urutanSiswa.indexOf(submissionId);
    return {
      prevSiswaId: idx > 0 ? urutanSiswa[idx - 1] : null,
      nextSiswaId: idx >= 0 && idx < urutanSiswa.length - 1 ? urutanSiswa[idx + 1] : null,
    };
  }, [urutanSiswa, submissionId]);

  async function handleSimpanEssay() {
    if (!currentSoal?.jawabanSiswa) return;
    const nilai = Number(nilaiEssayInput);
    if (Number.isNaN(nilai) || nilai < 0 || nilai > 100) {
      await showAlert("Nilai essay harus angka 0-100.");
      return;
    }
    setSavingEssay(true);
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/jawaban/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jawabanSiswaId: currentSoal.jawabanSiswa.id, nilaiSoal: nilai }),
      });
      const data = await res.json();
      if (!res.ok) {
        await showAlert(data.error ?? "Gagal menyimpan nilai essay.");
        return;
      }
      await loadDetail();
    } catch {
      await showAlert("Gagal menyimpan nilai essay.");
    } finally {
      setSavingEssay(false);
    }
  }

  if (loading) return <p className="text-sm text-[#9CA3AF]">Memuat jawaban siswa...</p>;
  if (error || !detail) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-red-500">{error || "Jawaban siswa tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push(`/guru/asesmen/${asesmenId}/jawaban`)}>
          Kembali
        </Button>
      </div>
    );
  }

  const { rekap } = detail;

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <Link
        href={`/guru/asesmen/${asesmenId}/jawaban`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#6B85F6]"
      >
        &larr; Kembali ke Daftar Jawaban
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-5 border border-[#e1e5ed] border-t-4 border-t-[#6B85F6] bg-white p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Jawaban Siswa</p>
          <h1 className="mt-1 text-2xl font-bold text-[#182033]">{detail.siswa.nama}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="gray">NIS {detail.siswa.nis}</Badge>
            <Badge tone="gray">{detail.siswa.kelasJurusan}</Badge>
            <Badge tone="gray">{detail.kelas}</Badge>
            {detail.asesmen.mapel && <Badge tone="brand">{detail.asesmen.mapel}</Badge>}
          </div>
          <p className="mt-2 text-sm font-semibold text-[#374151]">{detail.asesmen.judul}</p>
        </div>

      </div>

      <div className="mt-4 border border-[#e1e5ed] bg-white">
        <div className="grid lg:grid-cols-[1fr_220px]">
          <div className="overflow-x-auto p-4 sm:p-5">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#dfe4ef] text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                  <th className="pb-3">Ringkasan</th>
                  <th className="pb-3 text-right">Hasil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f5]">
                <tr>
                  <td className="py-3 text-[#64748B]">Mulai</td>
                  <td className="py-3 text-right font-semibold text-[#182033]">{formatTanggal(detail.mulaiPada)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-[#64748B]">Dikumpulkan</td>
                  <td className="py-3 text-right font-semibold text-[#182033]">{formatTanggal(detail.submittedAt)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-[#64748B]">Pilihan Ganda Dikerjakan</td>
                  <td className="py-3 text-right font-bold text-[#182033]">{rekap.totalObjektifDijawab}/{rekap.totalObjektif}</td>
                </tr>
                <tr>
                  <td className="py-3 text-[#64748B]">Essay Dikerjakan</td>
                  <td className="py-3 text-right font-bold text-[#182033]">{rekap.totalEssayDijawab}/{rekap.totalEssay}</td>
                </tr>
                <tr>
                  <td className="py-3 text-[#64748B]">Jumlah Ragu-ragu</td>
                  <td className="py-3 text-right font-bold text-[#182033]">{rekap.totalRaguRagu}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="order-first flex items-center justify-center border-b border-[#dfe4ef] bg-[#f7f8fd] p-5 text-center lg:order-last lg:border-b-0 lg:border-l">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Nilai Objektif</p>
              <p className="mt-1 text-3xl font-bold text-green-600">{rekap.nilaiObjektif}</p>
              <div className="my-4 h-px bg-[#e1e5ed]" />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Nilai Akhir</p>
              <p className="mt-1 text-3xl font-bold" style={{ color: BRAND }}>
                {detail.nilaiAkhir ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={!prevSiswaId} onClick={() => prevSiswaId && router.push(`/guru/asesmen/${asesmenId}/jawaban/${prevSiswaId}`)}>
          &larr; Siswa Sebelumnya
        </Button>
        <Button size="sm" variant="outline" disabled={!nextSiswaId} onClick={() => nextSiswaId && router.push(`/guru/asesmen/${asesmenId}/jawaban/${nextSiswaId}`)}>
          Siswa Berikutnya &rarr;
        </Button>
      </div>

      {/* Strip soal — scroll ke samping, tap untuk lompat langsung */}
      {detail.soal.length > 0 && (
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
              {detail.soal.map((s, i) => {
                const tone = statusTone(s.status);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveIndex(i)}
                    className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition-colors"
                    style={
                      i === activeIndex
                        ? { background: BRAND, color: "white" }
                        : { background: `${tone}1A`, color: tone, border: `1px solid ${tone}55` }
                    }
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            aria-label="Soal berikutnya"
            onClick={() => setActiveIndex((i) => Math.min(detail.soal.length - 1, i + 1))}
            disabled={activeIndex >= detail.soal.length - 1}
            className="flex-shrink-0 cursor-pointer rounded-lg border border-[#dfe4ef] bg-white px-3 py-2 text-xs font-semibold text-[#435064] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {">>"}
          </button>
        </div>
      )}

      <div className="mt-4 min-h-[300px] border border-[#e1e5ed] bg-white p-6 sm:p-8">
        {detail.soal.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">Siswa ini belum menjawab soal apapun.</p>
        ) : currentSoal ? (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Badge tone="gray">
                  {currentSoal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : currentSoal.tipe === "CHECKBOX" ? "Checkbox" : "Essay"}
                </Badge>
                <Badge tone={STATUS_BADGE[currentSoal.status].tone}>{STATUS_BADGE[currentSoal.status].label}</Badge>
              </div>
              <button
                onClick={() => setShowGrid(true)}
                title="Buka daftar soal"
                aria-label="Buka daftar soal"
                className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#dfe4ef] text-[#435064] hover:bg-[#6B85F6]/10"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
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
                {currentSoal.opsi.map((o) => {
                  const dipilihSiswa = currentSoal.jawabanSiswa?.opsiDipilihIds.includes(o.id) ?? false;
                  let borderStyle: React.CSSProperties = { borderColor: "#dfe4ef" };
                  if (o.isBenar && dipilihSiswa) borderStyle = { borderColor: "#16A34A", background: "#16A34A0D" };
                  else if (o.isBenar) borderStyle = { borderColor: "#16A34A" };
                  else if (dipilihSiswa) borderStyle = { borderColor: "#EF4444", background: "#EF44440D" };

                  return (
                    <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm" style={borderStyle}>
                      <div className="flex items-center gap-3">
                        <input type={currentSoal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"} checked={dipilihSiswa} readOnly />
                        <span className="text-[#374151]">{o.teks}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {dipilihSiswa && <Badge tone="brand">Dipilih Siswa</Badge>}
                        {o.isBenar && <Badge tone="green">Kunci Jawaban</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-[#dfe4ef] bg-[#f7f8fd] p-4 text-sm text-[#374151]">
                  {currentSoal.jawabanSiswa?.jawabanEssay || <span className="text-[#9CA3AF]">Siswa belum menjawab.</span>}
                </div>

                {currentSoal.jawabanSiswa && (
                  <div className="flex flex-wrap items-end gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#64748B]">Nilai Essay (0-100)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={nilaiEssayInput}
                        onChange={(e) => setNilaiEssayInput(e.target.value)}
                        className="w-28 rounded-lg border border-[#dfe4ef] px-3 py-2 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
                      />
                    </div>
                    <Button size="sm" loading={savingEssay} onClick={handleSimpanEssay}>
                      Simpan Nilai
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Overlay daftar soal — terpusat, seperti di RuangGuru */}
      <Modal open={showGrid} onClose={() => setShowGrid(false)} title="Daftar Soal" maxWidth="max-w-lg">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-[#EEF2FF] p-3 text-center">
            <p className="text-xs font-semibold text-[#16A34A]">Benar</p>
            <p className="mt-1 text-lg font-bold text-[#16A34A]">{rekap.totalBenar}</p>
          </div>
          <div className="rounded-lg bg-[#FEF2F2] p-3 text-center">
            <p className="text-xs font-semibold text-[#DC2626]">Salah</p>
            <p className="mt-1 text-lg font-bold text-[#DC2626]">{rekap.totalSalah}</p>
          </div>
          <div className="rounded-lg bg-[#FEF3C7] p-3 text-center">
            <p className="text-xs font-semibold text-[#92400E]">Ragu-ragu</p>
            <p className="mt-1 text-lg font-bold text-[#92400E]">{rekap.totalRaguRagu}</p>
          </div>
          <div className="rounded-lg bg-[#f7f8fd] p-3 text-center">
            <p className="text-xs font-semibold text-[#435064]">Belum Dinilai</p>
            <p className="mt-1 text-lg font-bold text-[#435064]">{rekap.totalEssayBelumDinilai}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {detail.soal.map((s, i) => {
            const tone = statusTone(s.status);
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveIndex(i);
                  setShowGrid(false);
                }}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition-colors"
                style={
                  i === activeIndex
                    ? { background: BRAND, color: "white" }
                    : { background: `${tone}1A`, color: tone, border: `1px solid ${tone}55` }
                }
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}