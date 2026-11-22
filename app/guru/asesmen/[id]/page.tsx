"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ModalBuatSoal from "@/components/ModalBuatSoal";
import { showAlert, showConfirm } from "@/lib/dialog";
import { useLanguage } from "@/lib/i18n";
import TranslateContent, { TranslatedChoice } from "@/components/TranslateContent";

interface OpsiJawaban {
  id: string;
  teks: string;
  isBenar: boolean;
  urutan: number;
}
interface Soal {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: OpsiJawaban[];
}
interface AsesmenDetail {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  status: "PROSES" | "SELESAI";
  durasiMenit: number | null;
  mapel: { id: string; nama: string } | null;
  soal: Soal[];
}

export default function GuruAsesmenDetailPage() {
  const router = useRouter();
  const params = useParams();
  const asesmenId = params.id as string;
  const { t } = useLanguage();

  const [asesmen, setAsesmen] = useState<AsesmenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [showLibrary, setShowLibrary] = useState(false);
  const [search, setSearch] = useState("");

  const [showModalSoal, setShowModalSoal] = useState(false);
  const [editingSoal, setEditingSoal] = useState<Soal | null>(null);

  const [editingDurasi, setEditingDurasi] = useState(false);
  const [durasiInput, setDurasiInput] = useState("");

  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    loadAsesmen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId]);

  async function loadAsesmen() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(t(data.error ?? "Gagal memuat asesmen."));
        setLoading(false);
        return;
      }
      setAsesmen(data.data);
      const savedPageCount = Number(window.localStorage.getItem(`asesmen-pages-${asesmenId}`) ?? 0);
      setPageCount(Math.max(data.data.soal.length, Number.isFinite(savedPageCount) ? savedPageCount : 0));
      setDurasiInput(data.data.durasiMenit?.toString() ?? "");
    } catch {
      setError(t("Terjadi kesalahan."));
    } finally {
      setLoading(false);
    }
  }

  const soalTerfilter = asesmen ? asesmen.soal.filter((s) => s.pertanyaan.toLowerCase().includes(search.toLowerCase())) : [];
  const halamanCount = Math.max(pageCount, soalTerfilter.length);
  const currentSoal = soalTerfilter[activeIndex] ?? null;
  const halamanList = Array.from({ length: halamanCount }, (_, i) => soalTerfilter[i] ?? null);
  const filledCount = halamanList.filter(Boolean).length;

  function openBuatSoal() {
    setEditingSoal(currentSoal);
    setShowModalSoal(true);
  }
  function openEditSoal(soal: Soal) {
    setEditingSoal(soal);
    setShowModalSoal(true);
  }
  function handleTambahHalaman() {
    const nextIndex = Math.max(pageCount, asesmen?.soal.length ?? 0);
    const nextPageCount = nextIndex + 1;
    setPageCount(nextPageCount);
    window.localStorage.setItem(`asesmen-pages-${asesmenId}`, String(nextPageCount));
    setActiveIndex(nextIndex);
    setSearch("");
    setShowLibrary(false);
    setEditingSoal(null);
  }
  async function handleHapusHalaman(index: number) {
    if (!(await showConfirm(`${t("Hapus halaman")} ${index + 1}?`))) return;

    const nextPageCount = Math.max(0, halamanCount - 1);
    setPageCount(nextPageCount);
    setActiveIndex(Math.max(0, Math.min(index, nextPageCount - 1)));
    window.localStorage.setItem(`asesmen-pages-${asesmenId}`, String(nextPageCount));
  }
  async function handleDeleteSoal(soalId: string) {
    if (!(await showConfirm(t("Hapus soal ini?")))) return;
    await fetch(`/api/asesmen/${asesmenId}/soal/${soalId}`, { method: "DELETE" });
    loadAsesmen();
  }

  async function handleSaveDurasi() {
    await fetch(`/api/asesmen/${asesmenId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durasiMenit: durasiInput ? Number(durasiInput) : null }),
    });
    setEditingDurasi(false);
    loadAsesmen();
  }

  async function handleToggleKunci(opsiId: string) {
    if (!currentSoal) return;
    let opsiBenarIds: string[];
    if (currentSoal.tipe === "CHECKBOX") {
      const sudahBenar = currentSoal.opsi.find((o) => o.id === opsiId)?.isBenar;
      const currentBenar = currentSoal.opsi.filter((o) => o.isBenar).map((o) => o.id);
      opsiBenarIds = sudahBenar ? currentBenar.filter((id) => id !== opsiId) : [...currentBenar, opsiId];
    } else {
      opsiBenarIds = [opsiId];
    }
    await fetch(`/api/asesmen/${asesmenId}/soal/${currentSoal.id}/kunci`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opsiBenarIds }),
    });
    loadAsesmen();
  }

  async function handleSelesai() {
    if (!asesmen) return;
    if (asesmen.soal.length === 0) {
      await showAlert(t("Tambahkan minimal 1 soal sebelum menyelesaikan asesmen."));
      return;
    }
    if (!(await showConfirm(t("Selesaikan asesmen? Asesmen akan langsung tampil ke siswa di kelas tujuan.")))) return;
    setFinalizing(true);
    try {
      await fetch(`/api/asesmen/${asesmenId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SELESAI" }),
      });
      loadAsesmen();
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("Memuat...")}</p>;
  if (error || !asesmen) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-muted-foreground">{t(error || "Asesmen tidak ditemukan.")}</p>
        <Button variant="outline" onClick={() => router.push("/guru/asesmen")}>
          {t("Kembali")}
        </Button>
      </div>
    );
  }

  const isEditable = asesmen.status === "PROSES";

  function pillClass(active: boolean, soal: Soal | null) {
    if (active) return "bg-accent text-accent-foreground";
    if (soal) return "bg-surface-muted text-foreground";
    return "bg-warning-subtle text-warning";
  }

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <Link href="/guru/asesmen" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-accent-text">
        ← {t("Kembali ke Asesmen")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-5 border border-border border-t-4 border-t-[#6B85F6] bg-white p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            <TranslateContent text={asesmen.judul} textClassName="block" />
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{t(asesmen.tipe === "KUIS" ? "Kuis" : "Ujian Online")}</Badge>
            {asesmen.mapel && <Badge tone="gray"><TranslateContent text={asesmen.mapel.nama} textClassName="inline" /></Badge>}
            <Badge tone={asesmen.status === "SELESAI" ? "green" : "amber"}>{t(asesmen.status === "SELESAI" ? "Selesai" : "Proses")}</Badge>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("Durasi pengerjaan")}</p>
          {editingDurasi ? (
            <div className="mt-1 flex items-center gap-1">
              <input type="number" min={1} value={durasiInput} onChange={(e) => setDurasiInput(e.target.value)} className="w-16 rounded-lg border border-border px-2 py-1 text-sm text-foreground outline-none focus:border-accent" />
              <Button size="sm" onClick={handleSaveDurasi}>{t("Simpan")}</Button>
            </div>
          ) : (
            <button onClick={() => isEditable && setEditingDurasi(true)} disabled={!isEditable} className="mt-1 text-sm font-bold text-foreground disabled:cursor-default">
              {asesmen.durasiMenit ? `${asesmen.durasiMenit} ${t("menit")}` : t("Belum diatur")}
              {isEditable && <span className="ml-1 text-[11px] font-normal text-accent-text">{t("Atur Durasi")}</span>}
            </button>
          )}
        </div>
      </div>

      {/* Baris 1: aksi soal + pencarian */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {isEditable && (
          <Button size="sm" onClick={openBuatSoal}>
            {currentSoal ? t("Edit Soal") : `+ ${t("Buat Soal")}`}
          </Button>
        )}
        <Link
          href={`/guru/asesmen/${asesmenId}/jawaban`}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-accent hover:text-accent-text"
        >
          {t("Jawaban")}
        </Link>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveIndex(0);
          }}
          placeholder={t("Cari soal...")}
          className="min-w-[180px] flex-1 rounded-lg border border-border bg-white px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-[#6B85F6]/10"
        />
      </div>

      {/* Baris 2: strip halaman — scroll ke samping, tap untuk lompat langsung */}
      {halamanCount > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <button
            aria-label={t("Halaman sebelumnya")}
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className="flex-shrink-0 cursor-pointer rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {"<<"}
          </button>

          <div className="min-w-0 flex-1 overflow-x-auto">
            <div className="flex gap-2 pb-1">
              {halamanList.map((soal, i) => (
                <button
                  key={soal?.id ?? `halaman-${i}`}
                  onClick={() => setActiveIndex(i)}
                  className={`flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition-colors ${pillClass(i === activeIndex, soal)}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <button
            aria-label={t("Halaman berikutnya")}
            onClick={() => setActiveIndex((i) => Math.min(halamanCount - 1, i + 1))}
            disabled={activeIndex >= halamanCount - 1}
            className="flex-shrink-0 cursor-pointer rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {">>"}
          </button>

          {isEditable && (
            <button
              onClick={handleTambahHalaman}
              className="flex-shrink-0 cursor-pointer rounded-lg bg-[#6B85F6] px-3 py-2 text-xs font-semibold text-white hover:brightness-95"
            >
              + {t("Tambah Halaman")}
            </button>
          )}
        </div>
      )}

      {/* Card soal — tombol library di pojok kanan atas, buka overlay terpusat */}
      <div className="mt-4 min-h-[300px] rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8">
        {halamanCount > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowLibrary(true)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-[#6B85F6]/10"
              title={t("Buka Library Soal")}
              aria-label={t("Buka Library Soal")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
          </div>
        )}

        {halamanCount === 0 ? (
          <p className="text-sm text-muted-foreground">{t('Belum ada soal. Klik "+ Buat Soal" untuk mulai.')}</p>
        ) : currentSoal ? (
          <div>
            <div className="flex items-start justify-between gap-2">
              <Badge tone="gray">
                {t(currentSoal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : currentSoal.tipe === "CHECKBOX" ? "Checkbox" : "Essay")}
              </Badge>
              {isEditable && (
                <div className="flex gap-2">
                  <button onClick={() => openEditSoal(currentSoal)} className="cursor-pointer text-xs font-medium text-accent-text hover:underline">
                    {t("Edit")}
                  </button>
                  <button onClick={() => handleDeleteSoal(currentSoal.id)} className="cursor-pointer text-xs font-medium text-red-500 hover:underline">
                    {t("Hapus")}
                  </button>
                </div>
              )}
            </div>

            <p className="mt-5 text-base font-semibold leading-relaxed text-foreground">
              {activeIndex + 1}. <TranslateContent text={currentSoal.pertanyaan} />
            </p>

            {currentSoal.gambar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentSoal.gambar} alt={t("Gambar soal")} className="mt-3 max-h-64 rounded-xl object-contain" />
            )}

            {currentSoal.tipe !== "ESSAY" ? (
              <div className="mt-4 space-y-2">
                {currentSoal.opsi.map((o) => (
                  <TranslatedChoice
                    key={o.id}
                    text={o.teks}
                    inputType={currentSoal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"}
                    selected={o.isBenar}
                    disabled={!isEditable}
                    onChange={() => handleToggleKunci(o.id)}
                    labelClassName={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${o.isBenar ? "border-accent bg-[#6B85F6]/5" : "border-border hover:border-[#94A3B8]"}`}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">{t("Soal Essay — dinilai manual setelah siswa mengumpulkan.")}</p>
            )}
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center border border-dashed border-border bg-surface-muted text-center">
            <p className="text-sm font-semibold text-muted-foreground">{t("Halaman {current} masih kosong").replace("{current}", String(activeIndex + 1))}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("Buat soal untuk mengisi halaman ini.")}</p>
            {isEditable && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={openBuatSoal}>
                  + {t("Buat Soal")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleHapusHalaman(activeIndex)}>
                  {t("Hapus Halaman")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t("Kunci jawaban langsung tersimpan saat kamu klik opsi di atas.")}</p>
        {isEditable ? (
          <Button loading={finalizing} onClick={handleSelesai}>
            {t("Selesaikan Asesmen")}
          </Button>
        ) : (
          <Badge tone="green">{t("Sudah dipublikasikan ke kelas")}</Badge>
        )}
      </div>

      {/* Overlay Library Soal — terpusat, seperti di RuangGuru */}
      <Modal open={showLibrary} onClose={() => setShowLibrary(false)} title={t("Soal yang terisi: {answered}/{total}").replace("{answered}", String(filledCount)).replace("{total}", String(halamanCount))} maxWidth="max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-accent-subtle p-3 text-center">
            <p className="text-xs font-semibold text-accent-text">{t("Terisi")}</p>
            <p className="mt-1 text-lg font-bold text-accent-text">{filledCount}/{halamanCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-warning-subtle p-3 text-center">
            <p className="text-xs font-semibold text-warning">{t("Kosong")}</p>
            <p className="mt-1 text-lg font-bold text-warning">{halamanCount - filledCount}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {halamanList.map((soal, i) => (
            <div key={soal?.id ?? `lib-${i}`} className="group relative">
              <button
                onClick={() => {
                  setActiveIndex(i);
                  setShowLibrary(false);
                }}
                className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition-colors ${pillClass(i === activeIndex, soal)}`}
              >
                {i + 1}
              </button>
              {isEditable && !soal && (
                <button
                  type="button"
                  onClick={() => handleHapusHalaman(i)}
                  aria-label={`${t("Hapus halaman")} ${i + 1}`}
                  title={`${t("Hapus halaman")} ${i + 1}`}
                  className="absolute -right-1 -top-1 hidden h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white group-hover:flex"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {isEditable && (
          <Button className="mt-5 w-full" onClick={handleTambahHalaman}>
            + {t("Tambah Halaman")}
          </Button>
        )}
      </Modal>

      <ModalBuatSoal open={showModalSoal} onClose={() => setShowModalSoal(false)} onSuccess={loadAsesmen} asesmenId={asesmenId} mode={editingSoal ? "edit" : "create"} initialData={editingSoal} />
    </div>
  );
}
