"use client";

import { useEffect, useState } from "react";
import KelasCard, { KelasData } from "@/components/KelasCard";

export default function SiswaKelasPage() {
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
        throw new Error(data.error ?? "Gagal memuat daftar kelas.");
      }

      setKelasList(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat daftar kelas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Kelas Saya</p>
        <h1 className="mt-1 text-2xl font-bold text-[#182033]">Daftar Kelas</h1>
        <p className="mt-1 text-sm text-[#64748B]">Kelas yang sudah ditugaskan untukmu oleh admin.</p>
      </div>

      {loading && <p className="mt-4 text-sm text-[#9CA3AF]">Memuat kelas...</p>}

      {!loading && error && (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && kelasList.length === 0 && (
        <div className="border border-dashed border-[#dfe4ef] bg-white p-6 text-center">
          <p className="text-lg font-semibold text-[#182033]">Belum ada kelas</p>
          <p className="mt-2 text-sm text-[#64748B]">Kamu belum tergabung di kelas yang dibuat admin.</p>
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