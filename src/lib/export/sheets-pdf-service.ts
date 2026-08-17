import { google } from "googleapis";
import PDFDocument from "pdfkit";

export function getGoogleOAuth2Client(refreshToken?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "https://app-kasir-kedai-nyamleng.vercel.app/oauth2callback";

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  return oauth2Client;
}

/**
 * Generates a PDF Buffer from Google Sheets data using PDFKit & Google Sheets API v4
 */
export async function generatePdfFromGoogleSheets(
  spreadsheetId: string,
  range: string = "Sheet1!A1:Z100",
  refreshToken?: string
): Promise<Buffer> {
  const auth = getGoogleOAuth2Client(refreshToken);
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error("Tidak ada data ditemukan di Google Sheets.");
  }

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Header Banner
      doc.fontSize(18).fillColor("#0F172A").text("KEDAI NYAMLENG MALANG", { align: "center" });
      doc.fontSize(12).fillColor("#D97706").text("Laporan Audit Data Google Sheets", { align: "center" });
      doc.fontSize(9).fillColor("#64748B").text(`Spreadsheet ID: ${spreadsheetId} | Range: ${range}`, { align: "center" });
      doc.moveDown(1.5);

      // Render Rows
      rows.forEach((row, idx) => {
        if (idx === 0) {
          doc.fontSize(10).fillColor("#0F172A").text(row.join(" | "), { underline: true });
        } else {
          doc.fontSize(9).fillColor("#334155").text(row.join(" | "));
        }
        doc.moveDown(0.3);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
