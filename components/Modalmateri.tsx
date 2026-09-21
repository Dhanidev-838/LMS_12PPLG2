"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { MateriData } from "./MateriCard";

interface KelasOption {
  id: string;
  label: string;
}

interface ModalMateriProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  initialData?: MateriData | null;
}

export default function ModalMateri({ open, onClose, onSuccess, mode, initialData }: ModalMateriProps) {
  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState<"PDF" | "LINK">("LINK");
  const [url, setUrl] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    fetch("/api/kelas")
      .then((res) => res.json())
      .then((data) =>
        setKelasList((data.data ?? []).map((k: any) => ({ id: k.id, label: k.judul || "Tanpa Judul", })))
      )
      .catch(() => {});

    if (mode === "edit" && initialData) {
      setJudul(initialData.judul);
      setTipe(initialData.tipe);
      setUrl(initialData.url);
      setDeskripsi(initialData.deskripsi ?? "");
      setSelectedKelasIds((initialData.kelasTujuan ?? []).map((kt: any) => kt.kelas.id).filter(Boolean));
    } else {
      setJudul("");
      setTipe("LINK");
      setUrl("");
      setDeskripsi("");
      setSelectedKelasIds([]);
    }
    setError("");
  }, [open, mode, initialData]);

  function toggleKelas(id: string) {
    setSelectedKelasIds((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedKelasIds.length === 0) {
      setError("Pilih minimal 1 kelas tujuan.");
      return;
    }

    setLoading(true);
    try {
      const isEdit = mode === "edit";
      const urlEndpoint = isEdit ? `/api/materi/${initialData?.id}` : "/api/materi";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(urlEndpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul, tipe, url, deskripsi: deskripsi || null, kelasIds: selectedKelasIds }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === "create" ? "Upload Materi" : "Edit Materi"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Judul Materi" value={judul} onChange={(e) => setJudul(e.target.value)} required />

        <Select label="Tipe" value={tipe} onChange={(e) => setTipe(e.target.value as "PDF" | "LINK")}>
          <option value="LINK">Link</option>
          <option value="PDF">PDF</option>
        </Select>

        <Input
          label={tipe === "PDF" ? "URL File PDF" : "URL Link"}
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />

        <Textarea label="Deskripsi (opsional)" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Kelas Tujuan</label>
          <select
            className="w-full rounded-lg border border-[#D1D5DB] px-3.5 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
            value=""
            onChange={(e) => e.target.value && toggleKelas(e.target.value)}
          >
            <option value="">+ Tambah kelas</option>
            {kelasList
              .filter((k) => !selectedKelasIds.includes(k.id))
              .map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
          </select>

          {selectedKelasIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedKelasIds.map((id) => {
                const k = kelasList.find((kk) => kk.id === id);
                return (
                  <Badge key={id} tone="brand" className="flex items-center gap-1">
                    {k?.label}
                    <button type="button" onClick={() => toggleKelas(id)} className="cursor-pointer hover:text-red-500">
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          {mode === "create" ? "Upload Materi" : "Simpan Perubahan"}
        </Button>
      </form>
    </Modal>
  );
}