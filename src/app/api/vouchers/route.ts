import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

const INITIAL_VOUCHERS = [
  {
    id: "vch-001",
    code: "NYAMLENG10",
    title: "Diskon Spesial 10%",
    description: "Potongan 10% untuk minimal pembelian Rp 30.000",
    discountType: "percent",
    discountValue: 10,
    maxDiscount: 15000,
    minSubtotal: 30000,
    validUntil: "2026-12-31",
    isActive: true,
  },
  {
    id: "vch-002",
    code: "HEMAT5K",
    title: "Potongan Rp 5.000",
    description: "Potongan langsung Rp 5.000 min belanja Rp 25.000",
    discountType: "fixed",
    discountValue: 5000,
    maxDiscount: 5000,
    minSubtotal: 25000,
    validUntil: "2026-12-31",
    isActive: true,
  },
  {
    id: "vch-003",
    code: "RAMADAN20",
    title: "Diskon Promo 20%",
    description: "Diskon 20% khusus pelanggan Kedai Nyamleng",
    discountType: "percent",
    discountValue: 20,
    maxDiscount: 25000,
    minSubtotal: 50000,
    validUntil: "2026-12-31",
    isActive: true,
  },
];

export async function GET() {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.voucher) {
      return jsonWithCors(INITIAL_VOUCHERS);
    }

    let vouchers = await prismaClient.voucher.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Seed default vouchers if table is empty
    if (vouchers.length === 0) {
      for (const v of INITIAL_VOUCHERS) {
        await prismaClient.voucher.create({ data: v }).catch(() => {});
      }
      vouchers = await prismaClient.voucher.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    const normalized = vouchers.map((v: any) => {
      const dt = String(v.discountType || "").toLowerCase();
      const type = dt.includes("fixed") ? "fixed" : "percent";
      return {
        ...v,
        discountType: type,
      };
    });

    return jsonWithCors(normalized);
  } catch (error) {
    console.warn("DB voucher query error, returning initial vouchers:", error);
    return jsonWithCors(INITIAL_VOUCHERS);
  }
}

export async function POST(request: Request) {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.voucher) {
      return jsonWithCors({ message: "Mock voucher created" });
    }
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();

    if (!code || !body.title) {
      return jsonWithCors(
        { error: "Kode voucher dan Judul wajib diisi." },
        400
      );
    }

    const newVoucher = await prismaClient.voucher.create({
      data: {
        id: `vch-${Date.now()}`,
        code,
        title: body.title,
        description: body.description || "Promo Voucher Digital",
        discountType: body.discountType || "percent",
        discountValue: Number(body.discountValue || 0),
        maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
        minSubtotal: Number(body.minSubtotal || 0),
        validUntil: body.validUntil || "2026-12-31",
        isActive: body.isActive ?? true,
      },
    });

    return jsonWithCors(newVoucher, 201);
  } catch (error: any) {
    return jsonWithCors(
      { error: "Gagal membuat voucher (kode mungkin sudah ada).", details: String(error) },
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.voucher) {
      return jsonWithCors({ message: "Mock voucher updated" });
    }
    const body = await request.json();
    if (!body.id) {
      return jsonWithCors({ error: "ID Voucher wajib diisi." }, 400);
    }

    const updateData: any = {};
    if (body.code !== undefined) updateData.code = String(body.code).trim().toUpperCase();
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.discountValue !== undefined) updateData.discountValue = Number(body.discountValue);
    if (body.maxDiscount !== undefined) updateData.maxDiscount = body.maxDiscount ? Number(body.maxDiscount) : null;
    if (body.minSubtotal !== undefined) updateData.minSubtotal = Number(body.minSubtotal);
    if (body.validUntil !== undefined) updateData.validUntil = body.validUntil;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await prismaClient.voucher.update({
      where: { id: body.id },
      data: updateData,
    });

    return jsonWithCors(updated);
  } catch (error) {
    return jsonWithCors(
      { error: "Gagal mengubah voucher di DB.", details: String(error) },
      500
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.voucher) {
      return jsonWithCors({ message: "Mock voucher deleted" });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonWithCors({ error: "ID Voucher wajib diberikan." }, 400);
    }

    await prismaClient.voucher.delete({ where: { id } });
    return jsonWithCors({ success: true });
  } catch (error) {
    return jsonWithCors(
      { error: "Gagal menghapus voucher.", details: String(error) },
      500
    );
  }
}
