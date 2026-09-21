import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, requireAuth, FULL_CRUD_ADMIN, ADMIN_TIER } from "@/lib/rbac";
import crypto from "crypto";

type Params = { params: Promise<{ id: string }> };

function hashPrivateIdentifier(value: string | null) {
  return value ? crypto.createHash("sha256").update(value).digest("hex") : null;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = requireAuth(await getSession());
    const { id } = await params;

    const kelas = await db.kelas.findUnique({
      where: { id },
      include: {
        siswa: { include: { siswa: { include: { kelasReferensi: true } } } },
        guruMapel: { include: { guru: true, mapel: true } },
      },
    });

    if (!kelas) return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });

    if (!ADMIN_TIER.includes(session.role)) {
      if (session.role === "GURU") {
        const isPengajar = kelas.guruMapel.some((gm) => gm.guruId === session.userId);
        if (!isPengajar) {
          return NextResponse.json({ error: "Anda tidak mengajar di kelas ini." }, { status: 403 });
        }
      }
      if (session.role === "SISWA") {
        const isAnggota = kelas.siswa.some((ks) => ks.siswaId === session.userId);
        if (!isAnggota) {
          return NextResponse.json({ error: "Anda bukan anggota kelas ini." }, { status: 403 });
        }
      }
    }

    const [pengumumanList, asesmenKelasList, tugasKelasList] = await Promise.all([
      db.pengumuman.findMany({
        where: { kelasId: id },
        include: {
          author: { select: { id: true, nama: true, fotoProfil: true, role: true } },
          lampiran: true,
        },
      }),
      db.asesmenKelas.findMany({
        where: { kelasId: id, asesmen: { status: "SELESAI" } },
        include: {
          asesmen: {
            include: {
              mapel: true,
              guru: { select: { id: true, nama: true, fotoProfil: true } },
              submission: session.role === "SISWA" ? { where: { siswaId: session.userId }, select: { status: true } } : undefined,
              _count: { select: { soal: true } },
            },
          },
        },
      }),
      // Tugas -- baru ditambah, kemarin kelewat gak ikut di feed gabungan
      db.tugasKelas.findMany({
        where: { kelasId: id },
        include: {
          tugas: {
            include: {
              mapel: true,
              guru: { select: { id: true, nama: true, fotoProfil: true } },
              lampiran: true,
              kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } },
              submission: session.role === "SISWA" ? { where: { siswaId: session.userId }, select: { status: true } } : undefined,
              _count: { select: { submission: true } },
            },
          },
        },
      }),
    ]);

    const feedPengumuman = pengumumanList.map((p) => ({
      tipe: "PENGUMUMAN" as const,
      timestamp: p.createdAt,
      data: p,
    }));

    const feedAsesmen = asesmenKelasList.map((ak) => ({
      tipe: "ASESMEN" as const,
      timestamp: ak.asesmen.updatedAt,
      data: {
        ...ak.asesmen,
        ...(session.role === "SISWA" && { statusSubmission: ak.asesmen.submission[0]?.status ?? "BELUM" }),
      },
    }));

    const feedTugas = tugasKelasList.map((tk) => ({
      tipe: "TUGAS" as const,
      timestamp: tk.tugas.createdAt,
      data: {
        ...tk.tugas,
        ...(session.role === "SISWA" && { statusSubmission: tk.tugas.submission[0]?.status ?? "BELUM" }),
      },
    }));

    const feed = [...feedPengumuman, ...feedAsesmen, ...feedTugas].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    const kelasForResponse = {
      ...kelas,
      siswa: kelas.siswa.map((ks) => ({
        ...ks,
        siswa: {
          ...ks.siswa,
          nis: hashPrivateIdentifier(ks.siswa.nis),
        },
      })),
      guruMapel: kelas.guruMapel.map((gm) => ({
        ...gm,
        guru: {
          ...gm.guru,
          nik: hashPrivateIdentifier(gm.guru.nik),
        },
      })),
      feed,
    };

    return NextResponse.json({ data: kelasForResponse });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const { id } = await params;
    const body = await req.json();
    const { judul, deskripsi } = body;

    const kelas = await db.kelas.update({
      where: { id },
      data: {
        judul: judul || undefined,
        deskripsi: deskripsi !== undefined ? deskripsi || null : undefined,
      },
    });

    return NextResponse.json({ data: kelas });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const { id: kelasId } = await params;

    await db.$transaction(async (tx) => {
      await tx.lampiran.deleteMany({ where: { pengumuman: { kelasId } } });
      await tx.pengumuman.deleteMany({ where: { kelasId } });
      await tx.materiKelas.deleteMany({ where: { kelasId } });
      await tx.asesmenKelas.deleteMany({ where: { kelasId } });

      const tugasIds = (await tx.tugasKelas.findMany({ where: { kelasId }, select: { tugasId: true } })).map(
        (t) => t.tugasId
      );
      await tx.tugasKelas.deleteMany({ where: { kelasId } });
      // NOTE: sengaja gak hapus Tugas-nya sendiri di sini (Tugas bisa dikirim ke kelas lain juga,
      // beda dari Pengumuman yang emang scoped ke 1 kelas doang)

      await tx.kelasGuruMapel.deleteMany({ where: { kelasId } });
      await tx.kelasSiswa.deleteMany({ where: { kelasId } });
      await tx.kelas.delete({ where: { id: kelasId } });
    });

    return NextResponse.json({ data: { success: true } });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}