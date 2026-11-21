"use client";

import { useEffect, useState } from "react";
import KelasCard, { KelasData } from "@/components/KelasCard";
import { useLanguage } from "@/lib/i18n";

export default function SiswaKelasPage() {
  const { t } = useLanguage();
  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKelas();
  }, []);

  async function loadKelas() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/kelas");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(t(data.error ?? "Gagal memuat daftar kelas."));
      }

      setKelasList(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? t(err.message) : t("Gagal memuat daftar kelas."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Kelas Saya")}</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{t("Daftar Kelas")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Kelas yang sudah ditugaskan untukmu oleh admin.")}</p>
      </div>

      {loading && <p className="mt-4 text-sm text-muted-foreground">{t("Memuat kelas...")}</p>}

      {!loading && error && (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && kelasList.length === 0 && (
        <div className="border border-dashed border-border bg-surface p-6 text-center">
          <p className="text-lg font-semibold text-foreground">{t("Belum ada kelas")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("Kamu belum tergabung di kelas yang dibuat admin.")}</p>
        </div>
      )}

      {!loading && !error && kelasList.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((kelas) => (
            <KelasCard key={kelas.id} data={kelas} isEditable={false} basePath="/siswa/kelas" />
          ))}
        </div>
      )}
    </div>
  );
}