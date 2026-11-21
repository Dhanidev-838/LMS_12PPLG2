"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { showConfirm } from "@/lib/dialog";
import { intlLocaleCodes, useLanguage } from "@/lib/i18n";

type Mapel = {
  id: string;
  nama: string;
  _count: { kelasGuruMapel: number; asesmen: number; tugas: number; materi: number };
};

async function fetchMapelList(): Promise<Mapel[]> {
  const response = await fetch("/api/mapel", { cache: "no-store" });
  const result: { data?: Mapel[]; error?: string } = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Gagal memuat mapel.");
  if (!Array.isArray(result.data)) throw new Error("Daftar mapel tidak valid.");
  return result.data;
}

export default function MapelManager() {
  const { t, locale } = useLanguage();
  const [items, setItems] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newMapelName, setNewMapelName] = useState("");
  const [editingItem, setEditingItem] = useState<Mapel | null>(null);
  const [editMapelName, setEditMapelName] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchMapelList());
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal memuat mapel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchMapelList()
      .then((data) => {
        if (active) {
          setItems(data);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Gagal memuat mapel.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  async function createMapel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/mapel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: newMapelName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Gagal menambahkan mapel.");
      setNewMapelName("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal menambahkan mapel.");
    } finally {
      setBusy(false);
    }
  }

  async function updateMapel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem) return;
    setBusy(true);
    setEditError("");
    try {
      const response = await fetch(`/api/mapel/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: editMapelName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Gagal memperbarui mapel.");
      setEditingItem(null);
      setEditMapelName("");
      await refresh();
    } catch (cause) {
      setEditError(cause instanceof Error ? cause.message : "Gagal memperbarui mapel.");
    } finally {
      setBusy(false);
    }
  }

  function closeEditModal() {
    if (busy) return;
    setEditingItem(null);
    setEditMapelName("");
    setEditError("");
  }

  async function remove(item: Mapel) {
    if (!(await showConfirm(t("Hapus mapel {nama}?").replace("{nama}", item.nama)))) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/mapel/${item.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Gagal menghapus mapel.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal menghapus mapel.");
    } finally {
      setBusy(false);
    }
  }

  const visible = items.filter((item) => item.nama.toLocaleLowerCase(intlLocaleCodes[locale]).includes(search.toLocaleLowerCase(intlLocaleCodes[locale])));

  return (
    <div className="space-y-4">
      <header className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-accent-text">{t("Data akademik")}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t("Mata Pelajaran")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("Mapel yang tersedia untuk guru, materi, tugas, dan asesmen.")}</p>
      </header>

      <form onSubmit={createMapel} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-xs font-semibold text-muted-foreground">
          {t("Tambah mapel")}
          <input value={newMapelName} onChange={(event) => setNewMapelName(event.target.value)} required minLength={2} maxLength={100} placeholder={t("Contoh: Matematika")} className="mt-1 min-h-10 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent" />
        </label>
        <Button type="submit" disabled={busy}>{busy ? t("Menyimpan...") : t("Tambah mapel")}</Button>
      </form>

      {error && <p role="alert" className="rounded-[var(--radius-control)] border border-danger bg-danger-subtle p-3 text-sm text-danger">{t(error)}</p>}

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">{t("Daftar mapel")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{loading ? t("Memuat...") : `${items.length} ${t("mapel tersedia")}`}</p>
          </div>
          <input aria-label={t("Cari mapel")} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Cari mapel...")} className="min-h-10 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent sm:w-52" />
        </div>
        {loading ? <p className="p-5 text-sm text-muted-foreground">{t("Memuat daftar mapel...")}</p> : visible.length === 0 ? <p className="p-5 text-sm text-muted-foreground">{t("Tidak ada mapel yang cocok.")}</p> : (
          <ul className="divide-y divide-border">
            {visible.map((item) => {
              const used = Object.values(item._count).reduce((sum, count) => sum + count, 0);
              return (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.nama}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{used > 0 ? t("Sedang digunakan dalam pembelajaran") : t("Belum digunakan")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => { setEditingItem(item); setEditMapelName(item.nama); setEditError(""); }}>{t("Edit")}</Button>
                    <Button type="button" size="sm" variant="danger" disabled={busy || used > 0} title={used > 0 ? t("Mapel yang sedang digunakan tidak dapat dihapus") : `${t("Hapus")} ${item.nama}`} onClick={() => void remove(item)}>{t("Hapus")}</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal open={editingItem !== null} onClose={closeEditModal} title={t("Edit Mata Pelajaran")} dismissible={!busy}>
        <form onSubmit={updateMapel} className="space-y-4">
          <Input
            label={t("Nama mapel")}
            value={editMapelName}
            onChange={(event) => setEditMapelName(event.target.value)}
            required
            minLength={2}
            maxLength={100}
            autoFocus
          />
          {editError && <p role="alert" className="text-sm text-danger">{t(editError)}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={closeEditModal}>{t("Batal")}</Button>
            <Button type="submit" disabled={busy}>{busy ? t("Menyimpan...") : t("Simpan perubahan")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
