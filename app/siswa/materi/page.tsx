"use client";

import { useEffect, useState } from "react";
import MateriCard, { MateriData } from "@/components/MateriCard";
import RolePageHero from "@/components/shared/RolePageHero";
import { useLanguage } from "@/lib/i18n";
import { TranslatedOption } from "@/components/TranslateContent";

interface KelasOption {
  id: string;
  label: string;
}

export default function SiswaMateriPage() {
  const { t } = useLanguage();
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
        setError(t(payload.error ?? "Gagal memuat materi."));
        return;
      }
      setMateriList(payload.data ?? []);
    } catch {
      setError(t("Gagal memuat materi."));
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
    if (list.length === 0) return <p className="text-sm text-muted-foreground">{t("Belum ada materi pada bagian ini.")}</p>;
    return (
      <div className="space-y-3">
        {list.map((materi) => <MateriCard key={materi.id} data={materi} />)}
      </div>
    );
  }

  return (
    <div>
      <RolePageHero
        eyebrow={t("Ruang belajar siswa")}
        title={t("Materi Belajar")}
        description={t("Kumpulan materi yang dibagikan guru di kelasmu.")}
        summary={{
          label: t("Materi tersedia"),
          value: loading ? "—" : materiList.length,
          description: t("Materi dari kelas yang kamu ikuti"),
        }}
      >
        <select
          aria-label={t("Filter kelas")}
          className="min-h-10 min-w-40 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          value={filterKelasId}
          onChange={(event) => setFilterKelasId(event.target.value)}
        >
          <option value="">{t("Semua Kelas")}</option>
          {kelasOptions.map((kelas) => <TranslatedOption key={kelas.id} value={kelas.id} text={kelas.label} />)}
        </select>
      </RolePageHero>

      {error && <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">{t("Memuat materi...")}</p>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-bold text-foreground">{t("Materi Hari Ini")}</h2>
            {renderMateri(materiHariIni)}
          </section>
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-bold text-foreground">{t("History")}</h2>
            {renderMateri(history)}
          </section>
        </>
      )}
    </div>
  );
}
