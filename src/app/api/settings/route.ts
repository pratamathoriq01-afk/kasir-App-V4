import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.storeSettings) {
      return jsonWithCors({
        id: "default",
        storeName: "Kedai Nyamleng",
        address: "Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kecamatan Blimbing, Kota Malang, Jawa Timur",
        whatsapp: "085113661387",
        city: "Kota Malang",
        province: "Jawa Timur",
      });
    }

    let settings = await prismaClient.storeSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prismaClient.storeSettings.create({
        data: {
          id: "default",
          storeName: "Kedai Nyamleng",
          address: "Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kecamatan Blimbing, Kota Malang, Jawa Timur",
          whatsapp: "085113661387",
          city: "Kota Malang",
          province: "Jawa Timur",
        },
      });
    }

    return jsonWithCors(settings);
  } catch (error) {
    console.error("Error GET /api/settings:", error);
    return jsonWithCors(
      {
        id: "default",
        storeName: "Kedai Nyamleng",
        address: "Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kecamatan Blimbing, Kota Malang, Jawa Timur",
        whatsapp: "085113661387",
        city: "Kota Malang",
        province: "Jawa Timur",
      },
      200
    );
  }
}

export async function PUT(request: Request) {
  try {
    const prismaClient = prisma as any;
    const body = await request.json();

    if (!prismaClient || !prismaClient.storeSettings) {
      return jsonWithCors({ message: "Mock settings updated" });
    }

    const updated = await prismaClient.storeSettings.upsert({
      where: { id: "default" },
      update: {
        storeName: body.storeName || "Kedai Nyamleng",
        address: body.address || "Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kecamatan Blimbing, Kota Malang, Jawa Timur",
        whatsapp: body.whatsapp || "085113661387",
        city: body.city || "Kota Malang",
        province: body.province || "Jawa Timur",
      },
      create: {
        id: "default",
        storeName: body.storeName || "Kedai Nyamleng",
        address: body.address || "Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kecamatan Blimbing, Kota Malang, Jawa Timur",
        whatsapp: body.whatsapp || "085113661387",
        city: body.city || "Kota Malang",
        province: body.province || "Jawa Timur",
      },
    });

    return jsonWithCors(updated);
  } catch (error) {
    console.error("Error PUT /api/settings:", error);
    return jsonWithCors({ error: "Gagal meng-update pengaturan kedai." }, 500);
  }
}
