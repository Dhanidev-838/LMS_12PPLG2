import type { ReactNode } from "react";

type Summary = {
  label: string;
  value: ReactNode;
  description: string;
};

export default function RolePageHero({
  eyebrow,
  title,
  description,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  summary?: Summary;
  children?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface text-foreground">
      <div className={summary ? "grid lg:grid-cols-[minmax(0,1fr)_minmax(220px,28%)]" : ""}>
        <div className="min-w-0 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-accent-text">{eyebrow}</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-[1.8rem]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          {children && <div className="mt-5 flex flex-wrap items-center gap-2">{children}</div>}
        </div>
        {summary && (
          <div className="flex min-w-0 flex-col justify-center border-t border-border bg-surface-muted p-5 sm:p-6 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold text-muted-foreground">{summary.label}</p>
            <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-foreground">{summary.value}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{summary.description}</p>
          </div>
        )}
      </div>
    </section>
  );
}
