"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";

interface MapelOption {
  id: string;
  nama: string;
}

interface EditAsesmenData {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  mapelId?: string | null;
  durasiMenit: number | null;
  deskripsi?: string | null;
}

export default function ModalEditAsesmen({
  open,
  onClose,
  onSuccess,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: EditAsesmenData | null;
}) {
  const [judul, setJudul] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [durasiMenit, setDurasiMenit] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [mapelList, setMapelList] = useState<MapelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !initialData) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJudul(initialData.judul);
    setMapelId(initialData.mapelId ?? "");
    setDurasiMenit(initialData.durasiMenit?.toString() ?? "");
    setDeskripsi(initialData.deskripsi ?? "");
    setError("");
    fetch("/api/mapel")
      .then((res) => res.json())
      .then((data) => setMapelList(data.data ?? []))
      .catch(() => {});
  }, [open, initialData]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!initialData) return;
    const durasi = durasiMenit ? Number(durasiMenit) : null;
    const minimumDurasi = initialData.tipe === "KUIS" ? 10 : 20;
    if (durasi !== null && durasi < minimumDurasi) {
      setError(`${initialData.tipe === "KUIS" ? "Kuis" : "Ujian Online"} minimal berdurasi ${minimumDurasi} menit.`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/asesmen/${initialData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul,
          mapelId: mapelId || null,
          durasiMenit: durasiMenit ? Number(durasiMenit) : null,
          deskripsi: deskripsi || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Asesmen gagal diperbarui.");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Asesmen gagal diperbarui.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Asesmen" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Judul Asesmen" value={judul} onChange={(event) => setJudul(event.target.value)} required />
        <Select label="Mapel" placeholder="Pilih mapel" value={mapelId} onChange={(event) => setMapelId(event.target.value)}>
          {mapelList.map((mapel) => <option key={mapel.id} value={mapel.id}>{mapel.nama}</option>)}
        </Select>
        <Input label="Durasi (menit)" type="number" min={initialData?.tipe === "KUIS" ? 10 : 20} value={durasiMenit} onChange={(event) => setDurasiMenit(event.target.value)} />
        {durasiMenit && Number(durasiMenit) < (initialData?.tipe === "KUIS" ? 10 : 20) && (
          <p className="-mt-2 text-xs font-medium text-red-500">
            {initialData?.tipe === "KUIS" ? "Kuis" : "Ujian Online"} minimal berdurasi {initialData?.tipe === "KUIS" ? 10 : 20} menit.
          </p>
        )}
        <Textarea label="Deskripsi (opsional)" value={deskripsi} onChange={(event) => setDeskripsi(event.target.value)} />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Batal</Button>
          <Button type="submit" loading={loading} className="flex-1">Simpan Perubahan</Button>
        </div>
      </form>
    </Modal>
  );
}