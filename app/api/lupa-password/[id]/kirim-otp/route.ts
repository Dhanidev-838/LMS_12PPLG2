import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { requireRole, FULL_CRUD_ADMIN } from "@/lib/rbac";
import { sendOtpEmail } from "@/lib/Resend"; // fix: sebelumnya "@/lib/Resend" (huruf R besar) -> gagal di Vercel (Linux, case-sensitive)

type Params = { params: Promise<{ id: string }> };

// POST /api/lupa-password/[id]/kirim-otp -> generate OTP baru + kirim email
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const { id } = await params;

    const laporan = await db.laporanResetPassword.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!laporan) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });

    // generate OTP 4 digit
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await hashPassword(otp);
    const otpExpiredAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    await db.laporanResetPassword.update({
      where: { id },
      data: { otpHash, otpExpiredAt, otpVerified: false, status: "DITERIMA" },
    });

    await sendOtpEmail(laporan.email, laporan.user.nama, otp);

    return NextResponse.json({ message: "Kode OTP berhasil dikirim ke email.", otp }); // otp ikut dibalikin -> admin liat di dashboard (sesuai keputusan lu)
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Gagal mengirim OTP." }, { status });
  }
}