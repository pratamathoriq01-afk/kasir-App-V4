import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_TRANSACTIONS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(INITIAL_TRANSACTIONS);
    }
    const transactions = await prisma.transaction.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.warn("DB query error, returning initial transactions:", error);
    return NextResponse.json(INITIAL_TRANSACTIONS);
  }
}

export async function POST(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ message: "Mock transaction saved" });
    }
    const body = await request.json();
    const newTrx = await prisma.transaction.create({
      data: {
        orderNumber: body.orderNumber,
        customerName: body.customerName,
        orderType: body.orderType,
        tableNumber: body.tableNumber,
        subtotal: Number(body.subtotal),
        discountType: body.discountType,
        discountValue: Number(body.discountValue || 0),
        discountAmount: Number(body.discountAmount || 0),
        tax: Number(body.tax),
        total: Number(body.total),
        hppTotal: Number(body.hppTotal),
        netProfit: Number(body.netProfit),
        cashReceived: Number(body.cashReceived),
        change: Number(body.change),
        items: {
          create: body.items.map((item: { menuItemId?: string; nameSnapshot: string; priceSnapshot: number; hppSnapshot: number; qty: number }) => ({
            menuItemId: item.menuItemId || null,
            nameSnapshot: item.nameSnapshot,
            priceSnapshot: Number(item.priceSnapshot),
            hppSnapshot: Number(item.hppSnapshot),
            qty: Number(item.qty),
          })),
        },
      },
      include: { items: true },
    });
    return NextResponse.json(newTrx);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan transaksi ke DB.", details: String(error) },
      { status: 500 }
    );
  }
}
