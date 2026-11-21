import { useLanguage } from "@/lib/i18n";

type Slice = { label: string; value: number };

function pointAt(angle: number) {
  const radians = (angle - 90) * Math.PI / 180;
  return { x: 50 + 45 * Math.cos(radians), y: 50 + 45 * Math.sin(radians) };
}

function sector(start: number, end: number) {
  const first = pointAt(start);
  const last = pointAt(end);
  return `M 50 50 L ${first.x} ${first.y} A 45 45 0 ${end - start > 180 ? 1 : 0} 1 ${last.x} ${last.y} Z`;
}

export default function TwoSlicePieChart({ first, second }: { first: Slice; second: Slice }) {
  const { t } = useLanguage();
  const firstValue = Math.max(0, first.value);
  const secondValue = Math.max(0, second.value);
  const total = firstValue + secondValue;
  const angle = total === 0 ? 0 : firstValue / total * 360;
  const firstPercent = total === 0 ? 0 : Math.round(firstValue / total * 100);
  const secondPercent = total === 0 ? 0 : 100 - firstPercent;

  return (
    <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
      <svg className="h-32 w-32 shrink-0 sm:h-36 sm:w-36" viewBox="0 0 100 100" role="img" aria-label={`${first.label}: ${firstValue}; ${second.label}: ${secondValue}`}>
        {total === 0 ? <circle cx="50" cy="50" r="45" fill="var(--surface-muted)" /> : (
          <>
            {firstValue > 0 && (secondValue === 0
              ? <circle cx="50" cy="50" r="45" fill="var(--accent)" />
              : <path d={sector(0, angle)} fill="var(--accent)" />)}
            {secondValue > 0 && (firstValue === 0
              ? <circle cx="50" cy="50" r="45" fill="var(--accent-text)" />
              : <path d={sector(angle, 360)} fill="var(--accent-text)" />)}
          </>
        )}
      </svg>
      <div className="w-full min-w-0 space-y-3 text-sm">
        {([{ ...first, value: firstValue, percent: firstPercent, color: "var(--accent)" }, { ...second, value: secondValue, percent: secondPercent, color: "var(--accent-text)" }]).map((slice) => (
          <div key={slice.label} className="flex items-center gap-2.5 text-foreground">
            <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ backgroundColor: slice.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1">{slice.label}</span>
            <strong className="tabular-nums">{slice.value}</strong>
            <span className="w-10 text-right tabular-nums text-muted-foreground">{slice.percent}%</span>
          </div>
        ))}
        {total === 0 && <p className="text-xs text-muted-foreground">{t("Belum ada data.")}</p>}
      </div>
    </div>
  );
}
