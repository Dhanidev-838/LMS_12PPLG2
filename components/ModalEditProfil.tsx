"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import Button from "./ui/Button";

interface ModalEditProfilProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  initialNama: string;
  initialFoto: string | null;
  initialDeskripsi: string | null;
}

export default function ModalEditProfil({ open, onClose, onSuccess, userId, initialNama, initialFoto, initialDeskripsi }: ModalEditProfilProps) {
  const [nama, setNama] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [deskripsi, setDeskripsi] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNama(initialNama);
    setFotoPreview(initialFoto);
    setFotoFile(null);
    setDeskripsi(initialDeskripsi ?? "");
    setError("");
  }, [open, initialNama, initialFoto, initialDeskripsi]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nama.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      let fotoUrl = fotoPreview;
      if (fotoFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", fotoFile);
        const res = await fetch("/api/upload?kategori=profil", { method: "POST", body: fd });
        const json = await res.json();
        setUploading(false);
        if (!res.ok) {
          setError(json.error ?? "Gagal upload foto.");
          setLoading(false);
          return;
        }
        fotoUrl = json.url;
      }

      const res = await fetch(`/api/profil/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, fotoProfil: fotoUrl, deskripsi: deskripsi || null }),
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
    <Modal open={open} onClose={onClose} title="Edit Profil" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Foto Profil</label>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-lg font-bold text-[#6B7280]">
              {fotoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                nama.charAt(0) || "?"
              )}
            </div>
            <label className="cursor-pointer rounded-lg border border-[#D1D5DB] px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-black/5">
              {uploading ? "Mengunggah..." : "Ganti Foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFotoFile(f);
                    setFotoPreview(URL.createObjectURL(f));
                  }
                }}
              />
            </label>
          </div>
        </div>

        <Input label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} required />
        <Textarea label="Deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={4} placeholder="Ceritakan sedikit tentang dirimu..." />

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" loading={loading || uploading} className="flex-1">
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
}