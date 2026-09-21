import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await getSession();
    requireRole(session, ["SISWA"]);

    const siswaId = session!.userId;

    const siswa = await db.user.findUnique({
      where: { id: siswaId },
      select: {
        id: true,
        nama: true,
        kelasReferensi: {
          select: {
            label: true,
            jenjang: true,
            jurusan: { select: { nama: true } },
          },
        },
      },
    });

    if (!siswa) {
      return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
    }

    const kelasList = await db.kelas.findMany({
      where: { siswa: { some: { siswaId } } },
      select: {
        id: true,
        judul: true,
        _count: { select: { siswa: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const kelasIds = kelasList.map((kelas) => kelas.id);

    const asesmenKelasList = kelasIds.length
      ? await db.asesmenKelas.findMany({
          where: { kelasId: { in: kelasIds } },
          include: {
            kelas: { select: { id: true, judul: true } },
            asesmen: {
              include: {
                mapel: true,
                submission: {
                  where: { siswaId },
                  select: { id: true, status: true, nilaiAkhir: true, submittedAt: true },
                },
              },
            },
          },
          orderBy: { asesmen: { updatedAt: "desc" } },
        })
      : [];

    const flattenedAsesmen = new Map<string, any>();
    for (const item of asesmenKelasList) {
      const asesmen = item.asesmen;
      const existing = flattenedAsesmen.get(asesmen.id);
      const submission = asesmen.submission[0] ?? null;
      const statusSubmission = submission ? (submission.status === "SUDAH" ? "SUDAH" : "SEDANG") : "BELUM";
      const nextItem = {
        id: asesmen.id,
        judul: asesmen.judul,
        tipe: asesmen.tipe,
        statusSubmission,
        mapel: asesmen.mapel,
        createdAt: asesmen.createdAt,
        updatedAt: asesmen.updatedAt,
        kelasTujuan: [
          {
            kelas: {
              id: item.kelas.id,
              judul: item.kelas.judul,
            },
          },
        ],
      };

      if (!existing) {
        flattenedAsesmen.set(asesmen.id, nextItem);
        continue;
      }

      existing.kelasTujuan.push({
        kelas: {
          id: item.kelas.id,
          judul: item.kelas.judul,
        },
      });
    }

    const asesmenList = [...flattenedAsesmen.values()].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const tugasKelasList = kelasIds.length
      ? await db.tugasKelas.findMany({
          where: { kelasId: { in: kelasIds } },
          include: {
            kelas: { select: { id: true, judul: true } },
            tugas: {
              include: {
                mapel: true,
                guru: { select: { id: true, nama: true, fotoProfil: true, role: true } },
                submission: {
                  where: { siswaId },
                  select: { id: true, status: true, submittedAt: true },
                },
              },
            },
          },
          orderBy: { tugas: { createdAt: "desc" } },
        })
      : [];

    const flattenedTugas = new Map<string, any>();
    for (const item of tugasKelasList) {
      const tugas = item.tugas;
      const existing = flattenedTugas.get(tugas.id);
      const submission = tugas.submission[0] ?? null;
      const statusSubmission = submission ? (submission.status === "SUDAH" ? "SUDAH" : "BELUM") : "BELUM";
      const nextItem = {
        id: tugas.id,
        judul: tugas.judul,
        isi: tugas.isi,
        createdAt: tugas.createdAt,
        updatedAt: tugas.updatedAt,
        guru: tugas.guru,
        mapel: tugas.mapel,
        statusSubmission,
        kelasTujuan: [
          {
            kelas: {
              id: item.kelas.id,
              judul: item.kelas.judul,
            },
          },
        ],
      };

      if (!existing) {
        flattenedTugas.set(tugas.id, nextItem);
        continue;
      }

      existing.kelasTujuan.push({
        kelas: {
          id: item.kelas.id,
          judul: item.kelas.judul,
        },
      });
    }

    const tugasList = [...flattenedTugas.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalAsesmen = asesmenList.length;
    const asesmenSudah = asesmenList.filter((item) => item.statusSubmission === "SUDAH").length;
    const asesmenSedang = asesmenList.filter((item) => item.statusSubmission === "SEDANG").length;
    const asesmenBelum = totalAsesmen - asesmenSudah - asesmenSedang;

    const totalTugas = tugasList.length;
    const tugasSudah = tugasList.filter((item) => item.statusSubmission === "SUDAH").length;
    const tugasBelum = totalTugas - tugasSudah;

    const nilaiAkhirList = await db.submission.findMany({
      where: { siswaId, nilaiAkhir: { not: null } },
      include: {
        asesmen: {
          select: {
            id: true,
            judul: true,
            tipe: true,
            mapel: { select: { nama: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 5,
    });

    const rataRataNilai = await db.submission.aggregate({
      where: { siswaId, nilaiAkhir: { not: null } },
      _avg: { nilaiAkhir: true },
    });

    const nilaiRataRata = rataRataNilai._avg.nilaiAkhir ?? null;

    return NextResponse.json({
      data: {
        siswa: {
          id: siswa.id,
          nama: siswa.nama,
          kelasJurusan: siswa.kelasReferensi ? `${siswa.kelasReferensi.jenjang ?? ""} ${siswa.kelasReferensi.label ?? ""}${siswa.kelasReferensi.jurusan ? ` • ${siswa.kelasReferensi.jurusan.nama}` : ""}`.trim() : "Belum ditentukan",
          kelasReferensi: siswa.kelasReferensi,
        },
        statistik: {
          totalKelas: kelasList.length,
          totalAsesmen,
          asesmenSudah,
          asesmenSedang,
          asesmenBelum,
          totalTugas,
          tugasSudah,
          tugasBelum,
          rataRataNilai: nilaiRataRata !== null ? Number(nilaiRataRata.toFixed(1)) : null,
        },
        asesmenTerbaru: asesmenList.slice(0, 5),
        tugasTerbaru: tugasList.slice(0, 5),
        tugasBelumDikumpulkan: tugasList.filter((item) => item.statusSubmission !== "SUDAH").slice(0, 5),
        asesmenSedangDikerjakan: asesmenList.filter((item) => item.statusSubmission === "SEDANG").slice(0, 5),
        nilaiTerbaru: nilaiAkhirList.map((item) => ({
          id: item.id,
          judul: item.asesmen.judul,
          tipe: item.asesmen.tipe,
          nilai: item.nilaiAkhir,
          mapel: item.asesmen.mapel?.nama ?? "Umum",
          submittedAt: item.submittedAt,
        })),
      },
    });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
