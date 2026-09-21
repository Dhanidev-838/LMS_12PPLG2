import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

// POST /api/asesmen/[id]/jawab -> autosave jawaban 1 soal (dipanggil tiap siswa jawab/ganti jawaban/tandain ragu-ragu)
// body: { soalId, opsiIds?: string[], jawabanEssay?: string, raguRagu?: boolean }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["SISWA"]);

    const { id: asesmenId } = await params;
    const body = await req.json();
    const { soalId, opsiIds, jawabanEssay, raguRagu } = body;

    if (!soalId) {
      return NextResponse.json({ error: "soalId wajib diisi." }, { status: 400 });
    }

    const submission = await db.submission.findUnique({
      where: { asesmenId_siswaId: { asesmenId, siswaId: session!.userId } },
    });
    if (!submission) {
      return NextResponse.json({ error: "Anda belum memulai asesmen ini." }, { status: 404 });
    }
    if (submission.status === "SUDAH") {
      return NextResponse.json({ error: "Asesmen ini sudah dikumpulkan." }, { status: 409 });
    }

    const soal = await db.soal.findUnique({ where: { id: soalId } });
    if (!soal || soal.asesmenId !== asesmenId) {
      return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    }

    const jawaban = await db.$transaction(async (tx) => {
      const existing = await tx.jawabanSiswa.findFirst({ where: { submissionId: submission.id, soalId } });

      let jawabanSiswa;
      if (existing) {
        jawabanSiswa = await tx.jawabanSiswa.update({
          where: { id: existing.id },
          data: {
            jawabanEssay: jawabanEssay !== undefined ? jawabanEssay || null : existing.jawabanEssay,
            raguRagu: raguRagu !== undefined ? raguRagu : existing.raguRagu,
          },
        });
        // opsi lama dihapus dulu -- kalau opsiIds dikirim, di-replace; kalau gak dikirim (cuma toggle raguRagu), biarin
        if (opsiIds !== undefined) {
          await tx.jawabanOpsi.deleteMany({ where: { jawabanSiswaId: jawabanSiswa.id } });
        }
      } else {
        jawabanSiswa = await tx.jawabanSiswa.create({
          data: {
            submissionId: submission.id,
            soalId,
            jawabanEssay: jawabanEssay || null,
            raguRagu: !!raguRagu,
          },
        });
      }

      if (Array.isArray(opsiIds) && opsiIds.length > 0) {
        await tx.jawabanOpsi.createMany({
          data: opsiIds.map((opsiId: string) => ({ jawabanSiswaId: jawabanSiswa.id, opsiJawabanId: opsiId })),
        });
      }

      return jawabanSiswa;
    });

    return NextResponse.json({ message: "Jawaban tersimpan.", data: jawaban });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}