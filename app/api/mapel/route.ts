import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER, FULL_CRUD_ADMIN } from "@/lib/rbac";

// GET /api/mapel -> daftar semua mapel
export async function GET() {
  try {
    const session = await getSession();
    requireRole(session, [...ADMIN_TIER, "GURU"]);

    const mapelList = await db.mapel.findMany({ orderBy: { nama: "asc" } });
    return NextResponse.json({ data: mapelList });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// POST /api/mapel -> tambah mapel baru (kalau belum ada di list)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const body = await req.json();
    const { nama } = body;
    if (!nama) return NextResponse.json({ error: "Nama mapel wajib diisi." }, { status: 400 });

    const exists = await db.mapel.findUnique({ where: { nama } });
    if (exists) return NextResponse.json({ error: "Mapel sudah ada." }, { status: 409 });

    const mapelBaru = await db.mapel.create({ data: { nama } });
    return NextResponse.json({ message: "Mapel berhasil ditambahkan.", data: mapelBaru }, { status: 201 });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}