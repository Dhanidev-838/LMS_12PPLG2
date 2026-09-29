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
  const [jenisKonten, setJenisKonten] = useState<"PENGUMUMAN" | "MATERI">("PENGUMUMAN");
  const [isi, setIsi] = useState("");
  const [lampiranList, setLampiranList] = useState<LampiranInput[]>([]);
  const [lampiranUrl, setLampiranUrl] = useState("");
  const [judulMateri, setJudulMateri] = useState("");
  const [deskripsiMateri, setDeskripsiMateri] = useState("");
  const [tipeMateri, setTipeMateri] = useState<"PDF" | "FILE" | "IMAGE" | "LINK">("LINK");
  const [urlMateri, setUrlMateri] = useState("");
  const [namaFileMateri, setNamaFileMateri] = useState("");
  const [selectedKelasId, setSelectedKelasId] = useState(kelasId ?? "");
  const [kelasList, setKelasList] = useState<{ id: string; judul: string }[]>([]);
  const [uploadingLampiran, setUploadingLampiran] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const membuatMateri = mode === "create" && jenisKonten === "MATERI";

  useEffect(() => {
    if (!open) return;
    fetch("/api/kelas")
      .then((res) => res.json())
      .then((data) => setKelasList(data.data ?? []))
      .catch(() => {});

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJenisKonten("PENGUMUMAN");
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
    setJudulMateri("");
    setDeskripsiMateri("");
    setTipeMateri("LINK");
    setUrlMateri("");
    setNamaFileMateri("");
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

  async function handleUploadFileMateri(file: File) {
    setUploadingLampiran(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload?kategori=materi", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "File gagal diunggah.");
        return;
      }
      setTipeMateri(file.type === "application/pdf" ? "PDF" : file.type.startsWith("image/") ? "IMAGE" : "FILE");
      setUrlMateri(data.url);
      setNamaFileMateri(file.name);
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
    setJenisKonten("PENGUMUMAN");
    setIsi("");
    setLampiranList([]);
    setLampiranUrl("");
    setJudulMateri("");
    setDeskripsiMateri("");
    setTipeMateri("LINK");
    setUrlMateri("");
    setNamaFileMateri("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (membuatMateri && !judulMateri.trim()) {
      setError("Judul materi wajib diisi.");
      return;
    }
    if (membuatMateri && !selectedKelasId) {
      setError("Pilih kelas tujuan.");
      return;
    }
    if (membuatMateri && !urlMateri.trim()) {
      setError(tipeMateri === "LINK" ? "Masukkan link materi." : "Pilih file materi.");
      return;
    }
    if (membuatMateri && tipeMateri === "LINK" && !isValidLink(urlMateri.trim())) {
      setError("Masukkan link yang diawali http:// atau https://.");
      return;
    }
    if (!membuatMateri && !isi.trim() && lampiranList.length === 0) {
      setError("Isi pengumuman atau lampiran wajib ditambahkan.");
      return;
    }

    setLoading(true);
    try {
      const isEdit = mode === "edit" && initialData;
      const res = await fetch(
        membuatMateri ? "/api/materi" : isEdit ? `/api/pengumuman/${initialData.id}` : "/api/pengumuman",
        {
          method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify(membuatMateri
            ? {
                judul: judulMateri.trim(),
                tipe: tipeMateri,
                url: urlMateri.trim(),
                deskripsi: deskripsiMateri.trim() || null,
                kelasIds: [selectedKelasId],
              }
            : { kelasId: selectedKelasId, isi, lampiran: lampiranList }),
        }
      );
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
      title={mode === "edit" ? "Edit Pengumuman" : "Buat Konten"}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "create" && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-[#374151]">Jenis Konten</p>
            <div className="grid grid-cols-2 rounded-lg border border-[#dfe4ef] bg-white p-1" role="group" aria-label="Pilih jenis konten">
              {(["PENGUMUMAN", "MATERI"] as const).map((jenis) => (
                <button
                  key={jenis}
                  type="button"
                  aria-pressed={jenisKonten === jenis}
                  onClick={() => {
                    setJenisKonten(jenis);
                    setError("");
                  }}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm font-semibold transition-colors"
                  style={jenisKonten === jenis
                    ? { background: "#6B85F6", color: "#ffffff" }
                    : { background: "transparent", color: "#536076" }}
                >
                  {jenis === "PENGUMUMAN" ? "Pengumuman" : "Materi"}
                </button>
              ))}
            </div>
          </div>
        )}

        {membuatMateri ? (
          <>
            <Input label="Judul Materi" value={judulMateri} onChange={(e) => setJudulMateri(e.target.value)} required />
            <Textarea label="Deskripsi (opsional)" value={deskripsiMateri} onChange={(e) => setDeskripsiMateri(e.target.value)} rows={3} />
            <div>
              <p className="mb-1.5 text-xs font-semibold text-[#374151]">Sumber Materi</p>
              <div className="mb-2 grid grid-cols-2 rounded-lg border border-[#dfe4ef] bg-white p-1" role="group" aria-label="Pilih sumber materi">
                {(["LINK", "FILE"] as const).map((sumber) => (
                  <button
                    key={sumber}
                    type="button"
                    aria-pressed={sumber === "LINK" ? tipeMateri === "LINK" : tipeMateri !== "LINK"}
                    onClick={() => {
                      setTipeMateri(sumber);
                      setUrlMateri("");
                      setNamaFileMateri("");
                      setError("");
                    }}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm font-semibold transition-colors"
                    style={(sumber === "LINK" && tipeMateri === "LINK") || (sumber === "FILE" && tipeMateri !== "LINK")
                      ? { background: "#6B85F6", color: "#ffffff" }
                      : { background: "transparent", color: "#536076" }}
                  >
                    {sumber === "LINK" ? "Link" : "File / Foto"}
                  </button>
                ))}
              </div>
              {tipeMateri === "LINK" ? (
                <Input
                  label="URL Materi"
                  placeholder="https://..."
                  value={urlMateri}
                  onChange={(e) => setUrlMateri(e.target.value)}
                  required
                />
              ) : (
                <div className="rounded-lg border border-dashed border-[#D1D5DB] p-3">
                  <label className="cursor-pointer rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#374151] hover:bg-black/5">
                    {uploadingLampiran ? "Mengunggah..." : namaFileMateri || "+ Upload File / Foto"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingLampiran}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleUploadFileMateri(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Textarea
              placeholder="Tulis pengumuman untuk kelas..."
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              rows={4}
            />

            {lampiranList.length > 0 && (
              <div className="space-y-2">
                {lampiranList.map((l, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-black/5 bg-[#F9FAFB] p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#111827]">{l.judul || l.url}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{l.tipe}</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveLampiran(i)} className="cursor-pointer text-xs font-medium text-red-500 hover:underline">
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
          </>
        )}

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

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {mode === "edit" ? "Simpan Perubahan" : membuatMateri ? "Buat Materi" : "Posting Pengumuman"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}