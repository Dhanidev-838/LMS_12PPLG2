"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n";

type Range = "semua" | "bulan" | "3bulan" | "tahun";
type Data = {
  summary: { rataRataSemua: number | null; rataRataKuis: number | null; rataRataUjian: number | null; asesmenSudah: number; asesmenBelum: number; asesmenSedang: number; tugasSudah: number; tugasBelum: number; totalMateri: number };
  nilaiTerbaru: Array<{ id: string; judul: string; mapel: string; nilai: number }>;
  nilaiPerMapel: Array<{ mapel: string; nilai: number | null }>;
  tugasBelumDikumpulkan: Array<{ id: string; judul: string; mapel: string }>;
};

export default function PerformaSiswaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [range, setRange] = useState<Range>("semua");
  const [name, setName] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [performanceResponse, profileResponse] = await Promise.all([
          fetch(`/api/siswa/performa?siswaId=${encodeURIComponent(id)}&range=${range}`),
          fetch(`/api/profil/${encodeURIComponent(id)}`),
        ]);
        const [performance, profile] = await Promise.all([performanceResponse.json(), profileResponse.json()]);
        if (!performanceResponse.ok) throw new Error(performance.error ?? "Gagal memuat performa akademik.");
        if (cancelled) return;
        setData(performance.data);
        setName(profile.data?.nama ?? "Siswa");
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Gagal memuat performa akademik.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [id, range]);

  const summary = data?.summary;
  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <Link href={`/profil/${id}`} className="text-sm font-semibold text-accent-text hover:underline">← {t("Kembali ke Profil")}</Link>
      <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-wide text-accent-text">{t("Performa Akademik")}</p><h1 className="mt-1 text-2xl font-bold text-foreground">{name || t("Performa Siswa")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("Ringkasan hasil belajar siswa")}</p></div>
        <Button variant="outline" onClick={() => router.back()}>{t("Kembali")}</Button>
      </section>
      <div className="flex flex-wrap gap-2">
        {([["semua", "Semua"], ["bulan", "Bulan Ini"], ["3bulan", "3 Bulan Terakhir"], ["tahun", "Tahun Ini"]] as [Range, string][]).map(([key, label]) => <Button key={key} size="sm" variant={range === key ? "primary" : "outline"} onClick={() => setRange(key)}>{t(label)}</Button>)}
      </div>
      {loading ? <p className="text-sm text-muted-foreground">{t("Memuat...")}</p> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{t(error)}</p> : summary && data ? <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[["Rata-rata seluruh asesmen", summary.rataRataSemua ?? "—"], ["Asesmen sudah dikerjakan", summary.asesmenSudah], ["Tugas sudah dikumpulkan", summary.tugasSudah], ["Materi yang dibuat", summary.totalMateri]].map(([label, value]) => <div key={String(label)} className="rounded-[var(--radius-card)] border border-border bg-surface p-4"><p className="text-xs font-semibold text-muted-foreground">{t(String(label))}</p><p className="mt-2 text-2xl font-bold text-foreground">{value}</p></div>)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5"><h2 className="font-bold text-foreground">{t("Nilai Terbaru")}</h2>{data.nilaiTerbaru.length ? <ul className="mt-3 divide-y divide-border">{data.nilaiTerbaru.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{item.judul}</p><p className="text-xs text-muted-foreground">{item.mapel}</p></div><strong className="text-accent-text">{item.nilai}</strong></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{t("Belum ada nilai untuk menampilkan perkembangan.")}</p>}</section>
          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5"><h2 className="font-bold text-foreground">{t("Rata-rata Nilai per Mata Pelajaran")}</h2>{data.nilaiPerMapel.length ? <ul className="mt-3 divide-y divide-border">{data.nilaiPerMapel.map((item) => <li key={item.mapel} className="flex justify-between gap-3 py-3 text-sm"><span>{item.mapel}</span><strong>{item.nilai ?? "—"}</strong></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{t("Belum ada nilai berdasarkan mata pelajaran.")}</p>}</section>
          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 lg:col-span-2"><h2 className="font-bold text-foreground">{t("Tugas belum dikumpulkan")}</h2>{data.tugasBelumDikumpulkan.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{data.tugasBelumDikumpulkan.map((item) => <li key={item.id} className="rounded-lg bg-surface-muted p-3"><p className="text-sm font-semibold">{item.judul}</p><p className="text-xs text-muted-foreground">{item.mapel}</p></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{t("Tidak ada tugas yang tertunda.")}</p>}</section>
        </div>
      </> : null}
    </main>
  );
}
