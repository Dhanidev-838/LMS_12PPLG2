export type DeadlineSelection =
  | { mode: "none" }
  | { mode: "duration"; amount: string; unit: "hours" | "days" }
  | { mode: "date"; localDateTime: string };

export interface DeadlinePayload {
  deadlineAt: string | null;
  deadlineDurationMinutes: number | null;
}

export function selectionFromDeadline(
  deadlineAt?: string | null,
  deadlineDurationMinutes?: number | null,
): DeadlineSelection {
  if (deadlineAt) {
    const date = new Date(deadlineAt);
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
    return { mode: "date", localDateTime };
  }

  if (deadlineDurationMinutes) {
    if (deadlineDurationMinutes % 1440 === 0) {
      return { mode: "duration", amount: String(deadlineDurationMinutes / 1440), unit: "days" };
    }
    return { mode: "duration", amount: String(deadlineDurationMinutes / 60), unit: "hours" };
  }

  return { mode: "none" };
}

export function selectionToDeadlinePayload(
  selection: DeadlineSelection,
): { payload?: DeadlinePayload; error?: string } {
  if (selection.mode === "none") {
    return { payload: { deadlineAt: null, deadlineDurationMinutes: null } };
  }

  if (selection.mode === "duration") {
    const amount = Number(selection.amount);
    const multiplier = selection.unit === "days" ? 1440 : 60;
    const durationMinutes = amount * multiplier;
    if (!Number.isInteger(amount) || amount < 1 || durationMinutes > 525_600) {
      return { error: "Durasi deadline harus antara 1 jam dan 365 hari." };
    }
    return { payload: { deadlineAt: null, deadlineDurationMinutes: durationMinutes } };
  }

  const timestamp = new Date(selection.localDateTime).getTime();
  if (!selection.localDateTime || !Number.isFinite(timestamp)) {
    return { error: "Tanggal dan waktu deadline tidak valid." };
  }
  return {
    payload: {
      deadlineAt: new Date(timestamp).toISOString(),
      deadlineDurationMinutes: null,
    },
  };
}
