import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER, FULL_CRUD_ADMIN } from "@/lib/rbac";
import { hashPassword } from "@/lib/auth";

// GET /api/akun?role=SISWA|GURU -> daftar akun
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ADMIN_TIER);

    const role = req.nextUrl.searchParams.get("role");
    if (role !== "SISWA" && role !== "GURU") {
      return NextResponse.json(
        { error: "Query 'role' wajib diisi SISWA atau GURU." },
        { status: 400 }
      );
    }

    if (role === "SISWA") {
      const siswaList = await db.user.findMany({
        where: { role: "SISWA" },
        select: {
          id: true,
          nama: true,
          email: true,
          nis: true,
          jenisKelamin: true,
          tanggalLahir: true,
          fotoProfil: true,
          deskripsi: true,
          kelasReferensi: { include: { jurusan: true } },
          kelasSiswa: {
            include: {
              kelas: { select: { id: true, judul: true } },
            },
          },
        },
        orderBy: { nama: "asc" },
      });
      return NextResponse.json({ data: siswaList });
    }

    // role === "GURU" -- walasKelasId & kelasSebagaiWalas dihapus, fitur walas gak ada lagi
    const guruList = await db.user.findMany({
      where: { role: "GURU" },
      select: {
        id: true,
        nama: true,
        email: true,
        nik: true,
        jenisKelamin: true,
        tanggalLahir: true,
        fotoProfil: true,
        deskripsi: true,
        kelasGuruMapel: {
          include: {
            kelas: { select: { id: true, judul: true } },
            mapel: true,
          },
        },
      },
      orderBy: { nama: "asc" },
    });
    return NextResponse.json({ data: guruList });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// POST /api/akun -> buat akun baru (siswa atau guru)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const body = await req.json();
    const { role, email, nama, deskripsi, fotoProfil, tanggalLahir, jenisKelamin } = body;

    if (!role || !email) {
      return NextResponse.json({ error: "Role dan email wajib diisi." }, { status: 400 });
    }

    const emailExists = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (emailExists) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }

    if (role === "SISWA") {
      const { nis, kelasReferensiId, kelasIds } = body;

      if (!nis || !kelasReferensiId) {
        return NextResponse.json(
          { error: "NIS dan Filter Jurusan (kelas referensi) wajib diisi untuk siswa." },
          { status: 400 }
        );
      }

      const nisExists = await db.user.findUnique({ where: { nis } });
      if (nisExists) {
        return NextResponse.json({ error: "NIS sudah terdaftar." }, { status: 409 });
      }

      const rombel = await db.kelasReferensi.findUnique({ where: { id: kelasReferensiId } });
      if (!rombel) {
        return NextResponse.json({ error: "Kelas referensi (rombel) tidak ditemukan." }, { status: 404 });
      }

      let kelasList: { id: string }[] = [];
      if (Array.isArray(kelasIds) && kelasIds.length > 0) {
        kelasList = await db.kelas.findMany({ where: { id: { in: kelasIds } }, select: { id: true } });
        if (kelasList.length !== kelasIds.length) {
          return NextResponse.json({ error: "Salah satu kelas (classroom) tidak ditemukan." }, { status: 404 });
        }
      }

      const hashedPassword = await hashPassword(nis);

      const siswaBaru = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "SISWA",
            nama: nama || "-",
            nis,
            jenisKelamin: jenisKelamin || null,
            deskripsi: deskripsi || null,
            tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
            fotoProfil: fotoProfil || null,
            kelasReferensiId,
          },
        });

        if (kelasList.length > 0) {
          await tx.kelasSiswa.createMany({
            data: kelasList.map((k) => ({ kelasId: k.id, siswaId: user.id })),
          });
        }

        return user;
      });

      return NextResponse.json(
        { message: "Akun siswa berhasil dibuat.", data: siswaBaru },
        { status: 201 }
      );
    }

    if (role === "GURU") {
      // walasKelasId dihapus dari body -- fitur walas gak ada lagi
      const { nik, mapelId, kelasIds } = body;

      if (!nik) {
        return NextResponse.json({ error: "NIK wajib diisi untuk guru." }, { status: 400 });
      }

      const nikExists = await db.user.findUnique({ where: { nik } });
      if (nikExists) {
        return NextResponse.json({ error: "NIK sudah terdaftar." }, { status: 409 });
      }

      let kelasList: { id: string }[] = [];
      if (Array.isArray(kelasIds) && kelasIds.length > 0) {
        if (!mapelId) {
          return NextResponse.json(
            { error: "Mapel wajib diisi kalau kelas yang diampu diisi." },
            { status: 400 }
          );
        }
        kelasList = await db.kelas.findMany({ where: { id: { in: kelasIds } }, select: { id: true } });
        if (kelasList.length !== kelasIds.length) {
          return NextResponse.json({ error: "Salah satu kelas tidak ditemukan." }, { status: 404 });
        }
      }

      const hashedPassword = await hashPassword(nik);

      const guruBaru = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "GURU",
            nama: nama || "-",
            nik,
            jenisKelamin: jenisKelamin || null,
            deskripsi: deskripsi || null,
            tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
            fotoProfil: fotoProfil || null,
          },
        });

        if (kelasList.length > 0) {
          await tx.kelasGuruMapel.createMany({
            data: kelasList.map((k) => ({ kelasId: k.id, guruId: user.id, mapelId })),
          });
        }

        return user;
      });

      return NextResponse.json(
        { message: "Akun guru berhasil dibuat.", data: guruBaru },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}