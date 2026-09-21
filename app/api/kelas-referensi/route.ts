import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, FULL_CRUD_ADMIN } from "@/lib/rbac";

// GET /api/kelas-referensi -> daftar master rombel siswa (buat dropdown "Filter Jurusan" di Buat Akun Siswa)
// SMP & SMA (jurusanId: null) SENGAJA ikut ditampilkan -- itu opsi valid buat siswa jenjang umum tanpa jurusan
export async function GET() {
  try {
    const session = await getSession();
    requireRole(session, FULL_CRUD_ADMIN);

    const list = await db.kelasReferensi.findMany({
      include: { jurusan: true },
      orderBy: [{ tingkat: "asc" }, { label: "asc" }],
    });

    return NextResponse.json({ data: list });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}