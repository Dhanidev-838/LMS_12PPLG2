"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import { showConfirm } from "@/lib/dialog";

interface LampiranTugas {
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

export interface TugasData {
  id: string;
  judul: string;
  isi: string | null;
  createdAt: string;
  guru: Author;
  mapelId?: string | null;
  mapel?: { nama: string } | null;
  lampiran: LampiranTugas[];
  kelasTujuan?: { kelas: { id: string; judul: string } }[];
  statusSubmission?: "BELUM" | "SUDAH"; // khusus response buat siswa
  _count?: { submission: number };
}

interface SubmissionLampiran {
  id: string;
  tipe: "FILE" | "LINK";
  url: string;
  judul: string | null;
}
interface SubmissionData {
  id: string;
  siswa: { id: string; nama: string; fotoProfil: string | null; kelasReferensi: { label: string } | null };
  lampiran: SubmissionLampiran[];
  submittedAt: string | null;
}

interface TugasCardProps {
  data: TugasData;
  currentUserId: string;
  role: "GURU" | "SISWA" | "ADMIN" | "KEPSEK" | "KURIKULUM";
  onSubmissionChanged?: () => void;
  onEdit?: (tugas: TugasData) => void;
  onDelete?: (id: string) => void;
  onSend?: (tugas: TugasData) => void;
}

export default function TugasCard({ data, currentUserId, role, onSubmissionChanged, onEdit, onDelete, onSend }: TugasCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionData[] | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [pendingLampiran, setPendingLampiran] = useState<{ tipe: "FILE" | "LINK"; url: string; judul?: string }[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);
  const [openOptionsId, setOpenOptionsId] = useState<string | null>(null);

  useEffect(() => {
    if (!openOptionsId) return;
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-options-menu]")) setOpenOptionsId(null);
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [openOptionsId]);
  const [editingSubmission, setEditingSubmission] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"BELUM" | "SUDAH">(data.statusSubmission ?? "BELUM");

  const isOwner = role === "GURU" && data.guru.id === currentUserId;

  function isImageUrl(url: string) {
    return /\.(png|jpe?g|gif|webp|bmp|svg)(?:[?#]|$)/i.test(url);
  }

  async function fetchDetail() {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/tugas/${data.id}`);
      const json = await res.json();
      setSubmissions(json.data?.submission ?? []);
    } catch {}
    setLoadingDetail(false);
  }

  async function handleToggleExpand() {
    if (!expanded) await fetchDetail();
    setExpanded((v) => !v);
  }

  async function handleUploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?kategori=tugas", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) setPendingLampiran((prev) => [...prev, { tipe: "FILE", url: json.url, judul: file.name }]);
    } finally {
      setUploading(false);
    }
  }

  function handleAddLink() {
    const url = linkInput.trim();
    if (!isValidLink(url)) return;
    setPendingLampiran((prev) => [...prev, { tipe: "LINK", url }]);
    setLinkInput("");
  }

  function isValidLink(value: string) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function handleRemovePending(i: number) {
    setPendingLampiran((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleEditSubmission() {
    const ownSubmission = submissions?.find((submission) => submission.siswa.id === currentUserId);
    if (!ownSubmission) return;
    setPendingLampiran(ownSubmission.lampiran.map((lampiran) => ({ tipe: lampiran.tipe, url: lampiran.url, judul: lampiran.judul ?? undefined })));
    setEditingSubmission(true);
  }

  async function handleDeleteSubmission() {
    if (!(await showConfirm("Hapus jawaban tugas ini?"))) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tugas/${data.id}/kirim-ke-kelas/submit`, { method: "DELETE" });
      if (res.ok) {
        setSubmissions((prev) => prev?.filter((submission) => submission.siswa.id !== currentUserId) ?? []);
        setPendingLampiran([]);
        setEditingSubmission(false);
        setSubmissionStatus("BELUM");
        onSubmissionChanged?.();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteStudentSubmission(submissionId: string, nama: string) {
    if (!(await showConfirm(`Hapus jawaban ${nama}? Siswa dapat mengerjakan tugas ini kembali.`))) return;
    setDeletingSubmissionId(submissionId);
    try {
      const res = await fetch(`/api/tugas/${data.id}/kirim-ke-kelas/submit?submissionId=${submissionId}`, { method: "DELETE" });
      if (res.ok) {
        setSubmissions((prev) => prev?.filter((submission) => submission.id !== submissionId) ?? []);
        onSubmissionChanged?.();
      }
    } finally {
      setDeletingSubmissionId(null);
    }
  }

  async function handleSubmitJawaban() {
    if (pendingLampiran.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tugas/${data.id}/kirim-ke-kelas/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lampiran: pendingLampiran }),
      });
      if (res.ok) {
        setPendingLampiran([]);
        setEditingSubmission(false);
        setSubmissionStatus("SUDAH");
        await fetchDetail();
        onSubmissionChanged?.();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-[#e1e5ed] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#64748B]">
            {data.guru.fotoProfil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.guru.fotoProfil} alt={data.guru.nama} className="h-full w-full object-cover" />
            ) : (
              data.guru.nama.charAt(0)
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-[#182033]">{data.guru.nama}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="brand">Tugas</Badge>
              {data.mapel && <Badge tone="gray">{data.mapel.nama}</Badge>}
              <span className="text-[11px] text-[#9CA3AF]">
                {new Date(data.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="relative flex-shrink-0" data-options-menu>
            <button type="button" aria-label="Opsi tugas" onClick={() => setOpenOptionsId((value) => value === "tugas" ? null : "tugas")} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-lg font-bold text-[#64748B] hover:bg-[#6B85F6]/10">⋯</button>
            {openOptionsId === "tugas" && (
              <div className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-lg border border-[#dfe4ef] bg-white py-1 shadow-md">
                <button type="button" onClick={() => { setOpenOptionsId(null); onSend?.(data); }} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-[#435064] hover:bg-[#6B85F6]/10">Kirim ke</button>
                <button type="button" onClick={() => { setOpenOptionsId(null); onEdit?.(data); }} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-[#435064] hover:bg-[#6B85F6]/10">Edit</button>
                <button type="button" onClick={() => { setOpenOptionsId(null); onDelete?.(data.id); }} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50">Hapus</button>
              </div>
            )}
          </div>
        )}
        {role === "SISWA" && (
          <Badge tone={submissionStatus === "SUDAH" ? "green" : "red"}>
            {submissionStatus === "SUDAH" ? "Sudah Dikerjakan" : "Belum Dikerjakan"}
          </Badge>
        )}
      </div>

      <p className="mt-3 text-sm font-bold text-[#182033]">{data.judul}</p>
      {data.isi && <p className="mt-1 whitespace-pre-wrap text-sm text-[#435064]">{data.isi}</p>}

      {data.lampiran.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.lampiran.map((l) => (
            <a
              key={l.id}
              href={isImageUrl(l.url) ? undefined : l.url}
              target={isImageUrl(l.url) ? undefined : "_blank"}
              rel={isImageUrl(l.url) ? undefined : "noopener noreferrer"}
              download={l.tipe === "FILE" ? l.judul || undefined : undefined}
              onClick={isImageUrl(l.url) ? (e) => { e.preventDefault(); setPreviewImage({ url: l.url, title: l.judul || "Preview gambar" }); } : undefined}
              className="attachment-item group flex min-w-0 items-center gap-3 border border-[#e1e5ed] bg-white p-3 transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#6B85F6]/10 text-[#6B85F6]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  {l.tipe === "LINK" ? (
                    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                  ) : (
                    <path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6M9 17h4" />
                  )}
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="attachment-title block truncate text-xs font-semibold text-[#182033]">
                  {l.judul || (l.tipe === "LINK" ? "Link materi tugas" : "File materi tugas")}
                </span>
                <span className="attachment-meta mt-0.5 block truncate text-[11px] text-[#94A3B8]">
                  {l.tipe === "LINK" ? l.url : "Lampiran file"}
                </span>
              </span>
              <span className="attachment-action flex-shrink-0 text-[11px] font-semibold text-[#6B85F6] group-hover:underline">
                {isImageUrl(l.url) ? "Lihat" : l.tipe === "FILE" ? "Unduh" : "Buka"}
              </span>
            </a>
          ))}
        </div>
      )}

      <button onClick={handleToggleExpand} className="mt-3 cursor-pointer text-xs font-medium text-[#64748B] hover:text-[#6B85F6]">
        {data._count?.submission ?? submissions?.length ?? 0} kumpulan jawaban {expanded ? "▲" : "▼"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-[#edf0f5] pt-3">
          {loadingDetail && <p className="text-xs text-[#9CA3AF]">Memuat...</p>}

          {/* upload jawaban -- cuma siswa, cuma lampiran (file/link), gak ada input teks */}
          {role === "SISWA" && (
            <div className="student-upload-box rounded-lg border border-dashed border-[#dfe4ef] bg-white p-3">
              <p className="mb-2 text-xs font-semibold text-[#182033]">{editingSubmission ? "Edit Jawaban Tugas" : "Jawab Tugas (lampirkan file/pdf/link)"}</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="student-upload-label cursor-pointer rounded-lg border border-[#dfe4ef] px-3 py-1.5 text-xs font-medium text-[#435064] hover:bg-[#6B85F6]/10">
                  {uploading ? "Upload..." : "+ Upload File"}
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0])}
                  />
                </label>
                <input
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="atau tempel link..."
                  className="student-upload-input min-w-[140px] flex-1 rounded-lg border border-[#dfe4ef] bg-white px-3 py-1.5 text-xs text-[#182033] outline-none placeholder:text-[#94A3B8] focus:border-[#6B85F6]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddLink}
                  disabled={!isValidLink(linkInput.trim())}
                >
                  + Link
                </Button>
              </div>

              {pendingLampiran.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {pendingLampiran.map((f, i) => (
                    <Badge key={i} tone="brand" className="flex items-center gap-1">
                      {f.judul || f.url}
                      <button type="button" onClick={() => handleRemovePending(i)} className="cursor-pointer hover:text-red-500">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Button
                type="button"
                size="sm"
                className="mt-2"
                loading={submitting}
                disabled={pendingLampiran.length === 0}
                onClick={handleSubmitJawaban}
              >
                {editingSubmission ? "Simpan Perubahan" : "Kumpulkan Tugas"}
              </Button>
              {editingSubmission && (
                <button
                  type="button"
                  onClick={() => { setPendingLampiran([]); setEditingSubmission(false); }}
                  className="ml-2 cursor-pointer text-xs font-medium text-[#64748B] hover:underline"
                >
                  Batal
                </button>
              )}
            </div>
          )}

          {/* daftar semua jawaban -- visible ke sekelas, beda dari Asesmen yang private */}
          {submissions?.map((s) => (
            <div key={s.id} className="flex items-start gap-2">
              <button
                onClick={() => router.push(`/profil/${s.siswa.id}`)}
                className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-[10px] font-bold text-[#64748B]"
              >
                {s.siswa.fotoProfil ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.siswa.fotoProfil} alt={s.siswa.nama} className="h-full w-full object-cover" />
                ) : (
                  s.siswa.nama.charAt(0)
                )}
              </button>
              <div className="relative flex-1 border border-[#edf0f5] bg-[#F9FAFB] p-2.5" data-options-menu>
                {(role === "GURU" || (role === "SISWA" && s.siswa.id === currentUserId)) && (
                  <div className="absolute right-2 top-2" data-options-menu>
                    <button
                      type="button"
                      aria-label="Opsi jawaban"
                      onClick={() => setOpenOptionsId((value) => value === `jawaban-${s.id}` ? null : `jawaban-${s.id}`)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-base font-bold text-[#64748B] hover:bg-[#6B85F6]/10"
                    >
                      ⋯
                    </button>
                    {openOptionsId === `jawaban-${s.id}` && (
                      <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-lg border border-[#dfe4ef] bg-white py-1 shadow-md">
                        {role === "SISWA" ? (
                          <>
                            <button type="button" onClick={() => { setOpenOptionsId(null); handleEditSubmission(); }} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-[#435064] hover:bg-[#6B85F6]/10">Edit Jawaban</button>
                            <button type="button" onClick={() => { setOpenOptionsId(null); void handleDeleteSubmission(); }} disabled={submitting} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50">Hapus Jawaban</button>
                          </>
                        ) : (
                          <button type="button" onClick={() => { setOpenOptionsId(null); void handleDeleteStudentSubmission(s.id, s.siswa.nama); }} disabled={deletingSubmissionId === s.id} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50">Hapus Jawaban Siswa</button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => router.push(`/profil/${s.siswa.id}`)}
                  className="cursor-pointer text-xs font-bold text-[#182033] hover:underline"
                >
                  {s.siswa.id === currentUserId ? "Anda" : s.siswa.nama}
                </button>
                <span className="ml-2 text-[11px] font-medium text-[#64748B]">
                  {s.siswa.kelasReferensi?.label ?? "Kelas belum diatur"}
                </span>
                {s.submittedAt && (
                  <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                    Dikumpulkan {new Date(s.submittedAt).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {s.lampiran.map((l) => (
                    <a
                      key={l.id}
                      href={isImageUrl(l.url) ? undefined : l.url}
                      target={isImageUrl(l.url) ? undefined : "_blank"}
                      rel={isImageUrl(l.url) ? undefined : "noopener noreferrer"}
                      download={l.tipe === "FILE" ? l.judul || undefined : undefined}
                      onClick={isImageUrl(l.url) ? (e) => { e.preventDefault(); setPreviewImage({ url: l.url, title: l.judul || "Preview gambar" }); } : undefined}
                      className="attachment-item group flex min-w-0 items-center gap-3 border border-[#e1e5ed] bg-white p-3 transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#6B85F6]/10 text-[#6B85F6]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                          {l.tipe === "LINK" ? (
                            <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                          ) : (
                            <path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6M9 17h4" />
                          )}
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="attachment-title block truncate text-xs font-semibold text-[#182033]">
                          {l.judul || (l.tipe === "LINK" ? "Link jawaban siswa" : "File jawaban siswa")}
                        </span>
                        <span className="attachment-meta mt-0.5 block truncate text-[11px] text-[#94A3B8]">
                          {l.tipe === "LINK" ? l.url : "Lampiran file"}
                        </span>
                      </span>
                      <span className="attachment-action flex-shrink-0 text-[11px] font-semibold text-[#6B85F6] group-hover:underline">
                        {isImageUrl(l.url) ? "Lihat" : l.tipe === "FILE" ? "Unduh" : "Buka"}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {!loadingDetail && submissions?.length === 0 && (
            <p className="text-xs text-[#9CA3AF]">Belum ada yang mengumpulkan.</p>
          )}
        </div>
      )}

      <Modal open={!!previewImage} onClose={() => setPreviewImage(null)} title={previewImage?.title ?? "Preview gambar"} maxWidth="max-w-4xl">
        {previewImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewImage.url} alt={previewImage.title} className="mx-auto max-h-[70vh] w-auto max-w-full object-contain" />
        )}
      </Modal>
    </div>
  );
}