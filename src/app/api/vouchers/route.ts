import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
      return NextResponse.json(INITIAL_VOUCHERS);
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

    return NextResponse.json(vouchers);
  } catch (error) {
    console.warn("DB voucher query error, returning initial vouchers:", error);
    return NextResponse.json(INITIAL_VOUCHERS);
  }
}

export async function POST(request: Request) {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.voucher) {
      return NextResponse.json({ message: "Mock voucher created" });
    }
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();

    if (!code || !body.title) {
      return NextResponse.json(
        { error: "Kode voucher dan Judul wajib diisi." },
        { status: 400 }
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

    return NextResponse.json(newVoucher);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Gagal membuat voucher (kode mungkin sudah ada).", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.voucher) {
      return NextResponse.json({ message: "Mock voucher updated" });
    }
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "ID Voucher wajib diisi." }, { status: 400 });
    }

    const updated = await prismaClient.voucher.update({
      where: { id: body.id },
      data: {
        isActive: body.isActive,
        title: body.title,
        description: body.description,
        discountType: body.discountType,
        discountValue: Number(body.discountValue),
        minSubtotal: Number(body.minSubtotal),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengubah voucher di DB.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient || !prismaClient.voucher) {
      return NextResponse.json({ message: "Mock voucher deleted" });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID Voucher wajib diberikan." }, { status: 400 });
    }

    await prismaClient.voucher.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menghapus voucher.", details: String(error) },
      { status: 500 }
    );
  }
}
