import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_MENU_ITEMS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(INITIAL_MENU_ITEMS);
    }
    const items = await prisma.menuItem.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.warn("DB query error, returning initial menu items:", error);
    return NextResponse.json(INITIAL_MENU_ITEMS);
  }
}

export async function POST(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ message: "Mock saved" });
    }
    const body = await request.json();
    const newItem = await prisma.menuItem.create({
      data: {
        name: body.name,
        category: body.category,
        price: Number(body.price),
        hpp: Number(body.hpp),
        taxPercent: Number(body.taxPercent || 10),
        icon: body.icon || "🍽️",
        imageUrl: body.imageUrl || null,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan menu ke DB.", details: String(error) },
      { status: 500 }
    );
  }
}
