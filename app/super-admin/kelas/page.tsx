"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import KelasCard, { KelasData } from "@/components/KelasCard";
import ModalKelas from "@/components/ModalKelas";
import { showAlert, showConfirm } from "@/lib/dialog";

export default function SuperAdminKelasPage() {
  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingKelas, setEditingKelas] = useState<KelasData | null>(null);

  async function loadKelas() {
    setError("");
    try {
      const res = await fetch("/api/kelas");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Gagal memuat daftar kelas.");
      }
      setKelasList(data.data ?? []);
    } catch (error) {
      console.error("Gagal memuat daftar kelas Super Admin:", error);
      setError(error instanceof Error ? error.message : "Terjadi kesalahan saat memuat kelas.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingKelas(null);
    setShowModal(true);
  }

  function openEdit(kelas: KelasData) {
    setEditingKelas(kelas);
    setShowModal(true);
  }

  async function handleDelete(kelasId: string) {
    const kelas = kelasList.find((item) => item.id === kelasId);
    if (!(await showConfirm(`Hapus kelas "${kelas?.judul ?? "ini"}"? Tindakan ini tidak dapat dibatalkan.`))) return;

    try {
      const response = await fetch(`/api/kelas/${kelasId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        await showAlert(data.error ?? "Kelas gagal dihapus.");
        return;
      }
      await loadKelas();
    } catch (error) {
      console.error("Gagal menghapus kelas Super Admin:", error);
      await showAlert("Terjadi kesalahan saat menghapus kelas.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadKelas();
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Manajemen Kelas</p>
          <h1 className="mt-1 text-2xl font-bold text-[#182033]">Kelas pembelajaran</h1>
          <p className="mt-1 text-sm text-[#64748B]">Buat dan atur ruang belajar untuk setiap kelompok.</p>
        </div>
        <Button onClick={openCreate}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Buat Kelas
        </Button>
      </div>
      {loading && <p className="mt-4 text-sm text-[#9CA3AF]">Memuat...</p>}
      {!loading && error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      {!loading && !error && kelasList.length === 0 && <p className="mt-4 text-sm text-[#9CA3AF]">Belum ada kelas yang dibuat.</p>}
      {!loading && !error && kelasList.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((kelas) => (
            <KelasCard
              key={kelas.id}
              data={kelas}
              isEditable
              basePath="/super-admin/kelas"
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      <ModalKelas
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => void loadKelas()}
        mode={editingKelas ? "edit" : "create"}
        initialData={editingKelas}
      />
    </div>
  );
}