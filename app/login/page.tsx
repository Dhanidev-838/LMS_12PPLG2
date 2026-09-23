"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const BRAND = "#6B85F6";

type Portal = "ADMIN" | "PETUGAS" | "SISWA";
type View = "LOGIN" | "LAPOR" | "OTP" | "PASSWORD_BARU" | "SUKSES";

const PORTAL_CONFIG: Record<
  Portal,
  { label: string; title: string; identifierLabel: string; identifierPlaceholder: string }
> = {
  ADMIN: { label: "Admin", title: "Login Sebagai Admin", identifierLabel: "Email", identifierPlaceholder: "Email" },
  PETUGAS: { label: "Petugas", title: "Login Sebagai Petugas", identifierLabel: "NIK", identifierPlaceholder: "Nik" },
  SISWA: { label: "Siswa", title: "Login Sebagai Siswa", identifierLabel: "NIS", identifierPlaceholder: "Nis" },
};

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("LOGIN");

  // ===== state login =====
  const [portal, setPortal] = useState<Portal>("ADMIN");
  const [loginIdentifier, setLoginIdentifier] = useState(""); // email (admin) / nik (petugas) / nis (siswa)
  const [loginPassword, setLoginPassword] = useState("");

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

  const config = PORTAL_CONFIG[portal];

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
    <div className="flex min-h-screen flex-col bg-[#f8f9fc] text-[#182033]" style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <header className="border-b border-[#e8ebf2] bg-white">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5"><Image src="/Logo1.png" alt="Logo Classify" width={32} height={32} className="rounded-[9px] object-contain" /><span className="text-[17px] font-bold tracking-[-.04em]">Classify</span></Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-[#dce1eb] px-3.5 py-2 text-sm font-semibold text-[#4b576b] transition-colors hover:bg-[#f7f8fb]"><span aria-hidden="true">←</span> Kembali</Link>
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
                    className="cursor-pointer rounded-lg border py-2 text-sm font-medium transition-colors"
                    style={
                      portal === key
                        ? { background: BRAND, borderColor: BRAND, color: "white" }
                        : { borderColor: "#D1D5DB", color: "#374151" }
                    }
                  >
                    {PORTAL_CONFIG[key].label}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-xs text-[#9CA3AF]">Login Sebagai {config.label}</p>
              <p className="text-sm font-bold text-[#111827]">{config.title}</p>

              <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3">
                <input
                  type={portal === "ADMIN" ? "email" : "text"}
                  required
                  placeholder={config.identifierPlaceholder}
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
                />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
                />

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
                    className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={lupaEmail}
                    onChange={(e) => setLupaEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
                  />
                  <input
                    type="date"
                    required
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
                  />
                  <textarea
                    required
                    placeholder="Alasan lupa password"
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
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
                  className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
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
                      className="h-12 w-12 rounded-lg border border-[#D1D5DB] text-center text-lg font-bold outline-none focus:border-[#6B85F6]"
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
                  className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm outline-none focus:border-[#6B85F6]"
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
    </div>
  );
}
