type IdentityRole = "SISWA" | "GURU";

const IDENTITY_NUMBER_LENGTHS: Record<IdentityRole, number> = {
  SISWA: 10,
  GURU: 16,
};

export function isValidIdentityNumber(role: IdentityRole, value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d+$/.test(value) &&
    value.length === IDENTITY_NUMBER_LENGTHS[role]
  );
}
