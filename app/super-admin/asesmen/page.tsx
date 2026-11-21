"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import ModalBuatAsesmen from "@/components/Modalbuatasesmen";
import ModalEditAsesmen from "@/components/ModalEditAsesmen";
import { showAlert, showConfirm } from "@/lib/dialog";
import { useLanguage } from "@/lib/i18n";
import CreatorScopeFilter, { type CreatorScope } from "@/components/shared/CreatorScopeFilter";

type StatusFilter = "SEMUA" | "PROSES" | "SELESAI";

export default function SuperAdminAsesmenPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [asesmenList, setAsesmenList] = useState<AsesmenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("SEMUA");
  const [creatorScope, setCreatorScope] = useState<CreatorScope>("ALL");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    "hari-ini": true,
    "tiga-bulan": true,
    history: true,
  });
  const [editingAsesmen, setEditingAsesmen] = useState<AsesmenData | null>(null);
  const [sendingAsesmen, setSendingAsesmen] = useState<AsesmenData | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((response) => response.json())
      .then((payload) => setCurrentUserId(payload.data?.id ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAsesmen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadAsesmen() {
    setLoading(true);
    try {
      const qs = statusFilter !== "SEMUA" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/asesmen${qs}`);
      const data = await res.json();
      setAsesmenList(data.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function handleSuccess(asesmenId: string) {
    router.push(`/super-admin/asesmen/${asesmenId}`);
  }

  function handleSendSuccess() {
    setSendingAsesmen(null);
    loadAsesmen();
  }

  async function handleDeleteAsesmen(asesmen: AsesmenData) {
    if (!(await showConfirm(t('Hapus asesmen "{judul}"? Data soal dan pengumpulan juga akan dihapus.').replace("{judul}", asesmen.judul)))) return;

    const res = await fetch(`/api/asesmen/${asesmen.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      await showAlert(t(data?.error ?? "Asesmen gagal dihapus."));
      return;
    }

    loadAsesmen();
  }

  const visibleAsesmen = creatorScope === "MINE" ? asesmenList.filter((asesmen) => asesmen.guru?.id === currentUserId) : asesmenList;
  const sekarang = new Date();
  const awalHariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  const awalTigaBulan = new Date(sekarang);
  awalTigaBulan.setMonth(awalTigaBulan.getMonth() - 3);
  const tanggalAsesmen = (asesmen: AsesmenData) => new Date(asesmen.createdAt ?? asesmen.updatedAt);
  const kelompok = [
    {
      key: "hari-ini",
      judul: t("Asesmen Hari Ini"),
      data: visibleAsesmen.filter((asesmen) => tanggalAsesmen(asesmen) >= awalHariIni),
    },
    {
      key: "tiga-bulan",
      judul: t("3 Bulan Terakhir"),
      data: visibleAsesmen.filter((asesmen) => {
        const tanggal = tanggalAsesmen(asesmen);
        return tanggal >= awalTigaBulan && tanggal < awalHariIni;
      }),
    },
    {
      key: "history",
      judul: t("Riwayat Asesmen"),
      data: visibleAsesmen.filter((asesmen) => tanggalAsesmen(asesmen) < awalTigaBulan),
    },
  ];

  function renderAsesmenCards(data: AsesmenData[]) {
    const kelompokTipe = [
      { judul: t("Kuis"), data: data.filter((asesmen) => asesmen.tipe === "KUIS") },
      { judul: t("Ujian Online"), data: data.filter((asesmen) => asesmen.tipe === "UJIAN") },
    ];
    return (
      <div className="space-y-5">
        {kelompokTipe.map((group) => group.data.length > 0 && (
          <div key={group.judul}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{group.judul}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.data.map((asesmen) => (
                <AsesmenCard key={asesmen.id} data={asesmen} basePath="/super-admin/asesmen" onEdit={setEditingAsesmen} onSend={setSendingAsesmen} onDelete={handleDeleteAsesmen} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6B85F6]/10 text-accent-text">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M9 5.5h6M9 3h6a2 2 0 0 1 2 2v1h2v15H5V6h2V5a2 2 0 0 1 2-2Z" />
              <path d="m9 14 2 2 4-4" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Ruang Pembelajaran")}</p>
            <h1 className="text-xl font-bold text-foreground">{t("Asesmen")}</h1>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {(["SEMUA", "PROSES", "SELESAI"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? "border-accent bg-[#6B85F6] text-white"
                  : "border-border text-muted-foreground hover:bg-[#6B85F6]/10"
              }`}
            >
              {t(s === "SEMUA" ? "Semua" : s === "PROSES" ? "Proses" : "Selesai")}
            </button>
          ))}
        </div>
        <CreatorScopeFilter value={creatorScope} onChange={setCreatorScope} mineDisabled={!currentUserId} />
        <Button onClick={() => setShowModal(true)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t("Buat Asesmen")}
        </Button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("Memuat...")}</p>
      ) : visibleAsesmen.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{t("Belum ada asesmen dibuat.")}</p>
      ) : (
        <div className="mt-6 space-y-5">
          {kelompok.map((group) => group.data.length > 0 && (
            <section key={group.key} className="rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setVisibleGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <span className="text-sm font-bold text-foreground">{group.judul}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" className={`h-4 w-4 transition-transform ${visibleGroups[group.key] ? "rotate-180" : ""}`}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {visibleGroups[group.key] && <div className="mt-5">{renderAsesmenCards(group.data)}</div>}
            </section>
          ))}
        </div>
      )}

      <ModalBuatAsesmen open={showModal} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
      <ModalEditAsesmen
        open={!!editingAsesmen}
        onClose={() => setEditingAsesmen(null)}
        onSuccess={loadAsesmen}
        initialData={editingAsesmen ? { ...editingAsesmen, mapelId: editingAsesmen.mapelId ?? editingAsesmen.mapel?.id ?? null } : null}
      />
      <ModalBuatAsesmen
        open={!!sendingAsesmen}
        onClose={() => setSendingAsesmen(null)}
        onSuccess={handleSendSuccess}
        initialSumber="EXISTING"
        initialAsesmenId={sendingAsesmen?.id}
      />
    </div>
  );
}
