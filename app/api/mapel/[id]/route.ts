import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, FULL_CRUD_ADMIN } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    requireRole(await getSession(), FULL_CRUD_ADMIN);
    const { id } = await params;
    const body = await req.json();
    const nama = typeof body.nama === "string" ? body.nama.replace(/\s+/g, " ").trim() : "";
    if (nama.length < 2 || nama.length > 100) {
      return NextResponse.json({ error: "Nama mapel harus 2–100 karakter." }, { status: 400 });
    }

    const existing = await db.mapel.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Mapel tidak ditemukan." }, { status: 404 });
    const duplicate = await db.mapel.findUnique({ where: { nama } });
    if (duplicate && duplicate.id !== id) return NextResponse.json({ error: "Mapel sudah ada." }, { status: 409 });

    const updated = await db.mapel.update({ where: { id }, data: { nama } });
    return NextResponse.json({ message: "Mapel berhasil diperbarui.", data: updated });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Terjadi kesalahan." }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    requireRole(await getSession(), FULL_CRUD_ADMIN);
    const { id } = await params;
    const mapel = await db.mapel.findUnique({
      where: { id },
      include: { _count: { select: { kelasGuruMapel: true, asesmen: true, tugas: true, materi: true } } },
    });
    if (!mapel) return NextResponse.json({ error: "Mapel tidak ditemukan." }, { status: 404 });
    const used = Object.values(mapel._count).some((count) => count > 0);
    if (used) return NextResponse.json({ error: "Mapel sedang digunakan oleh guru atau konten pembelajaran, jadi tidak dapat dihapus." }, { status: 409 });

    await db.mapel.delete({ where: { id } });
    return NextResponse.json({ message: "Mapel berhasil dihapus." });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Terjadi kesalahan." }, { status });
  }
}
