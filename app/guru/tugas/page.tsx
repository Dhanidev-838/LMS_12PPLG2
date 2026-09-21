// app/guru/tugas/page.tsx
"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import TugasCard, { TugasData } from "@/components/TugasCard";
import ModalTugas from "@/components/ModalTugas";
import ModalKirimTugas from "@/components/ModalKirimTugas";
import { showConfirm } from "@/lib/dialog";

const BRAND = "#6B85F6";

export default function GuruTugasPage() {
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
      .then((d) => setKelasOptions((d.data ?? []).map((k: any) => ({ id: k.id, label: k.judul }))))
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
      <div className="rounded-2xl p-5 text-white shadow-sm" style={{ background: BRAND }}>
        <p className="text-sm font-bold">Selamat Datang di Tab Tugas</p>
        <p className="mt-1 text-sm text-white/85">Buat Tugas kemudian kirim ke suatu kelas untuk memulai tugas.</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button onClick={openBuat}>+ Buat Tugas</Button>
        <select
          className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#6B85F6]"
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
            <p className="mb-3 text-sm font-bold text-[#111827]">Tugas Hari Ini</p>
            {hariIni.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">Belum ada tugas dibuat hari ini.</p>
            ) : (
              <div className="space-y-3">
                {hariIni.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="GURU" onEdit={openEdit} onDelete={handleDelete} onSend={setSendingTugas} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm font-bold text-[#111827]">History</p>
            {history.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">Belum ada riwayat tugas.</p>
            ) : (
              <div className="space-y-3">
                {history.map((t) => (
                  <TugasCard key={t.id} data={t} currentUserId={me?.id ?? ""} role="GURU" onEdit={openEdit} onDelete={handleDelete} onSend={setSendingTugas} />
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