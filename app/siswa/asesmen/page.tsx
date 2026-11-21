// app/siswa/asesmen/page.tsx
"use client";

import { useEffect, useState } from "react";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import { showConfirm } from "@/lib/dialog";
import { useLanguage } from "@/lib/i18n";

export default function SiswaAsesmenPage() {
  const { t } = useLanguage();
  const [asesmenList, setAsesmenList] = useState<(AsesmenData & { statusSubmission?: "BELUM" | "SEDANG" | "SUDAH" })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    "hari-ini": true,
    "tiga-bulan": true,
    history: true,
  });

  useEffect(() => {
    fetch("/api/asesmen")
      .then((res) => res.json())
      .then((data) => setAsesmenList(data.data ?? []))
      .catch(() => setAsesmenList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        const userId = data.data?.id;
        if (!userId) return;
        const stored = window.localStorage.getItem(`classify:siswa:removed-asesmen:${userId}`);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setDismissedIds(parsed.filter((id): id is string => typeof id === "string"));
      })
      .catch(() => {});
  }, []);

  async function removeHistory(asesmen: AsesmenData) {
    const confirmed = await showConfirm(t('Hapus kartu "{judul}" dari riwayat? Jawaban, nilai, dan submission tetap aman.').replace("{judul}", asesmen.judul));
    if (!confirmed) return;

    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        const userId = data.data?.id;
        if (!userId) return;
        setDismissedIds((current) => {
          const next = current.includes(asesmen.id) ? current : [...current, asesmen.id];
          window.localStorage.setItem(`classify:siswa:removed-asesmen:${userId}`, JSON.stringify(next));
          return next;
        });
      })
      .catch(() => {});
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("Memuat...")}</p>;

  const visibleAsesmenList = asesmenList.filter((asesmen) => !dismissedIds.includes(asesmen.id));
  const sekarang = new Date();
  const awalPeriodeSekarang = new Date(sekarang);
  awalPeriodeSekarang.setMonth(awalPeriodeSekarang.getMonth() - 3);
  const awalPeriodeSebelumnya = new Date(sekarang);
  awalPeriodeSebelumnya.setMonth(awalPeriodeSebelumnya.getMonth() - 6);
  const tanggalAsesmen = (asesmen: AsesmenData) => new Date(asesmen.createdAt ?? asesmen.updatedAt);
  const asesmenHariIni = visibleAsesmenList.filter((asesmen) => tanggalAsesmen(asesmen) >= awalPeriodeSekarang);
  const asesmenTigaBulan = visibleAsesmenList.filter((asesmen) => {
    const tanggal = tanggalAsesmen(asesmen);
    return tanggal >= awalPeriodeSebelumnya && tanggal < awalPeriodeSekarang;
  });
  const historyAsesmen = visibleAsesmenList.filter((asesmen) => tanggalAsesmen(asesmen) < awalPeriodeSebelumnya);

  const kelompok = [
    { key: "hari-ini", judul: t("Asesmen Hari Ini"), data: asesmenHariIni },
    { key: "tiga-bulan", judul: t("3 Bulan Terakhir"), data: asesmenTigaBulan },
    { key: "history", judul: t("Riwayat Asesmen"), data: historyAsesmen },
  ];

  function renderAsesmenCards(data: typeof asesmenList) {
    const kelompokTipe = [
      { judul: t("Kuis"), data: data.filter((asesmen) => asesmen.tipe === "KUIS") },
      { judul: t("Ujian Online"), data: data.filter((asesmen) => asesmen.tipe === "UJIAN") },
    ];
    return (
      <div className="space-y-5">
        {kelompokTipe.map((group) => group.data.length > 0 && (
          <div key={group.judul}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{group.judul}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.data.map((asesmen) => (
                <AsesmenCard key={asesmen.id} data={asesmen} basePath="/siswa/asesmen" submissionStatus={asesmen.statusSubmission} onRemove={removeHistory} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {visibleAsesmenList.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("Belum ada asesmen yang ditampilkan. Data asesmen yang sudah kamu hapus dari tampilan tetap tersimpan.")}</p>
      ) : (
        <div className="space-y-5">
          {kelompok.map((group) => group.data.length > 0 && (
            <section key={group.key} className="rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setVisibleGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <span className="text-sm font-bold text-foreground">{group.judul}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" className={`h-4 w-4 transition-transform ${visibleGroups[group.key] ? "rotate-180" : ""}`}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {visibleGroups[group.key] && <div className="mt-5">{renderAsesmenCards(group.data)}</div>}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}