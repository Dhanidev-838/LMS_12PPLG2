export function durasiMinimal(tipe: "KUIS" | "UJIAN"): number {
  return tipe === "KUIS" ? 10 : 20;
}

export function labelTipe(tipe: "KUIS" | "UJIAN"): string {
  return tipe === "KUIS" ? "Kuis" : "Ujian Online";
}
