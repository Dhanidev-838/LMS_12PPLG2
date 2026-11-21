"use client";

import { useEffect, useState } from "react";
import KelasCard, { KelasData } from "@/components/KelasCard";
import JoinClassForm from "@/components/JoinClassForm";
import { useLanguage } from "@/lib/i18n";

export default function GuruKelasPage() {
  const { t } = useLanguage();
  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKelas();
  }, []);

  async function loadKelas() {
    setLoading(true);
    try {
      const res = await fetch("/api/kelas");
      const data = await res.json();
      setKelasList(data.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Manajemen Kelas")}</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{t("Kelas yang Diampu")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Lihat kelas dan siswa yang menjadi tanggung jawabmu.")}</p>
      </div>
      <JoinClassForm onSuccess={loadKelas} />
      {loading && <p className="mt-4 text-sm text-muted-foreground">{t("Memuat...")}</p>}
      {!loading && kelasList.length === 0 && <p className="mt-4 text-sm text-muted-foreground">{t("Anda belum mengajar di kelas manapun. Hubungi admin untuk ditugaskan ke kelas.")}</p>}
      {!loading && kelasList.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((kelas) => <KelasCard key={kelas.id} data={kelas} isEditable={false} basePath="/guru/kelas" />)}
        </div>
      )}
    </div>
  );
}