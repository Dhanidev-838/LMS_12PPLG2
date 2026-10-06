import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import "dotenv/config";

const sslEnabled = process.env.DB_SSL === "true";
const sslCa = process.env.DB_SSL_CA;

if (sslEnabled && !sslCa) {
  throw new Error("DB_SSL_CA is required when DB_SSL=true");
}

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "Classify",
  ssl: sslEnabled ? { ca: sslCa, rejectUnauthorized: true } : undefined,
});

const db = new PrismaClient({ adapter });

// ===== JURUSAN =====
const jurusanList = ["DKV", "TJKT", "PPLG", "PEMASARAN", "MPLB"];

// ===== KELAS REFERENSI (63 kelas + SMP/SMA) =====
const kelasReferensiSeed: {
  label: string;
  jenjang: string;
  tingkat: number | null;
  jurusan: string | null;
}[] = [
  { label: "SMP", jenjang: "SMP", tingkat: null, jurusan: null },
  { label: "SMA", jenjang: "SMA", tingkat: null, jurusan: null },

  // Kelas 10
  { label: "10 DKV PLUS", jenjang: "SMK", tingkat: 10, jurusan: "DKV" },
  { label: "10 DKV 1", jenjang: "SMK", tingkat: 10, jurusan: "DKV" },
  { label: "10 DKV 2", jenjang: "SMK", tingkat: 10, jurusan: "DKV" },
  { label: "10 TJKT PLUS", jenjang: "SMK", tingkat: 10, jurusan: "TJKT" },
  { label: "10 TJKT 1", jenjang: "SMK", tingkat: 10, jurusan: "TJKT" },
  { label: "10 TJKT 2", jenjang: "SMK", tingkat: 10, jurusan: "TJKT" },
  { label: "10 TJKT 3", jenjang: "SMK", tingkat: 10, jurusan: "TJKT" },
  { label: "10 TJKT 4", jenjang: "SMK", tingkat: 10, jurusan: "TJKT" },
  { label: "10 TJKT 5", jenjang: "SMK", tingkat: 10, jurusan: "TJKT" },
  { label: "10 PPLG 1", jenjang: "SMK", tingkat: 10, jurusan: "PPLG" },
  { label: "10 PPLG 2", jenjang: "SMK", tingkat: 10, jurusan: "PPLG" },
  { label: "10 PEMASARAN 1", jenjang: "SMK", tingkat: 10, jurusan: "PEMASARAN" },
  { label: "10 PEMASARAN 2", jenjang: "SMK", tingkat: 10, jurusan: "PEMASARAN" },
  { label: "10 MPLB PLUS", jenjang: "SMK", tingkat: 10, jurusan: "MPLB" },
  { label: "10 MPLB 1", jenjang: "SMK", tingkat: 10, jurusan: "MPLB" },
  { label: "10 MPLB 2", jenjang: "SMK", tingkat: 10, jurusan: "MPLB" },
  { label: "10 MPLB 3", jenjang: "SMK", tingkat: 10, jurusan: "MPLB" },
  { label: "10 MPLB 4", jenjang: "SMK", tingkat: 10, jurusan: "MPLB" },
  { label: "10 MPLB 5", jenjang: "SMK", tingkat: 10, jurusan: "MPLB" },

  // Kelas 11
  { label: "11 DKV PLUS", jenjang: "SMK", tingkat: 11, jurusan: "DKV" },
  { label: "11 DKV 1", jenjang: "SMK", tingkat: 11, jurusan: "DKV" },
  { label: "11 DKV 2", jenjang: "SMK", tingkat: 11, jurusan: "DKV" },
  { label: "11 TJKT PLUS", jenjang: "SMK", tingkat: 11, jurusan: "TJKT" },
  { label: "11 TJKT 1", jenjang: "SMK", tingkat: 11, jurusan: "TJKT" },
  { label: "11 TJKT 2", jenjang: "SMK", tingkat: 11, jurusan: "TJKT" },
  { label: "11 TJKT 3", jenjang: "SMK", tingkat: 11, jurusan: "TJKT" },
  { label: "11 TJKT 4", jenjang: "SMK", tingkat: 11, jurusan: "TJKT" },
  { label: "11 TJKT 5", jenjang: "SMK", tingkat: 11, jurusan: "TJKT" },
  { label: "11 TJKT 6", jenjang: "SMK", tingkat: 11, jurusan: "TJKT" },
  { label: "11 TJKT 7", jenjang: "SMK", tingkat: 11, jurusan: "TJKT" },
  { label: "11 PPLG 1", jenjang: "SMK", tingkat: 11, jurusan: "PPLG" },
  { label: "11 PPLG 2", jenjang: "SMK", tingkat: 11, jurusan: "PPLG" },
  { label: "11 PEMASARAN 1", jenjang: "SMK", tingkat: 11, jurusan: "PEMASARAN" },
  { label: "11 PEMASARAN 2", jenjang: "SMK", tingkat: 11, jurusan: "PEMASARAN" },
  { label: "11 PEMASARAN 3", jenjang: "SMK", tingkat: 11, jurusan: "PEMASARAN" },
  { label: "11 MPLB PLUS", jenjang: "SMK", tingkat: 11, jurusan: "MPLB" },
  { label: "11 MPLB 1", jenjang: "SMK", tingkat: 11, jurusan: "MPLB" },
  { label: "11 MPLB 2", jenjang: "SMK", tingkat: 11, jurusan: "MPLB" },
  { label: "11 MPLB 3", jenjang: "SMK", tingkat: 11, jurusan: "MPLB" },
  { label: "11 MPLB 4", jenjang: "SMK", tingkat: 11, jurusan: "MPLB" },
  { label: "11 MPLB 5", jenjang: "SMK", tingkat: 11, jurusan: "MPLB" },

  // Kelas 12
  { label: "12 DKV PLUS", jenjang: "SMK", tingkat: 12, jurusan: "DKV" },
  { label: "12 DKV 1", jenjang: "SMK", tingkat: 12, jurusan: "DKV" },
  { label: "12 DKV 2", jenjang: "SMK", tingkat: 12, jurusan: "DKV" },
  { label: "12 TJKT PLUS", jenjang: "SMK", tingkat: 12, jurusan: "TJKT" },
  { label: "12 TJKT 1", jenjang: "SMK", tingkat: 12, jurusan: "TJKT" },
  { label: "12 TJKT 2", jenjang: "SMK", tingkat: 12, jurusan: "TJKT" },
  { label: "12 TJKT 3", jenjang: "SMK", tingkat: 12, jurusan: "TJKT" },
  { label: "12 TJKT 4", jenjang: "SMK", tingkat: 12, jurusan: "TJKT" },
  { label: "12 TJKT 5", jenjang: "SMK", tingkat: 12, jurusan: "TJKT" },
  { label: "12 TJKT 6", jenjang: "SMK", tingkat: 12, jurusan: "TJKT" },
  { label: "12 TJKT 7", jenjang: "SMK", tingkat: 12, jurusan: "TJKT" },
  { label: "12 PPLG 1", jenjang: "SMK", tingkat: 12, jurusan: "PPLG" },
  { label: "12 PPLG 2", jenjang: "SMK", tingkat: 12, jurusan: "PPLG" },
  { label: "12 PEMASARAN 1", jenjang: "SMK", tingkat: 12, jurusan: "PEMASARAN" },
  { label: "12 PEMASARAN 2", jenjang: "SMK", tingkat: 12, jurusan: "PEMASARAN" },
  { label: "12 PEMASARAN 3", jenjang: "SMK", tingkat: 12, jurusan: "PEMASARAN" },
  { label: "12 MPLB PLUS", jenjang: "SMK", tingkat: 12, jurusan: "MPLB" },
  { label: "12 MPLB 1", jenjang: "SMK", tingkat: 12, jurusan: "MPLB" },
  { label: "12 MPLB 2", jenjang: "SMK", tingkat: 12, jurusan: "MPLB" },
  { label: "12 MPLB 3", jenjang: "SMK", tingkat: 12, jurusan: "MPLB" },
  { label: "12 MPLB 4", jenjang: "SMK", tingkat: 12, jurusan: "MPLB" },
  { label: "12 MPLB 5", jenjang: "SMK", tingkat: 12, jurusan: "MPLB" },
];

// ===== MAPEL (opsional, contoh awal - bisa ditambah lewat aplikasi nanti) =====
const mapelList = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Pendidikan Agama",
  "PPKn",
  "Sejarah Indonesia",
  "Pendidikan Jasmani, Olahraga, dan Kesehatan",
  "Seni Budaya",
  "IPAS",
  "Projek Kreatif dan Kewirausahaan",
  "Bimbingan Konseling",
  "Pemrograman Web",
  "Basis Data",
  "Pemrograman Berorientasi Objek",
  "Desain Grafis",
  "Jaringan Komputer",
  "Administrasi Sistem Jaringan",
  "Marketing Digital",
  "Manajemen Perkantoran",
];

async function main() {
  console.log("Seeding jurusan...");
  const jurusanMap: Record<string, string> = {};

  for (const nama of jurusanList) {
    const j = await db.jurusan.upsert({
      where: { nama },
      update: {},
      create: { nama },
    });
    jurusanMap[nama] = j.id;
  }

  console.log("Seeding kelas referensi...");
  for (const kr of kelasReferensiSeed) {
    await db.kelasReferensi.upsert({
      where: { label: kr.label },
      update: {},
      create: {
        label: kr.label,
        jenjang: kr.jenjang,
        tingkat: kr.tingkat,
        jurusanId: kr.jurusan ? jurusanMap[kr.jurusan] : null,
      },
    });
  }

  console.log("Seeding mapel...");
  for (const nama of mapelList) {
    await db.mapel.upsert({
      where: { nama },
      update: {},
      create: { nama },
    });
  }

  console.log("Seeding akun admin default...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await db.user.upsert({
    where: { email: "admin@classify.sch.id" },
    update: {},
    create: {
      email: "admin@classify.sch.id",
      password: hashedPassword,
      role: "ADMIN",
      nama: "Admin Classify",
      passwordSementara: false, // <-- TAMBAH INI
    },
  });

  console.log("Seeding akun kepsek & kurikulum...");

const kepsekPassword = await bcrypt.hash("kepsek123", 10);
await db.user.upsert({
  where: { email: "kepsek@classify.sch.id" },
  update: {},
  create: {
    email: "kepsek@classify.sch.id",
    password: kepsekPassword,
    role: "KEPSEK",
    nama: "Kepala Sekolah",
    passwordSementara: false, // <-- TAMBAH INI
  },
});

const kurikulumPassword = await bcrypt.hash("kurikulum123", 10);
await db.user.upsert({
  where: { email: "kurikulum@classify.sch.id" },
  update: {},
  create: {
    email: "kurikulum@classify.sch.id",
    password: kurikulumPassword,
    role: "KURIKULUM",
    nama: "Waka Kurikulum",
    passwordSementara: false, // <-- TAMBAH INI
  },
});

  console.log("✅ Seed selesai:", jurusanList.length, "jurusan,", kelasReferensiSeed.length, "kelas referensi,", mapelList.length, "mapel, 1 akun admin.");
}
main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });