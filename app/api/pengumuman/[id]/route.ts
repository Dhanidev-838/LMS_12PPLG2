import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SISWA", ...ADMIN_TIER]);

    const { id } = await params;

    const pengumuman = await db.pengumuman.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, nama: true, fotoProfil: true, role: true } },
        lampiran: true,
      },
    });

    if (!pengumuman) {
      return NextResponse.json({ error: "Pengumuman tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ data: pengumuman });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id } = await params;
    const body = await req.json();
    const { isi, kelasId, lampiran } = body;

    const existing = await db.pengumuman.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Pengumuman tidak ditemukan." }, { status: 404 });
    if (existing.authorId !== session!.userId) {
      return NextResponse.json({ error: "Bukan pengumuman milik anda." }, { status: 403 });
    }

    if (!String(isi ?? "").trim() && (!Array.isArray(lampiran) || lampiran.length === 0)) {
      return NextResponse.json({ error: "Isi pengumuman atau lampiran wajib ditambahkan." }, { status: 400 });
    }

    if (kelasId) {
      const isPengajar = await db.kelasGuruMapel.findFirst({ where: { kelasId, guruId: session!.userId } });
      if (!isPengajar) return NextResponse.json({ error: "Anda tidak mengajar di kelas tujuan." }, { status: 403 });
    }

    const updated = await db.$transaction(async (tx) => {
      await tx.lampiran.deleteMany({ where: { pengumumanId: id } });
      return tx.pengumuman.update({
        where: { id },
        data: {
          isi: String(isi ?? "").trim(),
          kelasId: kelasId || existing.kelasId,
          lampiran: Array.isArray(lampiran) && lampiran.length > 0
            ? { create: lampiran.map((item: { tipe: string; url: string; judul?: string; thumbnail?: string }) => ({ tipe: item.tipe, url: item.url, judul: item.judul || null, thumbnail: item.thumbnail || null })) }
            : undefined,
        },
        include: {
          author: { select: { id: true, nama: true, fotoProfil: true, role: true } },
          lampiran: true,
        },
      });
    });

    return NextResponse.json({ message: "Berhasil diperbarui.", data: updated });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id } = await params;

    const existing = await db.pengumuman.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Pengumuman tidak ditemukan." }, { status: 404 });
    if (existing.authorId !== session!.userId) {
      return NextResponse.json({ error: "Bukan pengumuman milik anda." }, { status: 403 });
    }

    await db.$transaction([
      db.lampiran.deleteMany({ where: { pengumumanId: id } }),
      db.pengumuman.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Berhasil dihapus." });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}