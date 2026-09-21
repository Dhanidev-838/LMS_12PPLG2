import ExcelJS from "exceljs";

export type NilaiRow = {
  nama: string;
  nis: string;
  kelas: string; // label kelas, misal "12 PPLG 2"
  mapel: string;
  nilai: number | null;
};

export async function generateNilaiExcel(
  judulAsesmen: string,
  rows: NilaiRow[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Classify";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Nilai", {
    properties: { defaultRowHeight: 20 },
  });

  sheet.columns = [
    { header: "Nama", key: "nama", width: 28 },
    { header: "NIS", key: "nis", width: 16 },
    { header: "Kelas / Jurusan", key: "kelas", width: 18 },
    { header: "Mata Pelajaran", key: "mapel", width: 20 },
    { header: "Nilai", key: "nilai", width: 10 },
  ];

  // header styling
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF6B85F6" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  rows.forEach((r) => {
    sheet.addRow({
      nama: r.nama,
      nis: r.nis,
      kelas: r.kelas,
      mapel: r.mapel,
      nilai: r.nilai ?? "-",
    });
  });

  // border tipis buat semua cell yang ada data
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
    });
  });

  // judul di atas tabel (insert row baru di posisi 1, geser header ke bawah)
  sheet.insertRow(1, [`Rekap Nilai — ${judulAsesmen}`]);
  sheet.mergeCells("A1:E1");
  const titleCell = sheet.getCell("A1");
  titleCell.font = { bold: true, size: 13 };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 26;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}