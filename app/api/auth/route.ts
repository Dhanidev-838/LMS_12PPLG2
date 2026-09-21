import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, createSession, destroySession } from "@/lib/auth";
import { getDashboardPath, type Role } from "@/lib/rbac";

// ============================
// POST /api/auth -> LOGIN
// ============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, portal } = body;

    // validasi input dasar
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Identitas dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanIdentifier = String(identifier).trim();

    if (portal && !["ADMIN", "PETUGAS", "SISWA"].includes(portal)) {
      return NextResponse.json({ error: "Portal login tidak valid." }, { status: 400 });
    }

    // cari user berdasarkan email (admin/kepsek/kurikulum) ATAU nis (siswa) ATAU nik (guru)
    // portal yang dipilih di frontend cuma buat tampilan, backend cukup cocokin
    // ke salah satu field yang match
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier.toLowerCase() },
          { nis: cleanIdentifier },
          { nik: cleanIdentifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Identitas atau password salah." },
        { status: 401 }
      );
    }

    const portalRoleValid =
      !portal ||
      (portal === "PETUGAS" && user.role === "GURU") ||
      (portal === "SISWA" && user.role === "SISWA") ||
      (portal === "ADMIN" && ["ADMIN", "KEPSEK", "KURIKULUM"].includes(user.role));

    if (!portalRoleValid) {
      return NextResponse.json({ error: "Akun tidak sesuai dengan portal login yang dipilih." }, { status: 401 });
    }

    // cocokin password
    // - admin/kepsek/kurikulum: password asli
    // - guru: default-nya NIK (bisa diganti sendiri lewat fitur lupa password)
    // - siswa: default-nya NIS (bisa diganti sendiri lewat fitur lupa password)
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Identitas atau password salah." },
        { status: 401 }
      );
    }

    // bikin session (JWT disimpen di httpOnly cookie)
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      nama: user.nama,
      passwordSementara: user.passwordSementara,
    });

    // kalau password masih sementara (default NIS/NIK), langsung arahkan ke halaman
    // ganti password -- gak perlu nunggu proxy.ts nge-redirect ulang di request berikutnya
    const redirectTo = user.passwordSementara
      ? "/ganti-password-awal"
      : getDashboardPath(user.role as Role);

    return NextResponse.json({
      message: "Login berhasil.",
      redirectTo,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        fotoProfil: user.fotoProfil,
        passwordSementara: user.passwordSementara,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

// ============================
// DELETE /api/auth -> LOGOUT
// ============================
export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ message: "Logout berhasil." });
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}