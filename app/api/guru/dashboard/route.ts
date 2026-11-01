import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SUPER_ADMIN"]);
    const guruId = session!.userId;
    const contentScope = session!.role === "SUPER_ADMIN" ? {} : { guruId };
    const participantScope = session!.role === "SUPER_ADMIN" ? {} : { siswa: { role: { not: "SUPER_ADMIN" as const } } };

    const [kelas, asesmen, tugas, materi, submissionDinilai, essayBelumDinilai, tugasDikumpulkan, asesmenTerbaru, tugasTerbaru] = await Promise.all([
      db.kelas.findMany({
        where: session!.role === "SUPER_ADMIN" ? undefined : { guruMapel: { some: { guruId } } },
        select: { id: true, judul: true, _count: { select: { siswa: true } } },
        orderBy: { createdAt: "asc" },
      }),
      db.asesmen.count({ where: contentScope }),
      db.tugas.count({ where: contentScope }),
      db.materi.count({ where: contentScope }),
      db.submission.count({ where: { ...participantScope, asesmen: contentScope, status: "SUDAH", nilaiAkhir: { not: null } } }),
      db.jawabanSiswa.count({ where: { soal: { asesmen: contentScope, tipe: "ESSAY" }, nilaiSoal: null, submission: { ...participantScope, status: "SUDAH" } } }),
      db.tugasSubmission.count({ where: { ...participantScope, tugas: contentScope, status: "SUDAH" } }),
      db.asesmen.findMany({ where: contentScope, select: { id: true, judul: true, tipe: true, status: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 5 }),
      db.tugas.findMany({
        where: contentScope,
        select: {
          id: true,
          judul: true,
          createdAt: true,
          _count: { select: { submission: { where: participantScope } } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const siswaIds = await db.kelasSiswa.findMany({
      where: { kelasId: { in: kelas.map((item) => item.id) } },
      select: { siswaId: true },
      distinct: ["siswaId"],
    });

    return NextResponse.json({ data: {
      statistik: { totalKelas: kelas.length, totalSiswa: siswaIds.length, totalAsesmen: asesmen, totalTugas: tugas, totalMateri: materi, submissionDinilai, essayBelumDinilai, tugasDikumpulkan },
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
