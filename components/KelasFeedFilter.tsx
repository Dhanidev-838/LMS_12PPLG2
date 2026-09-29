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
    <div className="grid grid-cols-2 gap-1 border border-[#dfe4ef] bg-white p-1 sm:grid-cols-5" role="group" aria-label="Filter aktivitas kelas">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          aria-pressed={value === filter.value}
          onClick={() => onChange(filter.value)}
          className="min-h-9 cursor-pointer px-2 py-2 text-xs font-semibold transition-colors sm:text-sm"
          style={value === filter.value
            ? { background: "#6B85F6", color: "#ffffff" }
            : { background: "transparent", color: "#536076" }}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}