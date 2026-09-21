import type { SessionPayload } from "./auth"; // type-only -> gak ikut ke-bundle bcryptjs/next-headers ke edge

export type Role = "ADMIN" | "KEPSEK" | "KURIKULUM" | "GURU" | "SISWA";

// ============================
// GRUP ROLE (biar gampang cek "termasuk admin-tier" dsb)
// ============================
export const ADMIN_TIER: Role[] = ["ADMIN", "KEPSEK", "KURIKULUM"];
export const READ_ONLY_ADMIN_TIER: Role[] = ["KEPSEK", "KURIKULUM"]; // gak bisa CRUD, cuma liat + generate nilai
export const FULL_CRUD_ADMIN: Role[] = ["ADMIN"]; // cuma admin asli yang bisa CRUD kelas/akun

// ============================
// MAP: route prefix -> role yang boleh akses
// dipake bareng di proxy.ts (redirect) DAN di API routes (authorization)
// -> single source of truth, jangan didefinisikan ulang di tempat lain
// ============================
export const ROUTE_ACCESS: Record<string, Role[]> = {
  "/admin": ["ADMIN"],
  "/kepsek": ["KEPSEK"],
  "/kurikulum": ["KURIKULUM"],
  "/guru": ["GURU"],
  "/siswa": ["SISWA"],
  // "/profil" sengaja gak dimasukin -> semua role login boleh akses
};

// ============================
// HELPER CEK ROLE
// ============================

export function hasRole(session: SessionPayload | null, allowedRoles: Role[]): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.role);
}

export function isAdminTier(session: SessionPayload | null): boolean {
  return hasRole(session, ADMIN_TIER);
}

export function isReadOnlyAdmin(session: SessionPayload | null): boolean {
  return hasRole(session, READ_ONLY_ADMIN_TIER);
}

export function isFullAdmin(session: SessionPayload | null): boolean {
  return hasRole(session, FULL_CRUD_ADMIN);
}

// dapetin dashboard default sesuai role, dipake abis login buat redirect
// dan juga dipake di proxy.ts buat redirect kalau role gak sesuai route
export function getDashboardPath(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "KEPSEK":
      return "/kepsek";
    case "KURIKULUM":
      return "/kurikulum";
    case "GURU":
      return "/guru";
    case "SISWA":
      return "/siswa";
    default:
      return "/login";
  }
}

// ============================
// GUARD BUAT API ROUTES
// throw kalau session gak valid / role gak sesuai
// dipake di awal tiap API route yang butuh proteksi
// ============================
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden: role tidak diizinkan") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function requireAuth(session: SessionPayload | null): SessionPayload {
  if (!session) throw new UnauthorizedError();
  return session;
}

export function requireRole(session: SessionPayload | null, allowedRoles: Role[]): SessionPayload {
  const validSession = requireAuth(session);
  if (!allowedRoles.includes(validSession.role)) {
    throw new ForbiddenError();
  }
  return validSession;
}