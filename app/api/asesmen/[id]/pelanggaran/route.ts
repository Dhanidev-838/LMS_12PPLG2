import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

// POST /api/asesmen/[id]/pelanggaran -> catat siswa yang keluar dari asesmen.
// Reset dilakukan setiap tiga pelanggaran: ke-3, ke-6, ke-9, dan seterusnya.
// Pelanggaran di antaranya hanya memberi peringatan dan tidak menyentuh essay.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["SISWA"]);

    const { id: asesmenId } = await params;

    const submission = await db.submission.findUnique({
      where: { asesmenId_siswaId: { asesmenId, siswaId: session!.userId } },
      include: { jawaban: { include: { soal: true, opsiDipilih: true } } },
    });
    if (!submission) {
      return NextResponse.json({ error: "Anda belum memulai asesmen ini." }, { status: 404 });
    }
    if (submission.status === "SUDAH") {
      // udah kekumpul, gak ada yang perlu direset lagi
      return NextResponse.json({ message: "Asesmen sudah selesai.", jumlahDireset: 0 });
    }

    const violationCount = submission.tabSwitchCount + 1;
    const shouldReset = violationCount >= 3 && violationCount % 3 === 0;
    const idsToDelete = shouldReset
      ? submission.jawaban.filter((j) => j.soal.tipe !== "ESSAY" && j.opsiDipilih.length > 0).map((j) => j.id)
      : [];

    const jumlahDireset = idsToDelete.length;
    await db.$transaction(async (tx) => {
      if (idsToDelete.length > 0) {
        await tx.jawabanOpsi.deleteMany({ where: { jawabanSiswaId: { in: idsToDelete } } });
        await tx.jawabanSiswa.deleteMany({ where: { id: { in: idsToDelete } } });
      }
      await tx.submission.update({
        where: { id: submission.id },
        data: { tabSwitchCount: violationCount },
      });
    });

    return NextResponse.json({ message: "Pelanggaran tercatat.", violationCount, jumlahDireset });
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : "";
    const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = errorName === "UnauthorizedError" ? 401 : errorName === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}