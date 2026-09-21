"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AsesmenCard, { AsesmenData } from "@/components/Asesmencard";
import ModalBuatAsesmen from "@/components/Modalbuatasesmen";

export default function GuruAsesmenLibraryPage() {
  const [asesmenList, setAsesmenList] = useState<AsesmenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAsesmen, setSendingAsesmen] = useState<AsesmenData | null>(null);

  async function loadAsesmen() {
    setLoading(true);
    try {
      const res = await fetch("/api/asesmen");
      const data = await res.json();
      setAsesmenList(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAsesmen();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/guru/asesmen" className="text-xs font-semibold text-[#64748B] hover:text-[#6B85F6]">
            ← Kembali ke Asesmen
          </Link>
          <h1 className="mt-2 text-xl font-bold text-[#111827]">Library Asesmen</h1>
          <p className="mt-1 text-sm text-[#64748B]">Pilih asesmen yang sudah dibuat untuk dikirim ke satu atau beberapa kelas.</p>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-[#9CA3AF]">Memuat...</p>
      ) : asesmenList.length === 0 ? (
        <p className="mt-6 text-sm text-[#9CA3AF]">Belum ada asesmen di library.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {asesmenList.map((asesmen) => (
            <AsesmenCard key={asesmen.id} data={asesmen} basePath="/guru/asesmen" onSend={setSendingAsesmen} />
          ))}
        </div>
      )}

      <ModalBuatAsesmen
        open={!!sendingAsesmen}
        onClose={() => setSendingAsesmen(null)}
        onSuccess={() => {
          setSendingAsesmen(null);
          loadAsesmen();
        }}
        initialSumber="EXISTING"
        initialAsesmenId={sendingAsesmen?.id}
      />
    </div>
  );
}