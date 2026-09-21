import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword, createSession } from "@/lib/auth";
import { getDashboardPath, type Role } from "@/lib/rbac";

// POST /api/ganti-password-awal -> user (yang lagi login, passwordSementara=true) ganti password sendiri
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Belum login." }, { status: 401 });
    }

    const body = await req.json();
    const { passwordBaru } = body;

    const passwordValid = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(passwordBaru ?? "");
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter dan harus kombinasi huruf dan angka." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(passwordBaru);

    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword, passwordSementara: false },
    });

    // refresh session cookie -> flag passwordSementara di JWT ikut ke-update jadi false
    await createSession({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role as Role,
      nama: updatedUser.nama,
      passwordSementara: false,
    });

    return NextResponse.json({
      message: "Password berhasil diubah.",
      redirectTo: getDashboardPath(updatedUser.role as Role),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}