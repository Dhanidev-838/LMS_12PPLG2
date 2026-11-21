"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import MateriCard, { MateriData } from "@/components/MateriCard";
import ModalMateri from "@/components/Modalmateri";
import RolePageHero from "@/components/shared/RolePageHero";
import CreatorScopeFilter, { type CreatorScope } from "@/components/shared/CreatorScopeFilter";
import { showConfirm } from "@/lib/dialog";
import { useLanguage } from "@/lib/i18n";


interface KelasOption {
  id: string;
  label: string;
}

export default function SuperAdminMateriPage() {
  const { t } = useLanguage();
  const [materiList, setMateriList] = useState<MateriData[]>([]);
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [filterKelasId, setFilterKelasId] = useState("");
  const [creatorScope, setCreatorScope] = useState<CreatorScope>("ALL");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMateri, setEditingMateri] = useState<MateriData | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((response) => response.json())
      .then((payload) => setCurrentUserId(payload.data?.id ?? null))
      .catch(() => {});
    fetch("/api/kelas")
      .then((response) => response.json())
      .then((payload) => setKelasOptions((payload.data ?? []).map((kelas: { id: string; judul: string }) => ({ id: kelas.id, label: kelas.judul }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    void loadMateri();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKelasId]);

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

  function openCreate() {
    setEditingMateri(null);
    setShowModal(true);
  }

  function openEdit(materi: MateriData) {
    setEditingMateri(materi);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!(await showConfirm(t("Hapus materi ini?")))) return;
    const response = await fetch(`/api/materi/${id}`, { method: "DELETE" });
    if (response.ok) await loadMateri();
  }

  const visibleMateri = creatorScope === "MINE" ? materiList.filter((materi) => materi.guru?.id === currentUserId) : materiList;
  const selectedClassName = kelasOptions.find((kelas) => kelas.id === filterKelasId)?.label;
  const summaryScope = selectedClassName
    ? `${t(creatorScope === "MINE" ? "Dibuat Saya" : "Semua")} · ${selectedClassName}`
    : t(creatorScope === "MINE" ? "Dibuat Saya" : "Seluruh sekolah");
  const today = new Date().toDateString();
  const materiHariIni = visibleMateri.filter((materi) => new Date(materi.createdAt).toDateString() === today);
  const history = visibleMateri.filter((materi) => new Date(materi.createdAt).toDateString() !== today);

  function renderMateri(list: MateriData[]) {
    if (list.length === 0) return <p className="text-sm text-muted-foreground">{t("Belum ada materi pada bagian ini.")}</p>;
    return (
      <div className="space-y-3">
        {list.map((materi) => (
          <MateriCard key={materi.id} data={materi} isEditable onEdit={openEdit} onDelete={handleDelete} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <RolePageHero
        eyebrow={t("Ruang pembelajaran")}
        title={t("Materi kelas")}
        description={t("Bagikan tautan, dokumen, PDF, atau foto materi kepada kelas.")}
        summary={{ label: t("Materi tersedia"), value: loading ? "—" : visibleMateri.length, description: summaryScope }}
      >
        <Button onClick={openCreate}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t("Buat Materi")}
        </Button>
        <CreatorScopeFilter value={creatorScope} onChange={setCreatorScope} mineDisabled={!currentUserId} />
        <select
          aria-label={t("Filter kelas")}
          className="min-h-10 min-w-40 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          value={filterKelasId}
          onChange={(event) => setFilterKelasId(event.target.value)}
        >
          <option value="">{t("Semua Kelas")}</option>
          {kelasOptions.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.label}</option>)}
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

      <ModalMateri
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadMateri}
        mode={editingMateri ? "edit" : "create"}
        initialData={editingMateri}
      />
    </div>
  );
}
