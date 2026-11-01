// app/super-admin/tugas/page.tsx
"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import TugasCard, { TugasData } from "@/components/TugasCard";
import ModalTugas from "@/components/ModalTugas";
import ModalKirimTugas from "@/components/ModalKirimTugas";
import { showConfirm } from "@/lib/dialog";

const BRAND = "#6B85F6";

interface KelasOption {
  id: string;
  judul: string;
}

export default function SuperAdminTugasPage() {
  const [tugasList, setTugasList] = useState<TugasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTugas, setEditingTugas] = useState<TugasData | null>(null);
  const [sendingTugas, setSendingTugas] = useState<TugasData | null>(null);
  const [filterKelasId, setFilterKelasId] = useState("");
  const [kelasOptions, setKelasOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.data)).catch(() => {});
    fetch("/api/kelas")
      .then((r) => r.json())
      .then((d) => setKelasOptions((d.data ?? []).map((k: KelasOption) => ({ id: k.id, label: k.judul }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadTugas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKelasId]);

  async function loadTugas() {
    setLoading(true);
    try {
      const qs = filterKelasId ? `?kelasId=${filterKelasId}` : "";
      const res = await fetch(`/api/tugas${qs}`);
      const data = await res.json();
      setTugasList(data.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function openBuat() {
    setEditingTugas(null);
    setShowModal(true);
  }
  function openEdit(t: TugasData) {
    setEditingTugas(t);
    setShowModal(true);
  }
  function handleSendSuccess() {
    setSendingTugas(null);
    loadTugas();
  }
  async function handleDelete(id: string) {
    if (!(await showConfirm("Hapus tugas ini?"))) return;
    await fetch(`/api/tugas/${id}`, { method: "DELETE" });
    loadTugas();
  }

  const todayStr = new Date().toDateString();
  const hariIni = tugasList.filter((t) => new Date(t.createdAt).toDateString() === todayStr);
  const history = tugasList.filter((t) => new Date(t.createdAt).toDateString() !== todayStr);

  return (
    <div>
      <div className="flex items-center gap-4 border border-[#dfe4ef] p-5 text-white sm:p-6" style={{ background: BRAND }}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold">Tugas Kelas</p>
          <p className="mt-1 text-sm text-white/85">Buat tugas kemudian kirim ke suatu kelas untuk memulai tugas.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button onClick={openBuat}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Buat Tugas
        </Button>
        <select
          className="rounded-lg border border-[#dfe4ef] px-3 py-2 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
          value={filterKelasId}
          onChange={(e) => setFilterKelasId(e.target.value)}
        >
          <option value="">Semua Kelas</option>
          {kelasOptions.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-[#9CA3AF]">Memuat...</p>
      ) : (
        <>
          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-[#182033]">Tugas Hari Ini</p>
            {hariIni.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">Belum ada tugas dibuat hari ini.</p>
            ) : (
              <div className="space-y-3">
                {hariIni.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="SUPER_ADMIN" onEdit={openEdit} onDelete={handleDelete} onSend={setSendingTugas} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm font-bold text-[#182033]">History</p>
            {history.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">Belum ada riwayat tugas.</p>
            ) : (
              <div className="space-y-3">
                {history.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="SUPER_ADMIN" onEdit={openEdit} onDelete={handleDelete} onSend={setSendingTugas} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ModalTugas
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadTugas}
        mode={editingTugas ? "edit" : "create"}
        initialData={editingTugas}
      />
      <ModalKirimTugas
        open={!!sendingTugas}
        tugasId={sendingTugas?.id ?? null}
        onClose={() => setSendingTugas(null)}
        onSuccess={handleSendSuccess}
      />
    </div>
  );
}