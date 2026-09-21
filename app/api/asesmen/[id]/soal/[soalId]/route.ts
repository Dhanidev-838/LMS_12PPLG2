import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string; soalId: string }> }; // id = asesmenId

// PATCH /api/asesmen/[id]/soal/[soalId] -> edit soal (pertanyaan/gambar/opsi)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id: asesmenId, soalId } = await params;
    const body = await req.json();
    const { pertanyaan, gambar, opsi } = body;

    const soal = await db.soal.findUnique({
      where: { id: soalId },
      include: { asesmen: true },
    });
    if (!soal || soal.asesmenId !== asesmenId) {
      return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    }
    if (soal.asesmen.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan soal milik anda." }, { status: 403 });
    }

    await db.$transaction(async (tx) => {
      await tx.soal.update({
        where: { id: soalId },
        data: {
          pertanyaan: pertanyaan || undefined,
          gambar: gambar !== undefined ? gambar || null : undefined,
        },
      });

      // kalau opsi dikirim ulang, replace semua opsi lama
      if (Array.isArray(opsi)) {
        await tx.opsiJawaban.deleteMany({ where: { soalId } });
        await tx.opsiJawaban.createMany({
          data: opsi.map((o: { teks: string; isBenar: boolean }, i: number) => ({
            soalId,
            teks: o.teks,
            isBenar: !!o.isBenar,
            urutan: i + 1,
          })),
        });
      }
    });

    const updated = await db.soal.findUnique({ where: { id: soalId }, include: { opsi: true } });
    return NextResponse.json({ message: "Soal berhasil diperbarui.", data: updated });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// DELETE /api/asesmen/[id]/soal/[soalId] -> hapus soal
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id: asesmenId, soalId } = await params;

    const soal = await db.soal.findUnique({ where: { id: soalId }, include: { asesmen: true } });
    if (!soal || soal.asesmenId !== asesmenId) {
      return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    }
    if (soal.asesmen.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan soal milik anda." }, { status: 403 });
    }

    await db.$transaction([
      db.jawabanOpsi.deleteMany({ where: { jawabanSiswa: { soalId } } }),
      db.jawabanSiswa.deleteMany({ where: { soalId } }),
      db.opsiJawaban.deleteMany({ where: { soalId } }),
      db.soal.delete({ where: { id: soalId } }),
    ]);

    return NextResponse.json({ message: "Soal berhasil dihapus." });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}