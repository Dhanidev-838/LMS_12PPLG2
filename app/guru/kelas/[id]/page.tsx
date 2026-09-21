"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PengumumanCard, { PengumumanData } from "@/components/PengumumanCard";
import TugasCard, { TugasData } from "@/components/TugasCard";
import ModalPengumuman from "@/components/ModalPengumuman";
import ModalBuatAsesmen from "@/components/Modalbuatasesmen";
import ModalEditAsesmen from "@/components/ModalEditAsesmen";
import ModalTugas from "@/components/ModalTugas";
import ModalKirimTugas from "@/components/ModalKirimTugas";
import ModalKirimAsesmen from "@/components/ModalKirimAsesmen";
import ModalKirimPengumuman from "@/components/ModalKirimPengumuman";
import type { AsesmenData } from "@/components/Asesmencard";
import { showAlert, showConfirm } from "@/lib/dialog";

const BRAND = "#6B85F6";

interface SiswaDiKelas {
  siswaId: string;
  siswa: { id: string; nama: string; nis: string | null; fotoProfil: string | null; kelasReferensi: { label: string } | null };
}
interface GuruDiKelas {
  id: string;
  guru: { id: string; nama: string; nik: string | null; fotoProfil: string | null };
  mapel: { id: string; nama: string };
}
interface FeedItem {
  tipe: "PENGUMUMAN" | "ASESMEN" | "TUGAS";
  timestamp: string;
  data: any;
}
interface KelasDetail {
  id: string;
  judul: string;
  deskripsi: string | null;
  inviteToken: string;
  siswa: SiswaDiKelas[];
  guruMapel: GuruDiKelas[];
  feed: FeedItem[];
}

export default function GuruKelasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id as string;

  const [kelas, setKelas] = useState<KelasDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [error, setError] = useState("");

  const [section, setSection] = useState<"SISWA" | "GURU" | null>(null);
  const [expandedRombel, setExpandedRombel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [showModalPengumuman, setShowModalPengumuman] = useState(false);
  const [editingPengumuman, setEditingPengumuman] = useState<PengumumanData | null>(null);
  const [showModalAsesmen, setShowModalAsesmen] = useState(false);
  const [asesmenFixedTipe, setAsesmenFixedTipe] = useState<"KUIS" | "UJIAN">("KUIS");
  const [editingAsesmen, setEditingAsesmen] = useState<AsesmenData | null>(null);
  const [showModalTugas, setShowModalTugas] = useState(false);
  const [editingTugas, setEditingTugas] = useState<TugasData | null>(null);
  const [sendingTugas, setSendingTugas] = useState<TugasData | null>(null);
  const [sendingAsesmen, setSendingAsesmen] = useState<AsesmenData | null>(null);
  const [sendingPengumuman, setSendingPengumuman] = useState<PengumumanData | null>(null);
  const [openAsesmenOptionsId, setOpenAsesmenOptionsId] = useState<string | null>(null);

  useEffect(() => {
    if (!openAsesmenOptionsId) return;
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-options-menu]")) setOpenAsesmenOptionsId(null);
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [openAsesmenOptionsId]);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadKelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId]);

  async function loadKelas() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/kelas/${kelasId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat kelas.");
        setLoading(false);
        return;
      }
      setKelas(data.data);
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyInvite() {
    if (!kelas) return;
    navigator.clipboard.writeText(`${window.location.origin}/join/${kelas.inviteToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function openBuatQuiz() {
    setAsesmenFixedTipe("KUIS");
    setShowModalAsesmen(true);
  }
  function openBuatUjian() {
    setAsesmenFixedTipe("UJIAN");
    setShowModalAsesmen(true);
  }
  function handleAsesmenSuccess(asesmenId: string) {
    router.push(`/guru/asesmen/${asesmenId}`);
  }
  async function handleDeleteAsesmen(id: string) {
    if (!(await showConfirm("Hapus asesmen ini? Data soal dan pengumpulan juga akan dihapus."))) return;
    const res = await fetch(`/api/asesmen/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      await showAlert(data?.error ?? "Asesmen gagal dihapus.");
      return;
    }
    loadKelas();
  }

  function openBuatTugas() {
    setEditingTugas(null);
    setShowModalTugas(true);
  }
  function openEditTugas(tugas: TugasData) {
    setEditingTugas(tugas);
    setShowModalTugas(true);
  }
  async function handleDeleteTugas(id: string) {
    if (!(await showConfirm("Hapus tugas ini?"))) return;
    await fetch(`/api/tugas/${id}`, { method: "DELETE" });
    loadKelas();
  }

  function handleEditPengumuman(data: PengumumanData) {
    setEditingPengumuman(data);
  }
  async function handleDeletePengumuman(id: string) {
    if (!(await showConfirm("Hapus pengumuman ini?"))) return;
    await fetch(`/api/pengumuman/${id}`, { method: "DELETE" });
    loadKelas();
  }

  if (loading) return <p className="text-sm text-[#9CA3AF]">Memuat...</p>;

  if (error || !kelas) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-[#9CA3AF]">{error || "Kelas tidak ditemukan."}</p>
        <Button variant="outline" onClick={() => router.push("/guru")}>
          Kembali
        </Button>
      </div>
    );
  }

  const siswaGrouped = kelas.siswa.reduce((acc: Record<string, SiswaDiKelas[]>, ks) => {
    const label = ks.siswa.kelasReferensi?.label ?? "Belum Ada Kelas";
    if (!acc[label]) acc[label] = [];
    acc[label].push(ks);
    return acc;
  }, {});

  const guruGrouped = kelas.guruMapel.reduce((acc: Record<string, GuruDiKelas[]>, gm) => {
    const label = gm.mapel.nama;
    if (!acc[label]) acc[label] = [];
    acc[label].push(gm);
    return acc;
  }, {});

  return (
    <div>
      <div className="overflow-hidden rounded-2xl text-white shadow-sm" style={{ background: BRAND }}>
        <div className="flex flex-wrap items-start justify-between gap-3 p-5">
          <div>
            <p className="text-lg font-bold">{kelas.judul}</p>
            {kelas.deskripsi && <p className="mt-1 text-sm text-white/85">&quot;{kelas.deskripsi}&quot;</p>}
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/80">Kode Kelas</p>
            <p className="text-sm font-bold">{kelas.inviteToken}</p>
            <button onClick={handleCopyInvite} className="mt-1 flex items-center gap-1 text-[11px] font-medium text-white/90 hover:underline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
              {copied ? "Tersalin!" : "Salin Link Undangan"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant={section === "SISWA" ? "primary" : "outline"} onClick={() => setSection(section === "SISWA" ? null : "SISWA")}>
          Lihat Deretan Siswa
        </Button>
        <Button variant={section === "GURU" ? "primary" : "outline"} onClick={() => setSection(section === "GURU" ? null : "GURU")}>
          Lihat Deretan Guru
        </Button>
      </div>

      {section === "SISWA" && (
        <div className="mt-4 space-y-3">
          {Object.keys(siswaGrouped).length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">Belum ada siswa di kelas ini.</p>
          ) : (
            Object.entries(siswaGrouped).map(([label, list]) => {
              const isOpen = expandedRombel === label;
              return (
                <div key={label} className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
                  <button onClick={() => setExpandedRombel(isOpen ? null : label)} className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#111827]">{label}</p>
                      <Badge tone="brand">{list.length} Siswa</Badge>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-black/5 p-4">
                      {list.map((ks) => (
                        <button
                          key={ks.siswaId}
                          type="button"
                          onClick={() => router.push(`/profil/${ks.siswa.id}`)}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-black/5 p-3 text-left transition-colors hover:border-[#C7D2FE] hover:bg-[#F8FAFF]"
                        >
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                            {ks.siswa.fotoProfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={ks.siswa.fotoProfil} alt={ks.siswa.nama} className="h-full w-full object-cover" />
                            ) : (
                              ks.siswa.nama.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#111827]">{ks.siswa.nama}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {section === "GURU" && (
        <div className="mt-4">
          {Object.keys(guruGrouped).length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">Belum ada guru lain di kelas ini.</p>
          ) : (
            Object.entries(guruGrouped).map(([mapel, list]) => (
              <div key={mapel} className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">{mapel}</p>
                <div className="space-y-2">
                  {list.map((gm) => (
                    <div key={gm.id} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                        {gm.guru.fotoProfil ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={gm.guru.fotoProfil} alt={gm.guru.nama} className="h-full w-full object-cover" />
                        ) : (
                          gm.guru.nama.charAt(0)
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#111827]">{gm.guru.nama}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === null && (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setShowModalPengumuman(true)}>
              + Buat Pengumuman
            </Button>
            <Button size="sm" variant="outline" onClick={openBuatQuiz}>
              + Buat Quiz
            </Button>
            <Button size="sm" variant="outline" onClick={openBuatUjian}>
              + Buat Ujian Online
            </Button>
            <Button size="sm" variant="outline" onClick={openBuatTugas}>
              + Tugas
            </Button>
          </div>

          <div className="mt-4 space-y-3">
        {kelas.feed.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">Belum ada aktivitas di kelas ini.</p>
        ) : (
          kelas.feed.map((item, i) => {
            if (item.tipe === "PENGUMUMAN") {
              return (
                <PengumumanCard
                  key={`p-${i}`}
                  data={item.data}
                  currentUserId={me?.id ?? ""}
                  onEdit={handleEditPengumuman}
                  onDelete={handleDeletePengumuman}
                  onSend={setSendingPengumuman}
                />
              );
            }
            if (item.tipe === "TUGAS") {
              return (
                <TugasCard
                  key={`t-${i}`}
                  data={item.data}
                  currentUserId={me?.id ?? ""}
                  role="GURU"
                  onEdit={openEditTugas}
                  onDelete={handleDeleteTugas}
                  onSend={setSendingTugas}
                />
              );
            }
            const a = item.data;
            return (
              <div
                key={`a-${i}`}
                onClick={() => router.push(`/guru/asesmen/${a.id}`)}
                className="block w-full cursor-pointer rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{a.tipe === "KUIS" ? "Kuis" : "Ujian Online"}</Badge>
                    {a.mapel && <Badge tone="gray">{a.mapel.nama}</Badge>}
                  </div>
                  {me?.id === a.guru?.id && (
                    <div className="relative" data-options-menu>
                      <button
                        type="button"
                        aria-label="Opsi asesmen"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenAsesmenOptionsId((value) => value === a.id ? null : a.id);
                        }}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-lg font-bold text-[#64748B] hover:bg-[#F1F5F9]"
                      >
                        ⋯
                      </button>
                      {openAsesmenOptionsId === a.id && (
                        <div onClick={(event) => event.stopPropagation()} className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-1 text-left shadow-lg">
                          {a.status === "PROSES" && (
                            <button type="button" onClick={() => { setOpenAsesmenOptionsId(null); setEditingAsesmen(a as AsesmenData); }} className="block w-full cursor-pointer px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]">
                              Edit
                            </button>
                          )}
                          {a.status === "SELESAI" && (
                            <button type="button" onClick={() => { setOpenAsesmenOptionsId(null); setSendingAsesmen(a); }} className="block w-full cursor-pointer px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]">
                              Kirim ke
                            </button>
                          )}
                          <button type="button" onClick={() => { setOpenAsesmenOptionsId(null); void handleDeleteAsesmen(a.id); }} className="block w-full cursor-pointer px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50">
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm font-bold text-[#111827]">{a.judul}</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {a._count?.soal ?? 0} soal · oleh {a.guru?.nama}
                </p>
              </div>
            );
          })
        )}
          </div>
        </>
      )}

      <ModalPengumuman
        open={showModalPengumuman || !!editingPengumuman}
        onClose={() => {
          setShowModalPengumuman(false);
          setEditingPengumuman(null);
        }}
        onSuccess={loadKelas}
        mode={editingPengumuman ? "edit" : "create"}
        initialData={editingPengumuman}
        kelasId={kelasId}
      />

      <ModalBuatAsesmen
        open={showModalAsesmen}
        onClose={() => setShowModalAsesmen(false)}
        onSuccess={handleAsesmenSuccess}
        defaultKelasId={kelasId}
        fixedTipe={asesmenFixedTipe}
      />

      <ModalTugas
        open={showModalTugas}
        onClose={() => setShowModalTugas(false)}
        onSuccess={loadKelas}
        mode={editingTugas ? "edit" : "create"}
        initialData={editingTugas as any}
        defaultKelasId={kelasId}
      />
      <ModalEditAsesmen
        open={!!editingAsesmen}
        onClose={() => setEditingAsesmen(null)}
        onSuccess={loadKelas}
        initialData={editingAsesmen ? { ...editingAsesmen, mapelId: editingAsesmen.mapelId ?? editingAsesmen.mapel?.id ?? null } : null}
      />
      <ModalKirimTugas
        open={!!sendingTugas}
        tugasId={sendingTugas?.id ?? null}
        onClose={() => setSendingTugas(null)}
        onSuccess={() => {
          setSendingTugas(null);
          loadKelas();
        }}
      />
      <ModalKirimAsesmen
        open={!!sendingAsesmen}
        asesmenId={sendingAsesmen?.id ?? null}
        onClose={() => setSendingAsesmen(null)}
        onSuccess={() => {
          setSendingAsesmen(null);
          loadKelas();
        }}
      />
      <ModalKirimPengumuman
        open={!!sendingPengumuman}
        pengumumanId={sendingPengumuman?.id ?? null}
        onClose={() => setSendingPengumuman(null)}
        onSuccess={() => {
          setSendingPengumuman(null);
          loadKelas();
        }}
      />
    </div>
  );
}