import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, FULL_CRUD_ADMIN } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

// POST /api/lupa-password/[id]/tolak -> admin tolak, hapus laporan
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const { id } = await params;
    const laporan = await db.laporanResetPassword.findUnique({ where: { id } });
    if (!laporan) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });

    await db.laporanResetPassword.delete({ where: { id } });

    return NextResponse.json({ message: "Laporan ditolak dan dihapus." });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}