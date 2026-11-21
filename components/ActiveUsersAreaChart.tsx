import { useLanguage } from "@/lib/i18n";

type ActivityDay = { tanggal: string; userAktif: number };

export default function ActiveUsersAreaChart({ items }: { items: ActivityDay[] }) {
  const { t } = useLanguage();
  if (!items.length) return <p className="mt-4 text-sm text-muted-foreground">{t("Data login belum tersedia.")}</p>;

  const width = 640;
  const height = 230;
  const left = 32;
  const right = 12;
  const top = 18;
  const bottom = 32;
  const chartHeight = height - top - bottom;
  const maximum = Math.max(1, ...items.map((item) => item.userAktif));
  const step = Math.max(1, Math.ceil(maximum / 4));
  const scale = step * 4;
  const x = (index: number) => left + index * (width - left - right) / Math.max(1, items.length - 1);
  const y = (value: number) => top + chartHeight * (1 - value / scale);
  const line = items.map((item, index) => `${index ? "L" : "M"}${x(index)} ${y(item.userAktif)}`).join(" ");
  const area = `${line} L${x(items.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`;

  return (
    <div className="mt-4 w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[500px]" role="img" aria-label={t("Jumlah pengguna aktif per hari dalam 14 hari terakhir")}>
        {[0, 1, 2, 3, 4].map((index) => {
          const value = index * step;
          return <g key={value}>
            <line x1={left} x2={width - right} y1={y(value)} y2={y(value)} stroke="var(--border)" strokeWidth="1" />
            <text x={left - 7} y={y(value) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{value}</text>
          </g>;
        })}
        <path d={area} fill="var(--accent)" fillOpacity="0.14" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {items.map((item, index) => <g key={item.tanggal}>
          <circle cx={x(index)} cy={y(item.userAktif)} r="3" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2"><title>{`${item.tanggal}: ${item.userAktif} ${t("pengguna aktif")}`}</title></circle>
          {(index === 0 || index === items.length - 1 || index % 3 === 0) && <text x={x(index)} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{item.tanggal.slice(5)}</text>}
        </g>)}
      </svg>
    </div>
  );
}
