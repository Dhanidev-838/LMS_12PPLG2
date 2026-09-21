import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword } from "@/lib/auth";

// POST /api/verify-otp -> cek identifier + OTP valid (PUBLIC)
// body: { identifier (NIS/NIK), otp }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, otp } = body;

    if (!identifier || !otp) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { OR: [{ nis: identifier }, { nik: identifier }] },
    });
    if (!user) {
      return NextResponse.json({ error: "Kode OTP tidak valid atau sudah kedaluwarsa." }, { status: 400 });
    }

    const laporan = await db.laporanResetPassword.findFirst({
      where: { userId: user.id, status: "DITERIMA", otpHash: { not: null } },
      orderBy: { createdAt: "desc" },
    });

    if (!laporan || !laporan.otpHash || !laporan.otpExpiredAt) {
      return NextResponse.json({ error: "Kode OTP tidak valid atau sudah kedaluwarsa." }, { status: 400 });
    }

    if (new Date() > laporan.otpExpiredAt) {
      return NextResponse.json({ error: "Kode OTP sudah kedaluwarsa. Minta kode baru ke admin." }, { status: 400 });
    }

    const isValid = await comparePassword(otp, laporan.otpHash);
    if (!isValid) {
      return NextResponse.json({ error: "Kode OTP tidak valid atau sudah kedaluwarsa." }, { status: 400 });
    }

    await db.laporanResetPassword.update({
      where: { id: laporan.id },
      data: { otpVerified: true },
    });

    return NextResponse.json({ message: "Kode OTP valid. Silakan buat password baru." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}