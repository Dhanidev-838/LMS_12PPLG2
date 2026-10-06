import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// driver adapter butuh config koneksi manual, bukan DATABASE_URL langsung
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
  connectionLimit: 5,
  connectTimeout: 15000,
  acquireTimeout: 20000,
  ssl: sslEnabled ? { ca: sslCa, rejectUnauthorized: true } : undefined,
});

// biar gak bikin instance baru tiap hot-reload pas dev
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

db.$queryRaw`SELECT 1`.catch((e) =>
  console.error(
    "DB CONNECT ERROR:",
    JSON.stringify(e?.meta?.driverAdapterError?.cause, Object.getOwnPropertyNames(e?.meta?.driverAdapterError?.cause ?? {}))
  )
);