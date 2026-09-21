import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

// POST /api/asesmen/[id]/selesai -> siswa selesaiin/kumpulin asesmen.
// Jawaban udah kesimpen bertahap lewat /jawab, jadi di sini cuma nutup submission-nya.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["SISWA"]);

    const { id: asesmenId } = await params;

    const submission = await db.submission.findUnique({
      where: { asesmenId_siswaId: { asesmenId, siswaId: session!.userId } },
    });
    if (!submission) {
      return NextResponse.json({ error: "Anda belum memulai asesmen ini." }, { status: 404 });
    }
    if (submission.status === "SUDAH") {
      return NextResponse.json({ error: "Asesmen ini sudah pernah dikumpulkan." }, { status: 409 });
    }

    const updated = await db.submission.update({
      where: { id: submission.id },
      data: { status: "SUDAH", submittedAt: new Date() },
    });

    return NextResponse.json({ message: "Asesmen berhasil diselesaikan.", data: updated });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}