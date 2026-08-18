import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { INITIAL_TRANSACTIONS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const IDR = (val: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

function applyHeaderRow(
  ws: ExcelJS.Worksheet,
  row: number,
  values: (string | number)[],
  bgColor: string = "1E3A5F",
  fontColor: string = "FFFFFF"
) {
  const r = ws.getRow(row);
  r.values = ["", ...values];
  r.eachCell({ includeEmpty: false }, (cell, colNum) => {
    if (colNum === 1) return;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    cell.font = { bold: true, color: { argb: fontColor }, size: 11, name: "Calibri" };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "CCCCCC" } },
      left: { style: "thin", color: { argb: "CCCCCC" } },
      bottom: { style: "thin", color: { argb: "CCCCCC" } },
      right: { style: "thin", color: { argb: "CCCCCC" } },
    };
  });
  r.height = 32;
  r.commit();
}

function applyDataRow(
  ws: ExcelJS.Worksheet,
  rowIndex: number,
  values: (string | number)[],
  isAlternate: boolean
) {
  const bgFill: ExcelJS.Fill = isAlternate
    ? { type: "pattern", pattern: "solid", fgColor: { argb: "EFF4FB" } }
    : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF" } };

  const r = ws.getRow(rowIndex);
  r.values = ["", ...values];
  r.eachCell({ includeEmpty: false }, (cell, colNum) => {
    if (colNum === 1) return;
    cell.fill = bgFill;
    cell.font = { size: 10, name: "Calibri" };
    cell.alignment = { vertical: "middle" };
    cell.border = {
      top: { style: "hair", color: { argb: "DDDDDD" } },
      left: { style: "hair", color: { argb: "DDDDDD" } },
      bottom: { style: "hair", color: { argb: "DDDDDD" } },
      right: { style: "hair", color: { argb: "DDDDDD" } },
    };
  });
  r.height = 22;
  r.commit();
}

function addStoreHeader(ws: ExcelJS.Worksheet, title: string, colCount: number) {
  ws.getColumn(1).width = 3;

  // Row 1: Logo text / Store name
  ws.mergeCells(1, 2, 1, colCount);
  const r1 = ws.getRow(1);
  r1.height = 36;
  const c1 = r1.getCell(2);
  c1.value = "KEDAI NYAMLENG";
  c1.font = { bold: true, size: 18, name: "Calibri", color: { argb: "1E3A5F" } };
  c1.alignment = { horizontal: "center", vertical: "middle" };
  c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F6FF" } };

  // Row 2: Address
  ws.mergeCells(2, 2, 2, colCount);
  const r2 = ws.getRow(2);
  r2.height = 20;
  const c2 = r2.getCell(2);
  c2.value = "Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kota Malang | WA: 085113661387";
  c2.font = { size: 9, name: "Calibri", color: { argb: "555555" } };
  c2.alignment = { horizontal: "center", vertical: "middle" };
  c2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F6FF" } };

  // Row 3: Report title
  ws.mergeCells(3, 2, 3, colCount);
  const r3 = ws.getRow(3);
  r3.height = 28;
  const c3 = r3.getCell(2);
  c3.value = title;
  c3.font = { bold: true, size: 13, name: "Calibri", color: { argb: "FFFFFF" } };
  c3.alignment = { horizontal: "center", vertical: "middle" };
  c3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A5F" } };

  // Row 4: Print date
  ws.mergeCells(4, 2, 4, colCount);
  const r4 = ws.getRow(4);
  r4.height = 18;
  const c4 = r4.getCell(2);
  c4.value = `Dicetak: ${new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}`;
  c4.font = { italic: true, size: 9, name: "Calibri", color: { argb: "888888" } };
  c4.alignment = { horizontal: "center", vertical: "middle" };

  // Spacer row
  ws.getRow(5).height = 8;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // ---- Fetch transactions from DB ----
    const prismaClient = prisma as any;
    let allTransactions: any[] = [];

    if (prismaClient?.transaction) {
      const whereClause: any = { orderStatus: "ORDER_FINISH" };
      if (from || to) {
        whereClause.createdAt = {};
        if (from) whereClause.createdAt.gte = new Date(from);
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          whereClause.createdAt.lte = toDate;
        }
      }

      allTransactions = await prismaClient.transaction.findMany({
        where: whereClause,
        include: { items: true },
        orderBy: { createdAt: "asc" },
      });
    } else {
      allTransactions = INITIAL_TRANSACTIONS.filter((t: any) => t.orderStatus === "ORDER_FINISH");
    }

    // ---- Compute KPIs ----
    const totalRevenue = allTransactions.reduce((s: number, t: any) => s + (t.total || 0), 0);
    const totalTax = allTransactions.reduce((s: number, t: any) => s + (t.tax || 0), 0);
    const totalHPP = allTransactions.reduce((s: number, t: any) => s + (t.hppTotal || 0), 0);
    const totalNetProfit = allTransactions.reduce((s: number, t: any) => s + (t.netProfit || 0), 0);
    const totalDiscount = allTransactions.reduce((s: number, t: any) => s + (t.discountAmount || 0), 0);
    const totalTrx = allTransactions.length;
    const avgOrderValue = totalTrx > 0 ? Math.round(totalRevenue / totalTrx) : 0;

    // ---- Top Menu Terlaris ----
    const menuMap: Record<string, { nama: string; qty: number; revenue: number }> = {};
    for (const trx of allTransactions) {
      for (const item of trx.items || []) {
        const key = item.nameSnapshot;
        if (!menuMap[key]) menuMap[key] = { nama: key, qty: 0, revenue: 0 };
        menuMap[key].qty += item.qty;
        menuMap[key].revenue += item.qty * item.priceSnapshot;
      }
    }
    const topMenu = Object.values(menuMap).sort((a, b) => b.qty - a.qty);

    // ---- Rekap per hari ----
    const dailyMap: Record<string, { tanggal: string; trx: number; revenue: number; netProfit: number }> = {};
    for (const trx of allTransactions) {
      const dateStr = new Date(trx.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
      if (!dailyMap[dateStr]) dailyMap[dateStr] = { tanggal: dateStr, trx: 0, revenue: 0, netProfit: 0 };
      dailyMap[dateStr].trx++;
      dailyMap[dateStr].revenue += trx.total || 0;
      dailyMap[dateStr].netProfit += trx.netProfit || 0;
    }
    const dailySummary = Object.values(dailyMap);

    // ==================== BUILD EXCEL ====================
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Kedai Nyamleng POS";
    workbook.created = new Date();

    // ============================================================
    // SHEET 1: RINGKASAN EKSEKUTIF
    // ============================================================
    const ws1 = workbook.addWorksheet("📊 Ringkasan Eksekutif", {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
      views: [{ showGridLines: false }],
    });
    addStoreHeader(ws1, "RINGKASAN EKSEKUTIF KEUANGAN", 5);

    const kpiRows = [
      ["💰 Total Pendapatan (Revenue)", IDR(totalRevenue)],
      ["📦 Total Transaksi Selesai", `${totalTrx} transaksi`],
      ["🏷️ Total Diskon Diberikan", IDR(totalDiscount)],
      ["🧾 Total PPN 10%", IDR(totalTax)],
      ["🏭 Total HPP (Harga Pokok Penjualan)", IDR(totalHPP)],
      ["📈 Total Laba Bersih (Net Profit)", IDR(totalNetProfit)],
      ["💵 Rata-Rata Nilai Order (AOV)", IDR(avgOrderValue)],
      ["📅 Periode Laporan", from && to ? `${from} s/d ${to}` : "Semua Periode"],
    ];

    applyHeaderRow(ws1, 6, ["Indikator Kinerja Utama (KPI)", "Nilai"], "1E3A5F", "FFFFFF");
    ws1.getColumn(2).width = 40;
    ws1.getColumn(3).width = 30;

    kpiRows.forEach((row, idx) => {
      const isAlternate = idx % 2 === 0;
      const r = ws1.getRow(7 + idx);
      r.values = ["", row[0], row[1]];
      r.height = 24;
      r.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = {
          type: "pattern", pattern: "solid",
          fgColor: { argb: isAlternate ? "F0F6FF" : "FFFFFF" },
        };
        cell.font = {
          bold: colNum === 3,
          size: 11,
          name: "Calibri",
          color: { argb: colNum === 3 ? "1E3A5F" : "333333" },
        };
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "hair", color: { argb: "DDDDDD" } },
          bottom: { style: "hair", color: { argb: "DDDDDD" } },
          left: { style: "hair", color: { argb: "DDDDDD" } },
          right: { style: "hair", color: { argb: "DDDDDD" } },
        };
      });
      r.commit();
    });

    // Net Profit highlight row
    const netRow = ws1.getRow(7 + kpiRows.length - 3);
    netRow.eachCell({ includeEmpty: false }, (cell, colNum) => {
      if (colNum < 2) return;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colNum === 3 ? "D5F5E3" : "EAF9F1" } };
      cell.font = { bold: true, size: 11, name: "Calibri", color: { argb: "1A5C3E" } };
    });

    // ============================================================
    // SHEET 2: DETAIL TRANSAKSI
    // ============================================================
    const ws2 = workbook.addWorksheet("🧾 Detail Transaksi", {
      views: [{ showGridLines: false }],
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
    });

    const trxCols = 10;
    addStoreHeader(ws2, "LAPORAN DETAIL TRANSAKSI PENJUALAN", trxCols + 1);

    [3, 45, 20, 15, 18, 18, 14, 14, 18, 18, 14].forEach((w, i) => {
      ws2.getColumn(i + 1).width = w;
    });

    applyHeaderRow(ws2, 6, [
      "No.", "Nomor Nota", "Tanggal & Waktu", "Nama Customer", "Tipe Order",
      "Subtotal", "Diskon", "PPN 10%", "Total", "HPP", "Laba Bersih"
    ], "1E3A5F", "FFFFFF");

    allTransactions.forEach((trx: any, idx: number) => {
      const isAlternate = idx % 2 === 0;
      const r = ws2.getRow(7 + idx);
      const createdDate = new Date(trx.createdAt).toLocaleString("id-ID");
      r.values = [
        "",
        idx + 1,
        trx.orderNumber || "-",
        createdDate,
        trx.customerName || "Pelanggan",
        trx.orderType === "dine-in" ? `Dine-In (Meja ${trx.tableNumber})` : "Takeaway",
        trx.subtotal || 0,
        trx.discountAmount || 0,
        trx.tax || 0,
        trx.total || 0,
        trx.hppTotal || 0,
        trx.netProfit || 0,
      ];

      r.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        const fill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: isAlternate ? "EFF4FB" : "FFFFFF" } };
        cell.fill = fill;
        cell.font = { size: 10, name: "Calibri" };
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "hair", color: { argb: "DDDDDD" } },
          bottom: { style: "hair", color: { argb: "DDDDDD" } },
          left: { style: "hair", color: { argb: "DDDDDD" } },
          right: { style: "hair", color: { argb: "DDDDDD" } },
        };
        // Format currency cells
        if (colNum >= 7) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: "right", vertical: "middle" };
          // Net profit green if positive
          if (colNum === 12) {
            const val = Number(cell.value);
            if (val > 0) cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "1A5C3E" } };
            if (val < 0) cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "C0392B" } };
          }
        }
        if (colNum === 2) { cell.alignment = { horizontal: "center", vertical: "middle" }; }
      });
      r.height = 22;
      r.commit();
    });

    // Total footer row
    if (allTransactions.length > 0) {
      const footerIdx = 7 + allTransactions.length;
      const fr = ws2.getRow(footerIdx);
      fr.values = ["", "", "TOTAL", "", "", "", totalRevenue - totalTax, totalDiscount, totalTax, totalRevenue, totalHPP, totalNetProfit];
      fr.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A5F" } };
        cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FFFFFF" } };
        cell.border = { top: { style: "medium" }, bottom: { style: "medium" } };
        if (colNum >= 7) cell.numFmt = '"Rp "#,##0';
      });
      fr.height = 26;
      fr.commit();
    }

    // ============================================================
    // SHEET 3: TOP MENU TERLARIS
    // ============================================================
    const ws3 = workbook.addWorksheet("🏆 Top Menu Terlaris", {
      views: [{ showGridLines: false }],
    });
    addStoreHeader(ws3, "REKAP PENJUALAN PER MENU (TOP PENJUALAN)", 6);

    [3, 8, 40, 20, 25, 20].forEach((w, i) => ws3.getColumn(i + 1).width = w);

    applyHeaderRow(ws3, 6, ["Rank", "Nama Menu", "Total Terjual (Qty)", "Total Revenue", "% dari Revenue"], "D4700A", "FFFFFF");

    topMenu.forEach((menu, idx) => {
      const revenuePercent = totalRevenue > 0 ? ((menu.revenue / totalRevenue) * 100).toFixed(1) + "%" : "0%";
      const isAlternate = idx % 2 === 0;
      const r = ws3.getRow(7 + idx);

      r.values = ["", idx + 1, menu.nama, menu.qty, menu.revenue, revenuePercent];
      r.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = {
          type: "pattern", pattern: "solid",
          fgColor: { argb: isAlternate ? "FFF8EF" : "FFFFFF" },
        };
        cell.font = {
          bold: colNum === 2 || colNum === 3,
          size: 10, name: "Calibri",
          color: { argb: colNum === 2 ? "D4700A" : "333333" },
        };
        cell.alignment = { vertical: "middle" };
        cell.border = { top: { style: "hair", color: { argb: "DDDDDD" } }, bottom: { style: "hair", color: { argb: "DDDDDD" } }, left: { style: "hair" }, right: { style: "hair" } };
        if (colNum === 4) { cell.alignment = { horizontal: "center", vertical: "middle" }; cell.font = { bold: true, size: 11, name: "Calibri", color: { argb: "D4700A" } }; }
        if (colNum === 5) { cell.numFmt = '"Rp "#,##0'; cell.alignment = { horizontal: "right", vertical: "middle" }; }
        if (colNum === 6) { cell.alignment = { horizontal: "center", vertical: "middle" }; }
        if (idx === 0 && colNum !== 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8CC" } };
          cell.font = { bold: true, size: 11, name: "Calibri", color: { argb: "7D3200" } };
        }
      });
      r.height = 24;
      r.commit();
    });

    // ============================================================
    // SHEET 4: REKAP HARIAN
    // ============================================================
    const ws4 = workbook.addWorksheet("📅 Rekap Harian", {
      views: [{ showGridLines: false }],
    });
    addStoreHeader(ws4, "REKAP PENJUALAN PER HARI", 5);
    [3, 35, 20, 25, 25].forEach((w, i) => ws4.getColumn(i + 1).width = w);

    applyHeaderRow(ws4, 6, ["Tanggal", "Jumlah Transaksi", "Total Revenue", "Total Laba Bersih"], "2C6E49", "FFFFFF");

    dailySummary.forEach((day, idx) => {
      applyDataRow(ws4, 7 + idx, [day.tanggal, day.trx, day.revenue, day.netProfit], idx % 2 === 0);
      const r = ws4.getRow(7 + idx);
      r.getCell(4).numFmt = '"Rp "#,##0';
      r.getCell(5).numFmt = '"Rp "#,##0';
      r.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
      r.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
      r.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      r.commit();
    });

    // Footer
    if (dailySummary.length > 0) {
      const fi = 7 + dailySummary.length;
      const fr = ws4.getRow(fi);
      fr.values = ["", "TOTAL", dailySummary.reduce((s, d) => s + d.trx, 0), totalRevenue, totalNetProfit];
      fr.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "2C6E49" } };
        cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "FFFFFF" } };
        if (colNum >= 4) { cell.numFmt = '"Rp "#,##0'; cell.alignment = { horizontal: "right", vertical: "middle" }; }
      });
      fr.height = 26;
      fr.commit();
    }

    // ==================== FINALIZE ====================
    const buffer = await workbook.xlsx.writeBuffer();

    const reportDate = new Date().toISOString().split("T")[0];
    const fileName = `Laporan_Kedai_Nyamleng_${reportDate}.xlsx`;

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating Excel report:", error);
    return NextResponse.json(
      { error: "Gagal membuat laporan Excel.", details: String(error) },
      { status: 500 }
    );
  }
}
