import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

// POST /api/tugas/[id]/submit -> siswa kumpulin/update jawaban tugas.
// SENGAJA cuma nerima lampiran (file/pdf/link) -- gak ada field teks sama sekali.
// Bisa dipanggil ulang buat ganti lampiran (upsert, replace semua lampiran lama).
// body: { lampiran: [{ tipe: FILE|LINK, url, judul? }] }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["SISWA"]);

    const { id: tugasId } = await params;
    const body = await req.json();
    const { lampiran } = body;

    if (!Array.isArray(lampiran) || lampiran.length === 0) {
      return NextResponse.json({ error: "Lampirkan minimal 1 file/link untuk mengumpulkan tugas." }, { status: 400 });
    }

    const tugas = await db.tugas.findUnique({
      where: { id: tugasId },
      include: { kelasTujuan: { select: { kelasId: true } } },
    });
    if (!tugas) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });

    const kelasIdTujuan = tugas.kelasTujuan.map((tk) => tk.kelasId);
    const isAnggota = await db.kelasSiswa.findFirst({
      where: { siswaId: session!.userId, kelasId: { in: kelasIdTujuan } },
    });
    if (!isAnggota) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke tugas ini." }, { status: 403 });
    }

    const submission = await db.$transaction(async (tx) => {
      const sub = await tx.tugasSubmission.upsert({
        where: { tugasId_siswaId: { tugasId, siswaId: session!.userId } },
        update: { status: "SUDAH", submittedAt: new Date() },
        create: { tugasId, siswaId: session!.userId, status: "SUDAH", submittedAt: new Date() },
      });

      // replace semua lampiran lama (buat skenario edit/re-submit)
      await tx.lampiranTugasSubmission.deleteMany({ where: { submissionId: sub.id } });
      await tx.lampiranTugasSubmission.createMany({
        data: lampiran.map((l: { tipe: string; url: string; judul?: string }) => ({
          submissionId: sub.id,
          tipe: l.tipe,
          url: l.url,
          judul: l.judul || null,
        })),
      });

      return sub;
    });

    return NextResponse.json({ message: "Tugas berhasil dikumpulkan.", data: submission });
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : "";
    const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = errorName === "UnauthorizedError" ? 401 : errorName === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

// DELETE /api/tugas/[id]/submit -> siswa menghapus jawaban tugasnya.
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["SISWA", "GURU"]);

    const { id: tugasId } = await params;
    const submissionId = req.nextUrl.searchParams.get("submissionId");
    const tugas = await db.tugas.findUnique({ where: { id: tugasId }, select: { guruId: true } });
    if (!tugas) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    if (session!.role === "GURU" && tugas.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan tugas milik anda." }, { status: 403 });
    }
    const submission = session!.role === "GURU"
      ? submissionId ? await db.tugasSubmission.findFirst({ where: { id: submissionId, tugasId }, select: { id: true } }) : null
      : await db.tugasSubmission.findUnique({ where: { tugasId_siswaId: { tugasId, siswaId: session!.userId } }, select: { id: true } });

    if (!submission) {
      return NextResponse.json({ error: "Jawaban belum dikumpulkan." }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.lampiranTugasSubmission.deleteMany({ where: { submissionId: submission.id } });
      await tx.tugasSubmission.delete({ where: { id: submission.id } });
    });

    return NextResponse.json({ message: "Jawaban berhasil dihapus." });
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : "";
    const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = errorName === "UnauthorizedError" ? 401 : errorName === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}