"use client";

import { useState } from "react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { showAlert, showConfirm } from "@/lib/dialog";

export interface LaporanData {
  id: string;
  email: string;
  alasan: string;
  status: "PENDING" | "DITERIMA" | "DITOLAK";
  otpVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    nama: string;
    role: "SISWA" | "GURU";
    nis: string | null;
    nik: string | null;
    fotoProfil: string | null;
  };
}

interface LaporanCardProps {
  data: LaporanData;
  onUpdated: () => void; // refresh list di parent setelah aksi apapun
}

export default function LaporanCard({ data, onUpdated }: LaporanCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [otpTampil, setOtpTampil] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const identitas = data.user.role === "SISWA" ? `NIS: ${data.user.nis}` : `NIK: ${data.user.nik}`;

  async function handleTerima() {
    setLoadingAction("terima");
    try {
      const res = await fetch(`/api/lupa-password/${data.id}/kirim-otp`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setOtpTampil(json.otp);
        onUpdated();
      } else {
        await showAlert(json.error ?? "Gagal mengirim OTP.");
      }
    } catch {
      await showAlert("Terjadi kesalahan.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleKirimUlangOtp() {
    setLoadingAction("kirim-ulang");
    try {
      const res = await fetch(`/api/lupa-password/${data.id}/kirim-otp`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setOtpTampil(json.otp);
      } else {
        await showAlert(json.error ?? "Gagal mengirim OTP.");
      }
    } catch {
      await showAlert("Terjadi kesalahan.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleTolak() {
    if (!(await showConfirm("Tolak dan hapus laporan ini?"))) return;
    setLoadingAction("tolak");
    try {
      const res = await fetch(`/api/lupa-password/${data.id}/tolak`, { method: "POST" });
      if (res.ok) onUpdated();
    } catch {
      await showAlert("Terjadi kesalahan.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSelesai() {
    if (!(await showConfirm("Tandai laporan ini selesai? Card akan dihapus dari daftar."))) return;
    setLoadingAction("selesai");
    try {
      const res = await fetch(`/api/lupa-password/${data.id}/selesai`, { method: "POST" });
      if (res.ok) onUpdated();
    } catch {
      await showAlert("Terjadi kesalahan.");
    } finally {
      setLoadingAction(null);
    }
  }

  function handleCopyOtp() {
    if (!otpTampil) return;
    navigator.clipboard.writeText(otpTampil);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-foreground">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-sm font-bold text-muted-foreground">
          {data.user.fotoProfil ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.user.fotoProfil} alt={data.user.nama} className="h-full w-full object-cover" />
          ) : (
            data.user.nama.charAt(0)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted-foreground">Permintaan Laporan ubah password dari :</p>
          <div className="flex items-center gap-2">
            <p className="font-bold text-foreground">{data.user.nama}</p>
            <Badge tone="gray">{data.user.role === "SISWA" ? "Siswa" : "Guru"}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            email: {data.email} · {identitas}
          </p>
          <p className="mt-1 text-xs italic text-muted-foreground">Alasan: {data.alasan}</p>
        </div>
      </div>

      {/* ============ STATUS PENDING: tombol terima/tolak ============ */}
      {data.status === "PENDING" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" loading={loadingAction === "terima"} onClick={handleTerima}>
            Terima &amp; Kirim OTP
          </Button>
          <Button size="sm" variant="outline" loading={loadingAction === "tolak"} onClick={handleTolak}>
            Tolak dan Hapus Laporan
          </Button>
        </div>
      )}

      {/* ============ STATUS DITERIMA: OTP + selesai ============ */}
      {data.status === "DITERIMA" && (
        <div className="mt-4 space-y-3">
          {otpTampil && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Kode OTP 4 digit untuk ubah password :</p>
              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  {otpTampil.split("").map((digit, i) => (
                    <div
                      key={i}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-lg font-bold text-accent-foreground"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCopyOtp}
                  className="cursor-pointer text-xs font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {copied ? "Tersalin!" : "Salin Kode OTP"}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" loading={loadingAction === "kirim-ulang"} onClick={handleKirimUlangOtp}>
              Kirim Ulang OTP
            </Button>
            <Button size="sm" loading={loadingAction === "selesai"} onClick={handleSelesai}>
              Selesai
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}