import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_TRANSACTIONS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonWithCors(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-store, max-age=0, must-revalidate",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET() {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.transaction) {
      return jsonWithCors(INITIAL_TRANSACTIONS);
    }
    const transactions = await prismaClient.transaction.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return jsonWithCors(transactions);
  } catch (error) {
    console.warn("DB query error, returning initial transactions:", error);
    return jsonWithCors(INITIAL_TRANSACTIONS);
  }
}

export async function POST(request: Request) {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.transaction) {
      return jsonWithCors({ message: "Mock transaction saved" });
    }
    const body = await request.json();
    const newTrx = await prismaClient.transaction.create({
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
        orderStatus: body.orderStatus || "NEW_ORDER",
        orderNotes: body.orderNotes || null,
        items: {
          create: (body.items || []).map((item: { menuItemId?: string; nameSnapshot: string; priceSnapshot: number; hppSnapshot: number; qty: number }) => ({
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
    return jsonWithCors(newTrx, 201);
  } catch (error) {
    return jsonWithCors(
      { error: "Gagal menyimpan transaksi ke DB.", details: String(error) },
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.transaction) {
      return jsonWithCors({ message: "Mock transaction status updated" });
    }
    const body = await request.json();
    if (!body.id || !body.orderStatus) {
      return jsonWithCors({ error: "ID Transaksi dan Status wajib diisi." }, 400);
    }

    const updated = await prismaClient.transaction.update({
      where: { id: body.id },
      data: {
        orderStatus: body.orderStatus,
      },
      include: { items: true },
    });

    return jsonWithCors(updated);
  } catch (error) {
    return jsonWithCors(
      { error: "Gagal memperbarui status transaksi di DB.", details: String(error) },
      500
    );
  }
}
