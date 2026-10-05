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
      className="group relative cursor-pointer rounded-xl border border-border bg-surface text-foreground transition-colors duration-150 hover:border-accent hover:bg-surface-muted"
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{label}</p>
          <Badge tone="brand">{data._count?.siswa ?? 0} Siswa</Badge>
        </div>

        {isEditable && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Opsi kelas"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent-subtle hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 w-32 overflow-hidden rounded-lg border border-border bg-surface shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(data);
                  }}
                  className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-accent-subtle"
                >
                  Edit Kelas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(data.id);
                  }}
                  className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger-subtle"
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
        <p className="line-clamp-2 text-xs italic text-muted-foreground">
          {data.deskripsi ? `"${data.deskripsi}"` : "Belum ada deskripsi."}
        </p>
      </div>

      {isEditable && (
        <div className="flex items-center gap-1 border-t border-border px-4 py-2.5">
          <button
            type="button"
            onClick={handleCopyInvite}
            className="flex min-h-10 cursor-pointer items-center gap-1 text-[11px] font-medium text-foreground underline-offset-4 hover:underline"
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