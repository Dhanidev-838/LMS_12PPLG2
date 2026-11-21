"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import RolePageHero from "@/components/shared/RolePageHero";
import Link from "next/link";
import { intlLocaleCodes, useLanguage } from "@/lib/i18n";

type RangeKey = "semua" | "minggu" | "bulan" | "3bulan" | "tahun";

type PendingStudentItem = {
  type: "TUGAS" | "ESSAY";
  label: string;
  submittedAt: string | null;
};

type PendingStudent = {
  id: string;
  nama: string;
  kelas: string;
  items: PendingStudentItem[];
};

type PerformanceSummary = {
  totalKuis: number;
  totalUjian: number;
  rataRataNilaiKuis: number | null;
  rataRataNilaiUjian: number | null;
  rataRataNilaiSeluruhAsesmen: number | null;
  totalTugasDibuat: number;
  totalTugasDikumpulkan: number;
  totalMateriDibuat: number;
  persentasePengumpulanTugas: number;
  essayBelumDinilai: number;
  rataRataNilaiPerKelas: Array<{ kelas: string; rataRata: number }>;
  rataRataNilaiPerMapel: Array<{ mapel: string; rataRata: number }>;
  siswaBelumDinilai: PendingStudent[];
};

type PerformanceData = {
  range: RangeKey;
  summary: PerformanceSummary;
};

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: "semua", label: "Semua" },
  { key: "minggu", label: "Minggu ini" },
  { key: "bulan", label: "Bulan ini" },
  { key: "3bulan", label: "3 Bulan Terakhir" },
  { key: "tahun", label: "Tahun ini" },
];

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(label)}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t(helper)}</p>
    </div>
  );
}

function formatNumber(value: number, locale: "id" | "en" | "de" | "ja"): string {
  return new Intl.NumberFormat(intlLocaleCodes[locale]).format(value);
}

function formatPercent(value: number): string {
  return `${Number(value).toFixed(1)}%`;
}

function formatAverage(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

function ChartBar({ label, value }: { label: string; value: number | null }) {
  const { t } = useLanguage();
  const height = value === null ? 0 : Math.min(Math.max(value, 0), 100);

  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div
        role="img"
        aria-label={value === null ? `${t(label)}: ${t("Belum ada nilai")}` : `${t(label)}: ${t("rata-rata nilai")} ${formatAverage(value)} ${t("dari 100")}`}
        className="flex h-36 w-full items-end justify-center border border-border px-3 pt-3"
      >
        {value !== null && (
          <div
            className="w-14 rounded-t-md bg-accent transition-[height] duration-300"
            style={{ height: `${height}%` }}
            title={`${t(label)}: ${formatAverage(value)} / 100`}
          />
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-muted-foreground">{t(label)}</p>
        <p className="text-sm font-bold tabular-nums text-foreground">
          {value === null ? t("Belum ada nilai") : formatAverage(value)}
        </p>
      </div>
    </div>
  );
}

function HorizontalBars({ items, suffix = "" }: { items: Array<{ label: string; value: number }>; suffix?: string }) {
  const { t } = useLanguage();
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("Belum ada data untuk ditampilkan.")}</p>
      ) : (
        items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">{item.value}{suffix}</span>
            </div>
            <div className="h-2 w-full overflow-hidden bg-surface-muted">
              <div
                className="h-full bg-[#6B85F6]"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function SuperAdminPerformaAkademikPage() {
  const { locale, t } = useLanguage();
  const [selectedRange, setSelectedRange] = useState<RangeKey>("semua");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/guru/performa?range=${selectedRange}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(t(payload.error ?? "Gagal memuat performa akademik."));
        }

        if (!ignore) {
          setData(payload.data ?? null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? t(err.message) : t("Gagal memuat performa akademik."));
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
  }, [selectedRange]);

  const classChart = useMemo(
    () =>
      (data?.summary.rataRataNilaiPerKelas ?? []).map((item) => ({
        label: item.kelas,
        value: item.rataRata,
      })),
    [data],
  );

  const mapelChart = useMemo(
    () =>
      (data?.summary.rataRataNilaiPerMapel ?? []).map((item) => ({
        label: item.mapel,
        value: item.rataRata,
      })),
    [data],
  );

  const hasData = Boolean(
    data &&
      (data.summary.totalKuis > 0 ||
        data.summary.totalUjian > 0 ||
        data.summary.totalTugasDibuat > 0 ||
        data.summary.totalTugasDikumpulkan > 0 ||
        data.summary.totalMateriDibuat > 0 ||
          data.summary.totalKuis > 0 ||
          data.summary.totalUjian > 0 ||
        data.summary.rataRataNilaiPerKelas.length > 0 ||
        data.summary.rataRataNilaiPerMapel.length > 0 ||
        data.summary.siswaBelumDinilai.length > 0),
  );

  if (loading) {
    return (
      <div className="guru-performance-page space-y-6">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-[var(--radius-card)] border border-border bg-surface p-5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guru-performance-page border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="text-lg font-bold">{t("Gagal memuat data performa akademik")}</p>
        <p className="mt-2 text-sm">{error}</p>
        <Button className="mt-4" size="sm" onClick={() => setSelectedRange((current) => current)}>
          {t("Coba lagi")}
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="guru-performance-page border border-dashed border-border bg-white p-6 text-center">
        <p className="text-lg font-semibold text-foreground">{t("Belum ada data performa")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("Data akan muncul setelah Anda membuat dan mengirim asesmen atau tugas.")}</p>
      </div>
    );
  }

  return (
    <div className="guru-performance-page space-y-6">
      <Link href="/super-admin?tab=PERFORMA" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-accent-text">
        ← {t("Kembali")}
      </Link>
      <RolePageHero eyebrow={t("Performa Akademik")} title={t("Ringkasan evaluasi kelas dan tugas")} description={t("Pantau nilai asesmen, tugas, dan materi dalam satu tempat.")}>
        {RANGE_OPTIONS.map((option) => (
          <Button
            key={option.key}
            size="sm"
            variant={selectedRange === option.key ? "primary" : "outline"}
            onClick={() => setSelectedRange(option.key)}
          >
            {t(option.label)}
          </Button>
        ))}
      </RolePageHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Kuis" value={formatNumber(data.summary.totalKuis, locale)} helper="Kuis yang dibuat" />
        <StatCard label="Total Ujian" value={formatNumber(data.summary.totalUjian, locale)} helper="Ujian online" />
        <StatCard label="Rata-rata Nilai Kuis" value={formatAverage(data.summary.rataRataNilaiKuis)} helper="Nilai kuis" />
        <StatCard label="Rata-rata Nilai Ujian" value={formatAverage(data.summary.rataRataNilaiUjian)} helper="Nilai ujian" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Rata-rata Seluruh Asesmen" value={formatAverage(data.summary.rataRataNilaiSeluruhAsesmen)} helper="Semua nilai asesmen" />
        <StatCard label="Total Tugas Dibuat" value={formatNumber(data.summary.totalTugasDibuat, locale)} helper="Seluruh sekolah" />
        <StatCard label="Tugas Dikumpulkan" value={formatNumber(data.summary.totalTugasDikumpulkan, locale)} helper="Submission siswa" />
        <StatCard label="Materi Dibuat" value={formatNumber(data.summary.totalMateriDibuat, locale)} helper="Materi yang dibagikan" />
        <StatCard label="Persentase Pengumpulan" value={formatPercent(data.summary.persentasePengumpulanTugas)} helper="Dari tugas yang dibuat" />
      </div>

      {!hasData ? (
        <div className="border border-dashed border-border bg-white p-6 text-center">
          <p className="text-lg font-semibold text-foreground">{t("Belum ada data pada rentang waktu ini.")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("Buat kuis, ujian, atau tugas untuk melihat performa akademik di sini.")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-border bg-surface-muted p-5 text-foreground">
              <p className="text-sm font-bold">{t("Rata-rata Nilai Kuis dan Ujian")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("Skala nilai 0–100")}</p>
              <div className="mt-5 flex items-end gap-6">
                <ChartBar label="Kuis" value={data.summary.rataRataNilaiKuis} />
                <ChartBar label="Ujian" value={data.summary.rataRataNilaiUjian} />
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
              <p className="text-sm font-bold text-foreground">{t("Progress Tugas Dibuat vs Dikumpulkan")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("Seluruh sekolah")}</p>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t("Tugas dibuat")}</span>
                    <strong>{data.summary.totalTugasDibuat}</strong>
                  </div>
                  <div className="h-2 overflow-hidden bg-surface-muted">
                    <div className="h-full bg-[#6B85F6]" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t("Tugas dikumpulkan")}</span>
                    <strong>{data.summary.totalTugasDikumpulkan}</strong>
                  </div>
                  <div className="h-2 overflow-hidden bg-surface-muted">
                    <div
                      className="h-full bg-[#4ADE80]"
                      style={{ width: `${data.summary.totalTugasDibuat > 0 ? (data.summary.totalTugasDikumpulkan / data.summary.totalTugasDibuat) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Badge tone="green">{t("Pengumpulan:")} {formatPercent(data.summary.persentasePengumpulanTugas)}</Badge>
                  <Badge tone="amber">{t("Essay belum dinilai:")} {data.summary.essayBelumDinilai}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
              <p className="text-sm font-bold text-foreground">{t("Rata-rata Nilai per Kelas")}</p>
              <div className="mt-5">
                <HorizontalBars items={classChart} suffix="" />
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
              <p className="text-sm font-bold text-foreground">{t("Rata-rata Nilai per Mata Pelajaran")}</p>
              <div className="mt-5">
                <HorizontalBars items={mapelChart} suffix="" />
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="min-w-0 text-sm font-bold text-foreground">{t("Siswa dengan tugas atau essay belum dinilai")}</p>
              <Badge tone="amber" className="shrink-0 whitespace-nowrap">
                {data.summary.siswaBelumDinilai.length} {t("siswa")}
              </Badge>
            </div>

            {data.summary.siswaBelumDinilai.length === 0 ? (
              <div className="mt-4 border border-dashed border-border bg-surface-muted p-4 text-sm text-muted-foreground">
                {t("Tidak ada siswa dengan tugas atau essay yang menunggu penilaian.")}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {data.summary.siswaBelumDinilai.map((student) => (
                  <div key={student.id} className="rounded-[var(--radius-card)] border border-border bg-surface-muted p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{student.nama}</p>
                        <p className="text-xs text-muted-foreground">{student.kelas}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {student.items.map((item, index) => (
                          <Badge key={`${student.id}-${index}`} tone={item.type === "ESSAY" ? "amber" : "brand"}>
                            {item.type === "ESSAY" ? t("Essay") : t("Tugas")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {student.items.map((item, index) => (
                        <li key={`${student.id}-${index}`} className="flex flex-wrap items-center justify-between gap-3 border border-border bg-white px-3 py-2">
                          <span>{item.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.type === "TUGAS" && item.submittedAt ? new Date(item.submittedAt).toLocaleDateString(intlLocaleCodes[locale]) : t("Essay menunggu review")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
