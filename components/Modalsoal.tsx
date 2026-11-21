"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Textarea } from "./ui/Input";
import Button from "./ui/Button";
import { useLanguage } from "@/lib/i18n";

type TipeSoal = "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";

interface OpsiInput {
  teks: string;
  isBenar: boolean;
}

export interface SoalData {
  id: string;
  urutan: number;
  tipe: TipeSoal;
  pertanyaan: string;
  gambar: string | null;
  opsi: { id: string; teks: string; isBenar: boolean }[];
}

interface ModalSoalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asesmenId: string;
  editingSoal?: SoalData | null; // null = mode tambah baru
}

export default function ModalSoal({ open, onClose, onSuccess, asesmenId, editingSoal }: ModalSoalProps) {
  const { t } = useLanguage();
  const [tipe, setTipe] = useState<TipeSoal>("PILIHAN_GANDA");
  const [pertanyaan, setPertanyaan] = useState("");
  const [gambar, setGambar] = useState("");
  const [uploading, setUploading] = useState(false);
  const [opsiList, setOpsiList] = useState<OpsiInput[]>([
    { teks: "", isBenar: false },
    { teks: "", isBenar: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!editingSoal;

  useEffect(() => {
    if (!open) return;
    if (editingSoal) {
      setTipe(editingSoal.tipe);
      setPertanyaan(editingSoal.pertanyaan);
      setGambar(editingSoal.gambar ?? "");
      setOpsiList(
        editingSoal.opsi.length > 0
          ? editingSoal.opsi.map((o) => ({ teks: o.teks, isBenar: o.isBenar }))
          : [{ teks: "", isBenar: false }, { teks: "", isBenar: false }]
      );
    } else {
      setTipe("PILIHAN_GANDA");
      setPertanyaan("");
      setGambar("");
      setOpsiList([{ teks: "", isBenar: false }, { teks: "", isBenar: false }]);
    }
    setError("");
  }, [open, editingSoal]);

  function handleAddOpsi() {
    setOpsiList((prev) => [...prev, { teks: "", isBenar: false }]);
  }
  function handleRemoveOpsi(index: number) {
    if (opsiList.length <= 2) return;
    setOpsiList((prev) => prev.filter((_, i) => i !== index));
  }
  function handleOpsiTeksChange(index: number, value: string) {
    setOpsiList((prev) => prev.map((o, i) => (i === index ? { ...o, teks: value } : o)));
  }
  function handleOpsiBenarToggle(index: number) {
    setOpsiList((prev) =>
      prev.map((o, i) => {
        if (tipe === "PILIHAN_GANDA") return { ...o, isBenar: i === index };
        return i === index ? { ...o, isBenar: !o.isBenar } : o;
      })
    );
  }

  async function handleUploadGambar(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?kategori=soal", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setGambar(data.url);
      else setError(t(data.error ?? "Upload foto gagal."));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pertanyaan.trim()) {
      setError(t("Pertanyaan wajib diisi."));
      return;
    }
    if (tipe !== "ESSAY") {
      if (opsiList.some((o) => !o.teks.trim())) {
        setError(t("Semua opsi jawaban wajib diisi."));
        return;
      }
      // kunci jawaban BOLEH kosong di sini -- bisa ditandain belakangan lewat mode "Kunci Jawaban"
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/asesmen/${asesmenId}/soal/${editingSoal!.id}` : `/api/asesmen/${asesmenId}/soal`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe,
          pertanyaan,
          gambar: gambar || null,
          opsi: tipe !== "ESSAY" ? opsiList : undefined,
        }),
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
    <Modal open={open} onClose={onClose} title={isEditing ? t("Edit Soal") : t("Tambah Soal")} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {(["PILIHAN_GANDA", "CHECKBOX", "ESSAY"] as TipeSoal[]).map((tipeSoal) => (
            <button
              key={tipeSoal}
              type="button"
              onClick={() => setTipe(tipeSoal)}
              className="cursor-pointer rounded-lg border py-2 text-xs font-semibold transition-colors"
              style={
                tipe === tipeSoal
                  ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent-foreground)" }
                  : { borderColor: "var(--border)", color: "var(--foreground)" }
              }
            >
              {t(tipeSoal === "PILIHAN_GANDA" ? "Pilihan Ganda" : tipeSoal === "CHECKBOX" ? "Checkbox" : "Essay")}
            </button>
          ))}
        </div>

        <Textarea label={t("Pertanyaan")} value={pertanyaan} onChange={(e) => setPertanyaan(e.target.value)} required />

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">{t("Kirim Foto (opsional)")}</label>
          <label className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border text-muted-foreground hover:border-accent">
            {uploading ? (
              <span className="text-[10px] font-medium">{t("Upload...")}</span>
            ) : gambar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gambar} alt={t("Preview")} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl leading-none">+</span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && handleUploadGambar(e.target.files[0])}
            />
          </label>
        </div>

        {tipe !== "ESSAY" && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              {t("Opsi Jawaban")} ({t(tipe === "PILIHAN_GANDA" ? "pilih 1 jawaban benar" : "bisa pilih lebih dari 1")}) — {t("kunci jawaban opsional, bisa ditandain belakangan")}
            </label>
            <div className="space-y-2">
              {opsiList.map((opsi, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpsiBenarToggle(i)}
                    className={`flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center border-2 transition-colors ${
                      tipe === "PILIHAN_GANDA" ? "rounded-full" : "rounded"
                    }`}
                    style={{ borderColor: opsi.isBenar ? "var(--accent)" : "var(--border)", background: opsi.isBenar ? "var(--accent)" : "transparent" }}
                  >
                    {opsi.isBenar && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-foreground)" strokeWidth="3" className="h-3 w-3">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <input
                    value={opsi.teks}
                    onChange={(e) => handleOpsiTeksChange(i, e.target.value)}
                    placeholder={`${t("Opsi")} ${i + 1}`}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  {opsiList.length > 2 && (
                    <button type="button" onClick={() => handleRemoveOpsi(i)} className="cursor-pointer text-muted-foreground hover:text-danger">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={handleAddOpsi} className="mt-2 cursor-pointer text-xs font-semibold text-foreground hover:underline">
              + {t("Tambah Opsi")}
            </button>
          </div>
        )}

        {error && <p className="text-xs font-medium text-danger">{t(error)}</p>}

        <Button type="submit" loading={loading} className="w-full">
          {isEditing ? t("Simpan Perubahan") : t("Tambah Soal")}
        </Button>
      </form>
    </Modal>
  );
}