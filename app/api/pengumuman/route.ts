import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";

// GET /api/pengumuman?kelasId=xxx -> daftar pengumuman di kelas itu (gak ada lagi konsep komentar)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SISWA", ...ADMIN_TIER]);

    const kelasId = req.nextUrl.searchParams.get("kelasId");
    if (!kelasId) {
      return NextResponse.json({ error: "Query 'kelasId' wajib diisi." }, { status: 400 });
    }

    const pengumumanList = await db.pengumuman.findMany({
      where: { kelasId },
      include: {
        author: { select: { id: true, nama: true, fotoProfil: true, role: true } },
        lampiran: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: pengumumanList });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// POST /api/pengumuman -> buat pengumuman baru
// cuma GURU yang bisa posting (siswa gak punya hak lagi -- sebelumnya siswa juga bisa, sekarang enggak)
// body: { kelasId, isi, lampiran?: [{ tipe: FILE|LINK|VIDEO, url, judul?, thumbnail? }] }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const body = await req.json();
    const { kelasId, isi, lampiran } = body;

    if (!kelasId) {
      return NextResponse.json({ error: "Kelas wajib diisi." }, { status: 400 });
    }
    if (!String(isi ?? "").trim() && (!Array.isArray(lampiran) || lampiran.length === 0)) {
      return NextResponse.json({ error: "Isi pengumuman atau lampiran wajib ditambahkan." }, { status: 400 });
    }

    // guru wajib ngajar di kelas ini (KelasGuruMapel) -- gak ada lagi cek walas
    const isPengajar = await db.kelasGuruMapel.findFirst({ where: { kelasId, guruId: session!.userId } });
    if (!isPengajar) {
      return NextResponse.json({ error: "Anda tidak mengajar di kelas ini." }, { status: 403 });
    }

    const pengumumanBaru = await db.pengumuman.create({
      data: {
        kelasId,
        authorId: session!.userId,
        isi: String(isi ?? "").trim(),
        lampiran:
          Array.isArray(lampiran) && lampiran.length > 0
            ? {
                create: lampiran.map((l: { tipe: string; url: string; judul?: string; thumbnail?: string }) => ({
                  tipe: l.tipe,
                  url: l.url,
                  judul: l.judul || null,
                  thumbnail: l.thumbnail || null,
                })),
              }
            : undefined,
      },
      include: {
        author: { select: { id: true, nama: true, fotoProfil: true, role: true } },
        lampiran: true,
      },
    });

    return NextResponse.json(
      { message: "Pengumuman berhasil dibuat.", data: pengumumanBaru },
      { status: 201 }
    );
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}