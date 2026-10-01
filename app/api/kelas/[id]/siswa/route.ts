import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, FULL_CRUD_ADMIN } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const { id: kelasId } = await params;
    const body = await req.json();
    const rawSiswaIds: unknown = body.siswaIds;
    const siswaIds: string[] = Array.isArray(rawSiswaIds)
      ? Array.from(new Set<string>((rawSiswaIds as unknown[]).filter((id): id is string => typeof id === "string" && id.length > 0)))
      : [];

    if (siswaIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal satu siswa." }, { status: 400 });
    }
    if (siswaIds.length > 500) {
      return NextResponse.json({ error: "Maksimal 500 siswa dapat ditambahkan sekaligus." }, { status: 400 });
    }

    const kelas = await db.kelas.findUnique({ where: { id: kelasId }, select: { id: true } });
    if (!kelas) return NextResponse.json({ error: "Kelas tujuan tidak ditemukan." }, { status: 404 });

    const siswaValid = await db.user.findMany({
      where: { id: { in: siswaIds }, role: "SISWA" },
      select: { id: true },
    });
    if (siswaValid.length !== siswaIds.length) {
      return NextResponse.json({ error: "Daftar berisi akun yang bukan siswa atau tidak ditemukan." }, { status: 400 });
    }

    const result = await db.kelasSiswa.createMany({
      data: siswaIds.map((siswaId) => ({ kelasId, siswaId })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: `${result.count} siswa berhasil ditambahkan ke kelas.`,
      data: { ditambahkan: result.count, sudahTerdaftar: siswaIds.length - result.count },
    });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}