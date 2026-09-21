import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";

// GET /api/materi?kelasId=xxx -> daftar materi (filter per kelas, buat siswa/guru liat di halaman kelas)
// tanpa query kelasId -> daftar materi milik guru yang login (buat tab Materi guru)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SISWA", ...ADMIN_TIER]);

    const kelasId = req.nextUrl.searchParams.get("kelasId");

    if (kelasId) {
      const materiList = await db.materi.findMany({
        where: { kelasTujuan: { some: { kelasId } } },
        include: { guru: { select: { id: true, nama: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ data: materiList });
    }

    // tanpa kelasId -> harus guru, nampilin materi punya dia sendiri
    requireRole(session, ["GURU"]);
    const materiList = await db.materi.findMany({
      where: { guruId: session!.userId },
      include: { kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } } }, // kelasReferensi dihapus, pakai judul
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: materiList });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// POST /api/materi -> buat materi baru
// body: { judul, tipe: PDF|LINK, url, deskripsi?, kelasIds: string[] }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const body = await req.json();
    const { judul, tipe, url, deskripsi, kelasIds } = body;

    if (!judul || !tipe || !url || !Array.isArray(kelasIds) || kelasIds.length === 0) {
      return NextResponse.json(
        { error: "Judul, tipe, url, dan minimal 1 kelas tujuan wajib diisi." },
        { status: 400 }
      );
    }
    if (!["PDF", "LINK"].includes(tipe)) {
      return NextResponse.json({ error: "Tipe materi tidak valid." }, { status: 400 });
    }

    const materiBaru = await db.$transaction(async (tx) => {
      const materi = await tx.materi.create({
        data: {
          guruId: session!.userId,
          judul,
          tipe,
          url,
          deskripsi: deskripsi || null,
        },
      });

      await tx.materiKelas.createMany({
        data: kelasIds.map((kelasId: string) => ({ materiId: materi.id, kelasId })),
      });

      return materi;
    });

    return NextResponse.json({ message: "Materi berhasil ditambahkan.", data: materiBaru }, { status: 201 });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}