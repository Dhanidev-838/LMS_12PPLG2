"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import Modal from "./ui/Modal";
import { showAlert } from "@/lib/dialog";

interface NilaiRow {
  submissionId: string;
  nama: string;
  nis: string;
  kelasReferensi: string;
  nilaiObjektif: number;
  nilaiAkhir: number | null;
  nilaiSementara: number;
  totalSoalTerjawab: number;
}

interface TabelNilaiProps {
  asesmenId: string;
  judulAsesmen: string;
  nilaiList: NilaiRow[];
  onReset?: () => void;
  readOnly?: boolean;
  basePath?: string;
}

export default function TabelNilai({ asesmenId, judulAsesmen, nilaiList, onReset, readOnly = false, basePath = "/guru/asesmen" }: TabelNilaiProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [resettingSubmissionId, setResettingSubmissionId] = useState<string | null>(null);
  const [resetRequest, setResetRequest] = useState<{
    type: "asesmen" | "nilai";
    submissionId: string;
    nama: string;
  } | null>(null);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/nilai?format=xlsx`);
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nilai-${judulAsesmen.replace(/\s+/g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      await showAlert("Gagal mengunduh nilai. Coba lagi.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleResetSubmission(submissionId: string) {
    setResettingSubmissionId(submissionId);
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/nilai/${submissionId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        await showAlert(data.error ?? "Gagal mereset asesmen siswa.");
        return;
      }
      onReset?.();
    } catch {
      await showAlert("Gagal mereset asesmen siswa.");
    } finally {
      setResettingSubmissionId(null);
    }
  }

  async function handleResetNilai(submissionId: string) {
    setResettingSubmissionId(submissionId);
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/nilai/${submissionId}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        await showAlert(data.error ?? "Gagal mereset nilai.");
        return;
      }
      onReset?.();
    } catch {
      await showAlert("Gagal mereset nilai.");
    } finally {
      setResettingSubmissionId(null);
    }
  }

  function closeResetModal() {
    if (!resettingSubmissionId) setResetRequest(null);
  }

  async function confirmReset() {
    if (!resetRequest) return;
    const request = resetRequest;
    setResetRequest(null);
    if (request.type === "asesmen") {
      await handleResetSubmission(request.submissionId);
    } else {
      await handleResetNilai(request.submissionId);
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#111827]">Nilai Siswa</p>
        <div className="flex gap-2">
          <Button size="sm" loading={downloading} onClick={handleDownload}>
            Generate Excel
          </Button>
        </div>
      </div>

      {nilaiList.length === 0 ? (
        <p className="mt-6 text-center text-xs text-[#9CA3AF]">Belum ada siswa yang mengumpulkan.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs text-[#9CA3AF]">
                <th className="pb-2 font-semibold">Nama</th>
                <th className="pb-2 font-semibold">NIS</th>
                <th className="pb-2 font-semibold">Kelas/Jurusan</th>
                <th className="pb-2 font-semibold">Soal Terjawab</th>
                <th className="pb-2 text-right font-semibold">Nilai Objektif</th>
                <th className="pb-2 text-right font-semibold">Nilai Akhir</th>
                <th className="pb-2 text-right font-semibold">{readOnly ? "Detail" : "Aksi"}</th>
              </tr>
            </thead>
            <tbody>
              {nilaiList.map((row) => (
                <tr
                  key={row.submissionId}
                  onClick={() => router.push(`${basePath}/${asesmenId}/jawaban/${row.submissionId}`)}
                  className="cursor-pointer border-b border-black/5 transition-colors hover:bg-[#F8FAFC] last:border-0"
                >
                  <td className="py-2.5 font-medium text-[#111827]">{row.nama}</td>
                  <td className="py-2.5 text-xs text-[#6B7280]">{row.nis}</td>
                  <td className="py-2.5 text-xs text-[#6B7280]">{row.kelasReferensi}</td>
                  <td className="py-2.5 text-xs text-[#6B7280]">{row.totalSoalTerjawab}</td>
                  <td className="py-2.5 text-right">
                    <Badge tone={row.nilaiObjektif >= 75 ? "green" : row.nilaiObjektif >= 50 ? "amber" : "red"}>
                      {row.nilaiObjektif}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-right">
                    <Badge tone={(row.nilaiAkhir ?? row.nilaiObjektif) >= 75 ? "green" : (row.nilaiAkhir ?? row.nilaiObjektif) >= 50 ? "amber" : "red"}>
                      {row.nilaiAkhir ?? "-"}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-right">
                    {!readOnly && <Button
                      size="sm"
                      variant="outline"
                      loading={resettingSubmissionId === row.submissionId}
                      onClick={(event) => {
                        event.stopPropagation();
                        setResetRequest({ type: "asesmen", submissionId: row.submissionId, nama: row.nama });
                      }}
                    >
                      Reset Asesmen
                    </Button>}
                    {!readOnly && <Button
                      size="sm"
                      variant="outline"
                      loading={resettingSubmissionId === row.submissionId}
                      onClick={(event) => {
                        event.stopPropagation();
                        setResetRequest({ type: "nilai", submissionId: row.submissionId, nama: row.nama });
                      }}
                    >
                      Reset Nilai
                    </Button>}
                    {readOnly && <span className="text-xs font-semibold text-[#6B85F6]">Lihat jawaban</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={resetRequest !== null}
        onClose={closeResetModal}
        title={resetRequest?.type === "asesmen" ? "Reset Asesmen Siswa" : "Reset Nilai Siswa"}
      >
        {resetRequest?.type === "asesmen" ? (
          <p className="text-sm leading-6 text-[#475569]">
            Semua jawaban <strong>{resetRequest.nama}</strong> akan dihapus dan siswa dapat mengerjakan asesmen ini dari awal.
          </p>
        ) : (
          <p className="text-sm leading-6 text-[#475569]">
            Nilai akhir <strong>{resetRequest?.nama}</strong> akan dikosongkan. Jawaban siswa tetap tersimpan.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={closeResetModal}>
            Batal
          </Button>
          <Button
            size="sm"
            variant={resetRequest?.type === "asesmen" ? "danger" : "primary"}
            onClick={() => void confirmReset()}
          >
            {resetRequest?.type === "asesmen" ? "Reset Asesmen" : "Reset Nilai"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}