"use client";

import { useEffect, useState } from "react";


interface Lampiran {
  id: string;
  tipe: "FILE" | "LINK" | "VIDEO";
  url: string;
  judul: string | null;
  thumbnail: string | null;
}

interface Author {
  id: string;
  nama: string;
  fotoProfil: string | null;
  role: string;
}

export interface PengumumanData {
  id: string;
  isi: string;
  kelasId: string;
  createdAt: string;
  author: Author;
  lampiran: Lampiran[];
}

interface PengumumanCardProps {
  data: PengumumanData;
  currentUserId: string;
  onEdit?: (data: PengumumanData) => void;
  onDelete?: (id: string) => void;
  onSend?: (data: PengumumanData) => void;
}

export default function PengumumanCard({ data, currentUserId, onEdit, onDelete, onSend }: PengumumanCardProps) {
  const isOwner = data.author.id === currentUserId;
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (!showOptions) return;
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-options-menu]")) setShowOptions(false);
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showOptions]);

  return (
    <div className="border border-[#e1e5ed] bg-white p-4">
      {/* header author */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#64748B]">
            {data.author.fotoProfil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.author.fotoProfil} alt={data.author.nama} className="h-full w-full object-cover" />
            ) : (
              data.author.nama.charAt(0)
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-[#182033]">{data.author.nama}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#9CA3AF]">
                {new Date(data.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="relative" data-options-menu>
            <button
              type="button"
              aria-label="Opsi pengumuman"
              onClick={() => setShowOptions((value) => !value)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-lg font-bold text-[#64748B] hover:bg-[#6B85F6]/10"
            >
              ⋯
            </button>
            {showOptions && (
              <div className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-lg border border-[#dfe4ef] bg-white py-1 shadow-md">
                <button type="button" onClick={() => { setShowOptions(false); onSend?.(data); }} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-[#435064] hover:bg-[#6B85F6]/10">Kirim ke</button>
                <button type="button" onClick={() => { setShowOptions(false); onEdit?.(data); }} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-[#435064] hover:bg-[#6B85F6]/10">Edit</button>
                <button type="button" onClick={() => { setShowOptions(false); onDelete?.(data.id); }} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50">Hapus</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* isi */}
      {data.isi && <p className="mt-3 whitespace-pre-wrap text-sm text-[#435064]">{data.isi}</p>}

      {/* lampiran */}
      {data.lampiran.length > 0 && (
        <div className="mt-3 space-y-2">
          {data.lampiran.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              download={l.tipe === "FILE" ? l.judul || undefined : undefined}
              className="flex items-center gap-2 border border-[#e1e5ed] bg-[#F9FAFB] p-2.5 text-xs font-medium text-[#435064] transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#6B85F6" strokeWidth="1.8" className="h-4 w-4 flex-shrink-0">
                {l.tipe === "LINK" ? (
                  <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                ) : (
                  <path d="M4 4h16v16H4z M8 8h8M8 12h8M8 16h5" />
                )}
              </svg>
              <span className="truncate">{l.judul || l.url}</span>
            </a>
          ))}
        </div>
      )}

      {/* fitur komentar dihapus total -- pengumuman gak bisa dibalas/dikomentari lagi */}
    </div>
  );
}