import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Inisialisasi dokumen PDF baru di memori server
    const doc = new PDFDocument({ margin: 50 });

    // 2. Buat buffer untuk menampung data PDF saat sedang ditulis
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    // ---- DESAIN & ISI PDF DIMULAI ----
    // 3. Tambah Judul Laporan
    doc.fontSize(22).fillColor("#0F172A").text("LAPORAN PENJUALAN KEDAI NYAMLENG", { align: "center" });
    doc.moveDown(2); // Memberi jarak baris ke bawah

    // 4. Tambah Informasi Ringkas
    doc.fontSize(12).fillColor("#475569").text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`);
    doc.text("Status: Sinkronisasi Google Sheets Sukses");
    doc.moveDown(1);

    // Garis Pembatas
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#CBD5E1").stroke();
    doc.moveDown(2);

    // 5. Contoh Data Transaksi (Nanti diganti dengan variabel dari Google Sheets)
    const dataPenjualan = [
      { produk: "Ayam Goreng Nyamleng", jumlah: 12, total: "Rp 300.000" },
      { produk: "Es Teh Manis Jumbo", jumlah: 25, total: "Rp 125.000" },
      { produk: "Nasi Goreng Spesial", jumlah: 8, total: "Rp 160.000" },
    ];

    // Tulis data ke PDF menggunakan perulangan
    doc.fontSize(14).fillColor("#0F172A").text("Detail Transaksi:", { underline: true });
    doc.moveDown(0.5);

    dataPenjualan.forEach((item, index) => {
      doc.fontSize(12).fillColor("#334155").text(`${index + 1}. ${item.produk} (${item.jumlah} porsi) - ${item.total}`);
    });
    // ---- DESAIN & ISI PDF SELESAI ----

    // 6. Tutup penulisan dokumen
    doc.end();

    // 7. Tunggu sampai seluruh buffer PDF selesai dikumpulkan
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // 8. Kirim file PDF ke browser sebagai unduhan otomatis (NextResponse Uint8Array)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Laporan_Penjualan.pdf"',
      },
    });
  } catch (error) {
    console.error("Gagal membuat PDF:", error);
    return NextResponse.json({ error: "Gagal membuat file PDF" }, { status: 500 });
  }
}
