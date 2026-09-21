import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ token: string }> };

// GET /api/kelas/join/[token] -> preview info kelas sebelum join (dipanggil pas halaman invite link dibuka)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["SISWA"]); // cuma siswa yang bisa gabung lewat link, sesuai spek

    const { token } = await params;

    const kelas = await db.kelas.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        judul: true,
        deskripsi: true,
        _count: { select: { siswa: true } },
      },
    });

    if (!kelas) {
      return NextResponse.json({ error: "Link undangan tidak valid atau sudah kedaluwarsa." }, { status: 404 });
    }

    const sudahGabung = await db.kelasSiswa.findFirst({
      where: { kelasId: kelas.id, siswaId: session!.userId },
    });

    return NextResponse.json({ data: { ...kelas, sudahGabung: !!sudahGabung } });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// POST /api/kelas/join/[token] -> siswa join kelas via invite link
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["SISWA"]);

    const { token } = await params;

    const kelas = await db.kelas.findUnique({ where: { inviteToken: token } });
    if (!kelas) {
      return NextResponse.json({ error: "Link undangan tidak valid atau sudah kedaluwarsa." }, { status: 404 });
    }

    const sudahGabung = await db.kelasSiswa.findFirst({
      where: { kelasId: kelas.id, siswaId: session!.userId },
    });
    if (sudahGabung) {
      return NextResponse.json({ error: "Anda sudah tergabung di kelas ini." }, { status: 409 });
    }

    await db.kelasSiswa.create({
      data: { kelasId: kelas.id, siswaId: session!.userId },
    });

    return NextResponse.json(
      { message: `Berhasil bergabung ke kelas "${kelas.judul}".`, data: { kelasId: kelas.id } },
      { status: 201 }
    );
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}