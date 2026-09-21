import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ token: string }> };

// POST /api/kelas/join/[token] -> join kelas memakai kode atau link undangan.
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["SISWA", "GURU"]);

    const { token } = await params;
    const kelas = await db.kelas.findUnique({ where: { inviteToken: token } });
    if (!kelas) {
      return NextResponse.json({ error: "Kode atau link undangan tidak valid." }, { status: 404 });
    }

    if (session!.role === "SISWA") {
      const existing = await db.kelasSiswa.findUnique({
        where: { kelasId_siswaId: { kelasId: kelas.id, siswaId: session!.userId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Anda sudah tergabung di kelas ini." }, { status: 409 });
      }

      await db.kelasSiswa.create({ data: { kelasId: kelas.id, siswaId: session!.userId } });
      return NextResponse.json(
        { message: `Berhasil bergabung ke kelas "${kelas.judul}".`, data: { kelasId: kelas.id } },
        { status: 201 }
      );
    }

    const existingTeacher = await db.kelasGuruMapel.findFirst({
      where: { kelasId: kelas.id, guruId: session!.userId },
    });
    if (existingTeacher) {
      return NextResponse.json({ error: "Anda sudah terhubung ke kelas ini." }, { status: 409 });
    }

    const classMapel = await db.kelasGuruMapel.findFirst({
      where: { kelasId: kelas.id },
      select: { mapelId: true },
    });
    if (!classMapel) {
      return NextResponse.json(
        { error: "Kelas ini belum memiliki mapel. Minta admin menambahkan mapel sebelum guru bergabung." },
        { status: 400 }
      );
    }

    await db.kelasGuruMapel.create({
      data: { kelasId: kelas.id, guruId: session!.userId, mapelId: classMapel.mapelId },
    });
    return NextResponse.json(
      { message: `Berhasil terhubung ke kelas "${kelas.judul}".`, data: { kelasId: kelas.id } },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : "";
    const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = errorName === "UnauthorizedError" ? 401 : errorName === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
