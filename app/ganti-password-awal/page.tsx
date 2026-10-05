"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ThemeToggle from "@/components/shared/theme-toggle";

export default function GantiPasswordAwalPage() {
  const router = useRouter();
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [showPasswordBaru, setShowPasswordBaru] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("admin-theme") === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-admin-theme", theme);
    window.localStorage.setItem("admin-theme", theme);
    return () => document.documentElement.removeAttribute("data-admin-theme");
  }, [theme]);

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
    <div data-admin-theme={theme} className="public-shell relative min-h-screen bg-[#f8f9fc] px-4 py-6 text-[#182033] sm:px-6 lg:flex lg:items-center lg:justify-center lg:p-10" style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <ThemeToggle
        theme={theme}
        onToggle={() => setTheme((v) => (v === "light" ? "dark" : "light"))}
        className="absolute right-4 top-4 sm:right-6 sm:top-6 lg:right-10 lg:top-10"
      />
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
          <div className="relative">
            <input
              type={showPasswordBaru ? "text" : "password"}
              required
              placeholder="Password Baru"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              className="w-full rounded-lg border border-[#d9deea] bg-white px-4 py-3 pr-12 text-sm text-[#182033] outline-none transition-colors placeholder:text-[#9aa3b2] focus:border-[#6B85F6] focus:ring-2 focus:ring-[#6B85F6]/10"
            />
            <button
              type="button"
              onClick={() => setShowPasswordBaru((visible) => !visible)}
              aria-label={showPasswordBaru ? "Sembunyikan password baru" : "Tampilkan password baru"}
              title={showPasswordBaru ? "Sembunyikan password baru" : "Tampilkan password baru"}
              className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-[#748096] hover:text-[#435064]"
            >
              <PasswordVisibilityIcon visible={showPasswordBaru} />
            </button>
          </div>
          <div className="relative">
            <input
              type={showKonfirmasi ? "text" : "password"}
              required
              placeholder="Konfirmasi Password Baru"
              value={konfirmasi}
              onChange={(e) => setKonfirmasi(e.target.value)}
              className="w-full rounded-lg border border-[#d9deea] bg-white px-4 py-3 pr-12 text-sm text-[#182033] outline-none transition-colors placeholder:text-[#9aa3b2] focus:border-[#6B85F6] focus:ring-2 focus:ring-[#6B85F6]/10"
            />
            <button
              type="button"
              onClick={() => setShowKonfirmasi((visible) => !visible)}
              aria-label={showKonfirmasi ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
              title={showKonfirmasi ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
              className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-[#748096] hover:text-[#435064]"
            >
              <PasswordVisibilityIcon visible={showKonfirmasi} />
            </button>
          </div>

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

      <style jsx global>{`
        [data-admin-theme="dark"] { color-scheme: dark; }
        .public-shell[data-admin-theme="dark"] { background-color: #10141d !important; color: #f3f6fb; }

        [data-admin-theme="dark"] .public-shell [class~="bg-white"] { background-color: #171d28 !important; }
        [data-admin-theme="dark"] .public-shell [class~="bg-[#f8f9fc]"] { background-color: #10141d !important; }

        [data-admin-theme="dark"] .public-shell :is(
          [class~="border-[#dfe4ef]"], [class~="border-[#edf0f5]"], [class~="border-[#d9deea]"]
        ):not([class~="border-[#6B85F6]"]) { border-color: #2a3343 !important; }

        [data-admin-theme="dark"] .public-shell [class~="text-[#182033]"] { color: #f3f6fb !important; }
        [data-admin-theme="dark"] .public-shell :is(
          [class~="text-[#7a8495]"], [class~="text-[#6d7788]"]
        ) { color: #aeb8c9 !important; }

        [data-admin-theme="dark"] .public-shell input {
          background-color: #111722 !important;
          border-color: #344054 !important;
          color: #e9eef8 !important;
        }
        [data-admin-theme="dark"] .public-shell input[class*="placeholder:text-[#9aa3b2]"]::placeholder { color: #7d889b !important; }
      `}</style>
    </div>
  );
}

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
      {visible ? (
        <>
          <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.2 9.5 6.2a1.7 1.7 0 0 1 0 1.6 12 12 0 0 1-3.1 3.7M6.2 6.2a13 13 0 0 0-3.7 5 1.7 1.7 0 0 0 0 1.6C3.5 14.8 7 19 12 19c1.1 0 2.1-.2 3-.6" />
        </>
      ) : (
        <>
          <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </svg>
  );
}