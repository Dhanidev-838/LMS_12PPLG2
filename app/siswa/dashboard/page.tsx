"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MateriCard, { MateriData } from "@/components/MateriCard";
import MobileDashboardSummary, { MobileDashboardSummaryItem } from "@/components/MobileDashboardSummary";
import RolePageHero from "@/components/shared/RolePageHero";
import TranslateContent from "@/components/TranslateContent";
import { intlLocaleCodes, useLanguage } from "@/lib/i18n";

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
    totalMateri: number;
    tugasSudah: number;
    tugasBelum: number;
    rataRataNilai: number | null;
    rataRataNilaiKelas: number | null;
    statusNilaiKelas: "Di bawah rata-rata kelas" | "Di atas rata-rata kelas" | "Sejajar rata-rata kelas" | null;
  };
  pengumumanTerbaru: Array<{
    id: string;
    isi: string;
    createdAt: string;
    kelasJudul: string;
    authorNama: string;
    isToday: boolean;
    lampiranCount: number;
  }>;
  materiTerbaru: MateriData[];
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

function StatCard({ label, value, helper, featured = false }: { label: string; value: string; helper: string; featured?: boolean }) {
  return (
    <div className={`rounded-[var(--radius-card)] border p-5 ${featured ? "border-accent bg-accent-subtle" : "border-border bg-surface"}`}>
      <p className="text-xs font-semibold uppercase tracking-[.08em] text-muted-foreground">{label}</p>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

export default function SiswaDashboardPage() {
  const { t, locale } = useLanguage();
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
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-12 animate-pulse border border-border bg-surface sm:hidden" />
        <div className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-[var(--radius-card)] border border-border bg-surface p-5" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="text-lg font-bold">{t("Gagal memuat dashboard")}</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border border-dashed border-border bg-surface p-6 text-center">
        <p className="text-lg font-semibold text-foreground">{t("Belum ada data")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("Belum ada aktivitas kelas, tugas, atau asesmen untuk akun Anda.")}</p>
      </div>
    );
  }

  const today = new Date().toDateString();
  const materiHariIni = data.materiTerbaru.filter((materi) => new Date(materi.createdAt).toDateString() === today).slice(0, 4);
  const rataRataCaption = data.statistik.rataRataNilai !== null && data.statistik.rataRataNilaiKelas !== null
    ? `${t(data.statistik.statusNilaiKelas ?? "Sejajar rata-rata kelas")} (${data.statistik.rataRataNilaiKelas})`
    : t("Pembanding kelas belum tersedia");
  const statistik: MobileDashboardSummaryItem[] = [
    { label: "Total Kelas", value: data.statistik.totalKelas, caption: "Kelas yang diikuti" },
    { label: "Total Asesmen", value: data.statistik.totalAsesmen, caption: "Kuis dan ujian" },
    { label: "Asesmen Selesai", value: data.statistik.asesmenSudah, caption: "Sudah dikerjakan" },
    { label: "Asesmen Sedang", value: data.statistik.asesmenSedang, caption: "Dikerjakan saat ini" },
    { label: "Asesmen Belum", value: data.statistik.asesmenBelum, caption: "Belum dikerjakan" },
    { label: "Total Tugas", value: data.statistik.totalTugas, caption: "Tugas yang tersedia" },
    { label: "Total Materi", value: data.statistik.totalMateri, caption: "Materi dari kelas yang diikuti" },
    { label: "Tugas Sudah", value: data.statistik.tugasSudah, caption: "Sudah dikumpulkan" },
    { label: "Tugas Belum", value: data.statistik.tugasBelum, caption: "Belum dikumpulkan" },
    { label: "Rata-rata Nilai", value: data.statistik.rataRataNilai ?? "-", caption: rataRataCaption },
  ];

  return (
    <div className="student-dashboard space-y-6">
      <RolePageHero
        eyebrow={t("Ruang belajar siswa")}
        title={`${t("Selamat datang")}, ${data.siswa.nama}`}
        description={data.siswa.kelasJurusan}
        summary={{ label: t("Perlu perhatian"), value: data.statistik.asesmenBelum + data.statistik.tugasBelum, description: t("Asesmen dan tugas yang belum selesai") }}
      >
        <Link href="/siswa/asesmen" className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent-hover">{t("Lihat asesmen")}</Link>
        <Link href="/siswa/tugas" className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-muted">{t("Lihat tugas")}</Link>
      </RolePageHero>

      <MobileDashboardSummary items={statistik.map((item) => ({ ...item, label: t(item.label), caption: item.caption ? t(item.caption) : undefined }))} />
      <div className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("Total Kelas")} value={String(data.statistik.totalKelas)} helper={t("Kelas yang diikuti")} />
        <StatCard label={t("Asesmen Belum")} value={String(data.statistik.asesmenBelum)} helper={t("Belum dikerjakan")} featured />
        <StatCard label={t("Tugas Belum")} value={String(data.statistik.tugasBelum)} helper={t("Belum dikumpulkan")} featured />
        <StatCard label={t("Rata-rata Nilai")} value={String(data.statistik.rataRataNilai ?? "-")} helper={t(rataRataCaption)} />
        <StatCard label={t("Total Asesmen")} value={String(data.statistik.totalAsesmen)} helper={t("Kuis dan ujian")} />
        <StatCard label={t("Asesmen Selesai")} value={String(data.statistik.asesmenSudah)} helper={t("Sudah dikerjakan")} />
        <StatCard label={t("Asesmen Sedang")} value={String(data.statistik.asesmenSedang)} helper={t("Dikerjakan saat ini")} />
        <StatCard label={t("Total Tugas")} value={String(data.statistik.totalTugas)} helper={t("Tugas yang tersedia")} />
        <StatCard label={t("Total Materi")} value={String(data.statistik.totalMateri)} helper={t("Materi dari kelas yang diikuti")} />
        <StatCard label={t("Tugas Sudah")} value={String(data.statistik.tugasSudah)} helper={t("Sudah dikumpulkan")} />
      </div>

      <div className="student-card hidden rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:block">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-foreground">{t("Rata-rata Nilai Asesmen")}</p>
          <Badge tone={data.statistik.rataRataNilai !== null ? "green" : "gray"}>
            {data.statistik.rataRataNilai !== null ? `${data.statistik.rataRataNilai}` : t("Belum ada nilai")}
          </Badge>
        </div>
        {data.statistik.rataRataNilai !== null && data.statistik.rataRataNilaiKelas !== null ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {data.statistik.statusNilaiKelas === "Di bawah rata-rata kelas"
              ? `${t("Nilai Anda masih di bawah rata-rata kelas.")} (${data.statistik.rataRataNilaiKelas}).`
              : data.statistik.statusNilaiKelas === "Di atas rata-rata kelas"
                ? `${t("Nilai Anda di atas rata-rata kelas.")} (${data.statistik.rataRataNilaiKelas}).`
                : `${t("Nilai Anda sejajar dengan rata-rata kelas.")} (${data.statistik.rataRataNilaiKelas}).`}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{t("Belum ada pembanding rata-rata kelas untuk saat ini.")}</p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="student-card rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">{t("Aksi Cepat")}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href="/siswa/asesmen">
              <Button className="w-full" size="sm">{t("Kerjakan Asesmen")}</Button>
            </Link>
            <Link href="/siswa/tugas">
              <Button className="w-full" size="sm" variant="outline">{t("Lihat tugas")}</Button>
            </Link>
            <Link href="/siswa/kelas">
              <Button className="w-full" size="sm" variant="outline">{t("Lihat kelas")}</Button>
            </Link>
          </div>
        </div>

        <div className="student-card rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="text-sm font-bold text-foreground">{t("Nilai Terbaru")}</p>
          <div className="mt-3 space-y-3">
            {data.nilaiTerbaru.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Belum ada nilai yang tersedia.")}</p>
            ) : (
              data.nilaiTerbaru.map((item) => (
                <div key={item.id} className="student-list-row flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2">
                  <div>
                    <TranslateContent text={item.judul} className="block" textClassName="text-sm font-semibold text-foreground" />
                    <TranslateContent text={item.mapel} className="block" textClassName="text-xs text-muted-foreground" />
                  </div>
                  <Badge tone={item.nilai !== null && item.nilai >= 75 ? "green" : item.nilai !== null ? "amber" : "gray"}>
                    {item.nilai !== null ? `${item.nilai}` : "-"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="student-card lg:col-span-2 rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-foreground">{t("Pengumuman Kelas")}</p>
            <Badge tone="gray">{t("7 hari terakhir")}</Badge>
          </div>
          <div className="mt-3 space-y-3">
            {data.pengumumanTerbaru.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Belum ada pengumuman aktif dalam 7 hari terakhir.")}</p>
            ) : (
              data.pengumumanTerbaru.map((item) => (
                <div key={item.id} className="student-announce-item rounded-[var(--radius-card)] border border-border bg-surface-muted p-3">
                  <div className="flex items-center justify-between gap-2">
                    <TranslateContent text={item.kelasJudul} className="block" textClassName="text-xs font-semibold uppercase tracking-wide text-[#6B85F6]" />
                    {item.isToday ? (
                      <Badge tone="brand">{t("Hari ini")}</Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString(intlLocaleCodes[locale], { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                  <TranslateContent text={item.isi} className="mt-2 block" textClassName="whitespace-pre-wrap text-sm text-foreground" />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{t("oleh")} {item.authorNama}</span>
                    <span>{item.lampiranCount > 0 ? `${item.lampiranCount} ${t("lampiran")}` : t("tanpa lampiran")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <section className="student-card lg:col-span-2 rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-foreground">{t("Materi Hari Ini")}</p>
            <Link href="/siswa/materi" className="text-xs font-semibold text-[#6B85F6] hover:underline">{t("Lihat semua")}</Link>
          </div>
          {materiHariIni.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("Belum ada materi baru hari ini.")}</p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {materiHariIni.map((materi) => <MateriCard key={materi.id} data={materi} />)}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="text-sm font-bold text-foreground">{t("Asesmen Terbaru")}</p>
          <div className="mt-3 space-y-3">
            {data.asesmenTerbaru.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Belum ada asesmen.")}</p>
            ) : (
              data.asesmenTerbaru.map((item) => (
                <Link key={item.id} href={`/siswa/asesmen/${item.id}`} className="block rounded-[var(--radius-card)] border border-border p-3 transition-colors hover:bg-[#6B85F6]/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <TranslateContent text={item.judul} className="block" textClassName="text-sm font-semibold text-foreground" />
                      {item.mapel?.nama && <TranslateContent text={item.mapel.nama} className="block" textClassName="text-xs text-muted-foreground" />}
                      {!item.mapel?.nama && <p className="text-xs text-muted-foreground">{t("Umum")}</p>}
                    </div>
                    <Badge tone={item.statusSubmission === "SUDAH" ? "green" : item.statusSubmission === "SEDANG" ? "amber" : "red"}>
                      {item.statusSubmission === "SUDAH" ? t("Selesai") : item.statusSubmission === "SEDANG" ? t("Sedang") : t("Belum")}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="text-sm font-bold text-foreground">{t("Tugas Terbaru")}</p>
          <div className="mt-3 space-y-3">
            {data.tugasTerbaru.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Belum ada tugas.")}</p>
            ) : (
              data.tugasTerbaru.map((item) => (
                <Link key={item.id} href="/siswa/tugas" className="block rounded-[var(--radius-card)] border border-border p-3 transition-colors hover:bg-[#6B85F6]/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <TranslateContent text={item.judul} className="block" textClassName="text-sm font-semibold text-foreground" />
                      {item.mapel?.nama && <TranslateContent text={item.mapel.nama} className="block" textClassName="text-xs text-muted-foreground" />}
                      {!item.mapel?.nama && <p className="text-xs text-muted-foreground">{t("Umum")}</p>}
                    </div>
                    <Badge tone={item.statusSubmission === "SUDAH" ? "green" : "red"}>
                      {item.statusSubmission === "SUDAH" ? t("Sudah") : t("Belum")}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="text-sm font-bold text-foreground">{t("Tugas yang Belum Dikumpulkan")}</p>
          <div className="mt-3 space-y-3">
            {data.tugasBelumDikumpulkan.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Semua tugas sudah dikumpulkan.")}</p>
            ) : (
              data.tugasBelumDikumpulkan.map((item) => (
                <Link key={item.id} href="/siswa/tugas" className="block rounded-[var(--radius-card)] border border-border p-3 transition-colors hover:bg-[#6B85F6]/10">
                  <TranslateContent text={item.judul} className="block" textClassName="text-sm font-semibold text-foreground" />
                  {item.mapel?.nama && <TranslateContent text={item.mapel.nama} className="block" textClassName="text-xs text-muted-foreground" />}
                  {!item.mapel?.nama && <p className="text-xs text-muted-foreground">{t("Umum")}</p>}
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="text-sm font-bold text-foreground">{t("Asesmen yang Sedang Dikerjakan")}</p>
          <div className="mt-3 space-y-3">
            {data.asesmenSedangDikerjakan.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Tidak ada asesmen yang sedang dikerjakan.")}</p>
            ) : (
              data.asesmenSedangDikerjakan.map((item) => (
                <Link key={item.id} href={`/siswa/asesmen/${item.id}`} className="block rounded-[var(--radius-card)] border border-border p-3 transition-colors hover:bg-[#6B85F6]/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <TranslateContent text={item.judul} className="block" textClassName="text-sm font-semibold text-foreground" />
                      {item.mapel?.nama && <TranslateContent text={item.mapel.nama} className="block" textClassName="text-xs text-muted-foreground" />}
                      {!item.mapel?.nama && <p className="text-xs text-muted-foreground">{t("Umum")}</p>}
                    </div>
                    <Badge tone="amber">{t("Sedang")}</Badge>
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
