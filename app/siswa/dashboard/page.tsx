"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

type DashboardData = {
  siswa: {
    id: string;
    nama: string;
    kelasJurusan: string;
  };
  statistik: {
    totalKelas: number;
    totalAsesmen: number;
    asesmenSudah: number;
    asesmenSedang: number;
    asesmenBelum: number;
    totalTugas: number;
    tugasSudah: number;
    tugasBelum: number;
    rataRataNilai: number | null;
  };
  asesmenTerbaru: Array<{
    id: string;
    judul: string;
    tipe: "KUIS" | "UJIAN";
    statusSubmission: "BELUM" | "SEDANG" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  tugasTerbaru: Array<{
    id: string;
    judul: string;
    statusSubmission: "BELUM" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  tugasBelumDikumpulkan: Array<{
    id: string;
    judul: string;
    statusSubmission: "BELUM" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  asesmenSedangDikerjakan: Array<{
    id: string;
    judul: string;
    tipe: "KUIS" | "UJIAN";
    statusSubmission: "BELUM" | "SEDANG" | "SUDAH";
    createdAt: string;
    mapel?: { nama: string } | null;
  }>;
  nilaiTerbaru: Array<{
    id: string;
    judul: string;
    tipe: "KUIS" | "UJIAN";
    nilai: number | null;
    mapel: string;
    submittedAt: string | null;
  }>;
};

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#111827]">{value}</p>
      <p className="mt-1 text-xs text-[#64748B]">{helper}</p>
    </div>
  );
}

export default function SiswaDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/siswa/dashboard");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Gagal memuat dashboard siswa.");
        }

        if (!ignore) {
          setData(payload.data ?? null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat dashboard siswa.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-white p-5 shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        <p className="text-lg font-bold">Gagal memuat dashboard</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-semibold text-[#111827]">Belum ada data</p>
        <p className="mt-2 text-sm text-[#64748B]">Belum ada aktivitas kelas, tugas, atau asesmen untuk akun Anda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 text-white shadow-sm" style={{ background: "#6B85F6" }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Dashboard Siswa</p>
        <h1 className="mt-2 text-2xl font-bold">Selamat Datang, {data.siswa.nama}</h1>
        <p className="mt-2 text-sm text-white/85">{data.siswa.kelasJurusan}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Kelas" value={String(data.statistik.totalKelas)} helper="Kelas yang diikuti" />
        <StatCard label="Total Asesmen" value={String(data.statistik.totalAsesmen)} helper="Kuis & ujian" />
        <StatCard label="Asesmen Selesai" value={String(data.statistik.asesmenSudah)} helper="Sudah dikerjakan" />
        <StatCard label="Asesmen Sedang" value={String(data.statistik.asesmenSedang)} helper="Dikerjakan saat ini" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Asesmen Belum" value={String(data.statistik.asesmenBelum)} helper="Belum dikerjakan" />
        <StatCard label="Total Tugas" value={String(data.statistik.totalTugas)} helper="Tugas yang tersedia" />
        <StatCard label="Tugas Sudah" value={String(data.statistik.tugasSudah)} helper="Sudah dikumpulkan" />
        <StatCard label="Tugas Belum" value={String(data.statistik.tugasBelum)} helper="Belum dikumpulkan" />
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#111827]">Rata-rata Nilai Asesmen</p>
          <Badge tone={data.statistik.rataRataNilai !== null ? "green" : "gray"}>
            {data.statistik.rataRataNilai !== null ? `${data.statistik.rataRataNilai}` : "Belum ada nilai"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#111827]">Aksi Cepat</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href="/siswa/asesmen">
              <Button className="w-full" size="sm">Kerjakan Asesmen</Button>
            </Link>
            <Link href="/siswa/tugas">
              <Button className="w-full" size="sm" variant="outline">Lihat Tugas</Button>
            </Link>
            <Link href="/siswa/kelas">
              <Button className="w-full" size="sm" variant="outline">Lihat Kelas</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[#111827]">Nilai Terbaru</p>
          <div className="mt-3 space-y-3">
            {data.nilaiTerbaru.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Belum ada nilai yang tersedia.</p>
            ) : (
              data.nilaiTerbaru.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{item.judul}</p>
                    <p className="text-xs text-[#64748B]">{item.mapel}</p>
                  </div>
                  <Badge tone={item.nilai !== null && item.nilai >= 75 ? "green" : item.nilai !== null ? "amber" : "gray"}>
                    {item.nilai !== null ? `${item.nilai}` : "-"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[#111827]">Asesmen Terbaru</p>
          <div className="mt-3 space-y-3">
            {data.asesmenTerbaru.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Belum ada asesmen.</p>
            ) : (
              data.asesmenTerbaru.map((item) => (
                <Link key={item.id} href={`/siswa/asesmen/${item.id}`} className="block rounded-xl border border-[#E2E8F0] p-3 transition hover:bg-[#F8FAFC]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{item.judul}</p>
                      <p className="text-xs text-[#64748B]">{item.mapel?.nama ?? "Umum"}</p>
                    </div>
                    <Badge tone={item.statusSubmission === "SUDAH" ? "green" : item.statusSubmission === "SEDANG" ? "amber" : "red"}>
                      {item.statusSubmission === "SUDAH" ? "Selesai" : item.statusSubmission === "SEDANG" ? "Sedang" : "Belum"}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[#111827]">Tugas Terbaru</p>
          <div className="mt-3 space-y-3">
            {data.tugasTerbaru.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Belum ada tugas.</p>
            ) : (
              data.tugasTerbaru.map((item) => (
                <Link key={item.id} href="/siswa/tugas" className="block rounded-xl border border-[#E2E8F0] p-3 transition hover:bg-[#F8FAFC]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{item.judul}</p>
                      <p className="text-xs text-[#64748B]">{item.mapel?.nama ?? "Umum"}</p>
                    </div>
                    <Badge tone={item.statusSubmission === "SUDAH" ? "green" : "red"}>
                      {item.statusSubmission === "SUDAH" ? "Sudah" : "Belum"}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[#111827]">Tugas yang Belum Dikumpulkan</p>
          <div className="mt-3 space-y-3">
            {data.tugasBelumDikumpulkan.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Semua tugas sudah dikumpulkan.</p>
            ) : (
              data.tugasBelumDikumpulkan.map((item) => (
                <Link key={item.id} href="/siswa/tugas" className="block rounded-xl border border-[#E2E8F0] p-3 transition hover:bg-[#F8FAFC]">
                  <p className="text-sm font-semibold text-[#111827]">{item.judul}</p>
                  <p className="text-xs text-[#64748B]">{item.mapel?.nama ?? "Umum"}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[#111827]">Asesmen yang Sedang Dikerjakan</p>
          <div className="mt-3 space-y-3">
            {data.asesmenSedangDikerjakan.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Tidak ada asesmen yang sedang dikerjakan.</p>
            ) : (
              data.asesmenSedangDikerjakan.map((item) => (
                <Link key={item.id} href={`/siswa/asesmen/${item.id}`} className="block rounded-xl border border-[#E2E8F0] p-3 transition hover:bg-[#F8FAFC]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{item.judul}</p>
                      <p className="text-xs text-[#64748B]">{item.mapel?.nama ?? "Umum"}</p>
                    </div>
                    <Badge tone="amber">Sedang</Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
