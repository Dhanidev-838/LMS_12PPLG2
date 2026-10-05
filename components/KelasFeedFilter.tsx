"use client";

export type KelasFeedFilterValue = "SEMUA" | "PENGUMUMAN" | "MATERI" | "TUGAS" | "ASESMEN";

const FILTERS: { value: KelasFeedFilterValue; label: string }[] = [
  { value: "SEMUA", label: "Semua" },
  { value: "PENGUMUMAN", label: "Pengumuman" },
  { value: "MATERI", label: "Materi" },
  { value: "TUGAS", label: "Tugas" },
  { value: "ASESMEN", label: "Asesmen" },
];

interface KelasFeedFilterProps {
  value: KelasFeedFilterValue;
  onChange: (value: KelasFeedFilterValue) => void;
}

export default function KelasFeedFilter({ value, onChange }: KelasFeedFilterProps) {
  return (
    <div className="grid grid-cols-2 gap-1 border border-border bg-surface p-1 sm:grid-cols-5" role="group" aria-label="Filter aktivitas kelas">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          aria-pressed={value === filter.value}
          onClick={() => onChange(filter.value)}
          className={`min-h-10 cursor-pointer rounded-md px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent last:col-span-2 last:mx-auto last:w-1/2 sm:last:col-span-1 sm:last:mx-0 sm:last:w-auto sm:text-sm ${
            value === filter.value
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}