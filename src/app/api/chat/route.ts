import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
import { createDeepSeek } from "@ai-sdk/deepseek";

export const dynamic = "force-dynamic";

// Inisialisasi DeepSeek Provider
const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { messages, modelPreference } = await req.json();

    // 💡 PILIHAN MODEL BERDASARKAN SETTING ATAU PREFERENSI (Fallback: Gemini / OpenAI)
    let activeModel;

    switch (modelPreference) {
      case "openai":
        activeModel = openai("gpt-4o-mini");
        break;
      case "claude":
      case "anthropic":
        activeModel = anthropic("claude-3-5-haiku-20241022");
        break;
      case "groq":
        activeModel = groq("llama-3.3-70b-versatile");
        break;
      case "deepseek":
        activeModel = deepseek("deepseek-chat");
        break;
      case "gemini":
      default:
        activeModel = google("gemini-1.5-flash");
        break;
    }

    const result = streamText({
      model: activeModel,
      messages,
      system:
        "Anda adalah Asisten Kasir Pintar & AI Financial Advisor resmi Kedai Nyamleng Malang. Tugas Anda membantu kasir dan pemilik toko menganalisis penjualan, merekomendasikan strategi produk, dan menjawab pertanyaan dengan ramah, profesional, dan presisi.",
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Terjadi kesalahan pada AI Server:", error);
    return new Response(
      JSON.stringify({ error: "Gagal memproses permintaan AI" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
