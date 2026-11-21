// app/super-admin/tugas/page.tsx
"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import TugasCard, { TugasData } from "@/components/TugasCard";
import ModalTugas from "@/components/ModalTugas";
import ModalKirimTugas from "@/components/ModalKirimTugas";
import RolePageHero from "@/components/shared/RolePageHero";
import CreatorScopeFilter, { type CreatorScope } from "@/components/shared/CreatorScopeFilter";
import { showConfirm } from "@/lib/dialog";
import { useLanguage } from "@/lib/i18n";


interface KelasOption {
  id: string;
  judul: string;
}

export default function SuperAdminTugasPage() {
  const { t } = useLanguage();
  const [tugasList, setTugasList] = useState<TugasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTugas, setEditingTugas] = useState<TugasData | null>(null);
  const [sendingTugas, setSendingTugas] = useState<TugasData | null>(null);
  const [filterKelasId, setFilterKelasId] = useState("");
  const [creatorScope, setCreatorScope] = useState<CreatorScope>("ALL");
  const [kelasOptions, setKelasOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.data)).catch(() => {});
    fetch("/api/kelas")
      .then((r) => r.json())
      .then((d) => setKelasOptions((d.data ?? []).map((k: KelasOption) => ({ id: k.id, label: k.judul }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadTugas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKelasId]);

  async function loadTugas() {
    setLoading(true);
    try {
      const qs = filterKelasId ? `?kelasId=${filterKelasId}` : "";
      const res = await fetch(`/api/tugas${qs}`);
      const data = await res.json();
      setTugasList(data.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function openBuat() {
    setEditingTugas(null);
    setShowModal(true);
  }
  function openEdit(t: TugasData) {
    setEditingTugas(t);
    setShowModal(true);
  }
  function handleSendSuccess() {
    setSendingTugas(null);
    loadTugas();
  }
  async function handleDelete(id: string) {
    if (!(await showConfirm(t("Hapus tugas ini?")))) return;
    await fetch(`/api/tugas/${id}`, { method: "DELETE" });
    loadTugas();
  }

  const visibleTugas = creatorScope === "MINE" ? tugasList.filter((tugas) => tugas.guru.id === me?.id) : tugasList;
  const selectedClassName = kelasOptions.find((kelas) => kelas.id === filterKelasId)?.label;
  const summaryScope = selectedClassName
    ? `${t(creatorScope === "MINE" ? "Dibuat Saya" : "Semua")} · ${selectedClassName}`
    : t(creatorScope === "MINE" ? "Dibuat Saya" : "Seluruh sekolah");
  const todayStr = new Date().toDateString();
  const hariIni = visibleTugas.filter((tugas) => new Date(tugas.createdAt).toDateString() === todayStr);
  const history = visibleTugas.filter((tugas) => new Date(tugas.createdAt).toDateString() !== todayStr);

  return (
    <div>
      <RolePageHero
        eyebrow={t("Ruang Pembelajaran")}
        title={t("Tugas kelas")}
        description={t("Buat tugas, kirim ke kelas, lalu pantau pengumpulan siswa.")}
        summary={{ label: t("Tugas dibuat"), value: loading ? "—" : visibleTugas.length, description: summaryScope }}
      >
        <Button onClick={openBuat}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t("Buat Tugas")}
        </Button>
        <CreatorScopeFilter value={creatorScope} onChange={setCreatorScope} mineDisabled={!me?.id} />
        <select
          aria-label={t("Filter kelas")}
          className="min-h-10 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          value={filterKelasId}
          onChange={(e) => setFilterKelasId(e.target.value)}
        >
          <option value="">{t("Semua Kelas")}</option>
          {kelasOptions.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </RolePageHero>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("Memuat...")}</p>
      ) : (
        <>
          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-foreground">{t("Tugas Hari Ini")}</p>
            {hariIni.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Belum ada tugas dibuat hari ini.")}</p>
            ) : (
              <div className="space-y-3">
                {hariIni.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="SUPER_ADMIN" onEdit={openEdit} onDelete={handleDelete} onSend={setSendingTugas} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm font-bold text-foreground">{t("Riwayat Tugas")}</p>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Belum ada riwayat tugas.")}</p>
            ) : (
              <div className="space-y-3">
                {history.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="SUPER_ADMIN" onEdit={openEdit} onDelete={handleDelete} onSend={setSendingTugas} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ModalTugas
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadTugas}
        mode={editingTugas ? "edit" : "create"}
        initialData={editingTugas}
      />
      <ModalKirimTugas
        open={!!sendingTugas}
        tugasId={sendingTugas?.id ?? null}
        onClose={() => setSendingTugas(null)}
        onSuccess={handleSendSuccess}
      />
    </div>
  );
}
