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
    <div className="min-h-screen bg-white" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* NAVBAR */}
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image src="/Logo1.png" alt="Logo Classify" fill sizes="32px" className="rounded-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Classify
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-full px-6 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ background: BRAND }}
          >
            Back
          </Link>
        </div>
      </header>

      {/* HERO + CARD */}
      <section
        className="relative flex min-h-[640px] items-center justify-center bg-cover bg-center px-6 py-16"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(17,24,39,0.45), rgba(17,24,39,0.65)), url('/hero-sekolah.jpg')",
          backgroundColor: "#1F2937",
        }}
      >
        <h1
          className="absolute top-16 text-center text-2xl font-bold text-white md:text-3xl opacity-0 animate-[fadeUp_0.6s_ease-out_forwards]"
          style={{ fontFamily: "'Space Grotesk', sans-serif", animationDelay: "0.1s" }}
        >
          Selamat Datang di Classify
        </h1>

        <div className="mt-20 w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl opacity-0 animate-[fadeUp_0.6s_ease-out_forwards]">
          {/* header logo + tagline, tampil di semua view */}
          <div className="flex flex-col items-center text-center">
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image src="/Logo1.png" alt="Logo Classify" fill sizes="32px" className="rounded-full object-contain" />
            </div>
            <p className="mt-2 text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Classify
            </p>
            <p className="mt-1 text-sm font-semibold text-[#111827]">Ayo Belajar Lebih Cerdas Bersama Classify</p>
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
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-white" style={{ background: BRAND }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold">Classify</p>
            <p className="mt-2 text-sm">Belajar Lebih Mudah, Mengajar Lebih Terarah.</p>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/80">
              Platform Learning Management System yang mendukung proses belajar mengajar
              secara modern, efektif, dan terintegrasi.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Quick Links</p>
            <ul className="mt-3 space-y-2 text-sm text-white/90">
              <li><Link href="/#tentang" className="hover:underline">About Us</Link></li>
              <li><Link href="/#jurusan" className="hover:underline">Jurusan</Link></li>
              <li><Link href="/#role" className="hover:underline">Role</Link></li>
              <li><Link href="/#tentang" className="hover:underline">Contact Us</Link></li>
              <li><Link href="/login" className="hover:underline">Login</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Social Media</p>
            <ul className="mt-3 space-y-2 text-sm text-white/90">
              <li>Instagram : @chronion999</li>
              <li>Github : Dhanidev-838</li>
              <li>LinkedIn : Dhani Triadi Saputra</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-white/20 pt-6 text-center text-xs text-white/80">
          © 2026 Classify. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}