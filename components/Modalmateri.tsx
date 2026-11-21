"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { MateriData } from "./MateriCard";
import { useLanguage } from "@/lib/i18n";

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
  const { t } = useLanguage();
  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState<"PDF" | "FILE" | "IMAGE" | "LINK">("LINK");
  const [sumber, setSumber] = useState<"LINK" | "FILE">("LINK");
  const [url, setUrl] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [mapelList, setMapelList] = useState<{ id: string; nama: string }[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    fetch("/api/kelas")
      .then((res) => res.json())
      .then((data: { data?: { id: string; judul: string | null }[] }) =>
        setKelasList((data.data ?? []).map((kelas) => ({ id: kelas.id, label: kelas.judul || "Tanpa Judul" })))
      )
      .catch(() => {});

    fetch("/api/mapel")
      .then(async (res) => {
        const data: { data?: { id: string; nama: string }[]; error?: string } = await res.json();
        if (!res.ok) throw new Error(t(data.error ?? "Gagal memuat daftar mapel."));
        if (!Array.isArray(data.data)) throw new Error(t("Daftar mapel tidak valid."));
        setMapelList(data.data);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? t(cause.message) : t("Gagal memuat daftar mapel.")));

    if (mode === "edit" && initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJudul(initialData.judul);
      setTipe(initialData.tipe);
      setSumber(initialData.tipe === "LINK" ? "LINK" : "FILE");
      setUrl(initialData.url);
      setDeskripsi(initialData.deskripsi ?? "");
      setMapelId(initialData.mapelId ?? "");
      setSelectedKelasIds((initialData.kelasTujuan ?? []).map((kelasTujuan) => kelasTujuan.kelas.id).filter(Boolean));
    } else {
      setJudul("");
      setTipe("LINK");
      setSumber("LINK");
      setUrl("");
      setDeskripsi("");
      setMapelId("");
      setSelectedKelasIds([]);
    }
    setError("");
  }, [open, mode, initialData]);

  function toggleKelas(id: string) {
    setSelectedKelasIds((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
  }

  function isValidLink(value: string) {
    try {
      const link = new URL(value);
      return link.protocol === "http:" || link.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload?kategori=materi", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(t(data.error ?? "File gagal diunggah."));
        return;
      }
      setTipe(file.type === "application/pdf" ? "PDF" : file.type.startsWith("image/") ? "IMAGE" : "FILE");
      setUrl(data.url);
    } catch {
      setError(t("File gagal diunggah."));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedKelasIds.length === 0) {
      setError(t("Pilih minimal 1 kelas tujuan."));
      return;
    }
    if (sumber === "LINK" && !isValidLink(url.trim())) {
      setError(t("Masukkan link yang diawali http:// atau https://."));
      return;
    }
    if (sumber === "FILE" && !url) {
      setError(t("Pilih file materi terlebih dahulu."));
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
        body: JSON.stringify({ judul, tipe, url, deskripsi: deskripsi || null, mapelId: mapelId || null, kelasIds: selectedKelasIds }),
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
    <Modal open={open} onClose={onClose} title={mode === "create" ? t("Upload Materi") : t("Edit Materi")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t("Judul Materi")} value={judul} onChange={(e) => setJudul(e.target.value)} required />
        <Select label={t("Mata Pelajaran (opsional)")} value={mapelId} onChange={(event) => setMapelId(event.target.value)}>
          <option value="">{t("Tanpa mapel")}</option>
          {mapelList.map((mapel) => <option key={mapel.id} value={mapel.id}>{mapel.nama}</option>)}
        </Select>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground">{t("Sumber Materi")}</p>
          <div className="mb-2 grid grid-cols-2 border border-border bg-surface p-1" role="group" aria-label={t("Pilih sumber materi")}>
            {(["LINK", "FILE"] as const).map((source) => (
              <button
                key={source}
                type="button"
                aria-pressed={sumber === source}
                onClick={() => {
                  setSumber(source);
                  setTipe(source);
                  setUrl("");
                  setError("");
                }}
                className="cursor-pointer px-3 py-2 text-sm font-semibold transition-colors"
                style={sumber === source ? { background: "var(--accent)", color: "var(--accent-foreground)" } : { color: "var(--muted-foreground)" }}
              >
                {source === "LINK" ? t("Link") : t("File / Foto")}
              </button>
            ))}
          </div>

          {sumber === "LINK" ? (
            <Input label={t("Tautan Materi")} placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} required />
          ) : (
            <div className="border border-dashed border-border p-3">
              {url && <p className="mb-2 truncate text-xs text-muted-foreground">{t("File sudah dipilih. Pilih file lain untuk mengganti.")}</p>}
              <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted">
                {uploading ? t("Mengunggah...") : url ? t("Ganti File / Foto") : `+ ${t("Upload File / Foto")}`}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUpload(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          )}
        </div>

        <Textarea label={t("Deskripsi (opsional)")} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">{t("Kelas Tujuan")}</label>
          <select
            className="min-h-10 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            value=""
            onChange={(e) => e.target.value && toggleKelas(e.target.value)}
          >
            <option value="">+ {t("Tambah kelas")}</option>
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
                    <button type="button" onClick={() => toggleKelas(id)} className="cursor-pointer hover:text-danger">
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-xs font-medium text-danger">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          {mode === "create" ? t("Upload Materi") : t("Simpan Perubahan")}
        </Button>
      </form>
    </Modal>
  );
}
