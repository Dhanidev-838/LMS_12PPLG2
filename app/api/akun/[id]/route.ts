import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { requireRole, ADMIN_TIER, FULL_CRUD_ADMIN } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ADMIN_TIER);

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        nis: true,
        nik: true,
        jenisKelamin: true,
        tanggalLahir: true,
        fotoProfil: true,
        deskripsi: true,
        kelasReferensi: true,
        kelasSiswa: { include: { kelas: { select: { id: true, judul: true } } } },
        kelasGuruMapel: { include: { kelas: { select: { id: true, judul: true } }, mapel: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ data: user });
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
    // walasKelasId dihapus dari body -- fitur walas gak ada lagi
    const {
      email,
      nama,
      deskripsi,
      fotoProfil,
      jenisKelamin,
      tanggalLahir,
      nis,
      kelasReferensiId,
      kelasIds,
      nik,
      mapelId,
    } = body;

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    }

    if (email && email.toLowerCase().trim() !== existing.email) {
      const emailTaken = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (emailTaken) return NextResponse.json({ error: "Email sudah dipakai akun lain." }, { status: 409 });
    }
    if (nis && nis !== existing.nis) {
      const nisTaken = await db.user.findUnique({ where: { nis } });
      if (nisTaken) return NextResponse.json({ error: "NIS sudah dipakai akun lain." }, { status: 409 });
    }
    if (nik && nik !== existing.nik) {
      const nikTaken = await db.user.findUnique({ where: { nik } });
      if (nikTaken) return NextResponse.json({ error: "NIK sudah dipakai akun lain." }, { status: 409 });
    }

    if (kelasReferensiId) {
      const rombel = await db.kelasReferensi.findUnique({ where: { id: kelasReferensiId } });
      if (!rombel) return NextResponse.json({ error: "Kelas referensi (rombel) tidak ditemukan." }, { status: 404 });
    }

    let newPasswordHash: string | undefined;
    if (existing.role === "SISWA" && nis && nis !== existing.nis) {
      newPasswordHash = await hashPassword(nis);
    }
    if (existing.role === "GURU" && nik && nik !== existing.nik) {
      newPasswordHash = await hashPassword(nik);
    }

    const updated = await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          email: email ? email.toLowerCase().trim() : undefined,
          nama: nama || undefined,
          deskripsi: deskripsi !== undefined ? deskripsi || null : undefined,
          fotoProfil: fotoProfil !== undefined ? fotoProfil || null : undefined,
          jenisKelamin: jenisKelamin !== undefined ? jenisKelamin || null : undefined,
          nis: existing.role === "SISWA" && nis ? nis : undefined,
          nik: existing.role === "GURU" && nik ? nik : undefined,
          kelasReferensiId: existing.role === "SISWA" && kelasReferensiId ? kelasReferensiId : undefined,
          tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
          password: newPasswordHash ?? undefined,
        },
      });

      if (existing.role === "SISWA" && Array.isArray(kelasIds)) {
        await tx.kelasSiswa.deleteMany({ where: { siswaId: id } });
        if (kelasIds.length > 0) {
          await tx.kelasSiswa.createMany({
            data: kelasIds.map((kId: string) => ({ kelasId: kId, siswaId: id })),
          });
        }
      }

      if (existing.role === "GURU" && Array.isArray(kelasIds)) {
        await tx.kelasGuruMapel.deleteMany({ where: { guruId: id } });
        if (kelasIds.length > 0 && mapelId) {
          await tx.kelasGuruMapel.createMany({
            data: kelasIds.map((kId: string) => ({ kelasId: kId, guruId: id, mapelId })),
          });
        }
      }

      return user;
    });

    return NextResponse.json({ message: "Akun berhasil diperbarui.", data: updated });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const { id } = await params;

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    }

    // pembersihan walas dihapus -- fitur walas gak ada lagi di Kelas
    await db.$transaction([
      db.kelasSiswa.deleteMany({ where: { siswaId: id } }),
      db.kelasGuruMapel.deleteMany({ where: { guruId: id } }),
      db.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Akun berhasil dihapus." });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}