import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function jsonWithCors(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-store, max-age=0, must-revalidate",
    },
  });
}

export async function OPTIONS() {
  return jsonWithCors({ message: "OK" });
}

export async function GET() {
  const fallbackSettings = {
    id: "default",
    storeName: "Kedai Nyamleng",
    address: "Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kecamatan Blimbing, Kota Malang, Jawa Timur",
    whatsapp: "085113661387",
    city: "Kota Malang",
    province: "Jawa Timur",
    isOpen: true,
    openTime: "08:00",
    closeTime: "22:00",
    isAutoSchedule: true,
    closedReason: "Kedai sedang istirahat / tutup sementara.",
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/oauth2callback",
  };

  try {
    // 1. Try Supabase direct query for instant realtime data
    const { data: supaData, error: supaErr } = await supabase
      .from("StoreSettings")
      .select("*")
      .eq("id", "default")
      .single();

    if (!supaErr && supaData) {
      return jsonWithCors({
        ...fallbackSettings,
        ...supaData,
        googleClientSecret: undefined,
        openaiApiKey: undefined,
        geminiApiKey: undefined,
        anthropicApiKey: undefined,
        groqApiKey: undefined,
        deepseekApiKey: undefined,
      });
    }

    // 2. Try Prisma fallback
    const prismaClient = prisma as any;
    if (prismaClient && prismaClient.storeSettings) {
      const settings = await prismaClient.storeSettings.findUnique({
        where: { id: "default" },
      });
      if (settings) {
        return jsonWithCors({
          ...fallbackSettings,
          ...settings,
          googleClientSecret: undefined,
        });
      }
    }

    return jsonWithCors(fallbackSettings);
  } catch (error) {
    console.error("Error GET /api/settings:", error);
    return jsonWithCors(fallbackSettings, 200);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const updatePayload = {
      id: "default",
      storeName: body.storeName || "Kedai Nyamleng",
      address: body.address || "Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kecamatan Blimbing, Kota Malang, Jawa Timur",
      whatsapp: body.whatsapp || "085113661387",
      city: body.city || "Kota Malang",
      province: body.province || "Jawa Timur",
      isOpen: typeof body.isOpen === "boolean" ? body.isOpen : true,
      openTime: body.openTime || "08:00",
      closeTime: body.closeTime || "22:00",
      isAutoSchedule: typeof body.isAutoSchedule === "boolean" ? body.isAutoSchedule : true,
      closedReason: body.closedReason || "Kedai sedang istirahat / tutup sementara.",
      updatedAt: new Date().toISOString(),
    };

    // 1. Update Supabase table directly
    try {
      await supabase.from("StoreSettings").upsert(updatePayload);
    } catch (e) {
      console.warn("Supabase upsert warning:", e);
    }

    // 2. Update Prisma if available
    try {
      const prismaClient = prisma as any;
      if (prismaClient && prismaClient.storeSettings) {
        await prismaClient.storeSettings.upsert({
          where: { id: "default" },
          update: updatePayload,
          create: updatePayload,
        });
      }
    } catch (e) {
      console.warn("Prisma upsert warning:", e);
    }

    return jsonWithCors(updatePayload);
  } catch (error) {
    console.error("Error PUT /api/settings:", error);
    return jsonWithCors({ error: "Gagal meng-update pengaturan kedai." }, 500);
  }
}
