import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";

// GET /api/materi -> daftar materi yang boleh dilihat oleh role yang login
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SISWA", ...ADMIN_TIER]);

    const kelasId = req.nextUrl.searchParams.get("kelasId");
    let kelasSiswaIds: string[] = [];

    if (!kelasId && ADMIN_TIER.includes(session!.role)) {
      requireRole(session, ["GURU"]);
    }

    if (session!.role === "SISWA") {
      const keanggotaan = await db.kelasSiswa.findMany({
        where: { siswaId: session!.userId },
        select: { kelasId: true },
      });
      kelasSiswaIds = keanggotaan.map((item) => item.kelasId);

      if (kelasId && !kelasSiswaIds.includes(kelasId)) {
        return NextResponse.json({ error: "Anda bukan anggota kelas ini." }, { status: 403 });
      }
    }

    const kelasTerlihatIds = session!.role === "SISWA"
      ? kelasId ? [kelasId] : kelasSiswaIds
      : kelasId ? [kelasId] : undefined;
    const filterKelas = kelasTerlihatIds ? { kelasId: { in: kelasTerlihatIds } } : undefined;
    const where = session!.role === "GURU"
      ? {
          guruId: session!.userId,
          ...(kelasId ? { kelasTujuan: { some: { kelasId } } } : {}),
        }
      : kelasTerlihatIds
        ? { kelasTujuan: { some: { kelasId: { in: kelasTerlihatIds } } } }
        : {};

    const materiList = await db.materi.findMany({
      where,
      include: {
        guru: { select: { id: true, nama: true } },
        kelasTujuan: {
          where: filterKelas,
          include: { kelas: { select: { id: true, judul: true } } },
        },
      },
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
      if (!["PDF", "FILE", "IMAGE", "LINK"].includes(tipe)) {
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