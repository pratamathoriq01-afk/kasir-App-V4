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

export async function GET(request: Request) {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.transaction) {
      return jsonWithCors(INITIAL_TRANSACTIONS);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const orderNumber = searchParams.get("orderNumber");

    if (id || orderNumber) {
      const searchKey = (id || orderNumber || "").trim();
      const single = await prismaClient.transaction.findFirst({
        where: {
          OR: [
            { id: searchKey },
            { orderNumber: searchKey },
            { orderNumber: `#${searchKey.replace(/^#/, "")}` },
          ],
        },
        include: { items: true },
      });
      if (!single) {
        return jsonWithCors({ error: "Transaksi tidak ditemukan" }, 404);
      }

      // Normalize status if single lookup
      const st = String(single.orderStatus || "").toUpperCase();
      if (!single.orderStatus || st === "PROCESSED" || st === "PENDING" || st === "COOKING") {
        return jsonWithCors({ ...single, orderStatus: "NEW_ORDER" });
      }
      return jsonWithCors(single);
    }

    const transactions = await prismaClient.transaction.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    // PERMANENT FIX: Normalize DB statuses so that any new order from Menu Digital v2
    // stored as 'PROCESSED', 'PENDING', or empty in Supabase DB is normalized to 'NEW_ORDER'
    // UNLESS the cashier has confirmed it as 'IN_PROCESSED' or completed it as 'ORDER_FINISH'.
    const normalizedTransactions = transactions.map((t: any) => {
      const st = String(t.orderStatus || "").toUpperCase();
      if (!t.orderStatus || st === "PROCESSED" || st === "PENDING" || st === "COOKING") {
        return { ...t, orderStatus: "NEW_ORDER" };
      }
      return t;
    });

    return jsonWithCors(normalizedTransactions);
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

    // Force NEW_ORDER status for all buyer orders coming from Menu Digital v2
    const initialStatus = body.isPOSAdminCheckout
      ? (body.orderStatus || "ORDER_FINISH")
      : "NEW_ORDER";

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
        orderStatus: initialStatus,
        orderNotes: body.orderNotes || null,
        customerPhone: body.customerPhone || null,
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
    const searchKey = String(body.id || body.orderNumber || "").trim();
    if (!searchKey || !body.orderStatus) {
      return jsonWithCors({ error: "ID/Nomor Transaksi dan Status wajib diisi." }, 400);
    }

    // Flexible lookup by id OR orderNumber
    const existing = await prismaClient.transaction.findFirst({
      where: {
        OR: [
          { id: searchKey },
          { orderNumber: searchKey },
          { orderNumber: `#${searchKey.replace(/^#/, "")}` },
        ],
      },
    });

    if (!existing) {
      return jsonWithCors({ error: `Transaksi dengan ID/Nomor "${searchKey}" tidak ditemukan.` }, 404);
    }

    const updated = await prismaClient.transaction.update({
      where: { id: existing.id },
      data: {
        orderStatus: String(body.orderStatus),
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
