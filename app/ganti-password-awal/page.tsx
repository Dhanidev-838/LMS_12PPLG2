"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const BRAND = "#6B85F6";

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
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center px-6"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(17,24,39,0.55), rgba(17,24,39,0.7)), url('/hero-sekolah.jpg')",
        backgroundColor: "#1F2937",
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image src="/Logo1.png" alt="Logo Classify" fill sizes="40px" className="rounded-full object-contain" />
          </div>
          <p className="mt-2 text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Classify
          </p>
        </div>

        <div className="mt-6 rounded-lg bg-amber-50 p-3">
          <p className="text-xs leading-relaxed text-amber-800">
            Password anda masih menggunakan password sementara. Untuk keamanan akun, silakan buat password baru
            sebelum melanjutkan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="password"
            required
            placeholder="Password Baru"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
          />
          <input
            type="password"
            required
            placeholder="Konfirmasi Password Baru"
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
            className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
          />

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {loading ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}