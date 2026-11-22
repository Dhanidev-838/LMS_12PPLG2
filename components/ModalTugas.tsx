// components/ModalTugas.tsx
"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import DeadlineField from "./DeadlineField";
import { selectionFromDeadline, selectionToDeadlinePayload, type DeadlineSelection } from "@/lib/deadline";
import { useLanguage } from "@/lib/i18n";
import type { TugasData } from "./TugasCard";
import TranslateContent, { TranslatedOption } from "@/components/TranslateContent";

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
  const { t } = useLanguage();
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [lampiranList, setLampiranList] = useState<LampiranInput[]>([]);
  const [lampiranUrl, setLampiranUrl] = useState("");
  const [uploadingLampiran, setUploadingLampiran] = useState(false);
  const [deadline, setDeadline] = useState<DeadlineSelection>({ mode: "none" });

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
      .then(async (res) => {
        const data: { data?: MapelOption[]; error?: string } = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal memuat daftar mapel.");
        if (!Array.isArray(data.data)) throw new Error("Daftar mapel tidak valid.");
        setMapelList(data.data);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Gagal memuat daftar mapel."));

    if (mode === "edit" && initialData) {
      setJudul(initialData.judul);
      setIsi(initialData.isi ?? "");
      setMapelId(initialData.mapelId ?? "");
      setDeadline(selectionFromDeadline(initialData.deadlineAt, initialData.deadlineDurationMinutes));
      setSelectedKelasIds((initialData.kelasTujuan ?? []).map((kt) => kt.kelas.id));
      setLampiranList(
        (initialData.lampiran ?? []).map((l) => ({ tipe: l.tipe, url: l.url, judul: l.judul ?? undefined }))
      );
    } else {
      setJudul("");
      setIsi("");
      setMapelId("");
      setDeadline({ mode: "none" });
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
      setError(t("Pilih minimal 1 kelas tujuan."));
      return;
    }

    const deadlineResult = selectionToDeadlinePayload(deadline);
    if (!deadlineResult.payload) {
      setError(t(deadlineResult.error ?? "Deadline tidak valid."));
      return;
    }
    if (mode === "create" && deadlineResult.payload.deadlineAt && Date.parse(deadlineResult.payload.deadlineAt) <= Date.now()) {
      setError(t("Tanggal deadline harus berada di masa depan."));
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
        ...deadlineResult.payload,
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
    <Modal open={open} onClose={onClose} title={t(mode === "edit" ? "Edit Tugas" : "Buat Tugas")} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t("Judul Tugas (opsional)")} value={judul} onChange={(e) => setJudul(e.target.value)} />

        <Select label={t("Mapel (opsional)")} placeholder={t("Pilih mapel")} value={mapelId} onChange={(e) => setMapelId(e.target.value)}>
          {mapelList.map((m) => (
            <TranslatedOption key={m.id} value={m.id} text={m.nama} />
          ))}
        </Select>

        <Textarea label={t("Instruksi / Deskripsi Tugas (opsional)")} value={isi} onChange={(e) => setIsi(e.target.value)} rows={4} />

        <DeadlineField
          value={deadline}
          onChange={setDeadline}
          startsWhen="Deadline dihitung sejak tugas dikirim ke kelas."
        />

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            {t("Kirim ke Kelas")} {!defaultKelasId && mode === "create" && <span className="font-normal text-muted-foreground">({t("opsional")})</span>}
          </label>
          <select
            className="min-h-10 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            value=""
            onChange={(e) => e.target.value && toggleKelas(e.target.value)}
          >
            <option value="">+ {t("Tambah kelas")}</option>
            {kelasList
              .filter((k) => !selectedKelasIds.includes(k.id))
              .map((k) => (
                <TranslatedOption key={k.id} value={k.id} text={k.label} />
              ))}
          </select>

          {selectedKelasIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedKelasIds.map((id) => {
                const k = kelasList.find((kk) => kk.id === id);
                return (
                  <Badge key={id} tone="brand" className="flex items-center gap-1">
                    {k?.label && <TranslateContent text={k.label} textClassName="inline" />}
                    <button type="button" onClick={() => toggleKelas(id)} className="cursor-pointer hover:text-danger">
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
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-muted p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">{l.judul || l.url}</p>
                  <p className="text-[10px] text-muted-foreground">{l.tipe}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLampiran(i)}
                  className="cursor-pointer text-xs font-medium text-danger hover:underline"
                >
                  {t("Hapus")}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-dashed border-border p-3">
          <p className="mb-2 text-xs font-semibold text-foreground">{t("Tambah Lampiran (opsional)")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted">
              {uploadingLampiran ? t("Mengunggah...") : `+ ${t("Upload File")}`}
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
              placeholder={t("atau tempel link...")}
              value={lampiranUrl}
              onChange={(e) => setLampiranUrl(e.target.value)}
              className="min-w-[180px] flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddLampiran} disabled={!isValidLink(lampiranUrl.trim())}>
              {`+ ${t("Link")}`}
            </Button>
          </div>
        </div>

        {error && <p className="text-xs font-medium text-danger">{t(error)}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            {t("Batal")}
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {t(mode === "edit" ? "Simpan Perubahan" : defaultKelasId ? "Buat & Kirim Tugas" : "Buat Tugas")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}