"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function GantiPasswordAwalPage() {
  const router = useRouter();
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(passwordBaru)) {
      setError("Password minimal 6 karakter dan harus kombinasi huruf dan angka.");
      return;
    }
    if (passwordBaru !== konfirmasi) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ganti-password-awal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordBaru }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah password.");
        setLoading(false);
        return;
      }

      router.push(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] px-4 py-6 text-[#182033] sm:px-6 lg:flex lg:items-center lg:justify-center lg:p-10" style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <main className="mx-auto grid w-full max-w-5xl overflow-hidden border border-[#dfe4ef] bg-white lg:grid-cols-[.86fr_1.14fr]">
        <aside className="hidden min-h-[550px] flex-col justify-between bg-[#6B85F6] p-10 text-white lg:flex">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-white/70">Account security</p><h1 className="mt-5 text-4xl font-bold tracking-[-.055em]">Amankan akses akun Anda.</h1><p className="mt-5 max-w-sm text-sm leading-7 text-white/80">Sebelum melanjutkan ke Classify, buat password personal yang kuat untuk akun Anda.</p></div>
          <div className="border-t border-white/20 pt-6 text-sm text-white/80">Classify · Learning Management System</div>
        </aside>
        <section className="flex min-h-[550px] items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3 border-b border-[#edf0f5] pb-6"><Image src="/Logo1.png" alt="Logo Classify" width={40} height={40} className="rounded-[11px] object-contain" /><div><p className="font-bold tracking-[-.03em]">Classify</p><p className="mt-0.5 text-xs text-[#7a8495]">Pengaturan keamanan akun</p></div></div>
            <div className="mt-7"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#6B85F6]">Password sementara</p><h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">Buat password baru</h2><p className="mt-2 text-sm leading-6 text-[#6d7788]">Password sementara terdeteksi. Buat kombinasi huruf dan angka untuk melanjutkan.</p></div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <input
            type="password"
            required
            placeholder="Password Baru"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            className="w-full rounded-lg border border-[#d9deea] bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#9aa3b2] focus:border-[#6B85F6] focus:ring-2 focus:ring-[#6B85F6]/10"
          />
          <input
            type="password"
            required
            placeholder="Konfirmasi Password Baru"
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
            className="w-full rounded-lg border border-[#d9deea] bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#9aa3b2] focus:border-[#6B85F6] focus:ring-2 focus:ring-[#6B85F6]/10"
          />

          {error && <p className="border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#6B85F6] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5974ed] disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
          </div>
        </section>
      </main>
    </div>
  );
}
