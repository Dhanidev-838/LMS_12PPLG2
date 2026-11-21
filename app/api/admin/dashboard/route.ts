import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";
import { activityDate } from "@/lib/activity-date";

export async function GET() {
  try {
    const session = await getSession();
    requireRole(session, ADMIN_TIER);

    const activityStart = activityDate(new Date());
    activityStart.setUTCDate(activityStart.getUTCDate() - 13);
    const activityWindowStart = new Date(activityStart.getTime() - 7 * 60 * 60 * 1000);

    const [kelas, siswa, guru, asesmen, tugas, materi, mapel, laporanPending, akunTerbaru, asesmenPerTipe, nilaiAggregate, tugasDibuat, tugasDikumpulkan, recentAssessments, recentTasks, recentSubmissions, recentTaskSubmissions, academicRows, learningAssessments, learningTasks, recentLogins] = await Promise.all([
      db.kelas.count(),
      db.user.count({ where: { role: "SISWA" } }),
      db.user.count({ where: { role: "GURU" } }),
      db.asesmen.count(),
      db.tugas.count(),
      db.materi.count(),
      db.mapel.count(),
      db.laporanResetPassword.count({ where: { status: "PENDING" } }),
      db.user.findMany({
        where: { role: { in: ["SISWA", "GURU"] } },
        select: { id: true, nama: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.asesmen.groupBy({ by: ["tipe"], _count: { _all: true } }),
      db.submission.aggregate({ where: { status: "SUDAH", nilaiAkhir: { not: null } }, _avg: { nilaiAkhir: true }, _count: { _all: true } }),
      db.tugas.count(),
      db.tugasSubmission.count({ where: { status: "SUDAH" } }),
      db.asesmen.findMany({ where: { createdAt: { gte: activityWindowStart } }, select: { guruId: true, createdAt: true } }),
      db.tugas.findMany({ where: { createdAt: { gte: activityWindowStart } }, select: { guruId: true, createdAt: true } }),
      db.submission.findMany({ where: { mulaiPada: { gte: activityWindowStart } }, select: { siswaId: true, mulaiPada: true } }),
      db.tugasSubmission.findMany({ where: { submittedAt: { gte: activityWindowStart, not: null }, status: "SUDAH" }, select: { siswaId: true, submittedAt: true } }),
      db.asesmen.findMany({
        where: { status: "SELESAI" },
        select: {
          id: true,
          judul: true,
          createdAt: true,
          mapel: { select: { nama: true } },
          kelasTujuan: { select: { kelas: { select: { id: true, judul: true } } } },
          submission: { where: { status: "SUDAH", nilaiAkhir: { not: null } }, select: { nilaiAkhir: true, submittedAt: true } },
        },
      }),
      db.asesmen.findMany({
        where: { status: "SELESAI" },
        select: {
          id: true,
          kelasTujuan: { select: { kelas: { select: { siswa: { select: { siswaId: true } } } } } },
          submission: { select: { siswaId: true, status: true } },
        },
      }),
      db.tugas.findMany({
        select: {
          id: true,
          kelasTujuan: { select: { kelas: { select: { siswa: { select: { siswaId: true } } } } } },
          submission: { select: { siswaId: true, status: true } },
        },
      }),
      db.loginAktivitas.findMany({ where: { tanggal: { gte: activityStart } }, select: { userId: true, tanggal: true, user: { select: { role: true } } } }),
    ]);

    const kuis = asesmenPerTipe.find((item) => item.tipe === "KUIS")?._count._all ?? 0;
    const ujian = asesmenPerTipe.find((item) => item.tipe === "UJIAN")?._count._all ?? 0;
    const dailyActivity = new Map<string, { tanggal: string; asesmen: number; tugas: number; submission: number; userIds: Set<string> }>();
    for (let index = 0; index < 14; index += 1) {
      const date = new Date(activityStart);
      date.setUTCDate(activityStart.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      dailyActivity.set(key, { tanggal: key, asesmen: 0, tugas: 0, submission: 0, userIds: new Set<string>() });
    }
    const addActivity = (dateValue: Date, type: "asesmen" | "tugas" | "submission", userId: string) => {
      const day = dailyActivity.get(activityDate(dateValue).toISOString().slice(0, 10));
      if (!day) return;
      day[type] += 1;
      day.userIds.add(userId);
    };
    recentAssessments.forEach((item) => addActivity(item.createdAt, "asesmen", item.guruId));
    recentTasks.forEach((item) => addActivity(item.createdAt, "tugas", item.guruId));
    recentSubmissions.forEach((item) => addActivity(item.mulaiPada, "submission", item.siswaId));
    recentTaskSubmissions.forEach((item) => { if (item.submittedAt) addActivity(item.submittedAt, "submission", item.siswaId); });
    recentLogins.forEach((item) => dailyActivity.get(item.tanggal.toISOString().slice(0, 10))?.userIds.add(item.userId));
    const aktivitasHarian = [...dailyActivity.values()].map((item) => ({ tanggal: item.tanggal, asesmen: item.asesmen, tugas: item.tugas, submission: item.submission, userAktif: item.userIds.size }));
    const activeUserIds = new Set([...recentAssessments.map((item) => item.guruId), ...recentTasks.map((item) => item.guruId), ...recentSubmissions.map((item) => item.siswaId), ...recentTaskSubmissions.map((item) => item.siswaId), ...recentLogins.map((item) => item.userId)]);
    const activeStudents = new Set([...recentSubmissions.map((item) => item.siswaId), ...recentTaskSubmissions.map((item) => item.siswaId), ...recentLogins.filter((item) => item.user.role === "SISWA").map((item) => item.userId)]).size;
    const activeTeachers = new Set([...recentAssessments.map((item) => item.guruId), ...recentTasks.map((item) => item.guruId), ...recentLogins.filter((item) => item.user.role === "GURU").map((item) => item.userId)]).size;
    const countLearningProgress = (rows: typeof learningAssessments) => {
      const expected = new Set<string>();
      const completed = new Set<string>();
      for (const row of rows) {
        for (const target of row.kelasTujuan) {
          for (const student of target.kelas.siswa) expected.add(`${row.id}:${student.siswaId}`);
        }
        for (const submission of row.submission) {
          if (submission.status === "SUDAH") completed.add(`${row.id}:${submission.siswaId}`);
        }
      }
      return { completed: [...completed].filter((key) => expected.has(key)).length, pending: [...expected].filter((key) => !completed.has(key)).length };
    };
    const asesmenProgress = countLearningProgress(learningAssessments);
    const tugasProgress = countLearningProgress(learningTasks);
    const average = (values: number[]) => values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : null;
    const trendNilai = academicRows.filter((row) => row.submission.length > 0).map((row) => ({ tanggal: row.createdAt.toISOString().slice(0, 10), judul: row.judul, nilai: average(row.submission.map((item) => item.nilaiAkhir as number)) })).sort((first, second) => first.tanggal.localeCompare(second.tanggal)).slice(-12);
    const kelasValues = new Map<string, { label: string; values: number[] }>();
    const mapelValues = new Map<string, number[]>();
    for (const row of academicRows) {
      const values = row.submission.map((item) => item.nilaiAkhir as number);
      if (!values.length) continue;
      for (const target of row.kelasTujuan) {
        const current = kelasValues.get(target.kelas.id) ?? { label: target.kelas.judul, values: [] };
        current.values.push(...values);
        kelasValues.set(target.kelas.id, current);
      }
      const mapelLabel = row.mapel?.nama ?? "Umum";
      mapelValues.set(mapelLabel, [...(mapelValues.get(mapelLabel) ?? []), ...values]);
    }
    return NextResponse.json({ data: { statistik: { kelas, siswa, guru, asesmen, tugas, materi, mapel, laporanPending, kuis, ujian, rataRataNilai: Math.round(nilaiAggregate._avg.nilaiAkhir ?? 0), submissionDinilai: nilaiAggregate._count._all, tugasDibuat, tugasDikumpulkan }, akunTerbaru, aktivitas: { periodeHari: 14, userAktif: activeUserIds.size, siswaAktif: activeStudents, guruAktif: activeTeachers, aktivitasHarian }, akademik: { trendNilai, rataRataPerKelas: [...kelasValues.values()].map((item) => ({ label: item.label, nilai: average(item.values) })).filter((item) => item.nilai !== null).sort((a, b) => (b.nilai ?? 0) - (a.nilai ?? 0)), rataRataPerMapel: [...mapelValues.entries()].map(([label, values]) => ({ label, nilai: average(values) })).filter((item) => item.nilai !== null).sort((a, b) => (b.nilai ?? 0) - (a.nilai ?? 0)) }, aktivitasPembelajaran: { asesmenSelesai: asesmenProgress.completed, asesmenBelum: asesmenProgress.pending, tugasDikumpulkan: tugasProgress.completed, tugasBelum: tugasProgress.pending } } });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
