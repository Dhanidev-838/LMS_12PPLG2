"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import ModalBuatAsesmen from "@/components/Modalbuatasesmen";
import ModalEditAsesmen from "@/components/ModalEditAsesmen";
import { showAlert, showConfirm } from "@/lib/dialog";

type StatusFilter = "SEMUA" | "PROSES" | "SELESAI";

export default function SuperAdminAsesmenPage() {
  const router = useRouter();
  const [asesmenList, setAsesmenList] = useState<AsesmenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("SEMUA");
  const [showModal, setShowModal] = useState(false);
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    "hari-ini": true,
    "tiga-bulan": true,
    history: true,
  });
  const [editingAsesmen, setEditingAsesmen] = useState<AsesmenData | null>(null);
  const [sendingAsesmen, setSendingAsesmen] = useState<AsesmenData | null>(null);

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
    if (!(await showConfirm(`Hapus asesmen "${asesmen.judul}"? Data soal dan pengumpulan juga akan dihapus.`))) return;

    const res = await fetch(`/api/asesmen/${asesmen.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      await showAlert(data?.error ?? "Asesmen gagal dihapus.");
      return;
    }

    loadAsesmen();
  }

  const sekarang = new Date();
  const awalPeriodeSekarang = new Date(sekarang);
  awalPeriodeSekarang.setMonth(awalPeriodeSekarang.getMonth() - 3);
  const awalPeriodeSebelumnya = new Date(sekarang);
  awalPeriodeSebelumnya.setMonth(awalPeriodeSebelumnya.getMonth() - 6);
  const tanggalAsesmen = (asesmen: AsesmenData) => new Date(asesmen.createdAt ?? asesmen.updatedAt);
  const kelompok = [
    {
      key: "hari-ini",
      judul: "Asesmen Hari Ini",
      data: asesmenList.filter((asesmen) => tanggalAsesmen(asesmen) >= awalPeriodeSekarang),
    },
    {
      key: "tiga-bulan",
      judul: "3 Bulan Terakhir",
      data: asesmenList.filter((asesmen) => {
        const tanggal = tanggalAsesmen(asesmen);
        return tanggal >= awalPeriodeSebelumnya && tanggal < awalPeriodeSekarang;
      }),
    },
    {
      key: "history",
      judul: "History Asesmen",
      data: asesmenList.filter((asesmen) => tanggalAsesmen(asesmen) < awalPeriodeSebelumnya),
    },
  ];

  function renderAsesmenCards(data: AsesmenData[]) {
    const kelompokTipe = [
      { judul: "Kuis", data: data.filter((asesmen) => asesmen.tipe === "KUIS") },
      { judul: "Ujian Online", data: data.filter((asesmen) => asesmen.tipe === "UJIAN") },
    ];
    return (
      <div className="space-y-5">
        {kelompokTipe.map((group) => group.data.length > 0 && (
          <div key={group.judul}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">{group.judul}</p>
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
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6B85F6]/10 text-[#6B85F6]">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M9 5.5h6M9 3h6a2 2 0 0 1 2 2v1h2v15H5V6h2V5a2 2 0 0 1 2-2Z" />
              <path d="m9 14 2 2 4-4" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Ruang Pembelajaran</p>
            <h1 className="text-xl font-bold text-[#182033]">Asesmen</h1>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {(["SEMUA", "PROSES", "SELESAI"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? "border-[#6B85F6] bg-[#6B85F6] text-white"
                  : "border-[#dfe4ef] text-[#435064] hover:bg-[#6B85F6]/10"
              }`}
            >
              {s === "SEMUA" ? "Semua" : s === "PROSES" ? "Proses" : "Selesai"}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowModal(true)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Buat Asesmen
        </Button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-[#9CA3AF]">Memuat...</p>
      ) : asesmenList.length === 0 ? (
        <p className="mt-6 text-sm text-[#9CA3AF]">Belum ada asesmen dibuat.</p>
      ) : (
        <div className="mt-6 space-y-5">
          {kelompok.map((group) => group.data.length > 0 && (
            <section key={group.key} className="border border-[#e1e5ed] bg-white p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setVisibleGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <span className="text-sm font-bold text-[#182033]">{group.judul}</span>
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