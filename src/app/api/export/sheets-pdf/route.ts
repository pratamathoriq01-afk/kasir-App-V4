import { NextResponse, NextRequest } from "next/server";
import { google } from "googleapis";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const spreadsheetId =
      searchParams.get("spreadsheetId") ||
      process.env.GOOGLE_SPREADSHEET_ID ||
      "";
    const range = searchParams.get("range") || "Sheet1!A2:C100";

    // 1. Konfigurasi OAuth Google menggunakan Kunci Web Baru
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (process.env.GOOGLE_REFRESH_TOKEN) {
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
    }

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Spreadsheet ID tidak ditemukan. Masukkan parameter ?spreadsheetId=..." },
        { status: 400 }
      );
    }

    // 2. Ambil data dari Google Sheets API
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    
    const sheetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = sheetResponse.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Data di Google Sheets kosong." }, { status: 400 });
    }

    // 3. Inisialisasi Pembuatan Dokumen PDF
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    // --- DESAIN STRUKTUR PDF ---
    // Judul Utama
    doc.fontSize(20).fillColor("#0F172A").text("LAPORAN KASIR KEDAI NYAMLENG", { align: "center" });
    doc.fontSize(10).fillColor("#64748B").text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, { align: "center" });
    doc.moveDown(2);

    // Membuat Header Tabel PDF
    let currentY = doc.y;
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#0F172A");
    doc.text("Nama Produk", 50, currentY, { width: 200 });
    doc.text("Jumlah", 260, currentY, { width: 80, align: "center" });
    doc.text("Total Harga", 360, currentY, { width: 150, align: "right" });
    
    // Garis bawah untuk header tabel
    doc.moveTo(50, currentY + 15).lineTo(540, currentY + 15).strokeColor("#CBD5E1").stroke();
    doc.moveDown(1.5);

    // Looping data dari baris Google Sheets ke dalam tabel PDF
    doc.font("Helvetica").fontSize(10).fillColor("#334155");
    
    rows.forEach((row) => {
      // row[0] = Kolom A, row[1] = Kolom B, row[2] = Kolom C di Google Sheets
      const produk = row[0] || "-";
      const jumlah = row[1] || "0";
      const total = row[2] || "Rp 0";

      currentY = doc.y;

      // Proteksi jika data melebihi batas bawah kertas (buat halaman baru)
      if (currentY > 700) {
        doc.addPage();
        currentY = 40;
      }

      doc.text(produk, 50, currentY, { width: 200 });
      doc.text(jumlah, 260, currentY, { width: 80, align: "center" });
      doc.text(total, 360, currentY, { width: 150, align: "right" });
      
      doc.moveDown(1.2);
    });
    // --- AKHIR DESAIN PDF ---

    // 4. Selesaikan dokumen
    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // 5. Kirim file PDF ke user agar otomatis terdownload (NextResponse Uint8Array)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Laporan_Kedai_Nyamleng.pdf"',
      },
    });

  } catch (error) {
    console.error("Error integrasi Google Sheets ke PDF:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data atau mencetak PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
