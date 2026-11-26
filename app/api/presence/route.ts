import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { activityDate } from "@/lib/activity-date";

export async function POST() {
  try {
    const session = requireRole(await getSession(), ["GURU", "SISWA"]);
    const now = new Date();
    await db.loginAktivitas.upsert({
      where: { userId_tanggal: { userId: session.userId, tanggal: activityDate(now) } },
      create: { userId: session.userId, tanggal: activityDate(now), createdAt: now },
      update: { createdAt: now },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    return NextResponse.json({ error: "Presence unavailable." }, { status: name === "UnauthorizedError" ? 401 : 403 });
  }
}
