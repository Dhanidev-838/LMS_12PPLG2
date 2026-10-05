"use client";

import { useState } from "react";
import Badge from "./ui/Badge";

export interface MateriData {
  id: string;
  judul: string;
  tipe: "PDF" | "FILE" | "IMAGE" | "LINK";
  url: string;
  deskripsi: string | null;
  createdAt: string;
  guru?: { id: string; nama: string };
  kelasTujuan?: { kelas: { id: string; judul: string } }[];
}

interface MateriCardProps {
  data: MateriData;
  isEditable?: boolean;
  onEdit?: (materi: MateriData) => void;
  onDelete?: (id: string) => void;
}

export default function MateriCard({ data, isEditable = false, onEdit, onDelete }: MateriCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tipeLabel = data.tipe === "IMAGE" ? "Foto" : data.tipe === "FILE" ? "File" : data.tipe;
  const lampiranLabel = data.tipe === "LINK"
    ? data.url
    : data.tipe === "IMAGE"
      ? "Foto materi"
      : data.tipe === "PDF"
        ? "Dokumen PDF"
        : "File materi";

  return (
    <div className="border border-border bg-surface-muted p-4 text-foreground">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-xs font-bold text-muted-foreground">
            {data.guru?.nama.charAt(0) ?? "M"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{data.guru?.nama ?? "Materi Kelas"}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="brand">Materi</Badge>
              <Badge tone={data.tipe === "LINK" ? "brand" : "gray"}>{tipeLabel}</Badge>
              <span className="text-[11px] text-muted-foreground">
                {new Date(data.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
        </div>

        {isEditable && (
          <div className="relative flex-shrink-0" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="Opsi materi" onClick={() => setMenuOpen((value) => !value)} className="flex h-8 w-8 cursor-pointer items-center justify-center text-lg font-bold text-muted-foreground hover:bg-accent-subtle">⋯</button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-md">
                <button type="button" onClick={() => { setMenuOpen(false); onEdit?.(data); }} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-accent-subtle">Edit</button>
                <button type="button" onClick={() => { setMenuOpen(false); onDelete?.(data.id); }} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger-subtle">Hapus</button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-3 text-sm font-bold text-foreground">{data.judul}</p>
      {data.deskripsi && <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{data.deskripsi}</p>}

      <a href={data.url} target="_blank" rel="noopener noreferrer" className="attachment-item group mt-3 flex min-w-0 items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors duration-150 hover:border-accent hover:bg-surface-muted">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-accent-subtle text-foreground">
          {data.tipe === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.url} alt={data.judul} className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              {data.tipe === "LINK" ? (
                <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
              ) : (
                <path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6M9 17h4" />
              )}
            </svg>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="attachment-title block truncate text-xs font-semibold text-foreground">{lampiranLabel}</span>
          <span className="attachment-meta mt-0.5 block truncate text-[11px] text-muted-foreground">{data.tipe === "LINK" ? "Tautan materi" : "Lampiran file"}</span>
        </span>
        <span className="attachment-action flex-shrink-0 text-[11px] font-semibold text-foreground underline-offset-4 group-hover:underline">Buka</span>
      </a>
    </div>
  );
}