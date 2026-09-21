import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, FULL_CRUD_ADMIN } from "@/lib/rbac";

// ============================
// POST /api/lupa-password -> submit laporan lupa password (PUBLIC, gak perlu login)
// body: { identifier (NIS/NIK), email, tanggalLahir (yyyy-mm-dd), alasan }
// ============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, email, tanggalLahir, alasan } = body;

    // pesan generik yang SAMA PERSIS mau data cocok atau nggak (anti-enumeration)
    const genericResponse = NextResponse.json({
      message: "Jika data yang anda masukkan sesuai, laporan telah diteruskan ke admin.",
    });

    if (!identifier || !email || !tanggalLahir || !alasan) {
      return genericResponse;
    }

    const user = await db.user.findFirst({
      where: {
        OR: [{ nis: identifier }, { nik: identifier }],
      },
    });

    // gak ketemu, atau email/tanggal lahir gak cocok -> tetep balikin pesan generik, gak dikasih tau alasan spesifik
    if (
      !user ||
      user.email.toLowerCase() !== email.toLowerCase().trim() ||
      !user.tanggalLahir ||
      new Date(user.tanggalLahir).toDateString() !== new Date(tanggalLahir).toDateString()
    ) {
      return genericResponse;
    }

    // data valid -> baru bikin laporan beneran
    await db.laporanResetPassword.create({
      data: {
        userId: user.id,
        email: user.email,
        alasan,
        status: "PENDING",
      },
    });

    return genericResponse;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Terjadi kesalahan." }, { status: 500 });
  }
}

// ============================
// GET /api/lupa-password -> daftar laporan (khusus ADMIN)
// ============================
export async function GET() {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const laporanList = await db.laporanResetPassword.findMany({
      where: { status: { in: ["PENDING", "DITERIMA"] } },
      include: {
        user: {
          select: { id: true, nama: true, role: true, nis: true, nik: true, fotoProfil: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: laporanList });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}