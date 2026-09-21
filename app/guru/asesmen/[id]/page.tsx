"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ModalBuatSoal from "@/components/ModalBuatSoal";
import { showAlert, showConfirm } from "@/lib/dialog";

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
  mapel: { id: string; nama: string } | null;
  soal: Soal[];
}

export default function GuruAsesmenDetailPage() {
  const router = useRouter();
  const params = useParams();
  const asesmenId = params.id as string;

  const [asesmen, setAsesmen] = useState<AsesmenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [search, setSearch] = useState("");

  const [showModalSoal, setShowModalSoal] = useState(false);
  const [editingSoal, setEditingSoal] = useState<Soal | null>(null);

  const [editingDurasi, setEditingDurasi] = useState(false);
  const [durasiInput, setDurasiInput] = useState("");

  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
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
        setLoading(false);
        return;
      }
      setAsesmen(data.data);
      const savedPageCount = Number(window.localStorage.getItem(`asesmen-pages-${asesmenId}`) ?? 0);
      setPageCount(Math.max(data.data.soal.length, Number.isFinite(savedPageCount) ? savedPageCount : 0));
      setDurasiInput(data.data.durasiMenit?.toString() ?? "");
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const soalTerfilter = asesmen ? asesmen.soal.filter((s) => s.pertanyaan.toLowerCase().includes(search.toLowerCase())) : [];
  const halamanCount = Math.max(pageCount, soalTerfilter.length);
  const currentSoal = soalTerfilter[activeIndex] ?? null;

  function openBuatSoal() {
    setEditingSoal(currentSoal);
    setShowModalSoal(true);
  }
  function openEditSoal(soal: Soal) {
    setEditingSoal(soal);
    setShowModalSoal(true);
  }
  function handleTambahHalaman() {
    const nextIndex = Math.max(pageCount, asesmen?.soal.length ?? 0);
    const nextPageCount = nextIndex + 1;
    setPageCount(nextPageCount);
    window.localStorage.setItem(`asesmen-pages-${asesmenId}`, String(nextPageCount));
    setActiveIndex(nextIndex);
    setSearch("");
    setShowGrid(true);
    setEditingSoal(null);
  }
  async function handleHapusHalaman(index: number) {
    if (!(await showConfirm(`Hapus halaman ${index + 1}?`))) return;

    const nextPageCount = Math.max(0, halamanCount - 1);
    setPageCount(nextPageCount);
    setActiveIndex(Math.max(0, Math.min(index, nextPageCount - 1)));
    window.localStorage.setItem(`asesmen-pages-${asesmenId}`, String(nextPageCount));
    setShowGrid(true);
  }
  async function handleDeleteSoal(soalId: string) {
    if (!(await showConfirm("Hapus soal ini?"))) return;
    await fetch(`/api/asesmen/${asesmenId}/soal/${soalId}`, { method: "DELETE" });
    loadAsesmen();
  }

  async function handleSaveDurasi() {
    await fetch(`/api/asesmen/${asesmenId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durasiMenit: durasiInput ? Number(durasiInput) : null }),
    });
    setEditingDurasi(false);
    loadAsesmen();
  }

  async function handleToggleKunci(opsiId: string) {
    if (!currentSoal) return;
    let opsiBenarIds: string[];
    if (currentSoal.tipe === "CHECKBOX") {
      const sudahBenar = currentSoal.opsi.find((o) => o.id === opsiId)?.isBenar;
      const currentBenar = currentSoal.opsi.filter((o) => o.isBenar).map((o) => o.id);
      opsiBenarIds = sudahBenar ? currentBenar.filter((id) => id !== opsiId) : [...currentBenar, opsiId];
    } else {
      opsiBenarIds = [opsiId];
    }
    await fetch(`/api/asesmen/${asesmenId}/soal/${currentSoal.id}/kunci`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opsiBenarIds }),
    });
    loadAsesmen();
  }

  async function handleSelesai() {
    if (!asesmen) return;
    if (asesmen.soal.length === 0) {
      await showAlert("Tambahkan minimal 1 soal sebelum menyelesaikan asesmen.");
      return;
    }
    if (!(await showConfirm("Selesaikan asesmen? Asesmen akan langsung tampil ke siswa di kelas tujuan."))) return;
    setFinalizing(true);
    try {
      await fetch(`/api/asesmen/${asesmenId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SELESAI" }),
      });
      loadAsesmen();
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) return <p className="text-sm text-[#9CA3AF]">Memuat...</p>;
  if (error || !asesmen) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-[#9CA3AF]">{error || "Asesmen tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/guru/asesmen")}>
          Kembali
        </Button>
      </div>
    );
  }

  const isEditable = asesmen.status === "PROSES";

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <Link href="/guru/asesmen" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#6B85F6]">
        ← Kembali ke Asesmen
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-5 rounded-xl border border-black/5 border-t-4 border-t-[#6B85F6] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">{asesmen.judul}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
            {asesmen.mapel && <Badge tone="gray">{asesmen.mapel.nama}</Badge>}
            <Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>{asesmen.status === "SELESAI" ? "Selesai" : "Proses"}</Badge>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Durasi pengerjaan</p>
          {editingDurasi ? (
            <div className="mt-1 flex items-center gap-1">
              <input type="number" min={1} value={durasiInput} onChange={(e) => setDurasiInput(e.target.value)} className="w-16 rounded-lg border border-[#D1D5DB] px-2 py-1 text-sm outline-none focus:border-[#6B85F6]" />
              <Button size="sm" onClick={handleSaveDurasi}>Simpan</Button>
            </div>
          ) : (
            <button onClick={() => isEditable && setEditingDurasi(true)} disabled={!isEditable} className="mt-1 text-sm font-bold text-[#111827] disabled:cursor-default">
              {asesmen.durasiMenit ? `${asesmen.durasiMenit} menit` : "Belum diatur"}
              {isEditable && <span className="ml-1 text-[11px] font-normal text-[#6B85F6]">Atur Durasi</span>}
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {isEditable && (
          <Button size="sm" onClick={openBuatSoal}>
            {currentSoal ? "Edit Soal" : "+ Buat Soal"}
          </Button>
        )}
        <Link
          href={`/guru/asesmen/${asesmenId}/jawaban`}
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
          <button aria-label="Soal sebelumnya" onClick={() => setActiveIndex((i) => Math.max(0, i - 1))} disabled={activeIndex === 0} className="cursor-pointer rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#475569] disabled:cursor-not-allowed disabled:opacity-40">
            {"<<"}
          </button>
          <span className="min-w-12 px-2 text-center text-xs font-bold text-[#475569]">
            {halamanCount === 0 ? "0/0" : `${activeIndex + 1}/${halamanCount}`}
          </span>
          <button aria-label="Soal berikutnya" onClick={() => setActiveIndex((i) => Math.min(halamanCount - 1, i + 1))} disabled={activeIndex >= halamanCount - 1} className="cursor-pointer rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#475569] disabled:cursor-not-allowed disabled:opacity-40">
            {">>"}
          </button>
          <button onClick={() => setShowGrid((v) => !v)} className="cursor-pointer rounded-lg border border-[#CBD5E1] bg-white p-2 text-[#475569]" title="Buka Library Soal" aria-label="Buka Library Soal">
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
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#64748B]">Library Soal</p>
            {isEditable && (
              <Button size="sm" onClick={handleTambahHalaman}>
                + Tambah Halaman
              </Button>
            )}
          </div>
          {halamanCount === 0 ? (
            <p className="text-xs text-[#94A3B8]">Belum ada halaman soal.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: halamanCount }, (_, i) => soalTerfilter[i] ?? null).map((soal, i) => (
                <div key={soal?.id ?? `halaman-${i}`} className="group relative">
                  <button
                    onClick={() => setActiveIndex(i)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold"
                    style={i === activeIndex ? { background: BRAND, color: "white" } : { background: soal ? "#F3F4F6" : "#FFF7ED", color: soal ? "#374151" : "#C2410C" }}
                  >
                    {i + 1}
                  </button>
                  {isEditable && !soal && (
                    <button
                      type="button"
                      onClick={() => handleHapusHalaman(i)}
                      aria-label={`Hapus halaman ${i + 1}`}
                      title={`Hapus halaman ${i + 1}`}
                      className="absolute -right-1 -top-1 hidden h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white group-hover:flex"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 min-h-[300px] rounded-xl border border-black/5 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)] sm:p-8">
        {halamanCount === 0 ? (
          <p className="text-sm text-[#9CA3AF]">Belum ada soal. Klik &quot;+ Buat Soal&quot; untuk mulai.</p>
        ) : currentSoal ? (
          <div>
            <div className="flex items-start justify-between gap-2">
              <Badge tone="gray">
                {currentSoal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : currentSoal.tipe === "CHECKBOX" ? "Checkbox" : "Essay"}
              </Badge>
              {isEditable && (
                <div className="flex gap-2">
                  <button onClick={() => openEditSoal(currentSoal)} className="cursor-pointer text-xs font-medium text-[#6B85F6] hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteSoal(currentSoal.id)} className="cursor-pointer text-xs font-medium text-red-500 hover:underline">
                    Hapus
                  </button>
                </div>
              )}
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
                  <label key={o.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${o.isBenar ? "border-[#6B85F6] bg-[#6B85F6]/5" : "border-[#E2E8F0] hover:border-[#94A3B8]"}`}>
                    <input type={currentSoal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"} checked={o.isBenar} disabled={!isEditable} onChange={() => handleToggleKunci(o.id)} />
                    <span className="text-[#374151]">{o.teks}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#9CA3AF]">Soal Essay — dinilai manual setelah siswa mengumpulkan.</p>
            )}
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-center">
            <p className="text-sm font-semibold text-[#475569]">Halaman {activeIndex + 1} masih kosong</p>
            <p className="mt-1 text-xs text-[#94A3B8]">Buat soal untuk mengisi halaman ini.</p>
            {isEditable && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={openBuatSoal}>
                  + Buat Soal
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleHapusHalaman(activeIndex)}>
                  Hapus Halaman
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#9CA3AF]">Kunci jawaban langsung tersimpan saat kamu klik opsi di atas.</p>
        {isEditable ? (
          <Button loading={finalizing} onClick={handleSelesai}>
            Selesaikan Asesmen
          </Button>
        ) : (
          <Badge tone="green">Sudah dipublikasikan ke kelas</Badge>
        )}
      </div>

      <ModalBuatSoal open={showModalSoal} onClose={() => setShowModalSoal(false)} onSuccess={loadAsesmen} asesmenId={asesmenId} mode={editingSoal ? "edit" : "create"} initialData={editingSoal} />
    </div>
  );
}