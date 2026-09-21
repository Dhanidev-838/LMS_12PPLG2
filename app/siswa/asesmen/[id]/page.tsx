// app/siswa/asesmen/[id]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { showConfirm } from "@/lib/dialog";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

interface OpsiSoal {
  id: string;
  teks: string;
  urutan: number;
}
interface Soal {
  id: string;
  urutan: number;
  tipe: "PILIHAN_GANDA" | "CHECKBOX" | "ESSAY";
  pertanyaan: string;
  gambar: string | null;
  opsi: OpsiSoal[];
}
interface JawabanTersimpan {
  soalId: string;
  opsiIds: string[];
  jawabanEssay: string | null;
  raguRagu: boolean;
}
interface AsesmenDetail {
  id: string;
  judul: string;
  tipe: "KUIS" | "UJIAN";
  durasiMenit: number | null;
  mapel: { nama: string } | null;
  soal: Soal[];
  submissionId: string;
  submissionStatus: "BELUM" | "SUDAH";
  tabSwitchCount: number;
  mulaiPada: string;
  jawabanTersimpan: JawabanTersimpan[];
}
interface JawabanLokal {
  opsiIds: string[];
  jawabanEssay: string;
  raguRagu: boolean;
}

export default function SiswaAsesmenKerjakanPage() {
  const router = useRouter();
  const params = useParams();
  const asesmenId = params.id as string;

  const [asesmen, setAsesmen] = useState<AsesmenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [search, setSearch] = useState("");

  const [jawabanMap, setJawabanMap] = useState<Record<string, JawabanLokal>>({});

  const [sisaDetik, setSisaDetik] = useState(0);
  const [pelanggaranModal, setPelanggaranModal] = useState<{ violationCount: number; jumlahDireset: number } | null>(null);
  const keluarAsesmenRef = useRef(false);
  const mencatatPelanggaranRef = useRef(false);

  const [selesaiLoading, setSelesaiLoading] = useState(false);
  const [sudahSelesai, setSudahSelesai] = useState(false);

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
        setError(data.error ?? "Gagal memuat asesmen.");
        setLoading(false);
        return;
      }
      const detail: AsesmenDetail = data.data;
      setAsesmen(detail);
      setSudahSelesai(detail.submissionStatus === "SUDAH");

      const map: Record<string, JawabanLokal> = {};
      for (const s of detail.soal) {
        const tersimpan = detail.jawabanTersimpan.find((j) => j.soalId === s.id);
        map[s.id] = {
          opsiIds: tersimpan?.opsiIds ?? [],
          jawabanEssay: tersimpan?.jawabanEssay ?? "",
          raguRagu: tersimpan?.raguRagu ?? false,
        };
      }
      setJawabanMap(map);

      if (detail.durasiMenit) {
        const deadline = new Date(detail.mulaiPada).getTime() + detail.durasiMenit * 60000;
        setSisaDetik(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
      }
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  // ---- timer countdown, dihitung ulang tiap detik dari deadline server-truth ----
  useEffect(() => {
    if (!asesmen || sudahSelesai || !asesmen.durasiMenit) return;
    const deadline = new Date(asesmen.mulaiPada).getTime() + asesmen.durasiMenit * 60000;

    const interval = setInterval(() => {
      const sisa = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setSisaDetik(sisa);
      if (sisa <= 0) {
        clearInterval(interval);
        handleSelesai(true);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmen, sudahSelesai]);

  // ---- anti-cheat: catat pelanggaran saat siswa kembali ke asesmen ----
  useEffect(() => {
    if (!asesmen || sudahSelesai) return;

    async function catatPelanggaran() {
      if (mencatatPelanggaranRef.current) return;
      mencatatPelanggaranRef.current = true;
      try {
        const res = await fetch(`/api/asesmen/${asesmenId}/pelanggaran`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) return;

        setPelanggaranModal({
          violationCount: data.violationCount ?? 1,
          jumlahDireset: data.jumlahDireset ?? 0,
        });
        await loadAsesmen();
      } catch {
      } finally {
        mencatatPelanggaranRef.current = false;
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        keluarAsesmenRef.current = true;
      } else if (keluarAsesmenRef.current) {
        keluarAsesmenRef.current = false;
        void catatPelanggaran();
      }
    }

    function handleExitRequest() {
      void catatPelanggaran();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("assessment-exit-request", handleExitRequest);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("assessment-exit-request", handleExitRequest);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmen, sudahSelesai, asesmenId]);

  const soalTerfilter = asesmen ? asesmen.soal.filter((s) => s.pertanyaan.toLowerCase().includes(search.toLowerCase())) : [];
  const currentSoal = soalTerfilter[activeIndex] ?? null;
  const jawabanSaatIni = currentSoal ? jawabanMap[currentSoal.id] : null;
  const isKuis = asesmen?.tipe === "KUIS";

  async function simpanJawaban(soalId: string, patch: Partial<JawabanLokal>) {
    setJawabanMap((prev) => ({ ...prev, [soalId]: { ...prev[soalId], ...patch } }));
    const body: { soalId: string; opsiIds?: string[]; jawabanEssay?: string; raguRagu?: boolean } = { soalId };
    if (patch.opsiIds !== undefined) body.opsiIds = patch.opsiIds;
    if (patch.jawabanEssay !== undefined) body.jawabanEssay = patch.jawabanEssay;
    if (patch.raguRagu !== undefined) body.raguRagu = patch.raguRagu;
    await fetch(`/api/asesmen/${asesmenId}/jawab`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function handlePilihOpsiPG(soalId: string, opsiId: string) {
    simpanJawaban(soalId, { opsiIds: [opsiId] });
    if (isKuis) lanjutKeSoalBerikutnya();
  }
  function handleToggleOpsiCB(soalId: string, opsiId: string) {
    const current = jawabanMap[soalId]?.opsiIds ?? [];
    const next = current.includes(opsiId) ? current.filter((id) => id !== opsiId) : [...current, opsiId];
    simpanJawaban(soalId, { opsiIds: next });
  }
  function handleEssayChange(soalId: string, teks: string) {
    setJawabanMap((prev) => ({ ...prev, [soalId]: { ...prev[soalId], jawabanEssay: teks } }));
  }
  function handleToggleRagu(soalId: string) {
    simpanJawaban(soalId, { raguRagu: !jawabanMap[soalId]?.raguRagu });
  }

  // dipake buat Checkbox & Essay di Kuis (tombol "Lanjut" eksplisit) DAN autosave Essay/Checkbox biasa di Ujian saat pindah soal
  async function handleLanjutManual() {
    if (!currentSoal) return;
    await simpanJawaban(currentSoal.id, {
      opsiIds: jawabanMap[currentSoal.id]?.opsiIds ?? [],
      jawabanEssay: jawabanMap[currentSoal.id]?.jawabanEssay ?? "",
    });
    if (isKuis) lanjutKeSoalBerikutnya();
  }

  function lanjutKeSoalBerikutnya() {
    if (activeIndex >= soalTerfilter.length - 1) {
      handleSelesai(false);
    } else {
      setActiveIndex((i) => i + 1);
    }
  }

  async function handleSelesai(otomatis: boolean) {
    if (sudahSelesai) return;
    if (!otomatis) {
      if (!(await showConfirm("Selesaikan asesmen sekarang? Jawaban yang sudah tersimpan tidak bisa diubah lagi."))) return;
    }
    setSelesaiLoading(true);
    try {
      if (currentSoal && currentSoal.tipe !== "PILIHAN_GANDA") {
        await simpanJawaban(currentSoal.id, {
          opsiIds: jawabanMap[currentSoal.id]?.opsiIds ?? [],
          jawabanEssay: jawabanMap[currentSoal.id]?.jawabanEssay ?? "",
        });
      }
      await fetch(`/api/asesmen/${asesmenId}/selesai`, { method: "POST" });
      setSudahSelesai(true);
    } finally {
      setSelesaiLoading(false);
    }
  }

  function formatTimer(detik: number) {
    const j = Math.floor(detik / 3600);
    const m = Math.floor((detik % 3600) / 60);
    const d = detik % 60;
    return [j, m, d].map((n) => String(n).padStart(2, "0")).join(":");
  }

  if (loading) return <p className="text-sm text-[#9CA3AF]">Memuat...</p>;
  if (error || !asesmen) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-[#9CA3AF]">{error || "Asesmen tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/siswa/asesmen")}>
          Kembali
        </Button>
      </div>
    );
  }

  if (sudahSelesai) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/5 bg-white p-10 text-center shadow-sm">
        <Badge tone="green">Sudah Dikumpulkan</Badge>
        <p className="text-lg font-bold text-[#111827]">{asesmen.judul}</p>
        <p className="text-sm text-[#6B7280]">Jawabanmu sudah tersimpan. Nilai akan diumumkan oleh guru.</p>
        <Button onClick={() => router.push("/siswa/asesmen")}>Kembali ke Asesmen</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold text-[#111827]">{asesmen.judul}</p>
            <Badge tone="amber">Sedang Mengerjakan {isKuis ? "Kuis" : "Ujian Online"}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-[#6B7280]">Mapel - {asesmen.mapel?.nama ?? "-"}</p>
        </div>
        {asesmen.durasiMenit && (
          <div className={`rounded-xl border px-4 py-2 text-right ${sisaDetik <= 300 ? "border-red-300 bg-red-50" : "border-black/5 bg-[#F9FAFB]"}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Sisa Waktu</p>
            <p className={`text-lg font-bold ${sisaDetik <= 300 ? "text-red-600" : "text-[#111827]"}`}>{formatTimer(sisaDetik)}</p>
            {sisaDetik <= 300 && <p className="text-[10px] font-semibold text-red-500">Waktu hampir habis!</p>}
          </div>
        )}
      </div>

      {(
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Cari soal..."
            className="min-w-[140px] flex-1 rounded-lg border border-[#D1D5DB] px-3 py-1.5 text-sm outline-none focus:border-[#6B85F6]"
          />
          <div className="flex items-center gap-1">
            <button onClick={() => setActiveIndex((i) => Math.max(0, i - 1))} disabled={activeIndex === 0} className="cursor-pointer rounded-lg border border-[#D1D5DB] px-2 py-1.5 text-xs font-semibold text-[#374151] disabled:opacity-40">
              {"<<"}
            </button>
            <span className="px-2 text-xs font-semibold text-[#6B7280]">
              {soalTerfilter.length === 0 ? "0/0" : `${activeIndex + 1}/${soalTerfilter.length}`}
            </span>
            <button onClick={() => setActiveIndex((i) => Math.min(soalTerfilter.length - 1, i + 1))} disabled={activeIndex >= soalTerfilter.length - 1} className="cursor-pointer rounded-lg border border-[#D1D5DB] px-2 py-1.5 text-xs font-semibold text-[#374151] disabled:opacity-40">
              {">>"}
            </button>
            <button
              onClick={() => setShowGrid((v) => !v)}
              title={showGrid ? "Tutup daftar soal" : "Buka daftar soal"}
              aria-label={showGrid ? "Tutup daftar soal" : "Buka daftar soal"}
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border text-[#374151] transition-colors ${showGrid ? "border-[#6B85F6] bg-[#EEF2FF] text-[#6B85F6]" : "border-[#D1D5DB] bg-white hover:bg-black/5"}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showGrid && (
        <div className="mt-2 grid grid-cols-6 gap-1.5 rounded-xl border border-black/5 bg-white p-3 shadow-sm sm:grid-cols-10">
          {soalTerfilter.map((s, i) => {
            const dijawab = (jawabanMap[s.id]?.opsiIds.length ?? 0) > 0 || !!jawabanMap[s.id]?.jawabanEssay;
            const ragu = jawabanMap[s.id]?.raguRagu;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveIndex(i);
                  setShowGrid(false);
                }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-xs font-semibold"
                style={
                  i === activeIndex
                    ? { background: "#6B85F6", color: "white" }
                    : ragu
                    ? { background: "#FEF3C7", color: "#92400E" }
                    : dijawab
                    ? { background: "#DCFCE7", color: "#166534" }
                    : { background: "#F3F4F6", color: "#374151" }
                }
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 min-h-[280px] rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        {!currentSoal ? (
          <p className="text-sm text-[#9CA3AF]">Belum ada soal.</p>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-2">
              <Badge tone="gray">
                {currentSoal.tipe === "PILIHAN_GANDA" ? "Pilihan Ganda" : currentSoal.tipe === "CHECKBOX" ? "Checkbox" : "Essay"}
              </Badge>
              {!isKuis && (
                <button
                  onClick={() => handleToggleRagu(currentSoal.id)}
                  className="cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold"
                  style={
                    jawabanSaatIni?.raguRagu
                      ? { background: "#FEF3C7", borderColor: "#FDE68A", color: "#92400E" }
                      : { borderColor: "#D1D5DB", color: "#374151" }
                  }
                >
                  Ragu-ragu
                </button>
              )}
            </div>

            <p className="mt-3 text-sm font-semibold text-[#111827]">
              {activeIndex + 1}. {currentSoal.pertanyaan}
            </p>

            {currentSoal.gambar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentSoal.gambar} alt="Gambar soal" className="mt-3 max-h-64 rounded-xl object-contain" />
            )}

            {currentSoal.tipe === "ESSAY" ? (
              <textarea
                value={jawabanSaatIni?.jawabanEssay ?? ""}
                onChange={(e) => handleEssayChange(currentSoal.id, e.target.value)}
                onBlur={() => !isKuis && simpanJawaban(currentSoal.id, { jawabanEssay: jawabanMap[currentSoal.id]?.jawabanEssay ?? "" })}
                rows={5}
                placeholder="Tulis jawabanmu di sini..."
                className="mt-4 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#6B85F6]"
              />
            ) : (
              <div className="mt-4 space-y-2">
                {currentSoal.opsi.map((o) => {
                  const dipilih = jawabanSaatIni?.opsiIds.includes(o.id) ?? false;
                  return (
                    <label key={o.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm ${dipilih ? "border-[#6B85F6] bg-[#6B85F6]/5" : "border-black/5"}`}>
                      <input
                        type={currentSoal.tipe === "PILIHAN_GANDA" ? "radio" : "checkbox"}
                        checked={dipilih}
                        onChange={() =>
                          currentSoal.tipe === "PILIHAN_GANDA"
                            ? handlePilihOpsiPG(currentSoal.id, o.id)
                            : handleToggleOpsiCB(currentSoal.id, o.id)
                        }
                      />
                      <span className="text-[#374151]">{o.teks}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* tombol Lanjut eksplisit -- cuma di Kuis, cuma buat Checkbox & Essay (PG udah auto-lanjut) */}
            {isKuis && currentSoal.tipe !== "PILIHAN_GANDA" && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleLanjutManual}>Lanjut</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {!isKuis && (
        <div className="mt-4 flex justify-end">
          <Button loading={selesaiLoading} onClick={() => handleSelesai(false)}>
            Selesai Ujian
          </Button>
        </div>
      )}

      {isKuis && (
        <p className="mt-3 text-center text-xs text-[#9CA3AF]">
          Jawab soal untuk otomatis lanjut ke soal berikutnya. Kamu tidak bisa kembali ke soal sebelumnya.
        </p>
      )}

      <Modal
        open={!!pelanggaranModal}
        onClose={() => {}}
        dismissible={false}
        title="Peringatan Asesmen"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[#374151]">
            Kamu keluar dari tab atau halaman asesmen. Klik <strong>Lanjut Asesmen</strong> untuk kembali mengerjakan.
          </p>
          {pelanggaranModal && pelanggaranModal.jumlahDireset > 0 ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Pelanggaran ke-{pelanggaranModal.violationCount}: {pelanggaranModal.jumlahDireset} jawaban pilihan ganda/checkbox direset. Jawaban essay tetap aman.
            </p>
          ) : pelanggaranModal && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              Pelanggaran ke-{pelanggaranModal.violationCount} tercatat. Reset berikutnya terjadi pada pelanggaran ke-{pelanggaranModal.violationCount + (3 - (pelanggaranModal.violationCount % 3 || 3))}. Jawaban essay tetap aman.
            </p>
          )}
          <Button className="w-full" onClick={() => setPelanggaranModal(null)}>
            Lanjut Asesmen
          </Button>
        </div>
      </Modal>
    </div>
  );
}