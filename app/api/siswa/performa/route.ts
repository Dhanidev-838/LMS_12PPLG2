import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

type RangeKey = "semua" | "bulan" | "3bulan" | "tahun";

function getRangeStart(range: RangeKey): Date | undefined {
  if (range === "semua") return undefined;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "bulan") start.setDate(1);
  if (range === "3bulan") start.setMonth(start.getMonth() - 3);
  if (range === "tahun") start.setMonth(0, 1);
  return start;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1));
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ["SISWA"]);
    const rangeParam = req.nextUrl.searchParams.get("range") ?? "semua";
    const range: RangeKey = ["semua", "bulan", "3bulan", "tahun"].includes(rangeParam) ? rangeParam as RangeKey : "semua";
    const fromDate = getRangeStart(range);
    const siswaId = session!.userId;
    const kelasSiswa = await db.kelasSiswa.findMany({ where: { siswaId }, select: { kelasId: true } });
    const kelasIds = kelasSiswa.map((item) => item.kelasId);

    if (kelasIds.length === 0) {
      return NextResponse.json({ data: { range, summary: { rataRataSemua: null, rataRataKuis: null, rataRataUjian: null, asesmenSudah: 0, asesmenBelum: 0, asesmenSedang: 0, tugasSudah: 0, tugasBelum: 0, essaySudahDinilai: 0, essayBelumDinilai: 0 }, perkembanganNilai: [], perbandinganTipe: [], progressTugas: { sudah: 0, belum: 0 }, nilaiPerMapel: [], nilaiTerbaru: [], nilaiTertinggi: [], asesmenBelumDikerjakan: [], tugasBelumDikumpulkan: [] } });
    }

    const [asesmenKelas, tugasKelas] = await Promise.all([
      db.asesmenKelas.findMany({
        where: { kelasId: { in: kelasIds }, ...(fromDate ? { asesmen: { createdAt: { gte: fromDate } } } : {}) },
        select: { asesmen: { select: { id: true, judul: true, tipe: true, createdAt: true, mapel: { select: { nama: true } }, submission: { where: { siswaId }, select: { status: true, nilaiAkhir: true, submittedAt: true, jawaban: { select: { soal: { select: { tipe: true } }, nilaiSoal: true } } } } } } },
      }),
      db.tugasKelas.findMany({
        where: { kelasId: { in: kelasIds }, ...(fromDate ? { tugas: { createdAt: { gte: fromDate } } } : {}) },
        select: { tugas: { select: { id: true, judul: true, createdAt: true, mapel: { select: { nama: true } }, submission: { where: { siswaId }, select: { status: true } } } } },
      }),
    ]);

    const asesmenMap = new Map<string, (typeof asesmenKelas)[number]["asesmen"]>();
    asesmenKelas.forEach((item) => asesmenMap.set(item.asesmen.id, item.asesmen));
    const tugasMap = new Map<string, (typeof tugasKelas)[number]["tugas"]>();
    tugasKelas.forEach((item) => tugasMap.set(item.tugas.id, item.tugas));
    const asesmen = [...asesmenMap.values()];
    const tugas = [...tugasMap.values()];
    const assessmentStatus = (item: (typeof asesmen)[number]) => !item.submission[0] ? "BELUM" : item.submission[0].status === "SUDAH" ? "SUDAH" : "SEDANG";
    const taskStatus = (item: (typeof tugas)[number]) => item.submission[0]?.status === "SUDAH" ? "SUDAH" : "BELUM";
    const scored = asesmen.filter((item) => typeof item.submission[0]?.nilaiAkhir === "number");
    const values = scored.map((item) => item.submission[0].nilaiAkhir as number);
    const quizValues = scored.filter((item) => item.tipe === "KUIS").map((item) => item.submission[0].nilaiAkhir as number);
    const examValues = scored.filter((item) => item.tipe === "UJIAN").map((item) => item.submission[0].nilaiAkhir as number);
    const subjectMap = new Map<string, number[]>();
    scored.forEach((item) => { const key = item.mapel?.nama ?? "Umum"; subjectMap.set(key, [...(subjectMap.get(key) ?? []), item.submission[0].nilaiAkhir as number]); });
    const essayAnswers = asesmen.flatMap((item) => item.submission[0]?.status === "SUDAH" ? item.submission[0].jawaban : []).filter((answer) => answer.soal.tipe === "ESSAY");
    const toItem = (item: (typeof asesmen)[number]) => ({ id: item.id, judul: item.judul, tipe: item.tipe, nilai: item.submission[0].nilaiAkhir as number, mapel: item.mapel?.nama ?? "Umum", tanggal: item.submission[0].submittedAt?.toISOString() ?? item.createdAt.toISOString() });
    const latest = [...scored].sort((a, b) => (b.submission[0].submittedAt?.getTime() ?? 0) - (a.submission[0].submittedAt?.getTime() ?? 0));
    const highest = [...scored].sort((a, b) => (b.submission[0].nilaiAkhir ?? 0) - (a.submission[0].nilaiAkhir ?? 0));
    const tugasBelum = tugas.filter((item) => taskStatus(item) === "BELUM");

    return NextResponse.json({ data: { range, summary: { rataRataSemua: average(values), rataRataKuis: average(quizValues), rataRataUjian: average(examValues), asesmenSudah: asesmen.filter((item) => assessmentStatus(item) === "SUDAH").length, asesmenBelum: asesmen.filter((item) => assessmentStatus(item) === "BELUM").length, asesmenSedang: asesmen.filter((item) => assessmentStatus(item) === "SEDANG").length, tugasSudah: tugas.filter((item) => taskStatus(item) === "SUDAH").length, tugasBelum: tugasBelum.length, essaySudahDinilai: essayAnswers.filter((answer) => answer.nilaiSoal !== null).length, essayBelumDinilai: essayAnswers.filter((answer) => answer.nilaiSoal === null).length }, perkembanganNilai: latest.slice(0, 12).reverse().map(toItem), perbandinganTipe: [{ label: "Kuis", nilai: average(quizValues) }, { label: "Ujian", nilai: average(examValues) }], progressTugas: { sudah: tugas.length - tugasBelum.length, belum: tugasBelum.length }, nilaiPerMapel: [...subjectMap.entries()].map(([mapel, subjectValues]) => ({ mapel, nilai: average(subjectValues) })).sort((a, b) => (b.nilai ?? -1) - (a.nilai ?? -1)), nilaiTerbaru: latest.slice(0, 5).map(toItem), nilaiTertinggi: highest.slice(0, 5).map(toItem), asesmenBelumDikerjakan: asesmen.filter((item) => assessmentStatus(item) === "BELUM").slice(0, 8).map((item) => ({ id: item.id, judul: item.judul, tipe: item.tipe, mapel: item.mapel?.nama ?? "Umum" })), tugasBelumDikumpulkan: tugasBelum.slice(0, 8).map((item) => ({ id: item.id, judul: item.judul, mapel: item.mapel?.nama ?? "Umum" })) } });
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    return NextResponse.json({ error: message }, { status: name === "UnauthorizedError" ? 401 : name === "ForbiddenError" ? 403 : 500 });
  }
}