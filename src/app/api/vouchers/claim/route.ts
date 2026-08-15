import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal || 0);

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "Silakan masukkan kode voucher." },
        { status: 400 }
      );
    }

    let voucher = null;
    const prismaClient = prisma as any;

    if (prismaClient && prismaClient.voucher) {
      voucher = await prismaClient.voucher.findUnique({
        where: { code },
      });
    }

    if (!voucher) {
      return NextResponse.json({
        valid: false,
        message: `Kode voucher "${code}" tidak ditemukan.`,
      });
    }

    if (!voucher.isActive) {
      return NextResponse.json({
        valid: false,
        message: `Voucher "${code}" sudah tidak aktif.`,
      });
    }

    if (subtotal < voucher.minSubtotal) {
      return NextResponse.json({
        valid: false,
        message: `Minimal belanja untuk voucher ini adalah Rp ${voucher.minSubtotal.toLocaleString("id-ID")}.`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (voucher.discountType === "percent") {
      discountAmount = Math.round((subtotal * voucher.discountValue) / 100);
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      discountAmount = voucher.discountValue;
    }

    // Cap discount to subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return NextResponse.json({
      valid: true,
      voucher,
      discountAmount,
      message: `Voucher "${voucher.title}" berhasil digunakan! Hemat Rp ${discountAmount.toLocaleString("id-ID")}`,
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, message: "Gagal memproses klaim voucher.", details: String(error) },
      { status: 500 }
    );
  }
}
