import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string; soalId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id: asesmenId, soalId } = await params;
    const body = await req.json();
    const { opsiBenarIds } = body;

    if (!Array.isArray(opsiBenarIds)) {
      return NextResponse.json({ error: "opsiBenarIds wajib berupa array." }, { status: 400 });
    }

    const soal = await db.soal.findUnique({
      where: { id: soalId },
      include: { asesmen: true, opsi: true },
    });
    if (!soal || soal.asesmenId !== asesmenId) {
      return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    }
    if (soal.asesmen.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan soal milik anda." }, { status: 403 });
    }
    if (soal.tipe === "ESSAY") {
      return NextResponse.json({ error: "Soal Essay tidak punya kunci jawaban." }, { status: 400 });
    }
    if (soal.tipe === "PILIHAN_GANDA" && opsiBenarIds.length > 1) {
      return NextResponse.json({ error: "Pilihan Ganda cuma boleh 1 jawaban benar." }, { status: 400 });
    }

    await db.$transaction(
      soal.opsi.map((o) =>
        db.opsiJawaban.update({ where: { id: o.id }, data: { isBenar: opsiBenarIds.includes(o.id) } })
      )
    );

    const updated = await db.soal.findUnique({ where: { id: soalId }, include: { opsi: true } });
    return NextResponse.json({ message: "Kunci jawaban tersimpan.", data: updated });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}