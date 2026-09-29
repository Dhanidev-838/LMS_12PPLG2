"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const BRAND = "#6B85F6";
const SAVED_ACCOUNTS_KEY = "classify-saved-accounts";

type Portal = "ADMIN" | "PETUGAS" | "SISWA";
type View = "LOGIN" | "LAPOR" | "OTP" | "PASSWORD_BARU" | "SUKSES";
type SavedAccount = { portal: Portal; identifier: string; label: string; lastLoginAt: number };

const PORTAL_CONFIG: Record<
  Portal,
  { label: string; title: string; identifierLabel: string; identifierPlaceholder: string }
> = {
  ADMIN: { label: "Admin", title: "Login Sebagai Admin", identifierLabel: "Email", identifierPlaceholder: "Email" },
  PETUGAS: { label: "Petugas", title: "Login Sebagai Petugas", identifierLabel: "NIK", identifierPlaceholder: "Nik" },
  SISWA: { label: "Siswa", title: "Login Sebagai Siswa", identifierLabel: "NIS", identifierPlaceholder: "Nis" },
};

function ThemeToggle({ theme, onToggle }: { theme: "light" | "dark"; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
      title={theme === "light" ? "Mode gelap" : "Mode terang"}
      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#dce1eb] text-[#576277] transition-colors hover:bg-[#f7f8fb]"
    >
      {theme === "light" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
          <path d="M12 3v2m0 14v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M3 12h2m14 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
          <path d="M20 15.4A8 8 0 0 1 8.6 4 8 8 0 1 0 20 15.4Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function readSavedAccounts(): SavedAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedAccounts(accounts: SavedAccount[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function persistSavedAccount(portal: Portal, identifier: string) {
  const trimmed = identifier.trim();
  if (!trimmed) return;

  const accounts = readSavedAccounts();
  const next = [
    {
      portal,
      identifier: trimmed,
      label: `${PORTAL_CONFIG[portal].label} · ${trimmed}`,
      lastLoginAt: Date.now(),
    },
    ...accounts.filter((account) => !(account.portal === portal && account.identifier.toLowerCase() === trimmed.toLowerCase())),
  ].slice(0, 6);

  writeSavedAccounts(next);
}

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("LOGIN");
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // ===== state login =====
  const [portal, setPortal] = useState<Portal>("ADMIN");
  const [loginIdentifier, setLoginIdentifier] = useState(""); // email (admin) / nik (petugas) / nis (siswa)
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // ===== state lupa password =====
  const [identifier, setIdentifier] = useState(""); // NIS/NIK
  const [lupaEmail, setLupaEmail] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alasan, setAlasan] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [passwordBaru, setPasswordBaru] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);

  const config = PORTAL_CONFIG[portal];
  const filteredSavedAccounts = savedAccounts.filter((account) => {
    const query = loginIdentifier.trim().toLowerCase();
    if (!query) return true;
    return account.identifier.toLowerCase().includes(query) || account.portal.toLowerCase().includes(query);
  });

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("admin-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }

    const accounts = readSavedAccounts();
    setSavedAccounts(accounts);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-admin-theme", theme);
    window.localStorage.setItem("admin-theme", theme);
    return () => document.documentElement.removeAttribute("data-admin-theme");
  }, [mounted, theme]);

  function resetLupaState() {
    setIdentifier("");
    setLupaEmail("");
    setTanggalLahir("");
    setAlasan("");
    setOtpDigits(["", "", "", ""]);
    setPasswordBaru("");
    setError("");
    setInfo("");
  }

  function handlePortalChange(newPortal: Portal) {
    setPortal(newPortal);
    setLoginIdentifier("");
    setLoginPassword("");
    setShowLoginPassword(false);
    setError("");
  }

  // ===== LOGIN =====
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword, portal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login gagal, coba lagi.");
        setLoading(false);
        return;
      }

      persistSavedAccount(portal, loginIdentifier);
      setSavedAccounts(readSavedAccounts());
      router.push(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

  // ===== LAPOR (step 1) =====
  async function handleLaporSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/lupa-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, email: lupaEmail, tanggalLahir, alasan }),
      });
      const data = await res.json();
      setInfo(data.message ?? "Laporan berhasil dikirim ke admin.");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // ===== OTP (step 2) =====
  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return; // cuma boleh 1 digit angka
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);

    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const otp = otpDigits.join("");
    if (otp.length !== 4) {
      setError("Masukkan 4 digit kode OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kode OTP tidak valid.");
        setLoading(false);
        return;
      }
      setView("PASSWORD_BARU");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // ===== PASSWORD BARU (step 3) =====
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (passwordBaru.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, passwordBaru }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah password.");
        setLoading(false);
        return;
      }
      setView("SUKSES");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function kembaliKeLogin() {
    resetLupaState();
    setView("LOGIN");
  }

  return (
    <div data-admin-theme={mounted ? theme : "light"} className="public-shell flex min-h-screen flex-col bg-[#f8f9fc] text-[#182033]" style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <header className="border-b border-[#e8ebf2] bg-white">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5"><Image src="/Logo1.png" alt="Logo Classify" width={32} height={32} className="rounded-[9px] object-contain" /><span className="text-[17px] font-bold tracking-[-.04em]">Classify</span></Link>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={() => setTheme((v) => (v === "light" ? "dark" : "light"))} />
            <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-[#dce1eb] px-3.5 py-2 text-sm font-semibold text-[#4b576b] transition-colors hover:bg-[#f7f8fb]"><span aria-hidden="true">←</span> Kembali</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl flex-1 items-stretch px-4 py-6 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:px-8 lg:py-10">
        <aside className="hidden min-h-[620px] flex-col justify-between overflow-hidden border border-[#dfe4ef] bg-[#6B85F6] p-10 text-white lg:flex">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-white/70">Classify access</p><h1 className="mt-5 max-w-md text-4xl font-bold tracking-[-.055em]">Masuk dan lanjutkan pembelajaran.</h1><p className="mt-5 max-w-md text-sm leading-7 text-white/80">Satu akses untuk mengelola aktivitas belajar, materi, tugas, asesmen, hingga perkembangan akademik.</p></div>
          <div className="border-t border-white/20 pt-6"><p className="text-sm font-semibold">Lebih terarah, dalam satu sistem.</p><div className="mt-4 grid grid-cols-3 gap-3 text-xs text-white/75"><span>Materi</span><span>Tugas</span><span>Penilaian</span></div></div>
        </aside>

        <div className="flex min-h-[620px] items-center justify-center border border-t-0 border-[#dfe4ef] bg-white px-4 py-10 sm:px-8 lg:border-l-0 lg:border-t">
          <div className="w-full max-w-md">
          <div className="flex items-center gap-3 border-b border-[#edf0f5] pb-6">
            <Image src="/Logo1.png" alt="Logo Classify" width={38} height={38} className="rounded-[11px] object-contain" />
            <div><p className="font-bold tracking-[-.03em]">Classify</p><p className="mt-0.5 text-xs text-[#7a8495]">Learning Management System</p></div>
          </div>

          {/* ============ VIEW: LOGIN ============ */}
          {view === "LOGIN" && (
            <>
              <p className="mt-6 text-xs font-semibold text-[#6B7280]">Portal Administrasi</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(Object.keys(PORTAL_CONFIG) as Portal[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePortalChange(key)}
                    className={`cursor-pointer rounded-lg border py-2 text-sm font-medium transition-colors ${
                      portal === key
                        ? "border-[#6B85F6] bg-[#6B85F6] text-white"
                        : "border-[#dfe4ef] text-[#435064] hover:bg-[#6B85F6]/10"
                    }`}
                  >
                    {PORTAL_CONFIG[key].label}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-xs text-[#9CA3AF]">Login Sebagai {config.label}</p>
              <p className="text-sm font-bold text-[#111827]">{config.title}</p>

              <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3">
                <div className="relative">
                  <input
                    type={portal === "ADMIN" ? "email" : "text"}
                    required
                    placeholder={config.identifierPlaceholder}
                    value={loginIdentifier}
                    onFocus={() => setShowSavedAccounts(savedAccounts.length > 0)}
                    onBlur={() => setTimeout(() => setShowSavedAccounts(false), 120)}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      setShowSavedAccounts(savedAccounts.length > 0);
                    }}
                    className="w-full rounded-lg border border-[#dfe4ef] px-4 py-2.5 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
                  />

                  {showSavedAccounts && filteredSavedAccounts.length > 0 && (
                    <div className="account-picker absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#e5e7eb] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                      {filteredSavedAccounts.map((account) => (
                        <button
                          key={`${account.portal}-${account.identifier}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setPortal(account.portal);
                            setLoginIdentifier(account.identifier);
                            setLoginPassword("");
                            setError("");
                            setShowSavedAccounts(false);
                          }}
                          className="account-option flex w-full items-center gap-3 border-b border-[#f0f2f5] px-3 py-2.5 text-left transition-colors hover:bg-[#f5f7fb]"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2ff] text-[#4f46e5]">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[14px] w-[14px]" aria-hidden="true">
                              <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="m5 7 7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <span className="account-text flex-1 truncate text-[14px] font-medium text-[#1f2937]">{account.identifier}</span>
                        </button>
                      ))}

                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        className="account-option flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] font-medium text-[#374151] transition-colors hover:bg-[#f5f7fb]"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f3f4f6] text-[#4b5563]">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[12px] w-[12px]" aria-hidden="true">
                            <circle cx="12" cy="8.5" r="3.5" />
                            <path d="M4 18.5c1.3-2.4 4-3.8 8-3.8s6.7 1.4 8 3.8" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span className="account-text">Manage addresses...</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#dfe4ef] px-4 py-2.5 pr-12 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((visible) => !visible)}
                    aria-label={showLoginPassword ? "Sembunyikan password" : "Tampilkan password"}
                    title={showLoginPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-[#748096] hover:text-[#435064]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
                      {showLoginPassword ? (
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
                  </button>
                </div>

                {error && <p className="text-xs font-medium text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
                  style={{ background: BRAND }}
                >
                  {loading ? "Memproses..." : "Masuk"}
                </button>

                {portal !== "ADMIN" && (
                  <p className="text-center text-xs text-[#9CA3AF]">
                    Lupa Password?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        resetLupaState();
                        setView("LAPOR");
                      }}
                      className="cursor-pointer font-semibold hover:underline"
                      style={{ color: BRAND }}
                    >
                      Ubah Password
                    </button>
                  </p>
                )}
              </form>
            </>
          )}

          {/* ============ VIEW: LAPOR (step 1) ============ */}
          {view === "LAPOR" && (
            <>
              <p className="mt-6 text-xs font-semibold text-[#6B7280]">Buat Laporan Password</p>
              <p className="text-sm font-bold text-[#111827]">
                Gunakan NIS/NIK, email, tanggal lahir, dan alasan untuk ubah password
              </p>

              {info ? (
                <div className="mt-4 rounded-lg bg-[#F0FDF4] p-4 text-center">
                  <p className="text-sm text-[#166534]">{info}</p>
                  <button
                    type="button"
                    onClick={kembaliKeLogin}
                    className="mt-3 cursor-pointer text-xs font-semibold hover:underline"
                    style={{ color: BRAND }}
                  >
                    Kembali ke Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLaporSubmit} className="mt-4 space-y-3">
                  <input
                    required
                    placeholder="NIS / NIK"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full rounded-lg border border-[#dfe4ef] px-4 py-2.5 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={lupaEmail}
                    onChange={(e) => setLupaEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#dfe4ef] px-4 py-2.5 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
                  />
                  <input
                    type="date"
                    required
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full rounded-lg border border-[#dfe4ef] px-4 py-2.5 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
                  />
                  <textarea
                    required
                    placeholder="Alasan lupa password"
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[#dfe4ef] px-4 py-2.5 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
                  />

                  {error && <p className="text-xs font-medium text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
                    style={{ background: BRAND }}
                  >
                    {loading ? "Mengirim..." : "Buat Laporan"}
                  </button>

                  <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                    <button type="button" onClick={kembaliKeLogin} className="cursor-pointer hover:underline">
                      Kembali ke login
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("OTP")}
                      className="cursor-pointer font-semibold hover:underline"
                      style={{ color: BRAND }}
                    >
                      Sudah punya kode OTP?
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ============ VIEW: OTP (step 2) ============ */}
          {view === "OTP" && (
            <>
              <p className="mt-6 text-xs font-semibold text-[#6B7280]">Ubah Password</p>
              <p className="text-sm font-bold text-[#111827]">
                Ketik NIS/NIK lalu masukkan kode OTP 4 digit yang dikirim admin melalui email
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
                <input
                  required
                  placeholder="NIS / NIK"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-lg border border-[#dfe4ef] px-4 py-2.5 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
                />

                <div className="flex justify-center gap-3">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="h-12 w-12 rounded-lg border border-[#dfe4ef] text-center text-lg font-bold text-[#182033] outline-none focus:border-[#6B85F6]"
                    />
                  ))}
                </div>

                {error && <p className="text-center text-xs font-medium text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
                  style={{ background: BRAND }}
                >
                  {loading ? "Memverifikasi..." : "Lanjut"}
                </button>

                <p className="text-center text-xs text-[#9CA3AF]">
                  <button type="button" onClick={kembaliKeLogin} className="cursor-pointer hover:underline">
                    Kembali ke login
                  </button>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => setView("LAPOR")}
                    className="cursor-pointer font-semibold hover:underline"
                    style={{ color: BRAND }}
                  >
                    Belum lapor?
                  </button>
                </p>
              </form>
            </>
          )}

          {/* ============ VIEW: PASSWORD BARU (step 3) ============ */}
          {view === "PASSWORD_BARU" && (
            <>
              <p className="mt-6 text-xs font-semibold text-[#6B7280]">Portal Administrasi</p>
              <p className="text-sm font-bold text-[#111827]">Buat Password Baru</p>

              <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
                <input
                  type="password"
                  required
                  placeholder="Password Baru"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  className="w-full rounded-lg border border-[#dfe4ef] px-4 py-2.5 text-sm text-[#182033] outline-none focus:border-[#6B85F6]"
                />

                {error && <p className="text-xs font-medium text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
                  style={{ background: BRAND }}
                >
                  {loading ? "Menyimpan..." : "Buat Password"}
                </button>

                <p className="text-center text-xs text-[#9CA3AF]">
                  <button type="button" onClick={kembaliKeLogin} className="cursor-pointer hover:underline">
                    Kembali ke login
                  </button>
                </p>
              </form>
            </>
          )}

          {/* ============ VIEW: SUKSES ============ */}
          {view === "SUKSES" && (
            <div className="mt-6 text-center">
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "#DCFCE7" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" className="h-6 w-6">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-bold text-[#111827]">Password Berhasil Diubah</p>
              <p className="mt-1 text-xs text-[#6B7280]">Silakan login dengan password baru anda.</p>
              <button
                type="button"
                onClick={kembaliKeLogin}
                className="mt-4 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: BRAND }}
              >
                Kembali ke Login
              </button>
            </div>
          )}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e5e8ef] bg-white px-4 py-5 text-center text-xs text-[#8791a1] sm:px-6">© 2026 Classify. Belajar lebih mudah, mengajar lebih terarah.</footer>

      <style jsx global>{`
        [data-admin-theme="dark"] { color-scheme: dark; }
        .public-shell[data-admin-theme="dark"] { background-color: #10141d !important; color: #f3f6fb; }

        [data-admin-theme="dark"] .public-shell header,
        [data-admin-theme="dark"] .public-shell footer,
        [data-admin-theme="dark"] .public-shell [class~="bg-white"] { background-color: #171d28 !important; }
        [data-admin-theme="dark"] .public-shell [class~="bg-[#f8f9fc]"] { background-color: #10141d !important; }

        [data-admin-theme="dark"] .public-shell :is(
          [class~="border-[#e8ebf2]"], [class~="border-[#dce1eb]"], [class~="border-[#dfe4ef]"],
          [class~="border-[#edf0f5]"], [class~="border-[#e5e8ef]"]
        ):not([class~="border-[#6B85F6]"]) { border-color: #2a3343 !important; }

        [data-admin-theme="dark"] .public-shell :is(
          [class~="text-[#182033]"], [class~="text-[#111827]"]
        ) { color: #f3f6fb !important; }

        [data-admin-theme="dark"] .public-shell :is(
          [class~="text-[#4b576b]"], [class~="text-[#7a8495]"], [class~="text-[#6B7280]"],
          [class~="text-[#9CA3AF]"], [class~="text-[#8791a1]"], [class~="text-[#435064]"]
        ) { color: #aeb8c9 !important; }

        [data-admin-theme="dark"] .public-shell input,
        [data-admin-theme="dark"] .public-shell textarea {
          background-color: #111722 !important;
          border-color: #344054 !important;
          color: #e9eef8 !important;
        }
        [data-admin-theme="dark"] .public-shell input::placeholder,
        [data-admin-theme="dark"] .public-shell textarea::placeholder { color: #7d889b !important; }

        [data-admin-theme="dark"] .public-shell .account-picker,
        [data-admin-theme="dark"] .public-shell .account-picker .account-option,
        [data-admin-theme="dark"] .public-shell .account-picker .account-text {
          background-color: #ffffff !important;
          color: #111827 !important;
        }

        [data-admin-theme="dark"] .public-shell .account-picker {
          border-color: #dfe4ef !important;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18) !important;
        }

        [data-admin-theme="dark"] .public-shell .account-picker .account-option:hover {
          background-color: #f5f7fb !important;
        }

        [data-admin-theme="dark"] .public-shell [class*="hover:bg-"]:hover {
          background-color: rgba(107, 133, 246, .14) !important;
        }
      `}</style>
    </div>
  );
}