"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MobileDashboardSummary, { MobileDashboardSummaryItem } from "@/components/MobileDashboardSummary";

interface GuruDashboardData {
  statistik: { totalKelas: number; totalSiswa: number; totalAsesmen: number; totalTugas: number; totalMateri: number; submissionDinilai: number; essayBelumDinilai: number; tugasDikumpulkan: number };
  kelas: { id: string; judul: string; _count: { siswa: number } }[];
  asesmenTerbaru: { id: string; judul: string; tipe: "KUIS" | "UJIAN"; status: "PROSES" | "SELESAI"; updatedAt: string }[];
  tugasTerbaru: { id: string; judul: string; createdAt: string; _count: { submission: number } }[];
}

export default function GuruDashboardPage() {
  const [data, setData] = useState<GuruDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/guru/dashboard")
      .then((res) => res.json())
      .then((result) => setData(result.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[#9CA3AF]">Memuat dashboard...</p>;
  if (!data) return <p className="text-sm text-red-500">Dashboard guru gagal dimuat.</p>;

  const statistik: MobileDashboardSummaryItem[] = [
    { label: "Kelas Diampu", value: data.statistik.totalKelas, caption: "Kelas yang kamu ajar" },
    { label: "Total Siswa", value: data.statistik.totalSiswa, caption: "Siswa di kelasmu" },
    { label: "Asesmen", value: data.statistik.totalAsesmen, caption: "Kuis dan ujian" },
    { label: "Tugas", value: data.statistik.totalTugas, caption: "Tugas yang dibuat" },
    { label: "Materi", value: data.statistik.totalMateri, caption: "Materi yang dibuat" },
  ];

  return (
    <div className="space-y-6">
      <div className="border border-[#dfe4ef] p-6 text-white" style={{ background: "#6B85F6" }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Dashboard Guru</p>
        <h1 className="mt-2 text-2xl font-bold">Selamat Datang di Ruang Mengajar</h1>
        <p className="mt-2 text-sm text-white/85">Pantau kelas, asesmen, tugas, dan pekerjaan penilaianmu dari satu tempat.</p>
      </div>

      <MobileDashboardSummary items={statistik} />
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {statistik.map((item) => <div key={item.label} className="border border-[#e1e5ed] bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{item.label}</p><p className="mt-2 text-3xl font-bold text-[#182033]">{item.value}</p><p className="mt-1 text-xs text-[#64748B]">{item.caption}</p></div>)}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="border border-[#e1e5ed] bg-white p-5"><p className="text-sm font-bold text-[#182033]">Perlu Ditangani</p><div className="mt-4 space-y-3"><div className="flex items-center justify-between rounded-xl bg-[#FFF7ED] px-4 py-3"><span className="text-sm text-[#7C2D12]">Essay belum dinilai</span><strong className="text-lg text-[#C2410C]">{data.statistik.essayBelumDinilai}</strong></div><div className="flex items-center justify-between rounded-xl bg-[#EFF6FF] px-4 py-3"><span className="text-sm text-[#1E3A8A]">Tugas sudah dikumpulkan</span><strong className="text-lg text-[#2563EB]">{data.statistik.tugasDikumpulkan}</strong></div></div></div>
        <div className="border border-[#e1e5ed] bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm font-bold text-[#182033]">Aksi Cepat</p></div><div className="mt-4 grid grid-cols-2 gap-3"><Link href="/guru/asesmen"><Button className="w-full" size="sm">Buat Asesmen</Button></Link><Link href="/guru/tugas"><Button className="w-full" size="sm" variant="outline">Buat Tugas</Button></Link><Link href="/guru/kelas"><Button className="w-full" size="sm" variant="outline">Lihat Kelas</Button></Link><Link href="/guru/asesmen"><Button className="w-full" size="sm" variant="outline">Nilai Asesmen</Button></Link></div></div>
      </div>

      <div className="border border-[#e1e5ed] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-[#182033]">Kelas yang Diampu</p><p className="mt-1 text-xs text-[#64748B]">Ringkasan jumlah siswa per kelas.</p></div><Link href="/guru/kelas" className="text-xs font-semibold text-[#6B85F6] hover:underline">Lihat semua</Link></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.kelas.length === 0 ? <p className="text-sm text-[#94A3B8]">Belum ada kelas yang diampu.</p> : data.kelas.map((kelas) => <Link key={kelas.id} href={`/guru/kelas/${kelas.id}`} className="border border-[#e1e5ed] p-4 transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]"><p className="font-semibold text-[#182033]">{kelas.judul}</p><p className="mt-1 text-xs text-[#64748B]">{kelas._count.siswa} siswa</p></Link>)}</div></div>

      <div className="grid gap-5 lg:grid-cols-2"><div className="border border-[#e1e5ed] bg-white p-5"><p className="text-sm font-bold text-[#182033]">Asesmen Terbaru</p><div className="mt-3 divide-y divide-[#edf0f5]">{data.asesmenTerbaru.length === 0 ? <p className="py-3 text-sm text-[#94A3B8]">Belum ada asesmen.</p> : data.asesmenTerbaru.map((asesmen) => <Link key={asesmen.id} href={`/guru/asesmen/${asesmen.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-[#6B85F6]/10"><span className="min-w-0 truncate text-sm font-semibold text-[#182033]">{asesmen.judul}</span><Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>{asesmen.tipe === "KUIS" ? "Kuis" : "Ujian"}</Badge></Link>)}</div></div><div className="border border-[#e1e5ed] bg-white p-5"><p className="text-sm font-bold text-[#182033]">Tugas Terbaru</p><div className="mt-3 divide-y divide-[#edf0f5]">{data.tugasTerbaru.length === 0 ? <p className="py-3 text-sm text-[#94A3B8]">Belum ada tugas.</p> : data.tugasTerbaru.map((tugas) => <Link key={tugas.id} href="/guru/tugas" className="flex items-center justify-between gap-3 py-3 hover:bg-[#6B85F6]/10"><span className="min-w-0 truncate text-sm font-semibold text-[#182033]">{tugas.judul}</span><span className="text-xs text-[#64748B]">{tugas._count.submission} terkumpul</span></Link>)}</div></div></div>
    </div>
  );
}