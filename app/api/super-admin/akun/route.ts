import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

const CREATABLE_ROLES = ["ADMIN", "KEPSEK", "KURIKULUM"] as const;
type CreatableRole = typeof CREATABLE_ROLES[number];

export async function GET() {
  try {
    requireRole(await getSession(), ["SUPER_ADMIN"]);
    const accounts = await db.user.findMany({
      where: { role: { in: ["ADMIN", "KEPSEK", "KURIKULUM", "SUPER_ADMIN"] } },
      select: { id: true, role: true, nama: true, email: true, fotoProfil: true, passwordSementara: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ data: accounts });
  } catch (error) {
    const status = error instanceof Error && error.name === "UnauthorizedError" ? 401 : error instanceof Error && error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: "Gagal memuat akun pengelola." }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireRole(await getSession(), ["SUPER_ADMIN"]);
    const body = await request.json();
    const role = body.role as CreatableRole;
    const nama = typeof body.nama === "string" ? body.nama.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!CREATABLE_ROLES.includes(role)) {
      return NextResponse.json({ error: "Role akun tidak valid." }, { status: 400 });
    }
    if (!nama || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return NextResponse.json({ error: "Isi nama, email valid, dan password awal minimal 8 karakter." }, { status: 400 });
    }
    const coordinator = await db.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { id: true }, orderBy: { id: "asc" } });
    if (!coordinator) return NextResponse.json({ error: "Akun Super Admin tidak ditemukan." }, { status: 403 });
    const passwordHash = await hashPassword(password);
    const account = await db.$transaction(async (tx) => {
      // Semua pembuatan akun pengelola memakai baris yang sama sebagai kunci.
      // SELECT FOR UPDATE membaca data terbaru setelah permintaan lain selesai.
      const lock = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM \`User\` WHERE id = ${coordinator.id} FOR UPDATE`;
      if (lock.length === 0) return null;
      const existing = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM \`User\` WHERE role = ${role} FOR UPDATE`;
      if (existing.length > 0) return null;
      return tx.user.create({
        data: { role, nama, email, password: passwordHash, passwordSementara: true },
        select: { id: true, role: true, nama: true, email: true, fotoProfil: true, passwordSementara: true, createdAt: true },
      });
    }, { maxWait: 10000, timeout: 20000 });
    if (!account) {
      return NextResponse.json({ error: `Akun ${role} sudah ada. Setiap role hanya boleh memiliki satu akun.` }, { status: 409 });
    }
    return NextResponse.json({ message: "Akun berhasil dibuat. Password awal wajib diganti saat login pertama.", data: account }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email atau akun untuk role ini sudah terdaftar." }, { status: 409 });
    }
    const status = error instanceof Error && error.name === "UnauthorizedError" ? 401 : error instanceof Error && error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: "Gagal membuat akun pengelola." }, { status });
  }
}
