"use client";

import { useEffect, useState } from "react";
import { Input, Textarea } from "./ui/Input";
import Button from "./ui/Button";

type TipeSoal = "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";

interface OpsiInput {
  teks: string;
  isBenar: boolean;
}

export interface SoalData {
  id: string;
  tipe: TipeSoal;
  pertanyaan: string;
  gambar: string | null;
  opsi: { id: string; teks: string; isBenar: boolean }[];
}

interface SoalBuilderProps {
  asesmenId: string;
  onSaved: () => void; // dipanggil abis save, buat refresh list soal di parent
  editingSoal?: SoalData | null; // kalau diisi -> mode edit
  onCancelEdit?: () => void;
}

export default function SoalBuilder({ asesmenId, onSaved, editingSoal, onCancelEdit }: SoalBuilderProps) {
  const [tipe, setTipe] = useState<TipeSoal>("PILIHAN_GANDA");
  const [pertanyaan, setPertanyaan] = useState("");
  const [gambar, setGambar] = useState("");
  const [opsiList, setOpsiList] = useState<OpsiInput[]>([
    { teks: "", isBenar: false },
    { teks: "", isBenar: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!editingSoal;

  useEffect(() => {
    if (editingSoal) {
      setTipe(editingSoal.tipe);
      setPertanyaan(editingSoal.pertanyaan);
      setGambar(editingSoal.gambar ?? "");
      setOpsiList(
        editingSoal.opsi.length > 0
          ? editingSoal.opsi.map((o) => ({ teks: o.teks, isBenar: o.isBenar }))
          : [
              { teks: "", isBenar: false },
              { teks: "", isBenar: false },
            ]
      );
    } else {
      resetForm();
    }
  }, [editingSoal]);

  function resetForm() {
    setTipe("PILIHAN_GANDA");
    setPertanyaan("");
    setGambar("");
    setOpsiList([
      { teks: "", isBenar: false },
      { teks: "", isBenar: false },
    ]);
    setError("");
  }

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
        if (tipe === "PILIHAN_GANDA") {
          // radio behavior: cuma 1 yang bisa bener
          return { ...o, isBenar: i === index };
        }
        // checkbox behavior: bisa banyak yang bener
        return i === index ? { ...o, isBenar: !o.isBenar } : o;
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pertanyaan.trim()) {
      setError("Pertanyaan wajib diisi.");
      return;
    }
    if (tipe !== "ESSAY") {
      const isiKosong = opsiList.some((o) => !o.teks.trim());
      const adaJawabanBenar = opsiList.some((o) => o.isBenar);
      if (isiKosong) {
        setError("Semua opsi jawaban wajib diisi.");
        return;
      }
      if (!adaJawabanBenar) {
        setError("Tandai minimal 1 jawaban yang benar.");
        return;
      }
    }

    setLoading(true);
    try {
      const url = isEditing
        ? `/api/asesmen/${asesmenId}/soal/${editingSoal!.id}`
        : `/api/asesmen/${asesmenId}/soal`;
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
        setError(data.error ?? "Terjadi kesalahan.");
        setLoading(false);
        return;
      }

      resetForm();
      onCancelEdit?.();
      onSaved();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <p className="text-sm font-bold text-foreground">{isEditing ? "Edit Soal" : "Tambah Soal"}</p>

      <div className="grid grid-cols-3 gap-2">
        {(["PILIHAN_GANDA", "CHECKBOX", "ESSAY"] as TipeSoal[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipe(t)}
            className="cursor-pointer rounded-lg border py-2 text-xs font-semibold transition-colors"
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

      <Textarea label="Pertanyaan" value={pertanyaan} onChange={(e) => setPertanyaan(e.target.value)} required />
      <Input
        label="URL Gambar (opsional)"
        placeholder="https://..."
        value={gambar}
        onChange={(e) => setGambar(e.target.value)}
      />

      {tipe !== "ESSAY" && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Opsi Jawaban ({tipe === "PILIHAN_GANDA" ? "pilih 1 jawaban benar" : "bisa pilih lebih dari 1"})
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
                  style={{
                    borderColor: opsi.isBenar ? "var(--accent)" : "var(--border)",
                    background: opsi.isBenar ? "var(--accent)" : "transparent",
                  }}
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
                  placeholder={`Opsi ${i + 1}`}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
                {opsiList.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOpsi(i)}
                    className="cursor-pointer text-muted-foreground hover:text-danger"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddOpsi}
            className="mt-2 cursor-pointer text-xs font-semibold text-foreground hover:underline"
          >
            + Tambah Opsi
          </button>
        </div>
      )}

      {error && <p className="text-xs font-medium text-danger">{error}</p>}

      <div className="flex gap-2">
        {isEditing && (
          <Button type="button" variant="outline" onClick={onCancelEdit} className="flex-1">
            Batal
          </Button>
        )}
        <Button type="submit" loading={loading} className="flex-1">
          {isEditing ? "Simpan Perubahan" : "Tambah Soal"}
        </Button>
      </div>
    </form>
  );
}