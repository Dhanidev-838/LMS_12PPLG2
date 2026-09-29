"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Badge from "./ui/Badge";
import { formatTanggalIndonesia } from "@/lib/format";

export interface AsesmenData {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  status: "PROSES" | "SELESAI";
  durasiMenit: number | null;
  createdAt?: string;
  mapel?: { id?: string; nama: string } | null;
  mapelId?: string | null;
  deskripsi?: string | null;
  kelasTujuan?: { kelas: { id: string; judul: string } }[];
  _count?: { soal: number; submission: number };
  updatedAt: string;
}

interface AsesmenCardProps {
  data: AsesmenData;
  basePath?: string; // "/guru/asesmen" atau "/siswa/asesmen"
  submissionStatus?: "BELUM" | "SEDANG" | "SUDAH"; // khusus tampilan siswa
  onEdit?: (data: AsesmenData) => void;
  onSend?: (data: AsesmenData) => void;
  onDelete?: (data: AsesmenData) => void;
  onRemove?: (data: AsesmenData) => void;
}

const tipeLabel: Record<AsesmenData["tipe"], string> = {
  KUIS: "Kuis",
  UJIAN: "Ujian Online",
};

export default function AsesmenCard({ data, basePath = "/guru/asesmen", submissionStatus, onEdit, onSend, onDelete, onRemove }: AsesmenCardProps) {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const label = tipeLabel[data.tipe];

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
    <div
      onClick={() => router.push(`${basePath}/${data.id}`)}
      className="group cursor-pointer overflow-hidden border border-[#e1e5ed] bg-white transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#6B85F6]/10 text-[#6B85F6]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M12 2l3 6 6.5.9-4.7 4.6L18 20l-6-3.4L6 20l1.2-6.5L2.5 8.9 9 8l3-6Z" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            {basePath.startsWith("/siswa") ? null : (
              <Badge tone={data.status === "SELESAI" ? "green" : "amber"}>
                {data.status === "SELESAI" ? "Selesai" : "Proses"}
              </Badge>
            )}
            {(onEdit || onSend || onDelete) && (
              <div className="relative" data-options-menu>
                <button
                  type="button"
                  aria-label="Opsi asesmen"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowOptions((value) => !value);
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-lg font-bold text-[#64748B] hover:bg-[#6B85F6]/10"
                >
                  ⋯
                </button>
                {showOptions && (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-lg border border-[#dfe4ef] bg-white py-1 text-left shadow-md"
                  >
                    {onEdit && data.status === "PROSES" && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowOptions(false);
                          onEdit(data);
                        }}
                        className="block w-full cursor-pointer px-3 py-2 text-xs font-medium text-[#435064] hover:bg-[#6B85F6]/10"
                      >
                        Edit
                      </button>
                    )}
                    {onSend && data.status === "SELESAI" && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowOptions(false);
                          onSend(data);
                        }}
                        className="block w-full cursor-pointer px-3 py-2 text-xs font-medium text-[#435064] hover:bg-[#6B85F6]/10"
                      >
                        Kirim ke
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowOptions(false);
                          onDelete(data);
                        }}
                        className="block w-full cursor-pointer px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {submissionStatus && (
              <>
                <Badge tone={submissionStatus === "SUDAH" ? "green" : submissionStatus === "SEDANG" ? "amber" : "red"}>
                  {submissionStatus === "SUDAH" ? "Sudah dikerjakan" : submissionStatus === "SEDANG" ? "Sedang dikerjakan" : "Belum dikerjakan"}
                </Badge>
                {onRemove && submissionStatus !== "BELUM" && (
                  <button
                    type="button"
                    aria-label="Reset history asesmen"
                    title="Reset history asesmen"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemove(data);
                    }}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#dfe4ef] text-lg leading-none text-[#94A3B8] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <p className="mt-3 truncate text-sm font-bold text-[#182033]">{data.judul}</p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone="gray">{label}</Badge>
          {data.mapel && <Badge tone="brand">{data.mapel.nama}</Badge>}
          {data.durasiMenit && <span className="text-[11px] text-[#9CA3AF]">{data.durasiMenit} menit</span>}
        </div>

        {data.kelasTujuan && data.kelasTujuan.length > 0 && (
          <p className="mt-2 truncate text-[11px] text-[#64748B]">
            {data.kelasTujuan.map((kt) => kt.kelas.judul).join(", ")}
          </p>
        )}

        {data.createdAt && (
          <p className="mt-2 truncate text-[11px] text-[#9CA3AF]" title={formatTanggalIndonesia(data.createdAt)}>
            Dibuat: {formatTanggalIndonesia(data.createdAt)}
          </p>
        )}

        {data._count && (
          <div className="mt-3 flex items-center gap-3 border-t border-[#edf0f5] pt-2.5 text-[11px] text-[#9CA3AF]">
            <span>{data._count.soal} soal</span>
            <span>•</span>
            <span>{data._count.submission} pengumpulan</span>
          </div>
        )}
      </div>
    </div>
  );
}