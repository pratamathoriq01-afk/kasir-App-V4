import { NextResponse } from "next/server";
import { generateMultiModelAiText } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, systemPrompt } = body;

    const result = await generateMultiModelAiText({
      prompt: prompt || "Tolong berikan ringkasan eksekutif performa penjualan toko minggu ini.",
      systemPrompt,
    });

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error POST /api/ai/executive-summary:", error);
    return NextResponse.json(
      {
        error: "Gagal memproses analisis AI.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
