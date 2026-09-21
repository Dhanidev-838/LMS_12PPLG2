// app/api/asesmen/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SISWA", ...ADMIN_TIER]);

    const status = req.nextUrl.searchParams.get("status");

    // ---- cabang khusus SISWA ----
    if (session!.role === "SISWA") {
      const kelasSiswa = await db.kelasSiswa.findMany({
        where: { siswaId: session!.userId },
        select: { kelasId: true },
      });
      const kelasIds = kelasSiswa.map((k) => k.kelasId);
      if (kelasIds.length === 0) return NextResponse.json({ data: [] });

      const asesmenKelasList = await db.asesmenKelas.findMany({
        where: { kelasId: { in: kelasIds }, asesmen: { status: "SELESAI" } },
        include: {
          kelas: { select: { id: true, judul: true } },
          asesmen: {
            include: {
              mapel: true,
              submission: { where: { siswaId: session!.userId } },
              _count: { select: { soal: true } },
            },
          },
        },
      });

      const asesmenMap = new Map<string, any>();
      for (const ak of asesmenKelasList) {
        const a = ak.asesmen;
        if (!asesmenMap.has(a.id)) {
          const { submission, ...rest } = a;
          asesmenMap.set(a.id, {
            ...rest,
            kelasTujuan: [{ kelas: ak.kelas }],
            statusSubmission: submission[0]?.status === "SUDAH" ? "SUDAH" : submission[0] ? "SEDANG" : "BELUM",
          });
        } else {
          asesmenMap.get(a.id).kelasTujuan.push({ kelas: ak.kelas });
        }
      }
      return NextResponse.json({ data: Array.from(asesmenMap.values()) });
    }

    // ---- logic GURU/admin ORIGINAL, gak diubah ----
    const asesmenList = await db.asesmen.findMany({
      where: {
        guruId: session!.role === "GURU" ? session!.userId : undefined,
        status: status === "PROSES" || status === "SELESAI" ? status : undefined,
      },
      include: {
        mapel: true,
        guru: { select: { id: true, nama: true } },
        kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } },
        _count: { select: { soal: true, submission: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: asesmenList });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const body = await req.json();
    const { judul, tipe, mapelId, durasiMenit, deskripsi, kelasIds = [] } = body;

    if (!judul || !["KUIS", "UJIAN"].includes(tipe) || !Array.isArray(kelasIds)) {
      return NextResponse.json({ error: "Judul, tipe, dan kelas tujuan harus valid." }, { status: 400 });
    }
    if (durasiMenit !== undefined && durasiMenit !== null) {
      const minimumDurasi = tipe === "KUIS" ? 10 : 20;
      if (!Number.isInteger(durasiMenit) || durasiMenit < minimumDurasi) {
        return NextResponse.json({ error: `${tipe === "KUIS" ? "Kuis" : "Ujian Online"} minimal berdurasi ${minimumDurasi} menit.` }, { status: 400 });
      }
    }

    const asesmenBaru = await db.$transaction(async (tx) => {
      const asesmen = await tx.asesmen.create({
        data: {
          guruId: session!.userId,
          judul,
          tipe,
          mapelId: mapelId || null,
          durasiMenit: durasiMenit || null,
          deskripsi: deskripsi || null,
          status: "PROSES",
        },
      });
      if (kelasIds.length > 0) {
        await tx.asesmenKelas.createMany({
          data: kelasIds.map((kelasId: string) => ({ asesmenId: asesmen.id, kelasId })),
        });
      }
      return asesmen;
    });

    return NextResponse.json({ message: "Asesmen berhasil dibuat.", data: asesmenBaru }, { status: 201 });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}