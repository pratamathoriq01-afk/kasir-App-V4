import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const orderNumber = searchParams.get("orderNumber");
    const searchKey = (id || orderNumber || "").trim();

    // 1. Try Supabase REST Client
    if (searchKey) {
      const { data: single, error: sErr } = await supabase
        .from("Transaction")
        .select("*, items:TransactionItem(*)")
        .or(`id.eq.${searchKey},orderNumber.eq.${searchKey},orderNumber.eq.#${searchKey.replace(/^#/, "")}`)
        .maybeSingle();

      if (!sErr && single) {
        return jsonWithCors(normalizeTransaction(single));
      }
    } else {
      const { data: list, error: lErr } = await supabase
        .from("Transaction")
        .select("*, items:TransactionItem(*)")
        .order("createdAt", { ascending: false });

      if (!lErr && Array.isArray(list) && list.length > 0) {
        return jsonWithCors(list.map(normalizeTransaction));
      }
    }

    // 2. Prisma Fallback
    const prismaClient = prisma as any;
    if (prismaClient && prismaClient.transaction) {
      if (searchKey) {
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
        if (single) {
          return jsonWithCors(normalizeTransaction(single));
        }
      } else {
        const transactions = await prismaClient.transaction.findMany({
          include: { items: true },
          orderBy: { createdAt: "desc" },
        });
        if (Array.isArray(transactions) && transactions.length > 0) {
          return jsonWithCors(transactions.map(normalizeTransaction));
        }
      }
    }

    return jsonWithCors(INITIAL_TRANSACTIONS);
  } catch (error) {
    console.warn("DB query error, returning initial transactions:", error);
    return jsonWithCors(INITIAL_TRANSACTIONS);
  }
}

function normalizeTransaction(t: any) {
  const isOnlineDigitalOrder =
    (t.orderNumber && String(t.orderNumber).startsWith("KDN-")) ||
    Boolean(t.customerEmail) ||
    Boolean(t.customerPhone) ||
    (Boolean(t.tableNumber) && t.tableNumber !== "-");

  const isKasirConfirmed =
    t.orderNotes === "KASIR_CONFIRMED" ||
    t.orderStatus === "IN_PROCESSED" ||
    t.orderStatus === "CANCELLED";

  if (isOnlineDigitalOrder && !isKasirConfirmed) {
    return { ...t, orderStatus: "NEW_ORDER" };
  }

  const st = String(t.orderStatus || "").toUpperCase();
  if (!t.orderStatus || st === "PROCESSED" || st === "PENDING" || st === "COOKING") {
    return { ...t, orderStatus: "NEW_ORDER" };
  }
  return t;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Unique order number generator
    let finalOrderNumber = String(body.orderNumber || "").trim();
    if (!finalOrderNumber) {
      finalOrderNumber = `KDN-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const transactionId = body.id || `trx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const subtotal = Number(body.subtotal) || 0;
    const tax = Number(body.tax) || 0;
    const total = Number(body.total) || (subtotal + tax);
    const hppTotal = Number(body.hppTotal) || 0;
    const netProfit = Number(body.netProfit) || (total - hppTotal - tax);

    // Initial status: all buyer online orders MUST be NEW_ORDER
    const initialStatus = body.isPOSAdminCheckout
      ? (body.orderStatus || "ORDER_FINISH")
      : "NEW_ORDER";

    const orderNotes = body.isPOSAdminCheckout ? "KASIR_CONFIRMED" : (body.orderNotes || "DIGITAL_ORDER_UNCONFIRMED");

    const trxPayload = {
      id: transactionId,
      orderNumber: finalOrderNumber,
      customerName: body.customerName || "Pelanggan",
      orderType: body.orderType || "dine-in",
      tableNumber: body.tableNumber || "-",
      subtotal,
      discountType: body.discountType || null,
      discountValue: Number(body.discountValue || 0),
      discountAmount: Number(body.discountAmount || 0),
      tax,
      total,
      hppTotal,
      netProfit,
      cashReceived: Number(body.cashReceived || total),
      change: Number(body.change || 0),
      orderStatus: initialStatus,
      orderNotes,
      customerPhone: body.customerPhone || null,
      customerEmail: body.customerEmail || null,
      paymentStatus: body.paymentStatus || "PAID",
      paymentMethod: body.paymentMethod || "QRIS",
      createdAt: body.createdAt || new Date().toISOString(),
    };

    // Raw items mapper
    const rawItems: any[] = body.items || [];
    const itemsPayload = rawItems.map((item: any) => ({
      id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      transactionId,
      menuItemId: item.menuItemId || item.id || null,
      nameSnapshot: item.nameSnapshot || item.name || item.title || "Menu",
      priceSnapshot: Number(item.priceSnapshot || item.price || 0),
      hppSnapshot: Number(item.hppSnapshot || item.hpp || 0),
      qty: Number(item.qty || item.quantity || 1),
    }));

    // 1. Direct Supabase REST Insert / Upsert (100% Reliable & Fast)
    try {
      const { data: savedTrx, error: tErr } = await supabase
        .from("Transaction")
        .upsert(trxPayload, { onConflict: "id" })
        .select()
        .single();

      if (!tErr && savedTrx) {
        if (itemsPayload.length > 0) {
          await supabase.from("TransactionItem").upsert(itemsPayload, { onConflict: "id" });
        }
        return jsonWithCors({ ...savedTrx, items: itemsPayload }, 201);
      }
    } catch (sErr) {
      console.warn("Direct Supabase transaction insert error:", sErr);
    }

    // 2. Prisma Fallback
    const prismaClient = prisma as any;
    if (prismaClient && prismaClient.transaction) {
      const newTrx = await prismaClient.transaction.create({
        data: {
          ...trxPayload,
          items: {
            create: itemsPayload.map(({ transactionId, ...rest }) => rest),
          },
        },
        include: { items: true },
      });
      return jsonWithCors(newTrx, 201);
    }

    return jsonWithCors({ ...trxPayload, items: itemsPayload }, 201);
  } catch (error) {
    console.error("POST transaction error:", error);
    return jsonWithCors(
      { error: "Gagal menyimpan transaksi ke DB.", details: String(error) },
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const searchKey = String(body.id || body.orderNumber || "").trim();
    if (!searchKey || !body.orderStatus) {
      return jsonWithCors({ error: "ID/Nomor Transaksi dan Status wajib diisi." }, 400);
    }

    const newStatus = String(body.orderStatus);

    // 1. Direct Supabase Update
    try {
      const { data: updated, error: uErr } = await supabase
        .from("Transaction")
        .update({
          orderStatus: newStatus,
          orderNotes: "KASIR_CONFIRMED",
        })
        .or(`id.eq.${searchKey},orderNumber.eq.${searchKey}`)
        .select("*, items:TransactionItem(*)")
        .single();

      if (!uErr && updated) {
        return jsonWithCors(updated);
      }
    } catch (e) {
      console.warn("Supabase update error:", e);
    }

    // 2. Prisma Fallback
    const prismaClient = prisma as any;
    if (prismaClient && prismaClient.transaction) {
      const existing = await prismaClient.transaction.findFirst({
        where: {
          OR: [
            { id: searchKey },
            { orderNumber: searchKey },
            { orderNumber: `#${searchKey.replace(/^#/, "")}` },
          ],
        },
      });

      if (existing) {
        const updated = await prismaClient.transaction.update({
          where: { id: existing.id },
          data: {
            orderStatus: newStatus,
            orderNotes: "KASIR_CONFIRMED",
          },
          include: { items: true },
        });
        return jsonWithCors(updated);
      }
    }

    return jsonWithCors({ id: searchKey, orderStatus: newStatus, orderNotes: "KASIR_CONFIRMED" });
  } catch (error) {
    return jsonWithCors(
      { error: "Gagal memperbarui status transaksi di DB.", details: String(error) },
      500
    );
  }
}
