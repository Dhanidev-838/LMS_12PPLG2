import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// ============================
// KONFIGURASI
// ============================
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "ganti-ini-di-env-jangan-dipake-production"
);
const COOKIE_NAME = "classify_session";
const TOKEN_EXPIRY = "7d"; // token/login berlaku 7 hari

export type SessionPayload = {
  userId: string;
  passwordSementara: boolean;
  email: string;
  role: "ADMIN" | "KEPSEK" | "KURIKULUM" | "GURU" | "SISWA";
  nama: string;
};

// ============================
// PASSWORD HASHING
// ============================
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}

export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// ============================
// JWT SIGN & VERIFY
// ============================
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch (err) {
    // token invalid, expired, atau tampered
    return null;
  }
}

// ============================
// COOKIE SESSION HELPER
// (dipake di API routes / server components, BUKAN di middleware.ts)
// ============================
export async function createSession(payload: SessionPayload) {
  const token = await signToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari (detik)
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;
  return verifyToken(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME };