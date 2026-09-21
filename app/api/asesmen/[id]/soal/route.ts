import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> }; // id = asesmenId

// POST /api/asesmen/[id]/soal -> tambah soal baru
// body: { tipe: PILIHAN_GANDA|CHECKBOX|ESSAY, pertanyaan, gambar?, opsi?: [{teks, isBenar}] }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id: asesmenId } = await params;
    const body = await req.json();
    const { tipe, pertanyaan, gambar, opsi } = body;

    const asesmen = await db.asesmen.findUnique({ where: { id: asesmenId } });
    if (!asesmen) return NextResponse.json({ error: "Asesmen tidak ditemukan." }, { status: 404 });
    if (asesmen.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan asesmen milik anda." }, { status: 403 });
    }

    if (!tipe || !pertanyaan) {
      return NextResponse.json({ error: "Tipe dan pertanyaan wajib diisi." }, { status: 400 });
    }
    if (!["PILIHAN_GANDA", "CHECKBOX", "ESSAY"].includes(tipe)) {
      return NextResponse.json({ error: "Tipe soal tidak valid." }, { status: 400 });
    }
    if ((tipe === "PILIHAN_GANDA" || tipe === "CHECKBOX") && (!Array.isArray(opsi) || opsi.length < 2)) {
      return NextResponse.json({ error: "Minimal 2 opsi jawaban wajib diisi." }, { status: 400 });
    }

    const urutanTerakhir = await db.soal.count({ where: { asesmenId } });

    const soalBaru = await db.soal.create({
      data: {
        asesmenId,
        urutan: urutanTerakhir + 1,
        tipe,
        pertanyaan,
        gambar: gambar || null,
        opsi:
          tipe !== "ESSAY"
            ? {
                create: opsi.map((o: { teks: string; isBenar: boolean }, i: number) => ({
                  teks: o.teks,
                  isBenar: !!o.isBenar,
                  urutan: i + 1,
                })),
              }
            : undefined,
      },
      include: { opsi: true },
    });

    return NextResponse.json({ message: "Soal berhasil ditambahkan.", data: soalBaru }, { status: 201 });
  } catch (err: any) {
    const status = err.name === "UnauthorizedError" ? 401 : err.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan." }, { status });
  }
}