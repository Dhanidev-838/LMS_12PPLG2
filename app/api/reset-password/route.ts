import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// POST /api/reset-password -> submit password baru (PUBLIC, tapi butuh otpVerified=true dari step sebelumnya)
// body: { identifier (NIS/NIK), passwordBaru }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, passwordBaru } = body;

    if (!identifier || !passwordBaru) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }
    const passwordValid = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(passwordBaru);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter dan harus kombinasi huruf dan angka." },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: { OR: [{ nis: identifier }, { nik: identifier }] },
    });
    if (!user) {
      return NextResponse.json({ error: "Verifikasi OTP diperlukan sebelum ubah password." }, { status: 400 });
    }

    const laporan = await db.laporanResetPassword.findFirst({
      where: { userId: user.id, status: "DITERIMA", otpVerified: true },
      orderBy: { createdAt: "desc" },
    });

    if (!laporan) {
      return NextResponse.json({ error: "Verifikasi OTP diperlukan sebelum ubah password." }, { status: 400 });
    }

    const hashedPassword = await hashPassword(passwordBaru);

    await db.$transaction([
      // passwordSementara ikut di-set false -- kalau gak, siswa/guru yang belum pernah login sekalipun
      // (masih flag default true dari awal dibuat admin) bakal kena redirect paksa ke /ganti-password-awal
      // LAGI abis reset lewat OTP, padahal baru aja set password sendiri
      db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, passwordSementara: false },
      }),
      // OTP jadi gak valid lagi setelah dipake, tapi laporan tetep ada sampai admin klik "Selesai"
      db.laporanResetPassword.update({
        where: { id: laporan.id },
        data: { otpHash: null, otpExpiredAt: null, otpVerified: false },
      }),
    ]);

    return NextResponse.json({ message: "Password berhasil diubah. Silakan login dengan password baru." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}