"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import DeadlineField from "./DeadlineField";
import { selectionFromDeadline, selectionToDeadlinePayload, type DeadlineSelection } from "@/lib/deadline";
import { useLanguage } from "@/lib/i18n";
import { TranslatedOption } from "@/components/TranslateContent";

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
  deadlineAt?: string | null;
  deadlineDurationMinutes?: number | null;
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
  const { t } = useLanguage();
  const [judul, setJudul] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [durasiMenit, setDurasiMenit] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [deadline, setDeadline] = useState<DeadlineSelection>({ mode: "none" });
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
    setDeadline(selectionFromDeadline(initialData.deadlineAt, initialData.deadlineDurationMinutes));
    setError("");
    fetch("/api/mapel", { cache: "no-store" })
      .then(async (res) => {
        const data: { data?: MapelOption[]; error?: string } = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal memuat daftar mapel.");
        if (!Array.isArray(data.data)) throw new Error("Daftar mapel tidak valid.");
        setMapelList(data.data);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Gagal memuat daftar mapel."));
  }, [open, initialData]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!initialData) return;
    const durasi = durasiMenit ? Number(durasiMenit) : null;
    const minimumDurasi = initialData.tipe === "KUIS" ? 10 : 20;
    if (durasi !== null && durasi < minimumDurasi) {
      setError(t("Durasi minimal {minimum} menit.").replace("{minimum}", String(minimumDurasi)));
      return;
    }
    const deadlineResult = selectionToDeadlinePayload(deadline);
    if (!deadlineResult.payload) {
      setError(t(deadlineResult.error ?? "Deadline tidak valid."));
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
          ...deadlineResult.payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(t(data.error ?? "Asesmen gagal diperbarui."));
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError(t("Asesmen gagal diperbarui."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("Edit Asesmen")} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t("Judul Asesmen")} value={judul} onChange={(event) => setJudul(event.target.value)} required />
        <Select label={t("Mapel")} placeholder={t("Pilih mapel")} value={mapelId} onChange={(event) => setMapelId(event.target.value)}>
          {mapelList.map((mapel) => <TranslatedOption key={mapel.id} value={mapel.id} text={mapel.nama} />)}
        </Select>
        <Input label={t("Durasi (menit)")} type="number" min={initialData?.tipe === "KUIS" ? 10 : 20} value={durasiMenit} onChange={(event) => setDurasiMenit(event.target.value)} />
        {durasiMenit && Number(durasiMenit) < (initialData?.tipe === "KUIS" ? 10 : 20) && (
          <p className="-mt-2 text-xs font-medium text-danger">
            {t("Durasi minimal {minimum} menit.").replace("{minimum}", String(initialData?.tipe === "KUIS" ? 10 : 20))}
          </p>
        )}
        <Textarea label={t("Deskripsi (opsional)")} value={deskripsi} onChange={(event) => setDeskripsi(event.target.value)} />
        <DeadlineField
          value={deadline}
          onChange={setDeadline}
          required={Boolean(initialData?.deadlineAt || initialData?.deadlineDurationMinutes)}
          startsWhen="Deadline dihitung sejak asesmen diterbitkan."
        />
        {error && <p className="text-xs font-medium text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t("Batal")}</Button>
          <Button type="submit" loading={loading} className="flex-1">{t("Simpan Perubahan")}</Button>
        </div>
      </form>
    </Modal>
  );
}