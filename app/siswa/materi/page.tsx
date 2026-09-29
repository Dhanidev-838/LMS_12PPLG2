"use client";

import { useEffect, useState } from "react";
import MateriCard, { MateriData } from "@/components/MateriCard";

interface KelasOption {
  id: string;
  label: string;
}

export default function SiswaMateriPage() {
  const [materiList, setMateriList] = useState<MateriData[]>([]);
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [filterKelasId, setFilterKelasId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/kelas")
      .then((response) => response.json())
      .then((payload) => setKelasOptions((payload.data ?? []).map((kelas: { id: string; judul: string }) => ({ id: kelas.id, label: kelas.judul }))))
      .catch(() => {});
  }, []);

  async function loadMateri() {
    setLoading(true);
    setError("");
    try {
      const query = filterKelasId ? `?kelasId=${encodeURIComponent(filterKelasId)}` : "";
      const response = await fetch(`/api/materi${query}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Gagal memuat materi.");
        return;
      }
      setMateriList(payload.data ?? []);
    } catch {
      setError("Gagal memuat materi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMateri();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKelasId]);

  const today = new Date().toDateString();
  const materiHariIni = materiList.filter((materi) => new Date(materi.createdAt).toDateString() === today);
  const history = materiList.filter((materi) => new Date(materi.createdAt).toDateString() !== today);

  function renderMateri(list: MateriData[]) {
    if (list.length === 0) return <p className="text-sm text-[#9CA3AF]">Belum ada materi pada bagian ini.</p>;
    return (
      <div className="space-y-3">
        {list.map((materi) => <MateriCard key={materi.id} data={materi} />)}
      </div>
    );
  }

  return (
    <div>
      <section className="border border-[#dfe4ef] p-5 text-white sm:p-6" style={{ background: "#6B85F6" }}>
        <p className="text-sm font-bold">Materi Belajar</p>
        <p className="mt-1 text-sm text-white/85">Kumpulan materi yang dibagikan guru di kelasmu.</p>
      </section>

      <div className="mt-4 flex justify-end">
        <select
          aria-label="Filter kelas"
          className="min-w-40 border border-[#dfe4ef] bg-white px-3 py-2 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
          value={filterKelasId}
          onChange={(event) => setFilterKelasId(event.target.value)}
        >
          <option value="">Semua Kelas</option>
          {kelasOptions.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.label}</option>)}
        </select>
      </div>

      {error && <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="mt-6 text-sm text-[#9CA3AF]">Memuat materi...</p>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-bold text-[#182033]">Materi Hari Ini</h2>
            {renderMateri(materiHariIni)}
          </section>
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-bold text-[#182033]">History</h2>
            {renderMateri(history)}
          </section>
        </>
      )}
    </div>
  );
}
