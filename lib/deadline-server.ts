export interface ParsedDeadlineFields {
  deadlineAt: Date | null;
  deadlineDurationMinutes: number | null;
}

export type DeadlineFieldParseResult =
  | { provided: false }
  | { provided: true; value: ParsedDeadlineFields }
  | { provided: true; error: string };

export function parseDeadlineFields(body: unknown): DeadlineFieldParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { provided: true, error: "Data deadline tidak valid." };
  }

  const record = body as Record<string, unknown>;
  const hasDeadlineAt = Object.prototype.hasOwnProperty.call(record, "deadlineAt");
  const hasDuration = Object.prototype.hasOwnProperty.call(record, "deadlineDurationMinutes");
  if (!hasDeadlineAt && !hasDuration) return { provided: false };

  const rawDeadlineAt = hasDeadlineAt ? record.deadlineAt : null;
  const rawDuration = hasDuration ? record.deadlineDurationMinutes : null;

  if (rawDeadlineAt !== null && typeof rawDeadlineAt !== "string") {
    return { provided: true, error: "Tanggal deadline tidak valid." };
  }
  if (rawDeadlineAt !== null && !Number.isFinite(Date.parse(rawDeadlineAt))) {
    return { provided: true, error: "Tanggal deadline tidak valid." };
  }
  if (rawDuration !== null && (
    typeof rawDuration !== "number"
    || !Number.isInteger(rawDuration)
    || rawDuration < 60
    || rawDuration > 525_600
    || rawDuration % 60 !== 0
  )) {
    return { provided: true, error: "Durasi deadline harus antara 1 jam dan 365 hari." };
  }
  if (rawDeadlineAt !== null && rawDuration !== null) {
    return { provided: true, error: "Pilih tanggal deadline atau durasi, bukan keduanya." };
  }

  return {
    provided: true,
    value: {
      deadlineAt: rawDeadlineAt === null ? null : new Date(rawDeadlineAt),
      deadlineDurationMinutes: rawDuration === null ? null : rawDuration,
    },
  };
}
