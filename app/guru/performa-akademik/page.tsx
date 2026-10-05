"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

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
  return (
    <div className="border border-[#e1e5ed] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#182033]">{value}</p>
      <p className="mt-1 text-xs text-[#64748B]">{helper}</p>
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatPercent(value: number): string {
  return `${Number(value).toFixed(1)}%`;
}

function formatAverage(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

function ChartBar({ label, value }: { label: string; value: number | null }) {
  const height = value === null ? 0 : Math.min(Math.max(value, 0), 100);

  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div
        role="img"
        aria-label={value === null ? `${label}: belum ada nilai` : `${label}: rata-rata nilai ${formatAverage(value)} dari 100`}
        className="flex h-36 w-full items-end justify-center border border-border px-3 pt-3"
      >
        {value !== null && (
          <div
            className="w-14 rounded-t-md bg-accent transition-[height] duration-300"
            style={{ height: `${height}%` }}
            title={`${label}: ${formatAverage(value)} / 100`}
          />
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-sm font-bold tabular-nums text-foreground">
          {value === null ? "Belum ada nilai" : formatAverage(value)}
        </p>
      </div>
    </div>
  );
}

function HorizontalBars({ items, suffix = "" }: { items: Array<{ label: string; value: number }>; suffix?: string }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-[#94A3B8]">Belum ada data untuk ditampilkan.</p>
      ) : (
        items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-[#435064]">{item.label}</span>
              <span className="font-semibold text-[#182033]">{item.value}{suffix}</span>
            </div>
            <div className="h-2 w-full overflow-hidden bg-[#eef1f8]">
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

export default function GuruPerformaAkademikPage() {
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
          throw new Error(payload.error ?? "Gagal memuat performa akademik.");
        }

        if (!ignore) {
          setData(payload.data ?? null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat performa akademik.");
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
        <div className="border border-[#e1e5ed] bg-white p-5">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse border border-[#e1e5ed] bg-white p-5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guru-performance-page border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="text-lg font-bold">Gagal memuat data performa akademik</p>
        <p className="mt-2 text-sm">{error}</p>
        <Button className="mt-4" size="sm" onClick={() => setSelectedRange((current) => current)}>
          Coba lagi
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="guru-performance-page border border-dashed border-[#dfe4ef] bg-white p-6 text-center">
        <p className="text-lg font-semibold text-[#182033]">Belum ada data performa</p>
        <p className="mt-2 text-sm text-[#64748B]">Data akan muncul setelah Anda membuat dan mengirim asesmen atau tugas.</p>
      </div>
    );
  }

  return (
    <div className="guru-performance-page space-y-6">
      <div className="border border-[#dfe4ef] p-6 text-white" style={{ background: "#6B85F6" }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Performa Akademik</p>
            <h1 className="mt-2 text-2xl font-bold">Ringkasan evaluasi kelas dan tugas</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.key}
                size="sm"
                variant={selectedRange === option.key ? "primary" : "outline"}
                className="!rounded-full"
                onClick={() => setSelectedRange(option.key)}
                style={selectedRange === option.key ? { background: "#5B75E6" } : undefined}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Kuis" value={formatNumber(data.summary.totalKuis)} helper="Kuis yang dibuat" />
        <StatCard label="Total Ujian" value={formatNumber(data.summary.totalUjian)} helper="Ujian online" />
        <StatCard label="Rata-rata Nilai Kuis" value={formatAverage(data.summary.rataRataNilaiKuis)} helper="Nilai kuis" />
        <StatCard label="Rata-rata Nilai Ujian" value={formatAverage(data.summary.rataRataNilaiUjian)} helper="Nilai ujian" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Rata-rata Seluruh Asesmen" value={formatAverage(data.summary.rataRataNilaiSeluruhAsesmen)} helper="Semua nilai asesmen" />
        <StatCard label="Total Tugas Dibuat" value={formatNumber(data.summary.totalTugasDibuat)} helper="Tugas yang dibuat" />
        <StatCard label="Tugas Dikumpulkan" value={formatNumber(data.summary.totalTugasDikumpulkan)} helper="Submission siswa" />
        <StatCard label="Materi Dibuat" value={formatNumber(data.summary.totalMateriDibuat)} helper="Materi yang dibagikan" />
        <StatCard label="Persentase Pengumpulan" value={formatPercent(data.summary.persentasePengumpulanTugas)} helper="Dari tugas yang dibuat" />
      </div>

      {!hasData ? (
        <div className="border border-dashed border-[#dfe4ef] bg-white p-6 text-center">
          <p className="text-lg font-semibold text-[#182033]">Belum ada data pada rentang waktu ini.</p>
          <p className="mt-2 text-sm text-[#64748B]">Buat kuis, ujian, atau tugas untuk melihat performa akdemik di sini.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="border border-border bg-surface-muted p-5 text-foreground">
              <p className="text-sm font-bold">Rata-rata Nilai Kuis dan Ujian</p>
              <p className="mt-1 text-xs text-muted-foreground">Skala nilai 0–100</p>
              <div className="mt-5 flex items-end gap-6">
                <ChartBar label="Kuis" value={data.summary.rataRataNilaiKuis} />
                <ChartBar label="Ujian" value={data.summary.rataRataNilaiUjian} />
              </div>
            </div>

            <div className="border border-[#e1e5ed] bg-white p-5">
              <p className="text-sm font-bold text-[#182033]">Progress Tugas Dibuat vs Dikumpulkan</p>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-[#435064]">
                    <span>Tugas dibuat</span>
                    <strong>{data.summary.totalTugasDibuat}</strong>
                  </div>
                  <div className="h-2 overflow-hidden bg-[#eef1f8]">
                    <div className="h-full bg-[#6B85F6]" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-[#435064]">
                    <span>Tugas dikumpulkan</span>
                    <strong>{data.summary.totalTugasDikumpulkan}</strong>
                  </div>
                  <div className="h-2 overflow-hidden bg-[#eef1f8]">
                    <div
                      className="h-full bg-[#4ADE80]"
                      style={{ width: `${data.summary.totalTugasDibuat > 0 ? (data.summary.totalTugasDikumpulkan / data.summary.totalTugasDibuat) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Badge tone="green">Pengumpulan: {formatPercent(data.summary.persentasePengumpulanTugas)}</Badge>
                  <Badge tone="amber">Essay belum dinilai: {data.summary.essayBelumDinilai}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="border border-[#e1e5ed] bg-white p-5">
              <p className="text-sm font-bold text-[#182033]">Rata-rata Nilai per Kelas</p>
              <div className="mt-5">
                <HorizontalBars items={classChart} suffix="" />
              </div>
            </div>

            <div className="border border-[#e1e5ed] bg-white p-5">
              <p className="text-sm font-bold text-[#182033]">Rata-rata Nilai per Mata Pelajaran</p>
              <div className="mt-5">
                <HorizontalBars items={mapelChart} suffix="" />
              </div>
            </div>
          </div>

          <div className="border border-[#e1e5ed] bg-white p-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="min-w-0 text-sm font-bold text-[#182033]">Siswa dengan tugas atau essay belum dinilai</p>
              <Badge tone="amber" className="shrink-0 whitespace-nowrap">
                {data.summary.siswaBelumDinilai.length} siswa
              </Badge>
            </div>

            {data.summary.siswaBelumDinilai.length === 0 ? (
              <div className="mt-4 border border-dashed border-[#dfe4ef] bg-[#f7f8fd] p-4 text-sm text-[#64748B]">
                Tidak ada siswa dengan tugas atau essay yang menunggu penilaian.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {data.summary.siswaBelumDinilai.map((student) => (
                  <div key={student.id} className="border border-[#edf0f5] bg-[#f7f8fd] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-[#182033]">{student.nama}</p>
                        <p className="text-xs text-[#64748B]">{student.kelas}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {student.items.map((item, index) => (
                          <Badge key={`${student.id}-${index}`} tone={item.type === "ESSAY" ? "amber" : "brand"}>
                            {item.type === "ESSAY" ? "Essay" : "Tugas"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-[#435064]">
                      {student.items.map((item, index) => (
                        <li key={`${student.id}-${index}`} className="flex flex-wrap items-center justify-between gap-3 border border-[#edf0f5] bg-white px-3 py-2">
                          <span>{item.label}</span>
                          <span className="text-xs text-[#64748B]">
                            {item.type === "TUGAS" && item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("id-ID") : "Essay menunggu review"}
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