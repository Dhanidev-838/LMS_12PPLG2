import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole, ADMIN_TIER } from "@/lib/rbac";

type Params = { params: Promise<{ id: string; submissionId: string }> };
type StatusSoal = "BENAR" | "SALAH" | "SEBAGIAN_BENAR" | "BELUM_DIJAWAB" | "BELUM_DINILAI" | "SUDAH_DINILAI";

async function getContext(asesmenId: string, submissionId: string, userId: string, isAdminTier = false) {
  const asesmen = await db.asesmen.findUnique({
    where: { id: asesmenId },
    include: { mapel: true, kelasTujuan: { include: { kelas: { select: { id: true, judul: true } } } } },
  });
  if (!asesmen) return { error: "Asesmen tidak ditemukan.", status: 404 } as const;
  if (!isAdminTier && asesmen.guruId !== userId) return { error: "Bukan asesmen milik anda.", status: 403 } as const;

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      siswa: {
        select: {
          nama: true,
          nis: true,
          kelasReferensi: { select: { label: true } },
          kelasSiswa: { where: { kelasId: { in: asesmen.kelasTujuan.map((item) => item.kelasId) }, }, select: { kelas: { select: { judul: true } } } },
        },
      },
      jawaban: { include: { opsiDipilih: { select: { opsiJawabanId: true } } } },
    },
  });
  if (!submission || submission.asesmenId !== asesmenId) return { error: "Submission tidak ditemukan pada asesmen ini.", status: 404 } as const;
  return { asesmen, submission } as const;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU", ...ADMIN_TIER]);
    const { id: asesmenId, submissionId } = await params;
    const isAdminTier = ADMIN_TIER.includes(session!.role);
    const context = await getContext(asesmenId, submissionId, session!.userId, isAdminTier);
    if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

    const { asesmen, submission } = context;
    const soalList = await db.soal.findMany({ where: { asesmenId }, include: { opsi: { orderBy: { urutan: "asc" } } }, orderBy: { urutan: "asc" } });
    let order = soalList.map((soal) => soal.id);
    if (submission.soalOrder) {
      try {
        const parsed = JSON.parse(submission.soalOrder) as string[];
        const ids = new Set(order);
        order = [...parsed.filter((id) => ids.has(id)), ...order.filter((id) => !parsed.includes(id))];
      } catch {}
    }
    const soalMap = new Map(soalList.map((soal) => [soal.id, soal]));
    const jawabanMap = new Map(submission.jawaban.map((jawaban) => [jawaban.soalId, jawaban]));
    let totalBenar = 0;
    let totalSalah = 0;
    let totalKosong = 0;
    let totalEssay = 0;
    let totalEssayBelumDinilai = 0;
    let totalObjektif = 0;
    let totalObjektifDijawab = 0;
    let totalNilaiObjektif = 0;
    let totalRaguRagu = 0;
    let totalEssayDijawab = 0;

    const soal = order.map((soalId) => soalMap.get(soalId)).filter(Boolean).map((s) => {
      const jawaban = jawabanMap.get(s!.id);
      const benarIds = s!.opsi.filter((opsi) => opsi.isBenar).map((opsi) => opsi.id);
      const dipilihIds = jawaban?.opsiDipilih.map((opsi) => opsi.opsiJawabanId) ?? [];
      let status: StatusSoal;
      if (jawaban?.raguRagu) totalRaguRagu += 1;
      if (s!.tipe === "ESSAY") {
        totalEssay += 1;
        if (jawaban?.jawabanEssay?.trim()) totalEssayDijawab += 1;
        status = jawaban?.nilaiSoal == null ? "BELUM_DINILAI" : "SUDAH_DINILAI";
        if (jawaban?.nilaiSoal == null) totalEssayBelumDinilai += 1;
      } else if (dipilihIds.length === 0) {
        totalObjektif += 1;
        totalKosong += 1;
        status = "BELUM_DIJAWAB";
      } else {
        totalObjektif += 1;
        totalObjektifDijawab += 1;
        const perfect = benarIds.length === dipilihIds.length && benarIds.every((id) => dipilihIds.includes(id));
        const partial = s!.tipe === "CHECKBOX" && dipilihIds.some((id) => benarIds.includes(id));
        status = perfect ? "BENAR" : partial ? "SEBAGIAN_BENAR" : "SALAH";
        if (perfect) {
          totalBenar += 1;
          totalNilaiObjektif += 100;
        } else {
          totalSalah += 1;
        }
      }
      return {
        id: s!.id, urutan: s!.urutan, tipe: s!.tipe, pertanyaan: s!.pertanyaan, gambar: s!.gambar,
        opsi: s!.opsi.map((opsi) => ({ id: opsi.id, teks: opsi.teks, urutan: opsi.urutan, isBenar: opsi.isBenar })),
        jawabanSiswa: jawaban ? { id: jawaban.id, jawabanEssay: jawaban.jawabanEssay, nilaiSoal: jawaban.nilaiSoal, raguRagu: jawaban.raguRagu, opsiDipilihIds: dipilihIds } : null,
        status,
      };
    });
    const kelas = submission.siswa.kelasSiswa[0]?.kelas.judul ?? submission.siswa.kelasReferensi?.label ?? "-";
    const nilaiObjektif = totalObjektif ? Math.round(totalNilaiObjektif / totalObjektif) : 0;
    return NextResponse.json({ data: { submissionId: submission.id, siswa: { nama: submission.siswa.nama, nis: submission.siswa.nis ?? "-", kelasJurusan: submission.siswa.kelasReferensi?.label ?? "-" }, asesmen: { judul: asesmen.judul, mapel: asesmen.mapel?.nama ?? null }, kelas, mulaiPada: submission.mulaiPada, submittedAt: submission.submittedAt, nilaiAkhir: submission.nilaiAkhir, rekap: { totalBenar, totalSalah, totalKosong, totalEssay, totalEssayBelumDinilai, totalObjektif, totalObjektifDijawab, totalEssayDijawab, totalRaguRagu, nilaiObjektif }, soal } });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    return NextResponse.json({ error: message }, { status: name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    requireRole(session, ["GURU"]);
    const { id: asesmenId, submissionId } = await params;
    const { jawabanSiswaId, nilaiSoal } = await req.json();
    if (!jawabanSiswaId || typeof nilaiSoal !== "number" || nilaiSoal < 0 || nilaiSoal > 100) return NextResponse.json({ error: "jawabanSiswaId dan nilaiSoal (0-100) wajib diisi." }, { status: 400 });
    const context = await getContext(asesmenId, submissionId, session!.userId, false);
    if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
    const jawaban = await db.jawabanSiswa.findUnique({ where: { id: jawabanSiswaId }, include: { soal: true } });
    if (!jawaban || jawaban.submissionId !== submissionId || jawaban.soal.asesmenId !== asesmenId) return NextResponse.json({ error: "Jawaban tidak ditemukan pada submission ini." }, { status: 404 });
    if (jawaban.soal.tipe !== "ESSAY") return NextResponse.json({ error: "Hanya soal essay yang dinilai manual." }, { status: 400 });
    const nilaiAkhir = await db.$transaction(async (tx) => {
      await tx.jawabanSiswa.update({ where: { id: jawabanSiswaId }, data: { nilaiSoal } });
      const soal = await tx.soal.findMany({ where: { asesmenId }, include: { opsi: true } });
      const jawabanList = await tx.jawabanSiswa.findMany({ where: { submissionId }, include: { opsiDipilih: true } });
      const bySoal = new Map(jawabanList.map((item) => [item.soalId, item]));
      const total = soal.reduce((sum, item) => {
        const current = bySoal.get(item.id);
        if (item.tipe === "ESSAY") return sum + (current?.nilaiSoal ?? 0);
        const benar = item.opsi.filter((opsi) => opsi.isBenar).map((opsi) => opsi.id);
        const dipilih = current?.opsiDipilih.map((opsi) => opsi.opsiJawabanId) ?? [];
        return sum + (benar.length === dipilih.length && benar.every((id) => dipilih.includes(id)) ? 100 : 0);
      }, 0);
      const nilai = soal.length ? Math.round(total / soal.length) : 0;
      await tx.submission.update({ where: { id: submissionId }, data: { nilaiAkhir: nilai } });
      return nilai;
    });
    return NextResponse.json({ message: "Nilai essay tersimpan.", data: { nilaiAkhir } });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    return NextResponse.json({ error: message }, { status: name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500 });
  }
}
