"use client";

import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { Input, Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

type Role = "SISWA" | "GURU";

interface KelasOption {
  id: string;
  label: string;
}
interface KelasReferensiOption {
  id: string;
  label: string;
}
interface MapelOption {
  id: string;
  nama: string;
}

interface AkunInitialData {
  id: string;
  role: Role;
  email: string;
  nama: string;
  nis?: string | null;
  nik?: string | null;
  deskripsi?: string | null;
  fotoProfil?: string | null;
  tanggalLahir?: string | null;
  jenisKelamin?: string | null;
  kelasReferensiId?: string | null;
  kelasIds?: string[];
  mapelId?: string;
}

interface ModalAkunProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  defaultRole?: Role;
  initialData?: AkunInitialData | null;
}

export default function ModalAkun({ open, onClose, onSuccess, mode, defaultRole = "SISWA", initialData }: ModalAkunProps) {
  const [role, setRole] = useState<Role>(defaultRole);
  const [email, setEmail] = useState("");
  const [nama, setNama] = useState("");
  const [nomorInduk, setNomorInduk] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [fotoProfil, setFotoProfil] = useState("");
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);

  const [kelasReferensiList, setKelasReferensiList] = useState<KelasReferensiOption[]>([]);
  const [kelasReferensiId, setKelasReferensiId] = useState("");

  const [mapelList, setMapelList] = useState<MapelOption[]>([]);
  const [mapelId, setMapelId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    fetch("/api/kelas")
      .then((res) => res.json())
      .then((data) => setKelasList((data.data ?? []).map((k: any) => ({ id: k.id, label: k.judul }))))
      .catch(() => {});

    fetch("/api/kelas-referensi")
      .then((res) => res.json())
      .then((data) => setKelasReferensiList(data.data ?? []))
      .catch(() => {});

    fetch("/api/mapel")
      .then((res) => res.json())
      .then((data) => setMapelList(data.data ?? []))
      .catch(() => {});

    if (mode === "edit" && initialData) {
      setRole(initialData.role);
      setEmail(initialData.email);
      setNama(initialData.nama);
      setNomorInduk(initialData.role === "SISWA" ? initialData.nis ?? "" : initialData.nik ?? "");
      setTanggalLahir(initialData.tanggalLahir ? initialData.tanggalLahir.split("T")[0] : "");
      setJenisKelamin(initialData.jenisKelamin ?? "");
      setDeskripsi(initialData.deskripsi ?? "");
      setFotoProfil(initialData.fotoProfil ?? "");
      setKelasReferensiId(initialData.kelasReferensiId ?? "");
      setSelectedKelasIds(initialData.kelasIds ?? []);
      setMapelId(initialData.mapelId ?? "");
    } else {
      setRole(defaultRole);
      setEmail("");
      setNama("");
      setNomorInduk("");
      setTanggalLahir("");
      setJenisKelamin("");
      setDeskripsi("");
      setFotoProfil("");
      setKelasReferensiId("");
      setSelectedKelasIds([]);
      setMapelId("");
    }
    setError("");
  }, [open, mode, initialData, defaultRole]);

  function toggleKelas(id: string) {
    setSelectedKelasIds((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
  }

  async function handleUploadFoto(file: File) {
    setUploadingFoto(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?kategori=profil", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload foto gagal.");
        return;
      }
      setFotoProfil(data.url);
    } catch {
      setError("Upload foto gagal, coba lagi.");
    } finally {
      setUploadingFoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nama.trim()) {
      setError("Nama wajib diisi.");
      return;
    }
    if (role === "SISWA" && mode === "create" && !kelasReferensiId) {
      setError("Filter Jurusan (kelas referensi) wajib dipilih.");
      return;
    }
    if (role === "GURU" && selectedKelasIds.length > 0 && !mapelId) {
      setError("Pilih mapel kalau sudah menambahkan kelas yang diampu.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/akun" : `/api/akun/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const body: any = {
        role,
        email,
        nama,
        tanggalLahir,
        jenisKelamin: jenisKelamin || null,
        deskripsi: deskripsi || null,
        fotoProfil: fotoProfil || null,
      };

      if (role === "SISWA") {
        body.nis = nomorInduk;
        body.kelasReferensiId = kelasReferensiId;
        body.kelasIds = selectedKelasIds;
      } else {
        // walasKelasId dihapus -- fitur walas gak ada lagi
        body.nik = nomorInduk;
        body.mapelId = mapelId || undefined;
        body.kelasIds = selectedKelasIds;
      }

      const res = await fetch(url, {
        method,
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
    <Modal open={open} onClose={onClose} title={mode === "create" ? "Registrasi Akun" : `Edit Akun ${role === "SISWA" ? "Siswa" : "Guru"}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "create" && (
          <div className="grid grid-cols-2 gap-2">
            {(["GURU", "SISWA"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`cursor-pointer rounded-lg border py-2 text-sm font-medium transition-colors ${
                  role === r
                    ? "border-[#6B85F6] bg-[#6B85F6] text-white"
                    : "border-[#dfe4ef] text-[#435064] hover:bg-[#6B85F6]/10"
                }`}
              >
                {r === "GURU" ? "Guru" : "Siswa"}
              </button>
            ))}
          </div>
        )}

        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          label={role === "SISWA" ? "NIS" : "NIK"}
          value={nomorInduk}
          onChange={(e) => setNomorInduk(e.target.value)}
          required
        />
        {mode === "create" && (
          <p className="-mt-2 rounded-lg border border-[#e5e8ef] bg-[#f7f8fd] px-3 py-2 text-xs leading-relaxed text-[#435064]">
            Password awal otomatis sama dengan {role === "SISWA" ? "NIS" : "NIK"}. Saat login pertama, akun akan diminta membuat password baru.
          </p>
        )}
        <Input label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} required />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tanggal Lahir"
            type="date"
            value={tanggalLahir}
            onChange={(e) => setTanggalLahir(e.target.value)}
            required
          />
          <Select label="Jenis Kelamin (opsional)" placeholder="Pilih" value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)}>
            <option value="Laki Laki">Laki Laki</option>
            <option value="Perempuan">Perempuan</option>
          </Select>
        </div>

        <Textarea
          label={`Deskripsi ${role === "SISWA" ? "Siswa" : "Guru"} (opsional)`}
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
        />

        {role === "SISWA" && (
          <Select
            label="Filter Jurusan"
            placeholder="Pilih kelas/rombel"
            value={kelasReferensiId}
            onChange={(e) => setKelasReferensiId(e.target.value)}
            required
          >
            {kelasReferensiList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </Select>
        )}

        {role === "GURU" && (
          <Select label="Mapel" placeholder="Pilih mapel" value={mapelId} onChange={(e) => setMapelId(e.target.value)}>
            {mapelList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama}
              </option>
            ))}
          </Select>
        )}

        {/* Pilih Kelas (opsional) -- fitur Walas dihapus total dari sini */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#435064]">
            Pilih Kelas (opsional, bisa lebih dari 1 — kosongkan kalau cuma mau simpan datanya dulu)
          </label>
          <select
            className="w-full rounded-lg border border-[#dfe4ef] px-3.5 py-2.5 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
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
                    <button type="button" onClick={() => toggleKelas(id)} className="cursor-pointer hover:text-red-500">
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#435064]">
            Foto Profil {role === "SISWA" ? "/ Selfie" : ""} (opsional)
          </label>
          <div className="flex gap-2">
            <label className="relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-dashed border-[#dfe4ef] text-[#9CA3AF] transition-colors hover:border-[#6B85F6]">
              {fotoProfil ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoProfil} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                    <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                  <span className="text-[9px] font-medium leading-none">Ambil Foto</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                disabled={uploadingFoto}
                onChange={(e) => e.target.files?.[0] && handleUploadFoto(e.target.files[0])}
              />
            </label>

            <label className="relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-dashed border-[#dfe4ef] text-[#9CA3AF] transition-colors hover:border-[#6B85F6]">
              {uploadingFoto ? (
                <span className="text-[10px] font-medium">Upload...</span>
              ) : (
                <>
                  <span className="text-2xl leading-none">+</span>
                  <span className="text-[9px] font-medium leading-none">Upload File</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingFoto}
                onChange={(e) => e.target.files?.[0] && handleUploadFoto(e.target.files[0])}
              />
            </label>
          </div>
        </div>

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          {mode === "create" ? "Buat Akun" : "Simpan Perubahan"}
        </Button>
      </form>
    </Modal>
  );
}