"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import TabelNilai from "@/components/Tabelnilai";

interface NilaiRow {
  submissionId: string;
  nama: string;
  role: "SISWA" | "SUPER_ADMIN";
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

export default function GuruJawabanPage() {
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
    () => hasil?.nilai.filter((row) => row.role !== "SUPER_ADMIN" && row.kelas.some((kelas) => kelas.id === selectedKelasId)) ?? [],
    [hasil, selectedKelasId]
  );
  const superAdminRows = hasil?.nilai.filter((row) => row.role === "SUPER_ADMIN") ?? [];
  const studentRows = hasil?.nilai.filter((row) => row.role !== "SUPER_ADMIN") ?? [];

  if (loading) return <p className="text-sm text-[#9CA3AF]">Memuat jawaban...</p>;
  if (!hasil) return <p className="text-sm text-red-500">{error || "Jawaban tidak ditemukan."}</p>;

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <Link href={`/super-admin/asesmen/${asesmenId}`} className="text-sm font-semibold text-[#64748B] hover:text-[#6B85F6]">
        &larr; Kembali ke Asesmen
      </Link>

      <div className="mt-4 border border-[#e1e5ed] border-t-4 border-t-[#6B85F6] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Hasil Asesmen</p>
        <h1 className="mt-1 text-2xl font-bold text-[#182033]">{hasil.asesmen.judul}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="brand">{hasil.asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
          {hasil.asesmen.mapel && <Badge tone="gray">{hasil.asesmen.mapel}</Badge>}
          <Badge tone="green">{studentRows.length} siswa sudah mengumpulkan</Badge>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <section className="mt-6 border border-[#c7d2fe] border-l-4 border-l-[#6B85F6] bg-[#eef2ff] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#182033]">Jawaban Super Admin</h2>
            <p className="mt-1 text-xs text-[#64748B]">Bagian khusus. Submission ini hanya dapat dibuka oleh akun Super Admin.</p>
          </div>
          <Badge tone="brand">{superAdminRows.length} submission</Badge>
        </div>
        {superAdminRows.length === 0 ? (
          <p className="mt-4 text-sm text-[#64748B]">Belum ada Super Admin yang mengumpulkan asesmen ini.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {superAdminRows.map((row) => (
              <Link
                key={row.submissionId}
                href={`/super-admin/asesmen/${asesmenId}/jawaban/${row.submissionId}`}
                className="border border-[#c7d2fe] bg-white p-4 transition-colors hover:border-[#6B85F6]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-bold text-[#182033]">{row.nama}</p>
                  <Badge tone="brand">Super Admin</Badge>
                </div>
                <p className="mt-2 text-xs text-[#64748B]">Nilai: {row.nilaiAkhir ?? row.nilaiSementara}</p>
                <p className="mt-3 text-xs font-semibold text-[#6B85F6]">Buka jawaban &rarr;</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-bold text-[#182033]">Daftar Perkelas</h2>
        {kelasTujuan.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">Belum ada kelas tujuan.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kelasTujuan.map(({ kelas }) => {
              const count = studentRows.filter((row) => row.kelas.some((item) => item.id === kelas.id)).length;
              const active = selectedKelasId === kelas.id;
              return (
                <button
                  key={kelas.id}
                  onClick={() => setSelectedKelasId(active ? null : kelas.id)}
                  className={`border bg-white p-4 text-left transition-colors ${active ? "border-[#6B85F6]" : "border-[#dfe4ef] hover:border-[#bdc8f8] hover:bg-[#fafbff]"}`}
                >
                  <p className="font-bold text-[#182033]">{kelas.judul}</p>
                  <p className="mt-1 text-xs text-[#64748B]">{count} siswa mengumpulkan jawaban</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedKelasId && (
        <div className="mt-6">
          <TabelNilai
            asesmenId={asesmenId}
            judulAsesmen={hasil.asesmen.judul}
            nilaiList={selectedRows}
            basePath="/super-admin/asesmen"
            onReset={loadData}
            allowPdfExport
            kelasJudul={kelasTujuan.find(({ kelas }) => kelas.id === selectedKelasId)?.kelas.judul}
            namaMapel={hasil.asesmen.mapel}
            jenisAsesmen={hasil.asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online"}
          />
        </div>
      )}
    </div>
  );
}