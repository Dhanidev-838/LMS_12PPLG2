"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "./ui/Badge";

export interface KelasData {
  id: string;
  judul: string;
  deskripsi: string | null;
  inviteToken: string;
  _count?: { siswa: number };
}

interface KelasCardProps {
  data: KelasData;
  isEditable?: boolean;
  onEdit?: (kelas: KelasData) => void;
  onDelete?: (kelasId: string) => void;
  basePath?: string;
}

export default function KelasCard({
  data,
  isEditable = false,
  onEdit,
  onDelete,
  basePath = "/admin/kelas",
}: KelasCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const label = data.judul || "Tanpa Judul";

  function handleCopyInvite(e: React.MouseEvent) {
    e.stopPropagation();
    const link = `${window.location.origin}/join/${data.inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      onClick={() => router.push(`${basePath}/${data.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-[#111827]">{label}</p>
          <Badge tone="brand">{data._count?.siswa ?? 0} Siswa</Badge>
        </div>

        {isEditable && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-black/5"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 w-32 overflow-hidden rounded-lg border border-black/5 bg-white shadow-lg">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(data);
                  }}
                  className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-[#374151] hover:bg-black/5"
                >
                  Edit Kelas
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(data.id);
                  }}
                  className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50"
                >
                  Hapus Kelas
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* deskripsi -- strip walas dihapus total */}
      <div className="px-4 py-3">
        <p className="line-clamp-2 text-xs italic text-[#6B7280]">
          {data.deskripsi ? `"${data.deskripsi}"` : "Belum ada deskripsi."}
        </p>
      </div>

      {isEditable && (
        <div className="flex items-center gap-1 border-t border-black/5 px-4 py-2.5">
          <button
            onClick={handleCopyInvite}
            className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-[#6B7280] hover:text-[#6B85F6]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
            {copied ? "Tersalin!" : "Salin Link Undangan"}
          </button>
        </div>
      )}
    </div>
  );
}