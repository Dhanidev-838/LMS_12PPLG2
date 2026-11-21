"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import { KelasData } from "./KelasCard";
import { useLanguage } from "@/lib/i18n";

interface ModalKelasProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  initialData?: KelasData | null;
}

export default function ModalKelas({ open, onClose, onSuccess, mode, initialData }: ModalKelasProps) {
  const { t } = useLanguage();
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      setJudul(initialData.judul ?? "");
      setDeskripsi(initialData.deskripsi ?? "");
    } else {
      setJudul("");
      setDeskripsi("");
    }
    setError("");
  }, [open, mode, initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!judul.trim()) {
      setError(t("Judul kelas wajib diisi."));
      return;
    }

    setLoading(true);

    try {
      const url = mode === "create" ? "/api/kelas" : `/api/kelas/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul, deskripsi: deskripsi || null }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(t(data.error ?? "Terjadi kesalahan."));
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError(t("Terjadi kesalahan. Coba lagi."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === "create" ? t("Buat Kelas") : `${t("Edit Kelas")} - ${initialData?.judul ?? t("Kelas")}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t("Judul")}
          placeholder={t('Contoh: "12 PPLG 2 Belajar PPLG"')}
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          required
        />

        <Textarea
          label={t("Deskripsi Kelas (Opsional)")}
          placeholder={t("Contoh: Kelas unggulan jurusan...")}
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
        />

        {error && <p className="text-xs font-medium text-danger">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          {mode === "create" ? t("Buat Kelas") : t("Simpan Perubahan")}
        </Button>
      </form>
    </Modal>
  );
}