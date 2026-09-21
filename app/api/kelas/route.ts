import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, requireAuth, FULL_CRUD_ADMIN, ADMIN_TIER } from "@/lib/rbac";

// GET /api/kelas -> daftar kelas, SCOPED per role:
// - ADMIN_TIER: semua kelas (buat listing admin & dropdown "Kirim ke Kelas" gak relevan buat role ini)
// - GURU: cuma kelas yang dia ajar (KelasGuruMapel) -- penting biar dropdown "Kirim ke Kelas" di
//   ModalTugas/ModalBuatAsesmen/ModalMateri gak nampilin kelas orang lain
// - SISWA: cuma kelas yang dia ikuti (KelasSiswa)
export async function GET() {
  const session = requireAuth(await getSession());

  if (session.role === "GURU") {
    const kelas = await db.kelas.findMany({
      where: { guruMapel: { some: { guruId: session.userId } } },
      include: { _count: { select: { siswa: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ data: kelas });
  }

  if (session.role === "SISWA") {
    const kelas = await db.kelas.findMany({
      where: { siswa: { some: { siswaId: session.userId } } },
      include: { _count: { select: { siswa: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ data: kelas });
  }

  // ADMIN_TIER
  const kelas = await db.kelas.findMany({
    include: { _count: { select: { siswa: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ data: kelas });
}

// POST /api/kelas -> buat kelas baru
// body: { judul, deskripsi? }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const body = await req.json();
    const { judul, deskripsi } = body;

    if (!judul) {
      return NextResponse.json({ error: "Judul wajib diisi." }, { status: 400 });
    }

    const kelas = await db.kelas.create({
      data: {
        judul,
        deskripsi: deskripsi || null,
      },
    });

    return NextResponse.json({ data: kelas }, { status: 201 });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}