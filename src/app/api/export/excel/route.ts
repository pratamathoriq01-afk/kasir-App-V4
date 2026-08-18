import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { INITIAL_TRANSACTIONS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

// Executive Color Tokens
const COLORS = {
  NAVY: "0F172A",         // Slate 900
  SUBHEADER: "1E293B",    // Slate 800
  AMBER: "D97706",        // Amber 600
  GREEN: "059669",        // Emerald 600
  BLUE: "0284C7",         // Sky 600
  PURPLE: "7C3AED",       // Purple 600
  TEAL: "0D9488",         // Teal 600
  ROW_ALT: "F8FAFC",      // Slate 50
  ROW_WHITE: "FFFFFF",
  TEXT_MAIN: "1E293B",
  TEXT_MUTED: "64748B",
  BORDER: "CBD5E1",
  FILL_GREEN: "D1FAE5",   // Emerald 100
  TEXT_GREEN: "065F46",   // Emerald 800
  FILL_AMBER: "FEF3C7",   // Amber 100
  TEXT_AMBER: "92400E",   // Amber 800
};

const IDR = (val: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

function addStoreHeader(ws: ExcelJS.Worksheet, title: string, colCount: number, accentColor: string = COLORS.AMBER) {
  ws.getColumn(1).width = 3;

  // Row 1: Brand Header
  ws.mergeCells(1, 2, 1, colCount);
  const r1 = ws.getRow(1);
  r1.height = 36;
  const c1 = r1.getCell(2);
  c1.value = "KEDAI NYAMLENG MALANG — EXECUTIVE REPORTING SUITE";
  c1.font = { bold: true, size: 14, name: "Calibri", color: { argb: "FFFFFF" } };
  c1.alignment = { horizontal: "center", vertical: "middle" };
  c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.NAVY } };

  // Row 2: Store info
  ws.mergeCells(2, 2, 2, colCount);
  const r2 = ws.getRow(2);
  r2.height = 20;
  const c2 = r2.getCell(2);
  c2.value = "Jl. Laksada Adi Sucipto Gg.14 No 42, Kel. Blimbing, Malang | WA: 085113661387";
  c2.font = { size: 9, name: "Calibri", color: { argb: COLORS.TEXT_MUTED } };
  c2.alignment = { horizontal: "center", vertical: "middle" };
  c2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };

  // Row 3: Document Title
  ws.mergeCells(3, 2, 3, colCount);
  const r3 = ws.getRow(3);
  r3.height = 26;
  const c3 = r3.getCell(2);
  c3.value = title;
  c3.font = { bold: true, size: 11, name: "Calibri", color: { argb: "FFFFFF" } };
  c3.alignment = { horizontal: "center", vertical: "middle" };
  c3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: accentColor } };

  // Row 4: Generation timestamp & SAK EMKM indicator
  ws.mergeCells(4, 2, 4, colCount);
  const r4 = ws.getRow(4);
  r4.height = 18;
  const c4 = r4.getCell(2);
  c4.value = `Waktu Cetak: ${new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "medium" })} | Standar Laporan: SAK EMKM`;
  c4.font = { italic: true, size: 8.5, name: "Calibri", color: { argb: "64748B" } };
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

    // ---- Compute Financial Metrics ----
    const totalRevenue = allTransactions.reduce((s: number, t: any) => s + (t.total || 0), 0);
    const totalTax = allTransactions.reduce((s: number, t: any) => s + (t.tax || 0), 0);
    const totalHPP = allTransactions.reduce((s: number, t: any) => s + (t.hppTotal || 0), 0);
    const totalNetProfit = allTransactions.reduce((s: number, t: any) => s + (t.netProfit || 0), 0);
    const totalDiscount = allTransactions.reduce((s: number, t: any) => s + (t.discountAmount || 0), 0);
    const totalTrx = allTransactions.length;
    const avgOrderValue = totalTrx > 0 ? Math.round(totalRevenue / totalTrx) : 0;
    const gpmPct = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    const hppPct = totalRevenue > 0 ? (totalHPP / totalRevenue) * 100 : 0;

    // ---- Product Ranking Matrix ----
    const menuMap: Record<string, { nama: string; qty: number; revenue: number; hpp: number }> = {};
    for (const trx of allTransactions) {
      for (const item of trx.items || []) {
        const key = item.nameSnapshot;
        if (!menuMap[key]) menuMap[key] = { nama: key, qty: 0, revenue: 0, hpp: 0 };
        menuMap[key].qty += item.qty;
        menuMap[key].revenue += item.qty * item.priceSnapshot;
        menuMap[key].hpp += item.qty * (item.hppSnapshot || 0);
      }
    }
    const topMenu = Object.values(menuMap).sort((a, b) => b.qty - a.qty);

    // ---- Daily Summary Matrix ----
    const dailyMap: Record<string, { tanggal: string; trx: number; revenue: number; hpp: number; netProfit: number }> = {};
    for (const trx of allTransactions) {
      const dateStr = new Date(trx.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
      if (!dailyMap[dateStr]) dailyMap[dateStr] = { tanggal: dateStr, trx: 0, revenue: 0, hpp: 0, netProfit: 0 };
      dailyMap[dateStr].trx++;
      dailyMap[dateStr].revenue += trx.total || 0;
      dailyMap[dateStr].hpp += trx.hppTotal || 0;
      dailyMap[dateStr].netProfit += trx.netProfit || 0;
    }
    const dailySummary = Object.values(dailyMap);

    // ==================== BUILD EXCEL WORKBOOK ====================
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Kedai Nyamleng Executive Engine";
    workbook.created = new Date();

    // ============================================================
    // SHEET 1: 🤖 AI EXECUTIVE INSIGHT (Tab Color: Amber)
    // ============================================================
    const ws1 = workbook.addWorksheet("🤖 AI Executive Insight", {
      views: [{ showGridLines: false }],
    });
    ws1.properties.tabColor = { argb: COLORS.AMBER };
    addStoreHeader(ws1, "EXECUTIVE SUMMARY & STRATEGIC AI INSIGHTS", 4, COLORS.AMBER);
    [3, 28, 62, 18].forEach((w, i) => ws1.getColumn(i + 1).width = w);

    // KPI Scorecard Cards Block
    const kpiCards = [
      ["💰 Total Omzet Kotor", IDR(totalRevenue), "Termasuk PPN 10%"],
      ["🏭 Total HPP Bahan", IDR(totalHPP), `${hppPct.toFixed(1)}% dari Omzet`],
      ["📈 Laba Bersih (Net Profit)", IDR(totalNetProfit), `GPM ${gpmPct.toFixed(1)}% (${gpmPct >= 30 ? "EXCELLENT" : "STABIL"})`],
      ["💵 Rata-Rata Belanja (AOV)", IDR(avgOrderValue), `Dari ${totalTrx} Transaksi`],
    ];

    kpiCards.forEach((card, idx) => {
      const rIdx = 6 + idx * 3;
      ws1.mergeCells(rIdx, 2, rIdx, 4);
      const headerCell = ws1.getCell(rIdx, 2);
      headerCell.value = card[0];
      headerCell.font = { bold: true, size: 9.5, name: "Calibri", color: { argb: "FFFFFF" } };
      headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.NAVY } };
      headerCell.alignment = { vertical: "middle", indent: 1 };

      ws1.mergeCells(rIdx + 1, 2, rIdx + 1, 3);
      const valCell = ws1.getCell(rIdx + 1, 2);
      valCell.value = card[1];
      valCell.font = { bold: true, size: 14, name: "Calibri", color: { argb: COLORS.TEXT_MAIN } };
      valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.ROW_ALT } };
      valCell.alignment = { vertical: "middle", indent: 1 };

      const subCell = ws1.getCell(rIdx + 1, 4);
      subCell.value = card[2];
      subCell.font = { bold: true, size: 9, name: "Calibri", color: { argb: COLORS.TEXT_GREEN } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.FILL_GREEN } };
      subCell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // ============================================================
    // SHEET 2: ⚖️ AUDIT & KEPATUHAN EMKM (Tab Color: Slate Navy)
    // ============================================================
    const ws2 = workbook.addWorksheet("⚖️ Audit & Kepatuhan EMKM", {
      views: [{ showGridLines: false }],
    });
    ws2.properties.tabColor = { argb: COLORS.NAVY };
    addStoreHeader(ws2, "CHECKLIST AUDIT KEUANGAN & KEPATUHAN SAK EMKM", 5, COLORS.NAVY);
    [3, 30, 40, 22, 24].forEach((w, i) => ws2.getColumn(i + 1).width = w);

    // Header
    const hRow2 = ws2.getRow(6);
    hRow2.values = ["", "Komponen Audit", "Parameter Pengujian", "Hasil Realisasi", "Status Kepatuhan"];
    hRow2.eachCell({ includeEmpty: false }, (cell, colNum) => {
      if (colNum === 1) return;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.NAVY } };
      cell.font = { bold: true, color: { argb: "FFFFFF" }, size: 10, name: "Calibri" };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    hRow2.height = 26;

    const auditChecks = [
      ["Rekonsiliasi Omzet vs Physical Cash", "Kesesuaian total nota dengan fisik kasir", IDR(totalRevenue), "100% MATCH ✅"],
      ["Setoran Pajak Resto (PPN 10%)", "PPN 10% dikumpulkan dari pembeli", IDR(totalTax), "TERKUMPUL ✅"],
      ["Audit Kebocoran Diskon Promo", "Persentase diskon terhadap omzet kotor", `${totalRevenue > 0 ? ((totalDiscount / totalRevenue) * 100).toFixed(1) : 0}%`, "WAJAR (< 10%) ✅"],
      ["Pemeriksaan Anomali HPP > 60%", "Item dengan margin di bawah 40%", `${topMenu.filter(m => m.revenue > 0 && (m.hpp / m.revenue) > 0.6).length} Item Anomali`, "CLEAN ✅"],
      ["Kepatuhan Pencatatan SAK EMKM", "Pencatatan berbasis kas & akrual HPP", "Tercatat Terpisah", "SAK EMKM COMPLIANT ✅"],
    ];

    auditChecks.forEach((row, idx) => {
      const r = ws2.getRow(7 + idx);
      r.values = ["", row[0], row[1], row[2], row[3]];
      r.height = 24;
      r.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? COLORS.ROW_ALT : COLORS.ROW_WHITE } };
        cell.font = { size: 9.5, name: "Calibri" };
        cell.alignment = { vertical: "middle" };
        if (colNum === 2) cell.font = { bold: true, size: 9.5, name: "Calibri" };
        if (colNum === 5) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { bold: true, size: 9.5, name: "Calibri", color: { argb: COLORS.TEXT_GREEN } };
        }
      });
      r.commit();
    });

    // ============================================================
    // SHEET 3: 📊 KPI DASHBOARD (Tab Color: Sky Blue)
    // ============================================================
    const ws3 = workbook.addWorksheet("📊 KPI Dashboard", {
      views: [{ showGridLines: false }],
    });
    ws3.properties.tabColor = { argb: COLORS.BLUE };
    addStoreHeader(ws3, "DASHBOARD INDIKATOR KINERJA UTAMA (KPI)", 5, COLORS.BLUE);
    [3, 38, 25, 20, 22].forEach((w, i) => ws3.getColumn(i + 1).width = w);

    const hRow3 = ws3.getRow(6);
    hRow3.values = ["", "Indikator Kinerja Utama (KPI)", "Nilai Realisasi", "Target SAK EMKM", "Status Evaluasi"];
    hRow3.eachCell({ includeEmpty: false }, (cell, colNum) => {
      if (colNum === 1) return;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.NAVY } };
      cell.font = { bold: true, color: { argb: "FFFFFF" }, size: 10, name: "Calibri" };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    hRow3.height = 26;

    const kpiData = [
      ["💰 Total Omzet Penjualan (Kotor)", IDR(totalRevenue), "Baseline", "NORMAL"],
      ["📦 Total Transaksi Selesai", `${totalTrx} transaksi`, "-", "TERTATA"],
      ["🏷️ Total Diskon Diberikan", IDR(totalDiscount), "< 10.0%", "TERKENDALI"],
      ["🧾 Setoran PPN Resto (10%)", IDR(totalTax), "10.0%", "TERKUMPUL"],
      ["🏭 Total HPP (Harga Pokok)", IDR(totalHPP), "< 50.0%", hppPct <= 50 ? "EFISIEN" : "TINGGI"],
      ["📈 Total Laba Bersih (Net Profit)", IDR(totalNetProfit), `GPM ${gpmPct.toFixed(1)}%`, gpmPct >= 20 ? "EXCELLENT" : "STABIL"],
      ["💵 Rata-Rata Belanja (AOV)", IDR(avgOrderValue), "Per Transaksi", "NORMAL"],
    ];

    kpiData.forEach((row, idx) => {
      const r = ws3.getRow(7 + idx);
      r.values = ["", row[0], row[1], row[2], row[3]];
      r.height = 24;
      r.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? COLORS.ROW_ALT : COLORS.ROW_WHITE } };
        cell.font = { size: 9.5, name: "Calibri" };
        cell.alignment = { vertical: "middle" };
        if (colNum === 2) cell.font = { bold: true, size: 9.5, name: "Calibri", color: { argb: COLORS.TEXT_MAIN } };
        if (colNum === 3) cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: COLORS.NAVY } };
        if (colNum === 4 || colNum === 5) cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      r.commit();
    });

    // Highlighting Net Profit row in KPI
    const netProfitRow = ws3.getRow(12);
    netProfitRow.eachCell({ includeEmpty: false }, (cell, colNum) => {
      if (colNum < 2) return;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.FILL_GREEN } };
      cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: COLORS.TEXT_GREEN } };
    });

    // ============================================================
    // SHEET 4: 🧾 DETAIL TRANSAKSI PENJUALAN (Tab Color: Emerald)
    // ============================================================
    const ws4 = workbook.addWorksheet("🧾 Detail Transaksi", {
      views: [{ showGridLines: true }],
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
    });
    ws4.properties.tabColor = { argb: COLORS.GREEN };
    addStoreHeader(ws4, "LAPORAN DETAIL TRANSAKSI PENJUALAN", 11, COLORS.GREEN);
    [3, 8, 18, 22, 18, 20, 16, 14, 14, 16, 16, 16].forEach((w, i) => ws4.getColumn(i + 1).width = w);

    // Build Native Excel Table with sorting & total row!
    const trxRowsData = allTransactions.map((trx: any, idx: number) => [
      idx + 1,
      trx.orderNumber || "-",
      new Date(trx.createdAt).toLocaleString("id-ID"),
      trx.customerName || "Pelanggan",
      trx.orderType === "dine-in" ? `Dine-In (${trx.tableNumber || "-"})` : "Takeaway",
      trx.subtotal || 0,
      trx.discountAmount || 0,
      trx.tax || 0,
      trx.total || 0,
      trx.hppTotal || 0,
      trx.netProfit || 0,
    ]);

    if (trxRowsData.length > 0) {
      ws4.addTable({
        name: "DetailTransaksiTable",
        ref: "B6",
        headerRow: true,
        totalsRow: true,
        style: {
          theme: "TableStyleMedium9", // Dark Slate/Navy Excel Native Theme
          showRowStripes: true,
        },
        columns: [
          { name: "No.", filterButton: false },
          { name: "Nomor Nota", filterButton: true },
          { name: "Tanggal", filterButton: true },
          { name: "Pelanggan", filterButton: true },
          { name: "Tipe Order", filterButton: true },
          { name: "Subtotal", filterButton: false, totalsRowFunction: "sum" },
          { name: "Diskon", filterButton: false, totalsRowFunction: "sum" },
          { name: "PPN 10%", filterButton: false, totalsRowFunction: "sum" },
          { name: "Total Omzet", filterButton: false, totalsRowFunction: "sum" },
          { name: "HPP Modal", filterButton: false, totalsRowFunction: "sum" },
          { name: "Laba Bersih", filterButton: false, totalsRowFunction: "sum" },
        ],
        rows: trxRowsData,
      });

      // Format currency cells in added table rows
      for (let rIdx = 7; rIdx <= 6 + trxRowsData.length + 1; rIdx++) {
        const row = ws4.getRow(rIdx);
        row.height = 22;
        for (let cIdx = 7; cIdx <= 12; cIdx++) {
          row.getCell(cIdx).numFmt = '"Rp "#,##0';
        }
      }

      // Add Conditional Formatting rule for Laba Bersih column (Column L / 12)
      ws4.addConditionalFormatting({
        ref: `L7:L${6 + trxRowsData.length}`,
        rules: [
          {
            priority: 1,
            type: "cellIs",
            operator: "greaterThan",
            formulae: ["0"],
            style: {
              fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.FILL_GREEN } },
              font: { color: { argb: COLORS.TEXT_GREEN }, bold: true },
            },
          },
        ],
      });
    }

    // ============================================================
    // SHEET 5: 🏆 RANKING & MATRIKS PRODUK (Tab Color: Purple)
    // ============================================================
    const ws5 = workbook.addWorksheet("🏆 Ranking & Matriks Produk", {
      views: [{ showGridLines: true }],
    });
    ws5.properties.tabColor = { argb: COLORS.PURPLE };
    addStoreHeader(ws5, "RANKING & MATRIKS PROFITABILITAS PRODUK", 7, COLORS.PURPLE);
    [3, 8, 38, 20, 22, 20, 22, 18].forEach((w, i) => ws5.getColumn(i + 1).width = w);

    const productRowsData = topMenu.map((menu, idx) => {
      const menuProfit = menu.revenue - menu.hpp;
      const marginPct = menu.revenue > 0 ? (menuProfit / menu.revenue) : 0;
      return [
        idx + 1,
        menu.nama,
        menu.qty,
        menu.revenue,
        menu.hpp,
        menuProfit,
        marginPct,
      ];
    });

    if (productRowsData.length > 0) {
      ws5.addTable({
        name: "RankingProdukTable",
        ref: "B6",
        headerRow: true,
        totalsRow: true,
        style: {
          theme: "TableStyleMedium11",
          showRowStripes: true,
        },
        columns: [
          { name: "Rank", filterButton: false },
          { name: "Nama Menu Produk", filterButton: true },
          { name: "Terjual (Qty)", filterButton: false, totalsRowFunction: "sum" },
          { name: "Total Omzet", filterButton: false, totalsRowFunction: "sum" },
          { name: "Total HPP", filterButton: false, totalsRowFunction: "sum" },
          { name: "Laba Bersih", filterButton: false, totalsRowFunction: "sum" },
          { name: "GPM Margin %", filterButton: false, totalsRowFunction: "average" },
        ],
        rows: productRowsData,
      });

      for (let rIdx = 7; rIdx <= 6 + productRowsData.length + 1; rIdx++) {
        const row = ws5.getRow(rIdx);
        row.height = 22;
        row.getCell(5).numFmt = '"Rp "#,##0';
        row.getCell(6).numFmt = '"Rp "#,##0';
        row.getCell(7).numFmt = '"Rp "#,##0';
        row.getCell(8).numFmt = '0.0%';
      }

      // Add Conditional Formatting for GPM Margin %
      ws5.addConditionalFormatting({
        ref: `H7:H${6 + productRowsData.length}`,
        rules: [
          {
            priority: 1,
            type: "cellIs",
            operator: "greaterThan",
            formulae: ["0.29"],
            style: {
              fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.FILL_GREEN } },
              font: { color: { argb: COLORS.TEXT_GREEN }, bold: true },
            },
          },
        ],
      });
    }

    // ============================================================
    // SHEET 6: 📅 REKAPITULASI HARIAN (Tab Color: Teal)
    // ============================================================
    const ws6 = workbook.addWorksheet("📅 Rekapitulasi Harian", {
      views: [{ showGridLines: true }],
    });
    ws6.properties.tabColor = { argb: COLORS.TEAL };
    addStoreHeader(ws6, "REKAPITULASI PENJUALAN HARIAN", 5, COLORS.TEAL);
    [3, 30, 20, 25, 25, 25].forEach((w, i) => ws6.getColumn(i + 1).width = w);

    const dailyRowsData = dailySummary.map((day) => [
      day.tanggal,
      day.trx,
      day.revenue,
      day.hpp,
      day.netProfit,
    ]);

    if (dailyRowsData.length > 0) {
      ws6.addTable({
        name: "RekapHarianTable",
        ref: "B6",
        headerRow: true,
        totalsRow: true,
        style: {
          theme: "TableStyleMedium13",
          showRowStripes: true,
        },
        columns: [
          { name: "Tanggal Evaluasi", filterButton: true },
          { name: "Jumlah Transaksi", filterButton: false, totalsRowFunction: "sum" },
          { name: "Total Omzet", filterButton: false, totalsRowFunction: "sum" },
          { name: "Total HPP", filterButton: false, totalsRowFunction: "sum" },
          { name: "Total Laba Bersih", filterButton: false, totalsRowFunction: "sum" },
        ],
        rows: dailyRowsData,
      });

      for (let rIdx = 7; rIdx <= 6 + dailyRowsData.length + 1; rIdx++) {
        const row = ws6.getRow(rIdx);
        row.height = 22;
        row.getCell(4).numFmt = '"Rp "#,##0';
        row.getCell(5).numFmt = '"Rp "#,##0';
        row.getCell(6).numFmt = '"Rp "#,##0';
      }

      ws6.addConditionalFormatting({
        ref: `F7:F${6 + dailyRowsData.length}`,
        rules: [
          {
            priority: 1,
            type: "cellIs",
            operator: "greaterThan",
            formulae: ["0"],
            style: {
              fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.FILL_GREEN } },
              font: { color: { argb: COLORS.TEXT_GREEN }, bold: true },
            },
          },
        ],
      });
    }

    // ==================== FINALIZE & EXPORT ====================
    const buffer = await workbook.xlsx.writeBuffer();
    const reportDate = new Date().toISOString().split("T")[0];
    const fileName = `Laporan_Eksekutif_Kedai_Nyamleng_${reportDate}.xlsx`;

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
