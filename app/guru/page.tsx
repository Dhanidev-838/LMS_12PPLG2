"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { useLanguage } from "@/lib/i18n";

interface GuruDashboardData {
  statistik: { totalKelas: number; totalSiswa: number; totalAsesmen: number; totalTugas: number; totalMateri: number; submissionDinilai: number; essayBelumDinilai: number; tugasDikumpulkan: number };
  kelas: { id: string; judul: string; _count: { siswa: number } }[];
  asesmenTerbaru: { id: string; judul: string; tipe: "KUIS" | "UJIAN"; status: "PROSES" | "SELESAI"; updatedAt: string }[];
  tugasTerbaru: { id: string; judul: string; createdAt: string; _count: { submission: number } }[];
}

const panel = "rounded-[var(--radius-card)] border border-border bg-surface";

export default function GuruDashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<GuruDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/guru/dashboard")
      .then((res) => res.json())
      .then((result) => setData(result.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">{t("Memuat dashboard...")}</p>;
  if (!data) return <p className="text-sm text-danger">{t("Dashboard guru gagal dimuat.")}</p>;

  const stats = [
    { label: "Kelas diampu", value: data.statistik.totalKelas, detail: "Kelas yang kamu ajar", href: "/guru/kelas" },
    { label: "Siswa", value: data.statistik.totalSiswa, detail: "Di seluruh kelasmu", href: "/guru/kelas" },
    { label: "Asesmen", value: data.statistik.totalAsesmen, detail: "Kuis dan ujian", href: "/guru/asesmen" },
    { label: "Tugas", value: data.statistik.totalTugas, detail: "Tugas yang dibuat", href: "/guru/tugas" },
    { label: "Materi", value: data.statistik.totalMateri, detail: "Materi yang dibuat", href: "/guru/materi" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className={`${panel} grid overflow-hidden lg:grid-cols-[1.4fr_.6fr]`}>
        <div className="p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-accent-text">{t("Ruang mengajar")}</p>
          <h1 className="mt-3 text-2xl font-bold tracking-[-.045em] text-foreground sm:text-3xl">{t("Dashboard Guru")}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{t("Pantau kelas, asesmen, tugas, dan pekerjaan penilaian dari satu tempat.")}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/guru/asesmen" className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover">{t("Buat asesmen")}</Link>
            <Link href="/guru/tugas" className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted">{t("Buat tugas")}</Link>
          </div>
        </div>
        <div className="border-t border-border bg-surface-muted p-5 sm:p-7 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">{t("Perlu ditangani")}</p>
          <p className="mt-3 text-4xl font-bold tracking-[-.06em] text-foreground">{data.statistik.essayBelumDinilai}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("Essay belum dinilai")}</p>
          <Link href="/guru/asesmen" className="mt-5 inline-flex min-h-9 items-center text-sm font-semibold text-accent-text hover:underline">{t("Buka asesmen")} →</Link>
        </div>
      </section>

      <section aria-label={t("Ringkasan mengajar")} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className={`${panel} group min-w-0 p-4 transition-colors hover:border-accent hover:bg-surface-muted`}>
            <div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-[.08em] text-muted-foreground">{t(stat.label)}</p><span className="text-accent-text" aria-hidden="true">↗</span></div>
            <p className="mt-4 text-3xl font-bold tracking-[-.055em] text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(stat.detail)}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-3 lg:grid-cols-[1.25fr_.75fr]">
        <section className={panel}>
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div><h2 className="text-sm font-bold text-foreground">{t("Kelas yang diampu")}</h2><p className="mt-1 text-xs text-muted-foreground">{t("Jumlah siswa di setiap kelas.")}</p></div>
            <Link href="/guru/kelas" className="shrink-0 text-xs font-semibold text-accent-text hover:underline">{t("Lihat semua")}</Link>
          </div>
          {data.kelas.length === 0 ? <p className="p-5 text-sm text-muted-foreground">{t("Belum ada kelas yang diampu.")}</p> : (
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {data.kelas.map((kelas) => <Link key={kelas.id} href={`/guru/kelas/${kelas.id}`} className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent hover:bg-surface-muted"><p className="line-clamp-2 text-sm font-semibold text-foreground">{kelas.judul}</p><p className="mt-2 text-xs text-muted-foreground">{kelas._count.siswa} {t("siswa")}</p></Link>)}
            </div>
          )}
        </section>
        <section className={panel}>
          <div className="border-b border-border px-5 py-4"><h2 className="text-sm font-bold text-foreground">{t("Aktivitas penilaian")}</h2><p className="mt-1 text-xs text-muted-foreground">{t("Ringkasan pekerjaan yang masuk.")}</p></div>
          <div className="divide-y divide-border">
            <Link href="/guru/asesmen" className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-surface-muted"><span className="text-sm text-foreground">{t("Submission dinilai")}</span><strong className="text-lg tabular-nums text-foreground">{data.statistik.submissionDinilai}</strong></Link>
            <Link href="/guru/tugas" className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-surface-muted"><span className="text-sm text-foreground">{t("Tugas dikumpulkan")}</span><strong className="text-lg tabular-nums text-foreground">{data.statistik.tugasDikumpulkan}</strong></Link>
          </div>
          <div className="border-t border-border px-5 py-4"><Link href="/guru/kelas" className="text-xs font-semibold text-accent-text hover:underline">{t("Lihat ruang kelas")} →</Link></div>
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className={panel}>
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="text-sm font-bold text-foreground">{t("Asesmen terbaru")}</h2><Link href="/guru/asesmen" className="text-xs font-semibold text-accent-text hover:underline">{t("Lihat semua")}</Link></div>
          <div className="divide-y divide-border">{data.asesmenTerbaru.length === 0 ? <p className="p-5 text-sm text-muted-foreground">{t("Belum ada asesmen.")}</p> : data.asesmenTerbaru.map((asesmen) => <Link key={asesmen.id} href={`/guru/asesmen/${asesmen.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{asesmen.judul}</span><span className="text-xs text-muted-foreground">{t(asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online")}</span></span><Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>{t(asesmen.status === "SELESAI" ? "Selesai" : "Proses")}</Badge></Link>)}</div>
        </section>
        <section className={panel}>
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="text-sm font-bold text-foreground">{t("Tugas terbaru")}</h2><Link href="/guru/tugas" className="text-xs font-semibold text-accent-text hover:underline">{t("Lihat semua")}</Link></div>
          <div className="divide-y divide-border">{data.tugasTerbaru.length === 0 ? <p className="p-5 text-sm text-muted-foreground">{t("Belum ada tugas.")}</p> : data.tugasTerbaru.map((tugas) => <Link key={tugas.id} href="/guru/tugas" className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted"><span className="min-w-0 truncate text-sm font-semibold text-foreground">{tugas.judul}</span><span className="shrink-0 text-xs text-muted-foreground">{tugas._count.submission} {t("terkumpul")}</span></Link>)}</div>
        </section>
      </div>
    </div>
  );
}
