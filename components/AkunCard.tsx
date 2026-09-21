"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "./ui/Badge";

export interface AkunData {
  id: string;
  nama: string;
  email: string;
  nis?: string | null;
  nik?: string | null;
  fotoProfil?: string | null;
  deskripsi?: string | null;
  role: "SISWA" | "GURU";
  kelasReferensi?: { label: string; jenjang?: string; tingkat?: number | null; jurusan?: { nama: string } | null } | null; // rombel referensi siswa
  kelasSiswa?: { kelas: { id?: string; judul: string } }[];
  kelasGuruMapel?: { kelas: { id?: string; judul: string }; mapel: { nama: string } }[]; // buat guru
}

interface AkunCardProps {
  data: AkunData;
  isEditable?: boolean;
  onEdit?: (akun: AkunData) => void;
  onDelete?: (id: string) => void;
}

export default function AkunCard({ data, isEditable = false, onEdit, onDelete }: AkunCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const subInfo =
    data.role === "SISWA"
      ? data.kelasReferensi?.label ?? "Belum ada kelas"
      : data.kelasGuruMapel && data.kelasGuruMapel.length > 0
      ? `${data.kelasGuruMapel[0].mapel.nama} • ${data.kelasGuruMapel.length} kelas`
      : "Belum ada kelas";

  return (
    <div
      onClick={() => router.push(`/profil/${data.id}`)}
      className="group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-2xl p-4 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ background: "#6B85F6" }}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-sm font-bold">
        {data.fotoProfil ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.fotoProfil} alt={data.nama} className="h-full w-full object-cover" />
        ) : (
          data.nama.charAt(0)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold">{data.nama}</p>
          <Badge tone="gray" className="!bg-white/20 !text-white">
            {data.role === "SISWA" ? "Siswa" : "Guru"}
          </Badge>
        </div>
        <p className="truncate text-xs text-white/80">{data.email}</p>
        <p className="mt-0.5 text-[11px] text-white/70">
          {data.role === "SISWA" ? "NIS" : "NIK"}: {data.role === "SISWA" ? data.nis : data.nik}
        </p>
        <p className="mt-1 truncate text-[11px] font-medium text-white/90">{subInfo}</p>
        {data.deskripsi && <p className="mt-1 line-clamp-2 text-[11px] italic text-white/70">&quot;{data.deskripsi}&quot;</p>}
      </div>

      {isEditable && (
        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-28 overflow-hidden rounded-lg border border-black/5 bg-white shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(data);
                }}
                className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-[#374151] hover:bg-black/5"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(data.id);
                }}
                className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}