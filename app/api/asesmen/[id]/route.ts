import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET /api/asesmen/[id] -> detail asesmen + soal
// khusus SISWA: soal ditampilin dalam URUTAN ACAK (di-generate sekali, disimpen di Submission.soalOrder
// biar konsisten kalau reload halaman), + jawaban yang udah tersimpan buat resume
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SISWA", ...ADMIN_TIER]);

    const { id } = await params;

    const asesmen = await db.asesmen.findUnique({
      where: { id },
      include: {
        mapel: true,
        guru: { select: { id: true, nama: true } },
        kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } },
        soal: {
          orderBy: { urutan: "asc" },
          include: { opsi: { orderBy: { urutan: "asc" } } },
        },
      },
    });

    if (!asesmen) {
      return NextResponse.json({ error: "Asesmen tidak ditemukan." }, { status: 404 });
    }

    if (session!.role === "SISWA") {
      if (asesmen.status !== "SELESAI") {
        return NextResponse.json({ error: "Asesmen belum tersedia." }, { status: 403 });
      }

      const kelasIdTujuan = asesmen.kelasTujuan.map((ak) => ak.kelasId);
      const siswaAdaDiKelas = await db.kelasSiswa.findFirst({
        where: { siswaId: session!.userId, kelasId: { in: kelasIdTujuan } },
      });
      if (!siswaAdaDiKelas) {
        return NextResponse.json({ error: "Anda tidak memiliki akses ke asesmen ini." }, { status: 403 });
      }

      // lazy-create submission + urutan soal acak pas pertama kali siswa buka
      let submission = await db.submission.findUnique({
        where: { asesmenId_siswaId: { asesmenId: id, siswaId: session!.userId } },
        include: { jawaban: { include: { opsiDipilih: true } } },
      });

      if (!submission) {
        const pilihanIds = asesmen.soal.filter((s) => s.tipe !== "ESSAY").map((s) => s.id);
        const essayIds = asesmen.soal.filter((s) => s.tipe === "ESSAY").map((s) => s.id);
        const soalIdsAcak = [...shuffle(pilihanIds), ...shuffle(essayIds)];
        submission = await db.submission.create({
          data: { asesmenId: id, siswaId: session!.userId, soalOrder: JSON.stringify(soalIdsAcak) },
          include: { jawaban: { include: { opsiDipilih: true } } },
        });
      }

      const storedOrder: string[] = submission.soalOrder
        ? JSON.parse(submission.soalOrder)
        : asesmen.soal.map((s) => s.id);
      const soalMap = new Map(asesmen.soal.map((s) => [s.id, s]));
      // Keep the saved random order, but always put essay questions at the end.
      const order = [
        ...storedOrder.filter((soalId) => soalMap.get(soalId)?.tipe !== "ESSAY"),
        ...storedOrder.filter((soalId) => soalMap.get(soalId)?.tipe === "ESSAY"),
      ];
      const soalUrutanAcak = order.map((soalId) => soalMap.get(soalId)).filter(Boolean) as typeof asesmen.soal;

      // siswa gak boleh liat jawaban benar sebelum submit
      soalUrutanAcak.forEach((s) => s.opsi.forEach((o: any) => delete o.isBenar));

      const jawabanTersimpan = submission.jawaban.map((j) => ({
        soalId: j.soalId,
        opsiIds: j.opsiDipilih.map((jo) => jo.opsiJawabanId),
        jawabanEssay: j.jawabanEssay,
        raguRagu: j.raguRagu,
      }));

      return NextResponse.json({
        data: {
          ...asesmen,
          soal: soalUrutanAcak,
          submissionId: submission.id,
          submissionStatus: submission.status,
          tabSwitchCount: submission.tabSwitchCount,
          mulaiPada: submission.mulaiPada,
          jawabanTersimpan,
        },
      });
    }

    return NextResponse.json({ data: asesmen });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// PATCH /api/asesmen/[id] -> edit info dasar ATAU finalisasi (status -> SELESAI)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id } = await params;
    const body = await req.json();
    const { judul, deskripsi, durasiMenit, mapelId, status } = body;

    const existing = await db.asesmen.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Asesmen tidak ditemukan." }, { status: 404 });
    if (existing.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan asesmen milik anda." }, { status: 403 });
    }

    if (status && !["PROSES", "SELESAI"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    }

    if (durasiMenit !== undefined && durasiMenit !== null) {
      const minimumDurasi = existing.tipe === "KUIS" ? 10 : 20;
      if (!Number.isInteger(durasiMenit) || durasiMenit < minimumDurasi) {
        return NextResponse.json({ error: `${existing.tipe === "KUIS" ? "Kuis" : "Ujian Online"} minimal berdurasi ${minimumDurasi} menit.` }, { status: 400 });
      }
    }

    const updated = await db.asesmen.update({
      where: { id },
      data: {
        judul: judul || undefined,
        deskripsi: deskripsi !== undefined ? deskripsi || null : undefined,
        durasiMenit: durasiMenit !== undefined ? durasiMenit || null : undefined, // KUIS & UJIAN dua-duanya bisa punya durasi
        mapelId: mapelId !== undefined ? mapelId || null : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json({ message: "Asesmen berhasil diperbarui.", data: updated });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// DELETE /api/asesmen/[id] -> hapus asesmen (cuma guru pembuatnya)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id } = await params;
    const existing = await db.asesmen.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Asesmen tidak ditemukan." }, { status: 404 });
    if (existing.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan asesmen milik anda." }, { status: 403 });
    }

    await db.$transaction([
      db.jawabanOpsi.deleteMany({ where: { jawabanSiswa: { soal: { asesmenId: id } } } }),
      db.jawabanSiswa.deleteMany({ where: { soal: { asesmenId: id } } }),
      db.opsiJawaban.deleteMany({ where: { soal: { asesmenId: id } } }),
      db.soal.deleteMany({ where: { asesmenId: id } }),
      db.submission.deleteMany({ where: { asesmenId: id } }),
      db.asesmenKelas.deleteMany({ where: { asesmenId: id } }),
      db.asesmen.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Asesmen berhasil dihapus." });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}