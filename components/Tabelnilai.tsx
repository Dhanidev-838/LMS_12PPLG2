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
  allowPdfExport?: boolean;
  kelasJudul?: string;
  namaMapel?: string;
  jenisAsesmen?: string;
}

export default function TabelNilai({ asesmenId, judulAsesmen, nilaiList, onReset, readOnly = false, basePath = "/guru/asesmen", allowPdfExport = false, kelasJudul, namaMapel, jenisAsesmen }: TabelNilaiProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
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

  function handlePrintPdf() {
    setGenerateModalOpen(false);
    window.setTimeout(() => window.print(), 100);
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
    <div className="border border-[#e1e5ed] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#182033]">Nilai Siswa</p>
        <div className="flex gap-2">
          {allowPdfExport ? (
            <Button size="sm" onClick={() => setGenerateModalOpen(true)}>
              Generate Nilai
            </Button>
          ) : (
            <Button size="sm" loading={downloading} onClick={handleDownload}>
              Generate Excel
            </Button>
          )}
        </div>
      </div>

      {nilaiList.length === 0 ? (
        <p className="mt-6 text-center text-xs text-[#9CA3AF]">Belum ada siswa yang mengumpulkan.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e1e5ed] text-xs text-[#9CA3AF]">
                <th className="whitespace-nowrap pb-2 pr-4 font-semibold">Nama</th>
                <th className="whitespace-nowrap pb-2 pr-4 font-semibold">NIS</th>
                <th className="whitespace-nowrap pb-2 pr-4 font-semibold">Kelas/Jurusan</th>
                <th className="whitespace-nowrap pb-2 pr-4 font-semibold">Soal Terjawab</th>
                <th className="whitespace-nowrap pb-2 pr-4 text-right font-semibold">Nilai Objektif</th>
                <th className="whitespace-nowrap pb-2 pr-4 text-right font-semibold">Nilai Akhir</th>
                <th className="whitespace-nowrap pb-2 text-right font-semibold">{readOnly ? "Detail" : "Aksi"}</th>
              </tr>
            </thead>
            <tbody>
              {nilaiList.map((row) => (
                <tr
                  key={row.submissionId}
                  onClick={() => router.push(`${basePath}/${asesmenId}/jawaban/${row.submissionId}`)}
                  className="cursor-pointer border-b border-[#edf0f5] transition-colors hover:bg-[#6B85F6]/10 last:border-0"
                >
                  <td className="whitespace-nowrap py-2.5 pr-4 font-medium text-[#182033]">{row.nama}</td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-[#748096]">{row.nis}</td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-[#748096]">{row.kelasReferensi}</td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-[#748096]">{row.totalSoalTerjawab}</td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-right">
                    <Badge tone={row.nilaiObjektif >= 75 ? "green" : row.nilaiObjektif >= 50 ? "amber" : "red"}>
                      {row.nilaiObjektif}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-right">
                    <Badge tone={(row.nilaiAkhir ?? row.nilaiObjektif) >= 75 ? "green" : (row.nilaiAkhir ?? row.nilaiObjektif) >= 50 ? "amber" : "red"}>
                      {row.nilaiAkhir ?? "-"}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-right">
                    {!readOnly && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          loading={resettingSubmissionId === row.submissionId}
                          onClick={(event) => {
                            event.stopPropagation();
                            setResetRequest({ type: "asesmen", submissionId: row.submissionId, nama: row.nama });
                          }}
                        >
                          Reset Asesmen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          loading={resettingSubmissionId === row.submissionId}
                          onClick={(event) => {
                            event.stopPropagation();
                            setResetRequest({ type: "nilai", submissionId: row.submissionId, nama: row.nama });
                          }}
                        >
                          Reset Nilai
                        </Button>
                      </div>
                    )}
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
          <p className="text-sm leading-6 text-[#435064]">
            Semua jawaban <strong>{resetRequest.nama}</strong> akan dihapus dan siswa dapat mengerjakan asesmen ini dari awal.
          </p>
        ) : (
          <p className="text-sm leading-6 text-[#435064]">
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

      {allowPdfExport && (
        <Modal open={generateModalOpen} onClose={() => setGenerateModalOpen(false)} title="Generate Nilai" maxWidth="max-w-lg">
          <p className="text-sm text-[#64748B]">Pilih format rekap untuk {kelasJudul || "kelas ini"}.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={downloading}
              onClick={() => void handleDownload()}
              className="border border-[#dfe4ef] p-4 text-left transition-colors hover:border-[#6B85F6] hover:bg-[#fafbff] disabled:opacity-60"
            >
              <span className="block text-sm font-bold text-[#182033]">Excel (.xlsx)</span>
              <span className="mt-1 block text-xs leading-5 text-[#64748B]">Unduh data nilai dalam format spreadsheet.</span>
              {downloading && <span className="mt-2 block text-xs font-semibold text-[#6B85F6]">Menyiapkan file...</span>}
            </button>
            <button
              type="button"
              disabled={nilaiList.length === 0}
              onClick={handlePrintPdf}
              className="border border-[#dfe4ef] p-4 text-left transition-colors hover:border-[#6B85F6] hover:bg-[#fafbff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="block text-sm font-bold text-[#182033]">PDF</span>
              <span className="mt-1 block text-xs leading-5 text-[#64748B]">Cetak atau simpan rekap beserta ruang tanda tangan.</span>
            </button>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#8290a3]">Pada dialog cetak browser, pilih “Save as PDF” untuk menyimpan sebagai PDF.</p>
        </Modal>
      )}

      {allowPdfExport && (
        <section className="nilai-print-document" aria-hidden="true">
          <header>
            <p className="nilai-print-eyebrow">CLASSIFY · REKAP HASIL ASESMEN</p>
            <h1>Rekap Nilai</h1>
            <h2>{judulAsesmen}</h2>
            <div className="nilai-print-meta">
              <span>Kelas: {kelasJudul || "-"}</span>
              <span>Mata Pelajaran: {namaMapel || "-"}</span>
              <span>Jenis: {jenisAsesmen || "Asesmen"}</span>
              <span>Tanggal cetak: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </header>

          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Siswa</th>
                <th>NIS</th>
                <th>Kelas/Jurusan</th>
                <th>Soal Terjawab</th>
                <th>Nilai Objektif</th>
                <th>Nilai Akhir</th>
              </tr>
            </thead>
            <tbody>
              {nilaiList.map((row, index) => (
                <tr key={row.submissionId}>
                  <td>{index + 1}</td>
                  <td>{row.nama}</td>
                  <td>{row.nis}</td>
                  <td>{row.kelasReferensi}</td>
                  <td>{row.totalSoalTerjawab}</td>
                  <td>{row.nilaiObjektif}</td>
                  <td>{row.nilaiAkhir ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="nilai-print-count">Jumlah siswa: {nilaiList.length}</p>

          <div className="nilai-print-signatures">
            <div>
              <p>Mengetahui,</p>
              <p>Kepala Sekolah</p>
              <div className="nilai-print-signature-space" />
              <p className="nilai-print-signature-line">(........................................)</p>
            </div>
            <div>
              <p>Disetujui,</p>
              <p>Wakil Kepala Sekolah Bidang Kurikulum</p>
              <div className="nilai-print-signature-space" />
              <p className="nilai-print-signature-line">(........................................)</p>
            </div>
          </div>
        </section>
      )}

      {allowPdfExport && (
        <style jsx global>{`
          .nilai-print-document { display: none; }
          @media print {
            @page { size: A4 portrait; margin: 12mm; }
            body { background: #ffffff !important; }
            body * { visibility: hidden !important; }
            .nilai-print-document,
            .nilai-print-document * { visibility: visible !important; }
            .nilai-print-document {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              display: block !important;
              width: 100% !important;
              padding: 0 !important;
              color: #111827 !important;
              background: #ffffff !important;
              font-family: Arial, Helvetica, sans-serif !important;
              font-size: 10pt !important;
            }
            .nilai-print-document h1 { margin: 3mm 0 1mm; font-size: 18pt; }
            .nilai-print-document h2 { margin: 0 0 3mm; font-size: 12pt; font-weight: 600; }
            .nilai-print-eyebrow { color: #526ce4; font-size: 7.5pt; font-weight: 700; letter-spacing: .08em; }
            .nilai-print-meta { display: flex; flex-wrap: wrap; gap: 1.5mm 5mm; margin-bottom: 4mm; font-size: 7.5pt; }
            .nilai-print-document table { width: 100%; border-collapse: collapse; }
            .nilai-print-document th,
            .nilai-print-document td { border: 1px solid #9ca3af; padding: 1.5mm 1mm; text-align: left; overflow-wrap: anywhere; }
            .nilai-print-document th { background: #eef1ff !important; font-size: 7pt; }
            .nilai-print-document td { font-size: 7.5pt; }
            .nilai-print-count { margin-top: 2mm; font-size: 8pt; }
            .nilai-print-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; margin: 12mm 4mm 0; text-align: center; page-break-inside: avoid; font-size: 8pt; }
            .nilai-print-signatures p { margin: 0 0 1mm; }
            .nilai-print-signature-space { height: 22mm; }
            .nilai-print-signature-line { font-weight: 600; }
          }
        `}</style>
      )}
    </div>
  );
}