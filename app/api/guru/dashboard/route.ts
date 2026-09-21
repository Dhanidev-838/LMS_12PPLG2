import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);
    const guruId = session!.userId;

    const [kelas, asesmen, tugas, submissionDinilai, essayBelumDinilai, tugasDikumpulkan, asesmenTerbaru, tugasTerbaru] = await Promise.all([
      db.kelas.findMany({
        where: { guruMapel: { some: { guruId } } },
        select: { id: true, judul: true, _count: { select: { siswa: true } } },
        orderBy: { createdAt: "asc" },
      }),
      db.asesmen.count({ where: { guruId } }),
      db.tugas.count({ where: { guruId } }),
      db.submission.count({ where: { asesmen: { guruId }, status: "SUDAH", nilaiAkhir: { not: null } } }),
      db.jawabanSiswa.count({ where: { soal: { asesmen: { guruId }, tipe: "ESSAY" }, nilaiSoal: null, submission: { status: "SUDAH" } } }),
      db.tugasSubmission.count({ where: { tugas: { guruId }, status: "SUDAH" } }),
      db.asesmen.findMany({ where: { guruId }, select: { id: true, judul: true, tipe: true, status: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 5 }),
      db.tugas.findMany({ where: { guruId }, select: { id: true, judul: true, createdAt: true, _count: { select: { submission: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

    const siswaIds = await db.kelasSiswa.findMany({
      where: { kelasId: { in: kelas.map((item) => item.id) } },
      select: { siswaId: true },
      distinct: ["siswaId"],
    });

    return NextResponse.json({ data: {
      statistik: { totalKelas: kelas.length, totalSiswa: siswaIds.length, totalAsesmen: asesmen, totalTugas: tugas, submissionDinilai, essayBelumDinilai, tugasDikumpulkan },
      kelas,
      asesmenTerbaru,
      tugasTerbaru,
    } });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
