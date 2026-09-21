export function formatWaktuISO(dateInput: string | Date): string {
	const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

	if (Number.isNaN(date.getTime())) return "";

	return date.toISOString();
}

export function formatTanggalIndonesia(dateInput: string | Date): string {
	const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

	if (Number.isNaN(date.getTime())) return "";

	const tanggal = date.toLocaleDateString("id-ID", { day: "numeric", month: "long" });
  const tahunSekarang = new Date().getFullYear();

	if (date.getFullYear() === tahunSekarang) return tanggal;

	return `${date.getDate()} - ${date.toLocaleDateString("id-ID", { month: "long" })} - ${date.getFullYear()}`;
}
