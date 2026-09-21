import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string; submissionId: string }> };

async function getOwnedSubmission(asesmenId: string, submissionId: string, userId: string) {
  const asesmen = await db.asesmen.findUnique({ where: { id: asesmenId }, select: { guruId: true } });
  if (!asesmen) return { error: "Asesmen tidak ditemukan.", status: 404 } as const;
  if (asesmen.guruId !== userId) return { error: "Bukan asesmen milik anda.", status: 403 } as const;
  const submission = await db.submission.findUnique({ where: { id: submissionId }, select: { asesmenId: true } });
  if (!submission || submission.asesmenId !== asesmenId) return { error: "Submission tidak ditemukan.", status: 404 } as const;
  return { submission } as const;
}

// DELETE /api/asesmen/[id]/nilai/[submissionId] -> reset satu siswa agar dapat mengerjakan ulang
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);
    const { id: asesmenId, submissionId } = await params;
    const context = await getOwnedSubmission(asesmenId, submissionId, session!.userId);
    if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

    await db.$transaction(async (tx) => {
      await tx.jawabanOpsi.deleteMany({ where: { jawabanSiswa: { submissionId } } });
      await tx.jawabanSiswa.deleteMany({ where: { submissionId } });
      await tx.submission.update({
        where: { id: submissionId },
        data: { status: "BELUM", submittedAt: null, nilaiAkhir: null, mulaiPada: new Date(), tabSwitchCount: 0 },
      });
    });

    return NextResponse.json({ message: "Asesmen siswa berhasil direset." });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PATCH /api/asesmen/[id]/nilai/[submissionId] -> reset nilai akhir tanpa menghapus jawaban
export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);
    const { id: asesmenId, submissionId } = await params;
    const context = await getOwnedSubmission(asesmenId, submissionId, session!.userId);
    if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

    await db.submission.update({ where: { id: submissionId }, data: { nilaiAkhir: null } });
    return NextResponse.json({ message: "Nilai akhir berhasil direset." });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}