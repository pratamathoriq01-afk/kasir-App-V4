import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonWithCors(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchKey = (
      searchParams.get("orderNumber") ||
      searchParams.get("id") ||
      searchParams.get("phone") ||
      ""
    ).trim();

    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.transaction) {
      return jsonWithCors({
        found: false,
        message: "Database belum siap",
      });
    }

    if (!searchKey) {
      return jsonWithCors(
        { error: "Silakan masukkan nomor pesanan (orderNumber) atau ID." },
        400
      );
    }

    const transaction = await prismaClient.transaction.findFirst({
      where: {
        OR: [
          { id: searchKey },
          { orderNumber: searchKey },
          { orderNumber: `#${searchKey.replace(/^#/, "")}` },
          { customerPhone: searchKey },
        ],
      },
      include: { items: true },
    });

    if (!transaction) {
      return jsonWithCors({
        found: false,
        message: `Pesanan dengan nomor/ID "${searchKey}" tidak ditemukan.`,
      });
    }

    // Determine status human label for buyer UI
    let statusLabel = "Pesanan Diterima Penjual";
    let statusBadgeColor = "amber";
    let step = 1;

    const rawStatus = (transaction.orderStatus || "NEW_ORDER").toUpperCase();

    if (rawStatus === "NEW_ORDER" || rawStatus === "PENDING") {
      statusLabel = "Menunggu Diterima Kasir";
      statusBadgeColor = "amber";
      step = 1;
    } else if (rawStatus === "PROCESSED" || rawStatus === "COOKING") {
      statusLabel = "Pesanan Diterima & Sedang Diproses Dapur";
      statusBadgeColor = "indigo";
      step = 2;
    } else if (rawStatus === "COMPLETED" || rawStatus === "PAID" || rawStatus === "DONE") {
      statusLabel = "Pesanan Selesai / Siap Diambil";
      statusBadgeColor = "emerald";
      step = 3;
    } else if (rawStatus === "CANCELLED") {
      statusLabel = "Pesanan Dibatalkan";
      statusBadgeColor = "rose";
      step = 0;
    }

    return jsonWithCors({
      found: true,
      id: transaction.id,
      orderNumber: transaction.orderNumber,
      customerName: transaction.customerName,
      tableNumber: transaction.tableNumber,
      orderType: transaction.orderType,
      total: transaction.total,
      orderStatus: rawStatus,
      statusLabel,
      statusBadgeColor,
      step,
      items: transaction.items,
      createdAt: transaction.createdAt,
    });
  } catch (error) {
    return jsonWithCors(
      { error: "Gagal mengecek status pesanan.", details: String(error) },
      500
    );
  }
}
