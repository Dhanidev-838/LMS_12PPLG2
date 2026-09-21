import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type RangeKey = "semua" | "minggu" | "bulan" | "3bulan" | "tahun";

function getRangeStart(range: RangeKey): Date | undefined {
  if (range === "semua") return undefined;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (range) {
    case "minggu":
      now.setDate(now.getDate() - 6);
      return now;
    case "3bulan":
      now.setMonth(now.getMonth() - 3);
      return now;
    case "tahun":
      now.setMonth(0, 1);
      return now;
    case "bulan":
    default:
      now.setDate(1);
      return now;
  }
}

function safeAverage(values: Array<number | null | undefined>): number {
  const validValues = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (validValues.length === 0) return 0;
  return validValues.reduce((total, value) => total + value, 0) / validValues.length;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const rangeParam = req.nextUrl.searchParams.get("range") ?? "bulan";
    const range: RangeKey = ["semua", "minggu", "bulan", "3bulan", "tahun"].includes(rangeParam)
      ? (rangeParam as RangeKey)
      : "bulan";

    const fromDate = getRangeStart(range);
    const guruId = session!.userId;

    const kelasGuruMapel = await db.kelasGuruMapel.findMany({
      where: { guruId },
      select: { kelasId: true },
    });

    const kelasIds = [...new Set(kelasGuruMapel.map((entry) => entry.kelasId))];

    const [kuisCount, ujianCount, kuisAvg, ujianAvg, semuaNilaiAvg, tugasDibuat, tugasDikumpulkan, essayBelumDinilai, classRows, mapelRows, tugasBelumDinilaiRaw, essayBelumDinilaiRaw] = await Promise.all([
      db.asesmen.count({
        where: {
          guruId,
          tipe: "KUIS",
          createdAt: { gte: fromDate },
        },
      }),
      db.asesmen.count({
        where: {
          guruId,
          tipe: "UJIAN",
          createdAt: { gte: fromDate },
        },
      }),
      db.submission.aggregate({
        where: {
          status: "SUDAH",
          nilaiAkhir: { not: null },
          asesmen: {
            guruId,
            tipe: "KUIS",
            createdAt: { gte: fromDate },
          },
        },
        _avg: { nilaiAkhir: true },
      }),
      db.submission.aggregate({
        where: {
          status: "SUDAH",
          nilaiAkhir: { not: null },
          asesmen: {
            guruId,
            tipe: "UJIAN",
            createdAt: { gte: fromDate },
          },
        },
        _avg: { nilaiAkhir: true },
      }),
      db.submission.aggregate({
        where: {
          status: "SUDAH",
          nilaiAkhir: { not: null },
          asesmen: {
            guruId,
            createdAt: { gte: fromDate },
          },
        },
        _avg: { nilaiAkhir: true },
      }),
      db.tugas.count({
        where: {
          guruId,
          createdAt: { gte: fromDate },
        },
      }),
      db.tugasSubmission.count({
        where: {
          tugas: { guruId, createdAt: { gte: fromDate } },
          status: "SUDAH",
        },
      }),
      db.jawabanSiswa.count({
        where: {
          nilaiSoal: null,
          soal: {
            tipe: "ESSAY",
            asesmen: {
              guruId,
              createdAt: { gte: fromDate },
            },
          },
          submission: { status: "SUDAH" },
        },
      }),
      db.asesmen.findMany({
        where: {
          guruId,
          createdAt: { gte: fromDate },
        },
        select: {
          id: true,
          kelasTujuan: {
            select: {
              kelas: { select: { id: true, judul: true } },
            },
          },
          mapel: { select: { nama: true } },
          submission: {
            where: {
              status: "SUDAH",
              nilaiAkhir: { not: null },
            },
            select: { nilaiAkhir: true },
          },
        },
      }),
      db.asesmen.findMany({
        where: {
          guruId,
          createdAt: { gte: fromDate },
          mapelId: { not: null },
        },
        select: {
          id: true,
          mapel: { select: { nama: true } },
          submission: {
            where: {
              status: "SUDAH",
              nilaiAkhir: { not: null },
            },
            select: { nilaiAkhir: true },
          },
        },
      }),
      db.tugasSubmission.findMany({
        where: {
          tugas: { guruId, createdAt: { gte: fromDate } },
          status: "SUDAH",
        },
        select: {
          siswa: {
            select: {
              id: true,
              nama: true,
              kelasSiswa: { select: { kelas: { select: { judul: true } } } },
            },
          },
          tugas: { select: { judul: true } },
          submittedAt: true,
        },
      }),
      db.jawabanSiswa.findMany({
        where: {
          nilaiSoal: null,
          soal: {
            tipe: "ESSAY",
            asesmen: {
              guruId,
              createdAt: { gte: fromDate },
            },
          },
          submission: { status: "SUDAH" },
        },
        select: {
          submission: {
            select: {
              siswa: {
                select: {
                  id: true,
                  nama: true,
                  kelasSiswa: { select: { kelas: { select: { judul: true } } } },
                },
              },
              asesmen: { select: { judul: true } },
            },
          },
          soal: { select: { pertanyaan: true } },
        },
      }),
    ]);

    const rataRataKuis = Number((kuisAvg._avg.nilaiAkhir ?? 0).toFixed(1));
    const rataRataUjian = Number((ujianAvg._avg.nilaiAkhir ?? 0).toFixed(1));
    const rataRataSemua = Number((semuaNilaiAvg._avg.nilaiAkhir ?? 0).toFixed(1));
    const persentasePengumpulan = tugasDibuat > 0 ? Number(((tugasDikumpulkan / tugasDibuat) * 100).toFixed(1)) : 0;

    const kelasAggregate = new Map<string, number[]>();
    for (const row of classRows) {
      const values = row.submission.map((item) => item.nilaiAkhir ?? 0);

      if (values.length === 0) continue;

      for (const kelasTujuan of row.kelasTujuan) {
        const key = kelasTujuan.kelas.id;
        const current = kelasAggregate.get(key) ?? [];
        kelasAggregate.set(key, [...current, ...values]);
      }
    }

    const kelasAverage = [...kelasAggregate.entries()]
      .map(([kelasId, values]) => ({
        kelas: classRows
          .flatMap((row) => row.kelasTujuan)
          .find((kelasTujuan) => kelasTujuan.kelas.id === kelasId)?.kelas.judul ?? "Kelas",
        rataRata: Number(safeAverage(values).toFixed(1)),
      }))
      .filter((item) => item.kelas.length > 0)
      .sort((first, second) => second.rataRata - first.rataRata);

    const mapelAggregate = new Map<string, number[]>();
    for (const row of mapelRows) {
      const values = row.submission.map((item) => item.nilaiAkhir ?? 0);
      if (values.length === 0 || !row.mapel) continue;
      const key = row.mapel.nama;
      const current = mapelAggregate.get(key) ?? [];
      mapelAggregate.set(key, [...current, ...values]);
    }

    const mapelAverage = [...mapelAggregate.entries()]
      .map(([mapel, values]) => ({
        mapel,
        rataRata: Number(safeAverage(values).toFixed(1)),
      }))
      .filter((item) => item.mapel.length > 0)
      .sort((first, second) => second.rataRata - first.rataRata);

    const pendingStudentMap = new Map<string, {
      id: string;
      nama: string;
      kelas: string;
      items: Array<{ type: "TUGAS" | "ESSAY"; label: string; submittedAt: string | null }>; 
    }>();

    for (const item of tugasBelumDinilaiRaw) {
      const key = item.siswa.id;
      const kelas = item.siswa.kelasSiswa[0]?.kelas?.judul ?? "-";
      const current = pendingStudentMap.get(key) ?? {
        id: item.siswa.id,
        nama: item.siswa.nama,
        kelas,
        items: [],
      };

      current.items.push({
        type: "TUGAS",
        label: item.tugas.judul,
        submittedAt: item.submittedAt ? item.submittedAt.toISOString() : null,
      });

      pendingStudentMap.set(key, current);
    }

    for (const item of essayBelumDinilaiRaw) {
      const key = item.submission.siswa.id;
      const kelas = item.submission.siswa.kelasSiswa[0]?.kelas?.judul ?? "-";
      const current = pendingStudentMap.get(key) ?? {
        id: item.submission.siswa.id,
        nama: item.submission.siswa.nama,
        kelas,
        items: [],
      };

      current.items.push({
        type: "ESSAY",
        label: item.submission.asesmen.judul,
        submittedAt: null,
      });

      pendingStudentMap.set(key, current);
    }

    const siswaBelumDinilai = [...pendingStudentMap.values()].map((student) => ({
      ...student,
      items: student.items.slice(0, 6),
    }));

    return NextResponse.json({
      data: {
        range,
        summary: {
          totalKuis: kuisCount,
          totalUjian: ujianCount,
          rataRataNilaiKuis: rataRataKuis,
          rataRataNilaiUjian: rataRataUjian,
          rataRataNilaiSeluruhAsesmen: rataRataSemua,
          totalTugasDibuat: tugasDibuat,
          totalTugasDikumpulkan: tugasDikumpulkan,
          persentasePengumpulanTugas: persentasePengumpulan,
          essayBelumDinilai,
          rataRataNilaiPerKelas: kelasAverage,
          rataRataNilaiPerMapel: mapelAverage,
          siswaBelumDinilai,
        },
      },
    });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
