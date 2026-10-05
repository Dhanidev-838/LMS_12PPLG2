"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

type Tipe = "KUIS" | "UJIAN";
type Sumber = "BARU" | "EXISTING";

interface KelasOption {
  id: string;
  label: string;
}
interface MapelOption {
  id: string;
  nama: string;
}
interface AsesmenExisting {
  id: string;
  judul: string;
  tipe: Tipe;
}
interface KelasApiItem {
  id: string;
  judul: string;
}
interface AsesmenApiItem {
  id: string;
  judul: string;
  tipe: Tipe;
}

interface ModalBuatAsesmenProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (asesmenId: string) => void; // dikasih id -> parent bisa redirect ke halaman tambah soal
  defaultKelasId?: string; // kalau dibuka dari dalam halaman detail kelas, prefill 1 kelas
  fixedTipe?: Tipe; // kalau dibuka dari tombol "Buat Quiz"/"Buat Ujian Online" spesifik, kunci tipenya
  initialSumber?: Sumber;
  initialAsesmenId?: string;
  showSourceToggle?: boolean;
}

export default function ModalBuatAsesmen({ open, onClose, onSuccess, defaultKelasId, fixedTipe, initialSumber = "BARU", initialAsesmenId = "", showSourceToggle = false }: ModalBuatAsesmenProps) {
  const [sumber, setSumber] = useState<Sumber>("BARU");

  // form buat baru
  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState<Tipe>(fixedTipe ?? "KUIS");
  const [mapelId, setMapelId] = useState("");
  const [durasiMenit, setDurasiMenit] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  // kirim dari existing
  const [asesmenExistingList, setAsesmenExistingList] = useState<AsesmenExisting[]>([]);
  const [selectedAsesmenId, setSelectedAsesmenId] = useState("");

  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [mapelList, setMapelList] = useState<MapelOption[]>([]);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    fetch("/api/kelas")
      .then((res) => res.json())
      .then((data: { data?: KelasApiItem[] }) => setKelasList((data.data ?? []).map((kelas) => ({ id: kelas.id, label: kelas.judul }))))
      .catch(() => {});

    fetch("/api/mapel")
      .then((res) => res.json())
      .then((data) => setMapelList(data.data ?? []))
      .catch(() => {});

    if (showSourceToggle || initialSumber === "EXISTING") {
      fetch("/api/asesmen")
        .then((res) => res.json())
        .then((data: { data?: AsesmenApiItem[] }) => {
          const list = (data.data ?? []).filter((asesmen) => !fixedTipe || asesmen.tipe === fixedTipe);
          setAsesmenExistingList(list.map((asesmen) => ({ id: asesmen.id, judul: asesmen.judul, tipe: asesmen.tipe })));
        })
        .catch(() => {});
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSumber(initialSumber);
    setJudul("");
    setTipe(fixedTipe ?? "KUIS");
    setMapelId("");
    setDurasiMenit("");
    setDeskripsi("");
    setSelectedAsesmenId(initialAsesmenId);
    setSelectedKelasIds(defaultKelasId ? [defaultKelasId] : []);
    setError("");
  }, [open, defaultKelasId, fixedTipe, initialSumber, initialAsesmenId, showSourceToggle]);

  function toggleKelas(id: string) {
    setSelectedKelasIds((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const durasi = durasiMenit ? Number(durasiMenit) : null;
    const minimumDurasi = tipe === "KUIS" ? 10 : 20;
    if (durasi !== null && durasi < minimumDurasi) {
      setError(`${tipe === "KUIS" ? "Kuis" : "Ujian Online"} minimal berdurasi ${minimumDurasi} menit.`);
      return;
    }

    if (sumber === "EXISTING" && selectedKelasIds.length === 0) {
      setError("Pilih minimal 1 kelas tujuan.");
      return;
    }

    setLoading(true);

    try {
      // ============ KIRIM DARI ASESMEN EXISTING ============
      if (sumber === "EXISTING") {
        if (!selectedAsesmenId) {
          setError("Pilih asesmen yang mau dikirim.");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/asesmen/${selectedAsesmenId}/kirim-ke-kelas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kelasIds: selectedKelasIds }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Terjadi kesalahan.");
          setLoading(false);
          return;
        }

        onSuccess(selectedAsesmenId);
        onClose();
        return;
      }

      // ============ BUAT BARU ============
      const res = await fetch("/api/asesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul,
          tipe,
          mapelId: mapelId || null,
          durasiMenit: durasiMenit ? Number(durasiMenit) : null,
          deskripsi: deskripsi || null,
          kelasIds: selectedKelasIds,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
        setLoading(false);
        return;
      }

      onSuccess(data.data.id);
      onClose();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={fixedTipe === "KUIS" ? "Buat Quiz" : fixedTipe === "UJIAN" ? "Buat Ujian Online" : "Buat Asesmen"} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* toggle sumber - cuma tampil kalau ada asesmen existing yang bisa dipilih */}
        {showSourceToggle && asesmenExistingList.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSumber("BARU")}
              className="cursor-pointer rounded-lg border py-2 text-xs font-semibold transition-colors"
              style={
                sumber === "BARU"
                  ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent-foreground)" }
                  : { borderColor: "var(--border)", color: "var(--foreground)" }
              }
            >
              Buat Baru
            </button>
            <button
              type="button"
              onClick={() => setSumber("EXISTING")}
              className="cursor-pointer rounded-lg border py-2 text-xs font-semibold transition-colors"
              style={
                sumber === "EXISTING"
                  ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent-foreground)" }
                  : { borderColor: "var(--border)", color: "var(--foreground)" }
              }
            >
              Kirim dari Asesmen
            </button>
          </div>
        )}

        {sumber === "EXISTING" ? (
          <Select
            label="Pilih Asesmen"
            placeholder="Pilih asesmen yang sudah dibuat"
            value={selectedAsesmenId}
            onChange={(e) => setSelectedAsesmenId(e.target.value)}
            required
          >
            {asesmenExistingList.map((a) => (
              <option key={a.id} value={a.id}>
                {a.judul}
              </option>
            ))}
          </Select>
        ) : (
          <>
            {!fixedTipe && (
              <div className="grid grid-cols-2 gap-2">
                {(["KUIS", "UJIAN"] as Tipe[]).map((t) => (
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
                    {t === "KUIS" ? "Kuis" : "Ujian Online"}
                  </button>
                ))}
              </div>
            )}

            <Input label="Judul Asesmen" value={judul} onChange={(e) => setJudul(e.target.value)} required />

            <Select label="Mapel (opsional)" placeholder="Pilih mapel" value={mapelId} onChange={(e) => setMapelId(e.target.value)}>
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama}
                </option>
              ))}
            </Select>

            <Input
              label="Durasi (menit)"
              type="number"
              min={tipe === "KUIS" ? 10 : 20}
              value={durasiMenit}
              onChange={(e) => setDurasiMenit(e.target.value)}
            />
            {durasiMenit && Number(durasiMenit) < (tipe === "KUIS" ? 10 : 20) && (
              <p className="-mt-2 text-xs font-medium text-danger">
                {tipe === "KUIS" ? "Kuis" : "Ujian Online"} minimal berdurasi {tipe === "KUIS" ? 10 : 20} menit.
              </p>
            )}

            <Textarea label="Deskripsi (opsional)" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
          </>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Kirim ke Kelas {sumber === "BARU" && <span className="font-normal text-muted-foreground">(opsional)</span>}
          </label>
          <select
            className="min-h-10 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            value=""
            onChange={(e) => e.target.value && toggleKelas(e.target.value)}
          >
            <option value="">+ Tambah kelas</option>
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

        {sumber === "BARU" && (
          <p className="rounded-lg bg-surface-muted p-3 text-xs text-muted-foreground">
            Setelah dibuat, asesmen berstatus <strong>Proses</strong> — tambahkan soal dulu, baru klik &quot;Selesaikan
            Asesmen&quot; supaya muncul di kelas.
          </p>
        )}

        {error && <p className="text-xs font-medium text-danger">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          {sumber === "EXISTING" ? "Kirim ke Kelas" : "Lanjut Tambah Soal"}
        </Button>
      </form>
    </Modal>
  );
}