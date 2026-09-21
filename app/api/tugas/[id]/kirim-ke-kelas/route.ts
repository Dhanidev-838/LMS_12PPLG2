import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

// POST /api/tugas/[id]/kirim-ke-kelas -> kirim tugas yang udah ada (mungkin masih "cuma disimpen")
// ke kelas tambahan. body: { kelasIds: string[] }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id: tugasId } = await params;
    const body = await req.json();
    const { kelasIds } = body;

    if (!Array.isArray(kelasIds) || kelasIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal 1 kelas tujuan." }, { status: 400 });
    }

    const tugas = await db.tugas.findUnique({ where: { id: tugasId } });
    if (!tugas) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    if (tugas.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan tugas milik anda." }, { status: 403 });
    }

    const existing = await db.tugasKelas.findMany({
      where: { tugasId, kelasId: { in: kelasIds } },
      select: { kelasId: true },
    });
    const existingIds = new Set(existing.map((e) => e.kelasId));
    const kelasIdsBaru = kelasIds.filter((id: string) => !existingIds.has(id));

    if (kelasIdsBaru.length === 0) {
      return NextResponse.json({ error: "Tugas ini sudah dikirim ke semua kelas yang dipilih." }, { status: 409 });
    }

    await db.tugasKelas.createMany({
      data: kelasIdsBaru.map((kelasId: string) => ({ tugasId, kelasId })),
    });

    return NextResponse.json({ message: "Tugas berhasil dikirim ke kelas." }, { status: 201 });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}