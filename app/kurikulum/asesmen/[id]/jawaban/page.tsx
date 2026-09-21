"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import TabelNilai from "@/components/Tabelnilai";
import KurikulumShell from "@/components/KurikulumShell";

interface NilaiRow {
  submissionId: string;
  nama: string;
  nis: string;
  kelasReferensi: string;
  kelas: { id: string; judul: string }[];
  nilaiObjektif: number;
  nilaiAkhir: number | null;
  nilaiSementara: number;
  totalSoalTerjawab: number;
}

interface KelasTujuan {
  kelas: { id: string; judul: string };
}

interface NilaiResponse {
  asesmen: { judul: string; tipe: "KUIS" | "UJIAN"; mapel?: string };
  kelas: string[];
  nilai: NilaiRow[];
}

export default function KurikulumJawabanPage() {
  const params = useParams();
  const asesmenId = params.id as string;
  const [hasil, setHasil] = useState<NilaiResponse | null>(null);
  const [kelasTujuan, setKelasTujuan] = useState<KelasTujuan[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [nilaiRes, asesmenRes] = await Promise.all([
        fetch(`/api/asesmen/${asesmenId}/nilai`),
        fetch(`/api/asesmen/${asesmenId}`),
      ]);
      const nilaiData = await nilaiRes.json();
      const asesmenData = await asesmenRes.json();
      if (!nilaiRes.ok) {
        setError(nilaiData.error ?? "Gagal memuat jawaban.");
        return;
      }
      setHasil(nilaiData.data);
      setKelasTujuan(asesmenData.data?.kelasTujuan ?? []);
    } catch {
      setError("Gagal memuat jawaban.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId]);

  const selectedRows = useMemo(
    () => hasil?.nilai.filter((row) => row.kelas.some((kelas) => kelas.id === selectedKelasId)) ?? [],
    [hasil, selectedKelasId]
  );

  if (loading) return <KurikulumShell><p className="mx-auto max-w-7xl px-4 text-sm text-[#9CA3AF] sm:px-6">Memuat jawaban...</p></KurikulumShell>;
  if (!hasil) return <KurikulumShell><p className="mx-auto max-w-7xl px-4 text-sm text-red-500 sm:px-6">{error || "Jawaban tidak ditemukan."}</p></KurikulumShell>;

  return (
    <KurikulumShell activeTab="ASESMEN"><div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
      <Link href={`/kurikulum/asesmen/${asesmenId}`} className="text-sm font-semibold text-[#64748B] hover:text-[#6B85F6]">
        &larr; Kembali ke Asesmen
      </Link>

      <div className="mt-4 rounded-xl border border-black/5 border-t-4 border-t-[#6B85F6] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Jawaban Siswa</p>
        <h1 className="mt-1 text-2xl font-bold text-[#111827]">{hasil.asesmen.judul}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="brand">{hasil.asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
          {hasil.asesmen.mapel && <Badge tone="gray">{hasil.asesmen.mapel}</Badge>}
          <Badge tone="green">{hasil.nilai.length} sudah mengumpulkan</Badge>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <div className="mt-6">
        <h2 className="mb-3 text-base font-bold text-[#111827]">Daftar Perkelas</h2>

        {kelasTujuan.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">Belum ada kelas tujuan.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kelasTujuan.map(({ kelas }) => {
              const count = hasil.nilai.filter((row) => row.kelas.some((item) => item.id === kelas.id)).length;
              const active = selectedKelasId === kelas.id;
              return (
                <button
                  key={kelas.id}
                  onClick={() => setSelectedKelasId(active ? null : kelas.id)}
                  className="rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={active ? { borderColor: "#6B85F6", boxShadow: "0 0 0 2px #6B85F633" } : { borderColor: "#E5E7EB" }}
                >
                  <p className="font-bold text-[#111827]">{kelas.judul}</p>
                  <p className="mt-1 text-xs text-[#64748B]">{count} siswa mengumpulkan jawaban</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedKelasId && (
        <div className="mt-6">
          <TabelNilai asesmenId={asesmenId} judulAsesmen={hasil.asesmen.judul} nilaiList={selectedRows} readOnly basePath="/kurikulum/asesmen" />
        </div>
      )}
    </div></KurikulumShell>
  );
}