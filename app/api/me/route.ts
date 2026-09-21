import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/me -> info user yang lagi login (buat header dashboard)
// query fresh ke DB (bukan cuma dari JWT) biar nama/foto yang baru diedit langsung kepakai,
// gak perlu nunggu user login ulang.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, nama: true, email: true, role: true, fotoProfil: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ data: user });
}