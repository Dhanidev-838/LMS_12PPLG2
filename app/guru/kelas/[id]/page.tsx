"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PengumumanCard, { PengumumanData } from "@/components/PengumumanCard";
import TugasCard, { TugasData } from "@/components/TugasCard";
import MateriCard from "@/components/MateriCard";
import ModalPengumuman from "@/components/ModalPengumuman";
import ModalBuatAsesmen from "@/components/Modalbuatasesmen";
import ModalEditAsesmen from "@/components/ModalEditAsesmen";
import ModalTugas from "@/components/ModalTugas";
import ModalKirimTugas from "@/components/ModalKirimTugas";
import ModalKirimAsesmen from "@/components/ModalKirimAsesmen";
import ModalKirimPengumuman from "@/components/ModalKirimPengumuman";
import KelasFeedFilter, { KelasFeedFilterValue } from "@/components/KelasFeedFilter";
import type { AsesmenData } from "@/components/Asesmencard";
import { showAlert, showConfirm } from "@/lib/dialog";

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
  tipe: "PENGUMUMAN" | "ASESMEN" | "TUGAS" | "MATERI";
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
  const [feedFilter, setFeedFilter] = useState<KelasFeedFilterValue>("SEMUA");
  const filteredFeed = kelas?.feed.filter((item) => feedFilter === "SEMUA" || item.tipe === feedFilter) ?? [];

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
    <div className="mx-auto w-full max-w-5xl">
      <section className="border border-[#dfe4ef] border-l-4 border-l-[#6B85F6] bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#6B85F6]">Detail Kelas</p>
            <h1 className="mt-1 break-words text-xl font-bold text-[#182033] sm:text-2xl">{kelas.judul}</h1>
            {kelas.deskripsi && <p className="mt-1 whitespace-pre-wrap text-sm text-[#64748B]">{kelas.deskripsi}</p>}
          </div>
          <div className="w-full border-t border-[#edf0f5] pt-3 sm:w-auto sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8290a3]">Kode Kelas</p>
            <p className="mt-1 break-all text-sm font-semibold text-[#182033]">{kelas.inviteToken}</p>
            <button onClick={handleCopyInvite} className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-2 border border-[#dfe4ef] px-3 text-xs font-semibold text-[#435064] hover:bg-[#f7f8fb] sm:w-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
              {copied ? "Tersalin!" : "Salin Link Undangan"}
            </button>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        {(["SISWA", "GURU"] as const).map((type) => {
          const isStudent = type === "SISWA";
          const isActive = section === type;
          const count = isStudent ? kelas.siswa.length : new Set(kelas.guruMapel.map((assignment) => assignment.guru.id)).size;
          return (
            <button key={type} type="button" aria-expanded={isActive} onClick={() => setSection(isActive ? null : type)} className={`flex min-h-[72px] min-w-0 cursor-pointer items-center justify-between gap-2 border px-3 py-3 text-left transition-colors sm:px-4 ${isActive ? "border-[#6B85F6] bg-[#eef1ff]" : "border-[#dfe4ef] bg-white hover:border-[#bdc8f8] hover:bg-[#fafbff]"}`}>
              <span className="min-w-0"><span className="block truncate text-sm font-bold text-[#182033]">{isStudent ? "Siswa" : "Guru"}</span><span className="mt-0.5 block text-xs text-[#8290a3]">Lihat daftar</span></span>
              <span className={`flex h-9 min-w-9 flex-shrink-0 items-center justify-center px-2 text-sm font-bold ${isActive ? "bg-[#6B85F6] text-white" : "bg-[#f1f3f8] text-[#536076]"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {section === "SISWA" && (
        <div className="mt-4 space-y-3">
          {Object.keys(siswaGrouped).length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">Belum ada siswa di kelas ini.</p>
          ) : (
            Object.entries(siswaGrouped).map(([label, list]) => {
              const isOpen = expandedRombel === label;
              return (
                <div key={label} className="border border-[#e1e5ed] bg-white">
                  <button onClick={() => setExpandedRombel(isOpen ? null : label)} className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#182033]">{label}</p>
                      <Badge tone="brand">{list.length} Siswa</Badge>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-[#edf0f5] p-4">
                      {list.map((ks) => (
                        <button
                          key={ks.siswaId}
                          type="button"
                          onClick={() => router.push(`/profil/${ks.siswa.id}`)}
                          className="flex w-full cursor-pointer items-center gap-3 border border-[#edf0f5] p-3 text-left transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]"
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
                            <p className="truncate text-sm font-semibold text-[#182033]">{ks.siswa.nama}</p>
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
                    <div key={gm.id} className="flex items-center gap-3 border border-[#e1e5ed] bg-white p-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-bold text-[#6B7280]">
                        {gm.guru.fotoProfil ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={gm.guru.fotoProfil} alt={gm.guru.nama} className="h-full w-full object-cover" />
                        ) : (
                          gm.guru.nama.charAt(0)
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#182033]">{gm.guru.nama}</p>
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
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button size="sm" className="w-full sm:w-auto" onClick={() => setShowModalPengumuman(true)}>
              + Buat Konten
            </Button>
            <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={openBuatQuiz}>
              + Buat Quiz
            </Button>
            <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={openBuatUjian}>
              + Buat Ujian Online
            </Button>
            <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={openBuatTugas}>
              + Tugas
            </Button>
          </div>

          <div className="mt-6 space-y-3 border-t border-[#e1e5ed] pt-5">
        <div><h2 className="text-base font-bold text-[#182033]">Aktivitas Kelas</h2><p className="mt-1 text-xs text-[#8290a3]">Pengumuman, materi, tugas, dan asesmen di kelas ini.</p></div>
        <KelasFeedFilter value={feedFilter} onChange={setFeedFilter} />
        {filteredFeed.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">{kelas.feed.length === 0 ? "Belum ada aktivitas di kelas ini." : "Tidak ada konten untuk filter ini."}</p>
        ) : (
          filteredFeed.map((item, i) => {
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
            if (item.tipe === "MATERI") {
              return <MateriCard key={`m-${i}`} data={item.data} />;
            }
            const a = item.data;
            return (
              <div
                key={`a-${i}`}
                onClick={() => router.push(`/guru/asesmen/${a.id}`)}
                className="block w-full cursor-pointer border border-[#e1e5ed] bg-white p-4 text-left transition-colors hover:border-[#bdc8f8] hover:bg-[#fafbff]"
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
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-lg font-bold text-[#748096] hover:bg-[#6B85F6]/10"
                      >
                        ⋯
                      </button>
                      {openAsesmenOptionsId === a.id && (
                        <div onClick={(event) => event.stopPropagation()} className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-lg border border-[#dfe4ef] bg-white py-1 text-left shadow-md">
                          {a.status === "PROSES" && (
                            <button type="button" onClick={() => { setOpenAsesmenOptionsId(null); setEditingAsesmen(a as AsesmenData); }} className="block w-full cursor-pointer px-3 py-2 text-xs font-medium text-[#435064] hover:bg-[#6B85F6]/10">
                              Edit
                            </button>
                          )}
                          {a.status === "SELESAI" && (
                            <button type="button" onClick={() => { setOpenAsesmenOptionsId(null); setSendingAsesmen(a); }} className="block w-full cursor-pointer px-3 py-2 text-xs font-medium text-[#435064] hover:bg-[#6B85F6]/10">
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
                <p className="mt-2 text-sm font-bold text-[#182033]">{a.judul}</p>
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