import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id: pengumumanId } = await params;
    const body = await req.json();
    const { kelasIds } = body;
    if (!Array.isArray(kelasIds) || kelasIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal 1 kelas tujuan." }, { status: 400 });
    }

    const pengumuman = await db.pengumuman.findUnique({
      where: { id: pengumumanId },
      include: { lampiran: true },
    });
    if (!pengumuman) return NextResponse.json({ error: "Pengumuman tidak ditemukan." }, { status: 404 });
    if (pengumuman.authorId !== session!.userId) {
      return NextResponse.json({ error: "Bukan pengumuman milik anda." }, { status: 403 });
    }

    const targetKelas = await db.kelasGuruMapel.findMany({
      where: { guruId: session!.userId, kelasId: { in: kelasIds } },
      select: { kelasId: true },
    });
    const allowedIds = new Set(targetKelas.map((kelas) => kelas.kelasId));
    const newKelasIds = kelasIds.filter((kelasId: string) => kelasId !== pengumuman.kelasId && allowedIds.has(kelasId));
    if (newKelasIds.length === 0) {
      return NextResponse.json({ error: "Pilih kelas tujuan yang valid dan berbeda." }, { status: 400 });
    }

    await db.$transaction(
      newKelasIds.map((kelasId: string) =>
        db.pengumuman.create({
          data: {
            kelasId,
            authorId: pengumuman.authorId,
            isi: pengumuman.isi,
            lampiran: pengumuman.lampiran.length > 0
              ? { create: pengumuman.lampiran.map((lampiran) => ({ tipe: lampiran.tipe, url: lampiran.url, judul: lampiran.judul, thumbnail: lampiran.thumbnail })) }
              : undefined,
          },
        })
      )
    );

    return NextResponse.json({ message: "Pengumuman berhasil dikirim ke kelas." }, { status: 201 });
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : "";
    const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = errorName === "UnauthorizedError" ? 401 : errorName === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
