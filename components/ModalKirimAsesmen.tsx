"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

interface ModalKirimAsesmenProps {
  open: boolean;
  asesmenId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalKirimAsesmen({ open, asesmenId, onClose, onSuccess }: ModalKirimAsesmenProps) {
  const [kelasList, setKelasList] = useState<{ id: string; judul: string }[]>([]);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/kelas")
      .then((res) => res.json())
      .then((data) => setKelasList(data.data ?? []))
      .catch(() => setError("Daftar kelas gagal dimuat."));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedKelasIds([]);
    setError("");
  }, [open]);

  function toggleKelas(id: string) {
    setSelectedKelasIds((prev) => (prev.includes(id) ? prev.filter((kelasId) => kelasId !== id) : [...prev, id]));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!asesmenId || selectedKelasIds.length === 0) {
      setError("Pilih minimal 1 kelas tujuan.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/kirim-ke-kelas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasIds: selectedKelasIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Asesmen gagal dikirim.");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Asesmen gagal dikirim.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Kirim Asesmen ke Kelas" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Pilih kelas tujuan</label>
          <select
            className="w-full rounded-lg border border-[#D1D5DB] px-3.5 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
            value=""
            onChange={(event) => event.target.value && toggleKelas(event.target.value)}
          >
            <option value="">+ Tambah kelas</option>
            {kelasList.filter((kelas) => !selectedKelasIds.includes(kelas.id)).map((kelas) => (
              <option key={kelas.id} value={kelas.id}>{kelas.judul}</option>
            ))}
          </select>
          {selectedKelasIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedKelasIds.map((id) => {
                const kelas = kelasList.find((item) => item.id === id);
                return <Badge key={id} tone="brand" className="flex items-center gap-1">{kelas?.judul}<button type="button" onClick={() => toggleKelas(id)}>x</button></Badge>;
              })}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" loading={loading} className="flex-1">Kirim Asesmen</Button>
        </div>
      </form>
    </Modal>
  );
}
