import { NextResponse } from "next/server";
import { generatePdfFromGoogleSheets } from "@/lib/export/sheets-pdf-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { spreadsheetId, range, refreshToken } = body;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "spreadsheetId wajib diisi." },
        { status: 400 }
      );
    }

    const pdfBuffer = await generatePdfFromGoogleSheets(
      spreadsheetId,
      range || "Sheet1!A1:Z100",
      refreshToken
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Laporan_Google_Sheets_${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error POST /api/export/google-sheets-pdf:", error);
    return NextResponse.json(
      {
        error: "Gagal membuat PDF dari Google Sheets.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
