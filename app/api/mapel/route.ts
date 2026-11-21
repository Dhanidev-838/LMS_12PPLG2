import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER, FULL_CRUD_ADMIN, ForbiddenError, UnauthorizedError } from "@/lib/rbac";

function errorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
  const status = err instanceof UnauthorizedError ? 401 : err instanceof ForbiddenError ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}

// GET /api/mapel -> daftar semua mapel
export async function GET() {
  try {
    const session = await getSession();
    requireRole(session, [...ADMIN_TIER, "GURU"]);

    const mapelList = await db.mapel.findMany({
      orderBy: { nama: "asc" },
      include: { _count: { select: { kelasGuruMapel: true, asesmen: true, tugas: true, materi: true } } },
    });
    return NextResponse.json({ data: mapelList }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    return errorResponse(err);
  }
}

// POST /api/mapel -> tambah mapel baru (kalau belum ada di list)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const body = await req.json();
    const nama = typeof body.nama === "string" ? body.nama.replace(/\s+/g, " ").trim() : "";
    if (nama.length < 2 || nama.length > 100) return NextResponse.json({ error: "Nama mapel harus 2–100 karakter." }, { status: 400 });

    const exists = await db.mapel.findUnique({ where: { nama } });
    if (exists) return NextResponse.json({ error: "Mapel sudah ada." }, { status: 409 });

    const mapelBaru = await db.mapel.create({ data: { nama } });
    return NextResponse.json({ message: "Mapel berhasil ditambahkan.", data: mapelBaru }, { status: 201 });
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
