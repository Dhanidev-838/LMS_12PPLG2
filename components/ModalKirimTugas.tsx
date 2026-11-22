"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { useLanguage } from "@/lib/i18n";
import TranslateContent, { TranslatedOption } from "@/components/TranslateContent";

interface KelasOption {
  id: string;
  label: string;
}

interface ModalKirimTugasProps {
  open: boolean;
  tugasId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalKirimTugas({ open, tugasId, onClose, onSuccess }: ModalKirimTugasProps) {
  const { t } = useLanguage();
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    fetch("/api/kelas")
      .then((res) => res.json())
      .then((data: { data?: { id: string; judul: string }[] }) =>
        setKelasList((data.data ?? []).map((kelas) => ({ id: kelas.id, label: kelas.judul })))
      )
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
    if (!tugasId) return;
    if (selectedKelasIds.length === 0) {
      setError(t("Pilih minimal 1 kelas tujuan."));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tugas/${tugasId}/kirim-ke-kelas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasIds: selectedKelasIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(t(data.error ?? "Tugas gagal dikirim."));
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError(t("Tugas gagal dikirim."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("Kirim Tugas ke Kelas")} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">{t("Pilih kelas tujuan")}</label>
          <select
            className="min-h-10 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            value=""
            onChange={(event) => event.target.value && toggleKelas(event.target.value)}
          >
            <option value="">+ {t("Tambah kelas")}</option>
            {kelasList
              .filter((kelas) => !selectedKelasIds.includes(kelas.id))
              .map((kelas) => (
              <TranslatedOption key={kelas.id} value={kelas.id} text={kelas.label} />
              ))}
          </select>
          {selectedKelasIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedKelasIds.map((id) => {
                const kelas = kelasList.find((item) => item.id === id);
                return (
                  <Badge key={id} tone="brand" className="flex items-center gap-1">
                    {kelas?.label && <TranslateContent text={kelas.label} textClassName="inline" />}
                    <button type="button" onClick={() => toggleKelas(id)} className="cursor-pointer hover:text-danger">
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-xs font-medium text-danger">{t(error)}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            {t("Batal")}
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {t("Kirim Tugas")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
