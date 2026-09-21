import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";
import { generateNilaiExcel } from "@/lib/excel";

type Params = { params: Promise<{ id: string }> }; // id = asesmenId

// GET /api/asesmen/[id]/nilai -> hitung & ambil nilai semua siswa yang submit
// (pilihan ganda/checkbox dihitung otomatis; essay defaultnya belum ternilai sampai guru isi manual)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", ...ADMIN_TIER]);

    const { id: asesmenId } = await params;

    const asesmen = await db.asesmen.findUnique({
      where: { id: asesmenId },
      include: {
        mapel: true,
        soal: { select: { tipe: true } },
        kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } },
      },
    });
    if (!asesmen) return NextResponse.json({ error: "Asesmen tidak ditemukan." }, { status: 404 });

    const submissions = await db.submission.findMany({
      where: { asesmenId, status: "SUDAH" },
      include: {
        // rombel siswa (12 PPLG 2, dst) + NIS diambil langsung di sini -- gak perlu query tambahan per siswa
        siswa: {
          select: {
            id: true,
            nama: true,
            nis: true,
            kelasReferensi: { select: { label: true } },
            kelasSiswa: {
              where: { kelasId: { in: asesmen.kelasTujuan.map((ak) => ak.kelasId) } },
              select: { kelas: { select: { id: true, judul: true } } },
            },
          },
        },
        jawaban: { include: { soal: { include: { opsi: true } }, opsiDipilih: { include: { opsiJawaban: true } } } },
      },
    });

    const hasil = [];

    for (const sub of submissions) {
      let totalBenar = 0;
      const totalSoalTerjawab = sub.jawaban.length;

      for (const j of sub.jawaban) {
        if (j.soal.tipe === "ESSAY") continue; // essay dinilai manual, gak dihitung otomatis

        const opsiBenarIds = j.soal.opsi.filter((o) => o.isBenar).map((o) => o.id);
        const opsiDipilihIds = j.opsiDipilih.map((jo) => jo.opsiJawabanId);

        const cocokSempurna =
          opsiBenarIds.length === opsiDipilihIds.length &&
          opsiBenarIds.every((oid) => opsiDipilihIds.includes(oid));

        if (cocokSempurna) totalBenar += 1;
      }

      const totalSoalObjektif = asesmen.soal.filter((soal) => soal.tipe !== "ESSAY").length;
      const nilaiObjektif = totalSoalObjektif > 0 ? Math.round((totalBenar / totalSoalObjektif) * 100) : 0;

      hasil.push({
        submissionId: sub.id,
        nama: sub.siswa.nama,
        nis: sub.siswa.nis ?? "-",
        kelasReferensi: sub.siswa.kelasReferensi?.label ?? "-",
        kelas: sub.siswa.kelasSiswa.map((ks) => ks.kelas),
        nilaiObjektif,
        nilaiAkhir: sub.nilaiAkhir,
        nilaiSementara: sub.nilaiAkhir ?? nilaiObjektif,
        totalSoalTerjawab,
      });
    }

    const format = req.nextUrl.searchParams.get("format");

    if (format === "xlsx") {
      const rows = hasil.map((h) => ({
        nama: h.nama,
        nis: h.nis, // ganti email -> NIS, sesuai format standar yang disepakati
        kelas: h.kelasReferensi, // "Kelas/Jurusan" di Excel = rombel siswa, bukan judul classroom
        mapel: asesmen.mapel?.nama ?? "-",
        nilai: h.nilaiSementara,
      }));
      const buffer = await generateNilaiExcel(asesmen.judul, rows);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="nilai-${asesmen.judul.replace(/\s+/g, "-")}.xlsx"`,
        },
      });
    }

    return NextResponse.json({
      data: {
        asesmen: { judul: asesmen.judul, tipe: asesmen.tipe, mapel: asesmen.mapel?.nama },
        kelas: asesmen.kelasTujuan.map((ak) => ak.kelas.judul), // daftar classroom tujuan, bukan rombel siswa
        nilai: hasil,
      },
    });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/asesmen/[id]/nilai -> reset nilaiAkhir semua submission jadi null (cuma guru pembuat)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);

    const { id: asesmenId } = await params;
    const asesmen = await db.asesmen.findUnique({ where: { id: asesmenId } });
    if (!asesmen) return NextResponse.json({ error: "Asesmen tidak ditemukan." }, { status: 404 });
    if (asesmen.guruId !== session!.userId) {
      return NextResponse.json({ error: "Bukan asesmen milik anda." }, { status: 403 });
    }

    await db.submission.updateMany({ where: { asesmenId }, data: { nilaiAkhir: null } });

    return NextResponse.json({ message: "Nilai berhasil dihapus/direset." });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    const status = name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

