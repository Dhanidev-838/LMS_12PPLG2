import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireAuth, ADMIN_TIER } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = requireAuth(await getSession());
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
        role: true,
        fotoProfil: true,
        deskripsi: true,
        jenisKelamin: true,
        nis: true,
        nik: true,
        kelasReferensi: { select: { label: true, jurusan: { select: { nama: true } } } },
        kelasGuruMapel: { include: { mapel: { select: { nama: true } } } },
      },
    });

    if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

    const isSelf = session.userId === id;
    const isAdminTier = ADMIN_TIER.includes(session.role as any);
    const bolehLihatIdentitas = isSelf || isAdminTier;

    const mapelUnik = Array.from(new Set(user.kelasGuruMapel.map((kg) => kg.mapel.nama)));

    return NextResponse.json({
      data: {
        id: user.id,
        nama: user.nama,
        role: user.role,
        fotoProfil: user.fotoProfil,
        deskripsi: user.deskripsi,
        jenisKelamin: user.jenisKelamin,
        rombel: user.kelasReferensi?.label ?? null,
        jurusan: user.kelasReferensi?.jurusan?.nama ?? null,
        mapel: mapelUnik,
        nis: bolehLihatIdentitas ? user.nis : null,
        nik: bolehLihatIdentitas ? user.nik : null,
        isSelf,
      },
    });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}

// PATCH -> cuma bisa edit profil sendiri (nama, fotoProfil, deskripsi)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = requireAuth(await getSession());
    const { id } = await params;

    if (session.userId !== id) {
      return NextResponse.json({ error: "Anda tidak bisa mengedit profil orang lain." }, { status: 403 });
    }

    const body = await req.json();
    const { nama, fotoProfil, deskripsi } = body;

    const updated = await db.user.update({
      where: { id },
      data: {
        nama: nama || undefined,
        fotoProfil: fotoProfil !== undefined ? fotoProfil || null : undefined,
        deskripsi: deskripsi !== undefined ? deskripsi || null : undefined,
      },
    });

    return NextResponse.json({ message: "Profil berhasil diperbarui.", data: updated });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}