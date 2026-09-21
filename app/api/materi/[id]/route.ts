import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/materi/[id] -> edit materi
// body: { judul?, url?, deskripsi?, kelasIds? } -> kelasIds kalau dikirim, replace semua assignment lama
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id } = await params;
    const body = await req.json();
    const { judul, url, deskripsi, kelasIds } = body;

    const existing = await db.materi.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    if (existing.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan materi milik anda." }, { status: 403 });
    }

    const updated = await db.$transaction(async (tx) => {
      const materi = await tx.materi.update({
        where: { id },
        data: {
          judul: judul || undefined,
          url: url || undefined,
          deskripsi: deskripsi !== undefined ? deskripsi || null : undefined,
        },
      });

      if (Array.isArray(kelasIds) && kelasIds.length > 0) {
        await tx.materiKelas.deleteMany({ where: { materiId: id } });
        await tx.materiKelas.createMany({
          data: kelasIds.map((kelasId: string) => ({ materiId: id, kelasId })),
        });
      }

      return materi;
    });

    return NextResponse.json({ message: "Materi berhasil diperbarui.", data: updated });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// DELETE /api/materi/[id] -> hapus materi
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id } = await params;
    const existing = await db.materi.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    if (existing.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan materi milik anda." }, { status: 403 });
    }

    await db.$transaction([
      db.materiKelas.deleteMany({ where: { materiId: id } }),
      db.materi.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Materi berhasil dihapus." });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}