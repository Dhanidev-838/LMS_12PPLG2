"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import TabelNilai from "@/components/Tabelnilai";
import { useLanguage } from "@/lib/i18n";

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

export default function GuruJawabanPage() {
  const { t } = useLanguage();
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
        setError(t(nilaiData.error ?? "Gagal memuat jawaban."));
        return;
      }
      setHasil(nilaiData.data);
      setKelasTujuan(asesmenData.data?.kelasTujuan ?? []);
    } catch {
      setError(t("Gagal memuat jawaban."));
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

  if (loading) return <p className="text-sm text-muted-foreground">{t("Memuat jawaban...")}</p>;
  if (!hasil) return <p className="text-sm text-red-500">{t(error || "Jawaban tidak ditemukan.")}</p>;

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <Link href={`/guru/asesmen/${asesmenId}`} className="text-sm font-semibold text-muted-foreground hover:text-accent-text">
        &larr; {t("Kembali ke Asesmen")}
      </Link>

      <div className="mt-4 border border-border border-t-4 border-t-[#6B85F6] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Jawaban Siswa")}</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{hasil.asesmen.judul}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="brand">{t(hasil.asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online")}</Badge>
          {hasil.asesmen.mapel && <Badge tone="gray">{hasil.asesmen.mapel}</Badge>}
          <Badge tone="green">{hasil.nilai.length} {t("sudah mengumpulkan")}</Badge>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{t(error)}</p>}

      <div className="mt-6">
        <h2 className="mb-3 text-base font-bold text-foreground">{t("Daftar Perkelas")}</h2>
        {kelasTujuan.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("Belum ada kelas tujuan.")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kelasTujuan.map(({ kelas }) => {
              const count = hasil.nilai.filter((row) => row.kelas.some((item) => item.id === kelas.id)).length;
              const active = selectedKelasId === kelas.id;
              return (
                <button
                  key={kelas.id}
                  onClick={() => setSelectedKelasId(active ? null : kelas.id)}
                  className={`border bg-white p-4 text-left transition-colors ${active ? "border-accent" : "border-border hover:border-[#bdc8f8] hover:bg-[#fafbff]"}`}
                >
                  <p className="font-bold text-foreground">{kelas.judul}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{count} {t("siswa mengumpulkan jawaban")}</p>
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
            onReset={loadData}
            allowPdfExport
            kelasJudul={kelasTujuan.find(({ kelas }) => kelas.id === selectedKelasId)?.kelas.judul}
            namaMapel={hasil.asesmen.mapel}
            jenisAsesmen={t(hasil.asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online")}
          />
        </div>
      )}
    </div>
  );
}