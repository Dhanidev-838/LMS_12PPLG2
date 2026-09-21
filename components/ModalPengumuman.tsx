"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Textarea, Input } from "./ui/Input";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

interface LampiranInput {
  tipe: "FILE" | "LINK" | "VIDEO";
  url: string;
  judul?: string;
}

interface ModalPengumumanProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelasId?: string;
  mode?: "create" | "edit";
  initialData?: { id: string; isi: string; kelasId: string; lampiran: { tipe: "FILE" | "LINK" | "VIDEO"; url: string; judul: string | null }[] } | null;
}

export default function ModalPengumuman({ open, onClose, onSuccess, kelasId, mode = "create", initialData }: ModalPengumumanProps) {
  const [isi, setIsi] = useState("");
  const [lampiranList, setLampiranList] = useState<LampiranInput[]>([]);
  const [lampiranUrl, setLampiranUrl] = useState("");
  const [selectedKelasId, setSelectedKelasId] = useState(kelasId ?? "");
  const [kelasList, setKelasList] = useState<{ id: string; judul: string }[]>([]);
  const [uploadingLampiran, setUploadingLampiran] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/kelas")
      .then((res) => res.json())
      .then((data) => setKelasList(data.data ?? []))
      .catch(() => {});

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsi(initialData?.isi ?? "");
    setLampiranList(
      (initialData?.lampiran ?? []).map((lampiran) => ({
        tipe: lampiran.tipe,
        url: lampiran.url,
        judul: lampiran.judul ?? undefined,
      }))
    );
    setSelectedKelasId(initialData?.kelasId ?? kelasId ?? "");
    setLampiranUrl("");
    setError("");
  }, [open, initialData, kelasId]);

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
      const res = await fetch("/api/upload?kategori=pengumuman", { method: "POST", body: formData });
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

  function resetForm() {
    setIsi("");
    setLampiranList([]);
    setLampiranUrl("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isi.trim() && lampiranList.length === 0) {
      setError("Isi pengumuman atau lampiran wajib ditambahkan.");
      return;
    }

    setLoading(true);
    try {
        const res = await fetch(mode === "edit" && initialData ? `/api/pengumuman/${initialData.id}` : "/api/pengumuman", {
          method: mode === "edit" && initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kelasId: selectedKelasId, isi, lampiran: lampiranList }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
        setLoading(false);
        return;
      }

      resetForm();
      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={mode === "edit" ? "Edit Pengumuman" : "Post Pengumuman"}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Buat Pengumuman Pada Kelas anda"
          value={isi}
          onChange={(e) => setIsi(e.target.value)}
          rows={4}
        />

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Kirim ke Kelas</label>
          <select
            className="w-full rounded-lg border border-[#D1D5DB] px-3.5 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
            value=""
            onChange={(event) => event.target.value && setSelectedKelasId(event.target.value)}
          >
            <option value="">+ Tambah kelas</option>
            {kelasList.map((kelas) => (
              <option key={kelas.id} value={kelas.id}>
                {kelas.judul}
              </option>
            ))}
          </select>
          {selectedKelasId && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="brand" className="flex items-center gap-1">
                {kelasList.find((kelas) => kelas.id === selectedKelasId)?.judul ?? "Kelas terpilih"}
                <button type="button" onClick={() => setSelectedKelasId("")} className="cursor-pointer hover:text-red-500">x</button>
              </Badge>
            </div>
          )}
        </div>

        {/* daftar lampiran yang udah ditambah */}
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
                accept=".pdf,image/jpeg,image/png,image/webp"
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
            {mode === "edit" ? "Simpan Perubahan" : "Posting"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}