"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import RolePageHero from "@/components/shared/RolePageHero";
import { useLanguage } from "@/lib/i18n";

type RangeKey = "semua" | "bulan" | "3bulan" | "tahun";
type AssessmentItem = {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  nilai: number;
  mapel: string;
  tanggal: string;
};
type PerformanceData = {
  summary: {
    rataRataSemua: number | null;
    rataRataKuis: number | null;
    rataRataUjian: number | null;
    asesmenSudah: number;
    asesmenBelum: number;
    asesmenSedang: number;
    tugasSudah: number;
    tugasBelum: number;
    totalMateri: number;
    essaySudahDinilai: number;
    essayBelumDinilai: number;
  };
  perkembanganNilai: AssessmentItem[];
  perbandinganTipe: Array<{ label: string; nilai: number | null }>;
  progressTugas: { sudah: number; belum: number };
  nilaiPerMapel: Array<{ mapel: string; nilai: number | null }>;
  nilaiTerbaru: AssessmentItem[];
  nilaiTertinggi: AssessmentItem[];
  asesmenBelumDikerjakan: Array<{ id: string; judul: string; tipe: "KUIS" | "UJIAN"; mapel: string }>;
  tugasBelumDikumpulkan: Array<{ id: string; judul: string; mapel: string }>;
};

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "semua", label: "Semua" },
  { key: "bulan", label: "Bulan Ini" },
  { key: "3bulan", label: "3 Bulan Terakhir" },
  { key: "tahun", label: "Tahun Ini" },
];

function assessmentTypeLabel(type: "KUIS" | "UJIAN", t: (key: string) => string) {
  return type === "KUIS" ? t("Kuis") : t("Ujian Online");
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  const { t } = useLanguage();
  const featured =
    label === "Rata-rata seluruh asesmen" ||
    label === "Asesmen belum dikerjakan" ||
    label === "Tugas belum dikumpulkan";

  return (
    <div
      className={`student-stat-card rounded-[var(--radius-card)] border p-5 ${
        featured ? "border-accent bg-accent-subtle" : "border-border bg-surface"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(label)}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value === null ? "-" : value}</p>
    </div>
  );
}

function LineChart({ items }: { items: AssessmentItem[] }) {
  const { t } = useLanguage();
  if (!items.length) return <p className="text-sm text-muted-foreground">{t("Belum ada nilai untuk menampilkan perkembangan.")}</p>;

  const points = items.map((item, index) => `${index * (100 / Math.max(items.length - 1, 1))},${100 - item.nilai}`).join(" ");

  return (
    <div className="w-full overflow-hidden">
      <div className="w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full overflow-visible">
          <polyline points={points} fill="none" stroke="#6B85F6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {items.map((item, index) => (
            <circle
              key={item.id}
              cx={index * (100 / Math.max(items.length - 1, 1))}
              cy={100 - item.nilai}
              r="2"
              fill="#6B85F6"
              vectorEffect="non-scaling-stroke"
            >
              <title>{`${item.judul}: ${item.nilai}`}</title>
            </circle>
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap justify-between gap-2">
          {items.map((item) => (
            <span key={item.id} className="max-w-16 truncate text-[10px] text-muted-foreground">
              {item.judul}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HorizontalBars({ items }: { items: Array<{ label: string; value: number | null }> }) {
  const { t } = useLanguage();
  const available = items.filter((item): item is { label: string; value: number } => item.value !== null);
  if (!available.length) return <p className="text-sm text-muted-foreground">{t("Belum ada nilai berdasarkan mata pelajaran.")}</p>;

  return (
    <div className="space-y-4">
      {available.map((item) => (
        <div key={item.label} className="min-w-0">
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate">{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="h-2 rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-[#6B85F6]" style={{ width: `${Math.max(item.value, 0)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AssessmentList({ items, empty }: { items: AssessmentItem[]; empty: string }) {
  const { t } = useLanguage();

  return items.length ? (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="student-performance-row flex items-center justify-between gap-3 rounded-[var(--radius-control)] bg-surface-muted p-3"
        >
          <div className="min-w-0">
            <p className="student-performance-title truncate text-sm font-semibold text-foreground">{item.judul}</p>
            <p className="student-performance-subtitle text-xs text-muted-foreground">
              {item.mapel} · {assessmentTypeLabel(item.tipe, t)}
            </p>
          </div>
          <Badge tone={item.nilai >= 75 ? "green" : "amber"}>{item.nilai}</Badge>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">{t(empty)}</p>
  );
}

export default function SiswaPerformaAkademikPage() {
  const { t } = useLanguage();
  const [range, setRange] = useState<RangeKey>("semua");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/siswa/performa?range=${range}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Gagal memuat performa akademik.");
        if (!ignore) setData(payload.data ?? null);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Gagal memuat performa akademik.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [range]);

  const comparisonMax = useMemo(
    () => Math.max(...(data?.perbandinganTipe.map((item) => item.nilai ?? 0) ?? [1]), 1),
    [data],
  );

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-28 animate-pulse bg-surface" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-bold">{t("Gagal memuat performa akademik")}</p>
        <p className="mt-2 text-sm">{t(error)}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border border-dashed border-border bg-surface p-6 text-center">
        <p className="font-semibold">{t("Belum ada data performa akademik.")}</p>
      </div>
    );
  }

  const summary = data.summary;
  const hasActivity =
    data.perkembanganNilai.length > 0 ||
    summary.asesmenBelum > 0 ||
    summary.asesmenSedang > 0 ||
    summary.totalMateri > 0 ||
    data.progressTugas.sudah > 0 ||
    data.progressTugas.belum > 0;

  return (
    <div className="space-y-6">
      <RolePageHero
        eyebrow={t("Performa Akademik")}
        title={t("Perkembangan belajarmu")}
        description={t("Pantau nilai asesmen, tugas, dan materi dalam satu tempat.")}
        summary={{
          label: t("Perlu diselesaikan"),
          value: summary.asesmenBelum + summary.tugasBelum,
          description: t("Asesmen dan tugas yang belum selesai"),
        }}
      >
        {RANGES.map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={range === item.key ? "primary" : "outline"}
            className="!rounded-[var(--radius-control)]"
            onClick={() => setRange(item.key)}
          >
            {t(item.label)}
          </Button>
        ))}
      </RolePageHero>

      {!hasActivity && (
        <div className="border border-dashed border-border bg-surface p-6 text-center">
          <p className="font-semibold text-foreground">{t("Belum ada nilai atau aktivitas akademik.")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Nilai dan grafik akan muncul setelah kamu mengerjakan asesmen atau mengumpulkan tugas.")}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rata-rata seluruh asesmen" value={summary.rataRataSemua} />
        <StatCard label="Rata-rata kuis" value={summary.rataRataKuis} />
        <StatCard label="Rata-rata ujian online" value={summary.rataRataUjian} />
        <StatCard label="Asesmen sudah dikerjakan" value={summary.asesmenSudah} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Asesmen belum dikerjakan" value={summary.asesmenBelum} />
        <StatCard label="Asesmen sedang dikerjakan" value={summary.asesmenSedang} />
        <StatCard label="Tugas sudah dikumpulkan" value={summary.tugasSudah} />
        <StatCard label="Tugas belum dikumpulkan" value={summary.tugasBelum} />
        <StatCard label="Materi dibagikan" value={summary.totalMateri} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Essay sudah dinilai" value={summary.essaySudahDinilai} />
        <StatCard label="Essay belum dinilai" value={summary.essayBelumDinilai} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="text-sm font-bold">{t("Perkembangan Nilai Berdasarkan Asesmen")}</p>
          <div className="mt-5">
            <LineChart items={data.perkembanganNilai} />
          </div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="text-sm font-bold">{t("Perbandingan Nilai Kuis dan Ujian")}</p>
          <div className="mt-5 flex h-48 items-end justify-center gap-10">
            {data.perbandinganTipe.map((item) => (
              <div key={item.label} className="flex h-full w-20 flex-col items-center justify-end gap-2">
                <span className="text-sm font-bold">{item.nilai === null ? "-" : item.nilai}</span>
                <div
                  className="w-12 rounded-t-lg bg-[#A78BFA]"
                  style={{ height: `${item.nilai === null ? 0 : Math.max((item.nilai / comparisonMax) * 80, 5)}%` }}
                />
                <span className="text-xs text-muted-foreground">{t(item.label)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="text-sm font-bold">{t("Progress Tugas")}</p>
          <div className="mt-5 space-y-4">
            {(
              [
                ["Sudah dikumpulkan", data.progressTugas.sudah, "#4ADE80"],
                ["Belum dikumpulkan", data.progressTugas.belum, "#F59E0B"],
              ] as const
            ).map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{t(label)}</span>
                  <strong>{value}</strong>
                </div>
                <div className="h-2 rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${
                        data.progressTugas.sudah + data.progressTugas.belum
                          ? (value / (data.progressTugas.sudah + data.progressTugas.belum)) * 100
                          : 0
                      }%`,
                      background: color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="text-sm font-bold">{t("Nilai Berdasarkan Mata Pelajaran")}</p>
          <div className="mt-5">
            <HorizontalBars items={data.nilaiPerMapel.map((item) => ({ label: item.mapel, value: item.nilai }))} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="mb-4 text-sm font-bold">{t("Nilai Terbaru")}</p>
          <AssessmentList items={data.nilaiTerbaru} empty="Belum ada nilai." />
        </div>
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="mb-4 text-sm font-bold">{t("Asesmen dengan Nilai Tertinggi")}</p>
          <AssessmentList items={data.nilaiTertinggi} empty="Belum ada nilai." />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="mb-4 text-sm font-bold">{t("Asesmen Belum Dikerjakan")}</p>
          {data.asesmenBelumDikerjakan.length ? (
            <div className="space-y-3">
              {data.asesmenBelumDikerjakan.map((item) => (
                <div key={item.id} className="rounded-[var(--radius-control)] bg-warning-subtle p-3">
                  <p className="text-sm font-semibold">{item.judul}</p>
                  <p className="text-xs text-warning">{item.mapel} · {assessmentTypeLabel(item.tipe, t)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("Tidak ada asesmen yang tertunda.")}</p>
          )}
        </div>
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="mb-4 text-sm font-bold">{t("Tugas Belum Dikumpulkan")}</p>
          {data.tugasBelumDikumpulkan.length ? (
            <div className="space-y-3">
              {data.tugasBelumDikumpulkan.map((item) => (
                <div key={item.id} className="rounded-[var(--radius-control)] bg-warning-subtle p-3">
                  <p className="text-sm font-semibold">{item.judul}</p>
                  <p className="text-xs text-warning">{item.mapel}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("Semua tugas sudah dikumpulkan.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
