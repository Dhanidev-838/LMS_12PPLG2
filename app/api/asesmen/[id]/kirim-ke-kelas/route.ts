import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> }; // id = asesmenId

// POST /api/asesmen/[id]/kirim-ke-kelas -> assign asesmen yang sudah ada ke kelas tambahan
// body: { kelasIds: string[] }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id: asesmenId } = await params;
    const body = await req.json();
    const { kelasIds } = body;

    if (!Array.isArray(kelasIds) || kelasIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal 1 kelas tujuan." }, { status: 400 });
    }

    const asesmen = await db.asesmen.findUnique({ where: { id: asesmenId } });
    if (!asesmen) return NextResponse.json({ error: "Asesmen tidak ditemukan." }, { status: 404 });
    if (asesmen.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan asesmen milik anda." }, { status: 403 });
    }

    // cek kelas mana yang belum ke-assign, biar gak duplikat (unique constraint asesmenId+kelasId)
    const existing = await db.asesmenKelas.findMany({
      where: { asesmenId, kelasId: { in: kelasIds } },
      select: { kelasId: true },
    });
    const existingIds = new Set(existing.map((e) => e.kelasId));
    const kelasIdsBaru = kelasIds.filter((id: string) => !existingIds.has(id));

    if (kelasIdsBaru.length === 0) {
      return NextResponse.json({ error: "Asesmen ini sudah dikirim ke semua kelas yang dipilih." }, { status: 409 });
    }

    await db.asesmenKelas.createMany({
      data: kelasIdsBaru.map((kelasId: string) => ({ asesmenId, kelasId })),
    });

    return NextResponse.json({ message: "Asesmen berhasil dikirim ke kelas." }, { status: 201 });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}