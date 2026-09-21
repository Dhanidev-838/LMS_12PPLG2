import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ROUTE_ACCESS, getDashboardPath, type Role } from "@/lib/rbac";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "ganti-ini-di-env-jangan-dipake-production"
);
const COOKIE_NAME = "classify_session";

type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
  nama: string;
  passwordSementara: boolean;
};

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/lupa-password") ||
    pathname.startsWith("/api/verify-otp") ||
    pathname.startsWith("/api/reset-password") ||
    pathname.startsWith("/api/ganti-password-awal");

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (isPublicPath) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // password masih sementara -> paksa ke halaman ganti password dulu
  const isGantiPasswordPage = pathname === "/ganti-password-awal";
  if (session.passwordSementara && !isGantiPasswordPage) {
    return NextResponse.redirect(new URL("/ganti-password-awal", request.url));
  }
  if (!session.passwordSementara && isGantiPasswordPage) {
    return NextResponse.redirect(new URL(getDashboardPath(session.role), request.url));
  }

  const matchedPrefix = Object.keys(ROUTE_ACCESS).find((prefix) => pathname.startsWith(prefix));
  if (matchedPrefix) {
    const allowedRoles = ROUTE_ACCESS[matchedPrefix];
    if (!allowedRoles.includes(session.role)) {
      const correctDashboard = new URL(getDashboardPath(session.role), request.url);
      return NextResponse.redirect(correctDashboard);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};