// app/siswa/tugas/page.tsx
"use client";

import { useEffect, useState } from "react";
import TugasCard, { TugasData } from "@/components/TugasCard";
import RolePageHero from "@/components/shared/RolePageHero";
import { useLanguage } from "@/lib/i18n";

export default function SiswaTugasPage() {
  const { t } = useLanguage();
  const [tugasList, setTugasList] = useState<TugasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string } | null>(null);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.data)).catch(() => {});
    loadTugas();
  }, []);

  async function loadTugas() {
    setLoading(true);
    try {
      const res = await fetch("/api/tugas");
      const data = await res.json();
      setTugasList(data.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("Memuat...")}</p>;

  const todayStr = new Date().toDateString();
  const hariIni = tugasList.filter((t) => new Date(t.createdAt).toDateString() === todayStr);
  const sudahDikerjakan = tugasList.filter((t) => t.statusSubmission === "SUDAH");
  const belumDikerjakan = tugasList.filter((t) => t.statusSubmission !== "SUDAH");

  return (
    <div>
      <RolePageHero
        eyebrow={t("Tugas kelas")}
        title={t("Kelola tugas belajarmu")}
        description={t("Lihat tugas dari guru, kerjakan, lalu pantau yang sudah kamu kumpulkan.")}
        summary={{ label: t("Belum dikumpulkan"), value: belumDikerjakan.length, description: t("Tugas yang menunggu jawabanmu") }}
      />
      {tugasList.length === 0 ? (
        <p className="mt-6 rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-5 text-sm text-muted-foreground">{t("Belum ada tugas yang diberikan di kelasmu.")}</p>
      ) : (
        <>
          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-foreground">{t("Hari Ini")}</p>
            {hariIni.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Tidak ada tugas baru hari ini.")}</p>
            ) : (
              <div className="space-y-3">
                {hariIni.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="SISWA" onSubmissionChanged={loadTugas} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm font-bold text-foreground">{t("Belum Dikerjakan")}</p>
            {belumDikerjakan.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Semua tugas sudah dikerjakan. Mantap!")}</p>
            ) : (
              <div className="space-y-3">
                {belumDikerjakan.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="SISWA" onSubmissionChanged={loadTugas} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm font-bold text-foreground">{t("Sudah Dikerjakan")}</p>
            {sudahDikerjakan.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("Belum ada tugas yang kamu kumpulkan.")}</p>
            ) : (
              <div className="space-y-3">
                {sudahDikerjakan.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="SISWA" onSubmissionChanged={loadTugas} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
