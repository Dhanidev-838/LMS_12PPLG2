"use client";

import { useEffect, useState } from "react";
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
  kelasReferensi?: { id?: string; label: string; jenjang?: string; tingkat?: number | null; jurusan?: { nama: string } | null } | null; // rombel referensi siswa
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

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-options-menu]")) setMenuOpen(false);
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [menuOpen]);

  const subInfo =
    data.role === "SISWA"
      ? data.kelasReferensi?.label ?? "Belum ada kelas"
      : data.kelasGuruMapel && data.kelasGuruMapel.length > 0
      ? `${data.kelasGuruMapel[0].mapel.nama} • ${data.kelasGuruMapel.length} kelas`
      : "Belum ada kelas";

  return (
    <div
      onClick={() => router.push(`/profil/${data.id}`)}
      className="group relative flex cursor-pointer items-start gap-3 border border-[#e1e5ed] bg-white p-4 transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6B85F6]/10 text-sm font-bold text-[#6B85F6]">
        {data.fotoProfil ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.fotoProfil} alt={data.nama} className="h-full w-full object-cover" />
        ) : (
          data.nama.charAt(0)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-[#182033]">{data.nama}</p>
          <Badge tone={data.role === "GURU" ? "brand" : "gray"}>{data.role === "SISWA" ? "Siswa" : "Guru"}</Badge>
        </div>
        <p className="truncate text-xs text-[#748096]">{data.email}</p>
        <p className="mt-0.5 text-[11px] text-[#94A3B8]">
          {data.role === "SISWA" ? "NIS" : "NIK"}: {data.role === "SISWA" ? data.nis : data.nik}
        </p>
        <p className="mt-1 truncate text-[11px] font-medium text-[#435064]">{subInfo}</p>
        {data.deskripsi && <p className="mt-1 line-clamp-2 text-[11px] italic text-[#94A3B8]">&quot;{data.deskripsi}&quot;</p>}
      </div>

      {isEditable && (
        <div className="relative flex-shrink-0" data-options-menu onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-label="Opsi akun"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-lg font-bold text-[#64748B] hover:bg-[#6B85F6]/10"
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-28 overflow-hidden rounded-lg border border-[#dfe4ef] bg-white py-1 shadow-md">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(data);
                }}
                className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-[#435064] hover:bg-[#6B85F6]/10"
              >
                Edit
              </button>
              <button
                type="button"
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