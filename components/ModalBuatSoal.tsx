"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import Button from "./ui/Button";

type TipeSoal = "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";

interface OpsiInput {
  teks: string;
  isBenar: boolean;
}
interface SoalInitial {
  id: string;
  tipe: TipeSoal;
  pertanyaan: string;
  gambar: string | null;
  opsi: { id: string; teks: string; isBenar: boolean }[];
}

interface ModalBuatSoalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asesmenId: string;
  mode: "create" | "edit";
  initialData?: SoalInitial | null;
}

function opsiKosong(): OpsiInput[] {
  return [
    { teks: "", isBenar: false },
    { teks: "", isBenar: false },
    { teks: "", isBenar: false },
    { teks: "", isBenar: false },
  ];
}

export default function ModalBuatSoal({ open, onClose, onSuccess, asesmenId, mode, initialData }: ModalBuatSoalProps) {
  const [tipe, setTipe] = useState<TipeSoal>("PILIHAN_GANDA");
  const [pertanyaan, setPertanyaan] = useState("");
  const [gambarFile, setGambarFile] = useState<File | null>(null);
  const [gambarPreview, setGambarPreview] = useState<string | null>(null);
  const [opsiList, setOpsiList] = useState<OpsiInput[]>(opsiKosong());

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialData) {
      setTipe(initialData.tipe);
      setPertanyaan(initialData.pertanyaan);
      setGambarPreview(initialData.gambar);
      setGambarFile(null);
      setOpsiList(
        initialData.tipe === "ESSAY" ? opsiKosong() : initialData.opsi.map((o) => ({ teks: o.teks, isBenar: o.isBenar }))
      );
    } else {
      setTipe("PILIHAN_GANDA");
      setPertanyaan("");
      setGambarFile(null);
      setGambarPreview(null);
      setOpsiList(opsiKosong());
    }
    setError("");
  }, [open, mode, initialData]);

  function handleTambahOpsi() {
    setOpsiList((prev) => [...prev, { teks: "", isBenar: false }]);
  }
  function handleHapusOpsi(index: number) {
    setOpsiList((prev) => prev.filter((_, i) => i !== index));
  }
  function handleUbahTeksOpsi(index: number, teks: string) {
    setOpsiList((prev) => prev.map((o, i) => (i === index ? { ...o, teks } : o)));
  }
  function handlePilihJawabanBenar(index: number) {
    setOpsiList((prev) =>
      prev.map((o, i) => (tipe === "PILIHAN_GANDA" ? { ...o, isBenar: i === index } : i === index ? { ...o, isBenar: !o.isBenar } : o))
    );
  }

  async function handleUploadGambar(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?kategori=soal", { method: "POST", body: fd });
      const json = await res.json();
      return res.ok ? json.url : null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pertanyaan.trim()) {
      setError("Pertanyaan wajib diisi.");
      return;
    }
    if (tipe !== "ESSAY") {
      const opsiTerisi = opsiList.filter((o) => o.teks.trim());
      if (opsiTerisi.length < 2) {
        setError("Minimal 2 opsi jawaban wajib diisi.");
        return;
      }
      if (!opsiTerisi.some((o) => o.isBenar)) {
        setError("Pilih minimal 1 jawaban benar.");
        return;
      }
    }

    setLoading(true);
    try {
      let gambarUrl = gambarPreview;
      if (gambarFile) gambarUrl = await handleUploadGambar(gambarFile);

      const body = {
        tipe,
        pertanyaan,
        gambar: gambarUrl || null,
        opsi: tipe !== "ESSAY" ? opsiList.filter((o) => o.teks.trim()) : undefined,
      };

      const res =
        mode === "edit" && initialData
          ? await fetch(`/api/asesmen/${asesmenId}/soal/${initialData.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })
          : await fetch(`/api/asesmen/${asesmenId}/soal`, {
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
    <Modal open={open} onClose={onClose} title={mode === "edit" ? "Edit Soal" : "Buat Soal"} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {(["PILIHAN_GANDA", "CHECKBOX", "ESSAY"] as TipeSoal[]).map((t) => (
            <button
              key={t}
              type="button"
              disabled={mode === "edit"}
              onClick={() => setTipe(t)}
              className="cursor-pointer rounded-lg border py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={
                tipe === t
                  ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent-foreground)" }
                  : { borderColor: "var(--border)", color: "var(--foreground)" }
              }
            >
              {t === "PILIHAN_GANDA" ? "Pilihan Ganda" : t === "CHECKBOX" ? "Checkbox" : "Essay"}
            </button>
          ))}
        </div>

        <Textarea label="Pertanyaan" value={pertanyaan} onChange={(e) => setPertanyaan(e.target.value)} rows={3} required />

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Gambar (opsional)</label>
          {gambarPreview && !gambarFile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gambarPreview} alt="Preview" className="mb-2 max-h-40 rounded-lg object-contain" />
          )}
          <label className="inline-block cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted">
            {uploading ? "Mengunggah..." : gambarFile ? gambarFile.name : "+ Kirim Foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setGambarFile(f);
                  setGambarPreview(URL.createObjectURL(f));
                }
              }}
            />
          </label>
        </div>

        {tipe !== "ESSAY" && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">
              Opsi Jawaban {tipe === "PILIHAN_GANDA" ? "(pilih 1 jawaban benar)" : "(bisa pilih lebih dari 1)"}
            </label>
            {opsiList.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type={tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"} name="jawabanBenar" checked={o.isBenar} onChange={() => handlePilihJawabanBenar(i)} />
                <Input value={o.teks} onChange={(e) => handleUbahTeksOpsi(i, e.target.value)} placeholder={`Opsi ${String.fromCharCode(65 + i)}`} className="flex-1" />
                {opsiList.length > 2 && (
                  <button type="button" onClick={() => handleHapusOpsi(i)} className="cursor-pointer text-xs font-medium text-danger hover:underline">
                    Hapus
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={handleTambahOpsi}>
              + Tambah Opsi
            </Button>
          </div>
        )}

        {error && <p className="text-xs font-medium text-danger">{error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" loading={loading || uploading} className="flex-1">
            {mode === "edit" ? "Simpan Soal" : "Tambah Soal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}