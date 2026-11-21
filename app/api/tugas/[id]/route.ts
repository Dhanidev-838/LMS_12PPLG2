import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";
import { parseDeadlineFields } from "@/lib/deadline-server";

type Params = { params: Promise<{ id: string }> };

// GET /api/tugas/[id] -> detail tugas + SEMUA submission (visible ke sekelas, beda dari Asesmen yang private)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SISWA", ...ADMIN_TIER]);

    const { id } = await params;

    const tugas = await db.tugas.findUnique({
      where: { id },
      include: {
        mapel: true,
        guru: { select: { id: true, nama: true, fotoProfil: true } },
        lampiran: true,
        kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } },
        submission: {
          where: session!.role === "SUPER_ADMIN"
            ? undefined
            : { siswa: { role: { not: "SUPER_ADMIN" } } },
          include: {
            siswa: {
              select: {
                id: true,
                nama: true,
                fotoProfil: true,
                role: true,
                kelasReferensi: { select: { label: true } },
              },
            },
            lampiran: true,
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!tugas) {
      return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    }

    // siswa cuma boleh liat kalau dia anggota salah satu kelas tujuan tugas ini
    if (session!.role === "SISWA") {
      const kelasIdTujuan = tugas.kelasTujuan.map((tk) => tk.kelasId);
      const isAnggota = await db.kelasSiswa.findFirst({
        where: { siswaId: session!.userId, kelasId: { in: kelasIdTujuan } },
      });
      if (!isAnggota) {
        return NextResponse.json({ error: "Anda tidak memiliki akses ke tugas ini." }, { status: 403 });
      }
    }
    if (session!.role === "GURU" && tugas.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan tugas milik anda." }, { status: 403 });
    }

    return NextResponse.json({ data: tugas });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// PATCH /api/tugas/[id] -> edit judul/isi/mapel/lampiran, DAN/ATAU assign ke kelas (skenario "edit terus masukin ke suatu kelas")
// body: { judul?, isi?, mapelId?, lampiran?: [...], kelasIds? } -- kelasIds kalau dikirim, REPLACE semua kelas tujuan lama
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SUPER_ADMIN"]);

    const { id } = await params;
    const body = await req.json();
    const { judul, isi, mapelId, lampiran, kelasIds } = body;

    const existing = await db.tugas.findUnique({
      where: { id },
      include: { kelasTujuan: { select: { kelasId: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    if (session!.role !== "SUPER_ADMIN" && existing.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan tugas milik anda." }, { status: 403 });
    }
    const deadlineResult = parseDeadlineFields(body);
    if ("error" in deadlineResult) return NextResponse.json({ error: deadlineResult.error }, { status: 400 });
    const targetHasKelas = Array.isArray(kelasIds) ? kelasIds.length > 0 : existing.kelasTujuan.length > 0;
    let deadlineUpdate: {
      publishedAt?: Date | null;
      deadlineAt?: Date | null;
      deadlineDurationMinutes?: number | null;
    } = {};
    if ("value" in deadlineResult) {
      const { deadlineAt, deadlineDurationMinutes } = deadlineResult.value;
      deadlineUpdate.deadlineDurationMinutes = deadlineDurationMinutes;
      if (deadlineDurationMinutes !== null) {
        deadlineUpdate.publishedAt = targetHasKelas ? new Date() : null;
        deadlineUpdate.deadlineAt = targetHasKelas
          ? new Date(deadlineUpdate.publishedAt!.getTime() + deadlineDurationMinutes * 60_000)
          : null;
      } else {
        deadlineUpdate.deadlineAt = deadlineAt;
        deadlineUpdate.publishedAt = deadlineAt && targetHasKelas
          ? existing.publishedAt ?? new Date()
          : targetHasKelas ? existing.publishedAt : null;
      }
    } else if (targetHasKelas && !existing.publishedAt) {
      const publishedAt = new Date();
      deadlineUpdate.publishedAt = publishedAt;
      if (!existing.deadlineAt && existing.deadlineDurationMinutes !== null) {
        deadlineUpdate.deadlineAt = new Date(publishedAt.getTime() + existing.deadlineDurationMinutes * 60_000);
      }
    } else if (Array.isArray(kelasIds) && kelasIds.length === 0 && existing.publishedAt) {
      deadlineUpdate.publishedAt = null;
    }

    const updated = await db.$transaction(async (tx) => {
      const tugas = await tx.tugas.update({
        where: { id },
        data: {
          judul: judul || undefined,
          isi: isi !== undefined ? isi || null : undefined,
          mapelId: mapelId !== undefined ? mapelId || null : undefined,
          ...deadlineUpdate,
        },
      });

      if (Array.isArray(lampiran)) {
        await tx.lampiranTugas.deleteMany({ where: { tugasId: id } });
        if (lampiran.length > 0) {
          await tx.lampiranTugas.createMany({
            data: lampiran.map((l: { tipe: string; url: string; judul?: string; thumbnail?: string }) => ({
              tugasId: id,
              tipe: l.tipe,
              url: l.url,
              judul: l.judul || null,
              thumbnail: l.thumbnail || null,
            })),
          });
        }
      }

      if (Array.isArray(kelasIds)) {
        await tx.tugasKelas.deleteMany({ where: { tugasId: id } });
        if (kelasIds.length > 0) {
          await tx.tugasKelas.createMany({
            data: kelasIds.map((kelasId: string) => ({ tugasId: id, kelasId })),
          });
        }
      }

      return tugas;
    });

    return NextResponse.json({ message: "Tugas berhasil diperbarui.", data: updated });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// DELETE /api/tugas/[id] -> hapus tugas (cuma guru pembuat)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", "SUPER_ADMIN"]);

    const { id } = await params;
    const existing = await db.tugas.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    if (session!.role !== "SUPER_ADMIN" && existing.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan tugas milik anda." }, { status: 403 });
    }

    await db.$transaction(async (tx) => {
      const submissionIds = (await tx.tugasSubmission.findMany({ where: { tugasId: id }, select: { id: true } })).map(
        (s) => s.id
      );
      if (submissionIds.length > 0) {
        await tx.lampiranTugasSubmission.deleteMany({ where: { submissionId: { in: submissionIds } } });
      }
      await tx.tugasSubmission.deleteMany({ where: { tugasId: id } });
      await tx.lampiranTugas.deleteMany({ where: { tugasId: id } });
      await tx.tugasKelas.deleteMany({ where: { tugasId: id } });
      await tx.tugas.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Tugas berhasil dihapus." });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}