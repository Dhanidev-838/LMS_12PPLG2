"use client";

import { useState } from "react";
import Badge from "./ui/Badge";

export interface MateriData {
  id: string;
  judul: string;
  tipe: "PDF" | "LINK";
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

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: data.tipe === "PDF" ? "#FEE2E2" : "#DBEAFE" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={data.tipe === "PDF" ? "#EF4444" : "#3B82F6"}
          strokeWidth="1.8"
          className="h-5 w-5"
        >
          {data.tipe === "PDF" ? (
            <path d="M6 2h9l5 5v15H6V2Zm9 0v5h5M9 13h6M9 17h4" />
          ) : (
            <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
          )}
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-sm font-bold text-[#111827] hover:text-[#6B85F6]"
        >
          {data.judul}
        </a>
        {data.deskripsi && <p className="mt-0.5 line-clamp-2 text-xs text-[#6B7280]">{data.deskripsi}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={data.tipe === "PDF" ? "red" : "brand"}>{data.tipe}</Badge>
          {data.guru && <span className="text-[11px] text-[#9CA3AF]">oleh {data.guru.nama}</span>}
          {data.kelasTujuan?.map((kt) => (
            <Badge key={kt.kelas.id} tone="gray">
              {kt.kelas.judul}
            </Badge>
          ))}
        </div>
      </div>

      {isEditable && (
        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#9CA3AF] hover:bg-black/5"
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