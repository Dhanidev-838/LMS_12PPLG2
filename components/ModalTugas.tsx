// components/ModalTugas.tsx
"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import type { TugasData } from "./TugasCard";

interface LampiranInput {
  tipe: "FILE" | "LINK" | "VIDEO";
  url: string;
  judul?: string;
}
interface KelasOption {
  id: string;
  label: string;
}
interface MapelOption {
  id: string;
  nama: string;
}

interface ModalTugasProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  initialData?: TugasData | null;
  defaultKelasId?: string;
}

export default function ModalTugas({ open, onClose, onSuccess, mode, initialData, defaultKelasId }: ModalTugasProps) {
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [lampiranList, setLampiranList] = useState<LampiranInput[]>([]);
  const [lampiranUrl, setLampiranUrl] = useState("");
  const [uploadingLampiran, setUploadingLampiran] = useState(false);

  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [mapelList, setMapelList] = useState<MapelOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    fetch("/api/kelas")
      .then((res) => res.json())
      .then((data) => setKelasList((data.data ?? []).map((k: any) => ({ id: k.id, label: k.judul }))))
      .catch(() => {});

    fetch("/api/mapel")
      .then((res) => res.json())
      .then((data) => setMapelList(data.data ?? []))
      .catch(() => {});

    if (mode === "edit" && initialData) {
      setJudul(initialData.judul);
      setIsi(initialData.isi ?? "");
      setMapelId(initialData.mapelId ?? "");
      setSelectedKelasIds((initialData.kelasTujuan ?? []).map((kt) => kt.kelas.id));
      setLampiranList(
        (initialData.lampiran ?? []).map((l) => ({ tipe: l.tipe, url: l.url, judul: l.judul ?? undefined }))
      );
    } else {
      setJudul("");
      setIsi("");
      setMapelId("");
      setSelectedKelasIds(defaultKelasId ? [defaultKelasId] : []);
      setLampiranList([]);
    }
    setLampiranUrl("");
    setError("");
  }, [open, mode, initialData, defaultKelasId]);

  function toggleKelas(id: string) {
    setSelectedKelasIds((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
  }

  function handleAddLampiran() {
    const url = lampiranUrl.trim();
    if (!isValidLink(url)) return;
    setLampiranList((prev) => [...prev, { tipe: "LINK", url, judul: url }]);
    setLampiranUrl("");
  }

  function isValidLink(value: string) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleUploadLampiranFile(file: File) {
    setUploadingLampiran(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload?kategori=tugas", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "File gagal diunggah.");
        return;
      }
      setLampiranList((prev) => [...prev, { tipe: "FILE", url: data.url, judul: file.name }]);
    } catch {
      setError("File gagal diunggah.");
    } finally {
      setUploadingLampiran(false);
    }
  }

  function handleRemoveLampiran(index: number) {
    setLampiranList((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "create" && defaultKelasId && selectedKelasIds.length === 0) {
      setError("Pilih minimal 1 kelas tujuan.");
      return;
    }

    setLoading(true);
    try {
      const body = {
        judul,
        isi: isi || null,
        mapelId: mapelId || null,
        kelasIds: selectedKelasIds,
        lampiran: lampiranList,
      };

      const res =
        mode === "edit" && initialData
          ? await fetch(`/api/tugas/${initialData.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })
          : await fetch("/api/tugas", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
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
    <Modal open={open} onClose={onClose} title={mode === "edit" ? "Edit Tugas" : "Buat Tugas"} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Judul Tugas (opsional)" value={judul} onChange={(e) => setJudul(e.target.value)} />

        <Select label="Mapel (opsional)" placeholder="Pilih mapel" value={mapelId} onChange={(e) => setMapelId(e.target.value)}>
          {mapelList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama}
            </option>
          ))}
        </Select>

        <Textarea label="Instruksi / Deskripsi Tugas (opsional)" value={isi} onChange={(e) => setIsi(e.target.value)} rows={4} />

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
            Kirim ke Kelas {!defaultKelasId && mode === "create" && <span className="font-normal text-[#9CA3AF]">(opsional)</span>}
          </label>
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

        {lampiranList.length > 0 && (
          <div className="space-y-2">
            {lampiranList.map((l, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-black/5 bg-[#F9FAFB] p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#111827]">{l.judul || l.url}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{l.tipe}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLampiran(i)}
                  className="cursor-pointer text-xs font-medium text-red-500 hover:underline"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-dashed border-[#D1D5DB] p-3">
          <p className="mb-2 text-xs font-semibold text-[#374151]">Tambah Lampiran (opsional)</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#374151] hover:bg-black/5">
              {uploadingLampiran ? "Mengunggah..." : "+ Upload File"}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,image/*"
                className="hidden"
                disabled={uploadingLampiran}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleUploadLampiranFile(file);
                  event.target.value = "";
                }}
              />
            </label>
            <Input
              placeholder="atau tempel link..."
              value={lampiranUrl}
              onChange={(e) => setLampiranUrl(e.target.value)}
              className="min-w-[180px] flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddLampiran} disabled={!isValidLink(lampiranUrl.trim())}>
              + Link
            </Button>
          </div>
        </div>

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {mode === "edit" ? "Simpan Perubahan" : defaultKelasId ? "Buat & Kirim Tugas" : "Buat Tugas"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}