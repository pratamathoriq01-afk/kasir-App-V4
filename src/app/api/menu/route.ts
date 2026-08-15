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

export async function PUT(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ message: "Mock updated" });
    }
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "ID menu tidak ditemukan." }, { status: 400 });
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id: body.id },
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
    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memperbarui menu di DB.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ message: "Mock deleted" });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID menu wajib diberikan." }, { status: 400 });
    }

    // Set foreign keys in transaction items to null if any exist before deleting
    await prisma.transactionItem.updateMany({
      where: { menuItemId: id },
      data: { menuItemId: null },
    });

    const deleted = await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menghapus menu dari DB.", details: String(error) },
      { status: 500 }
    );
  }
}
