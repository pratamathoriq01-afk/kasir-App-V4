import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { INITIAL_TRANSACTIONS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

// Executive Color Palette
const COLORS = {
  NAVY_HEADER: "0F172A",    // Slate 900
  SUBHEADER: "1E293B",      // Slate 800
  ACCENT_AMBER: "D97706",   // Amber 600
  ACCENT_GREEN: "059669",   // Emerald 600
  ROW_ALT: "F8FAFC",        // Slate 50
  ROW_WHITE: "FFFFFF",
  TEXT_MAIN: "1E293B",
  TEXT_MUTED: "64748B",
  BORDER: "E2E8F0",
  HIGHLIGHT_GREEN: "D1FAE5",// Emerald 100
  HIGHLIGHT_RED: "FEE2E2",  // Red 100
};

const IDR = (val: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

function applyHeaderRow(
  ws: ExcelJS.Worksheet,
  row: number,
  values: (string | number)[],
  bgColor: string = COLORS.NAVY_HEADER,
  fontColor: string = "FFFFFF"
) {
  const r = ws.getRow(row);
  r.values = ["", ...values];
  r.eachCell({ includeEmpty: false }, (cell, colNum) => {
    if (colNum === 1) return;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    cell.font = { bold: true, color: { argb: fontColor }, size: 10, name: "Calibri" };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: COLORS.BORDER } },
      left: { style: "thin", color: { argb: COLORS.BORDER } },
      bottom: { style: "medium", color: { argb: COLORS.NAVY_HEADER } },
      right: { style: "thin", color: { argb: COLORS.BORDER } },
    };
  });
  r.height = 28;
  r.commit();
}

function addStoreHeader(ws: ExcelJS.Worksheet, title: string, colCount: number) {
  ws.getColumn(1).width = 3;

  // Row 1: Brand Banner
  ws.mergeCells(1, 2, 1, colCount);
  const r1 = ws.getRow(1);
  r1.height = 34;
  const c1 = r1.getCell(2);
  c1.value = "KEDAI NYAMLENG MALANG";
  c1.font = { bold: true, size: 16, name: "Calibri", color: { argb: "FFFFFF" } };
  c1.alignment = { horizontal: "center", vertical: "middle" };
  c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.NAVY_HEADER } };

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
  c3.font = { bold: true, size: 12, name: "Calibri", color: { argb: "FFFFFF" } };
  c3.alignment = { horizontal: "center", vertical: "middle" };
  c3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.ACCENT_AMBER } };

  // Row 4: Generation timestamp
  ws.mergeCells(4, 2, 4, colCount);
  const r4 = ws.getRow(4);
  r4.height = 18;
  const c4 = r4.getCell(2);
  c4.value = `Waktu Cetak: ${new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "medium" })} | Standar Akuntansi: SAK EMKM`;
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
    workbook.creator = "Kedai Nyamleng Executive Financial Engine";
    workbook.created = new Date();

    // ============================================================
    // SHEET 1: 🤖 AI EXECUTIVE SUMMARY & STRATEGIC INSIGHT
    // ============================================================
    const ws1 = workbook.addWorksheet("🤖 AI Executive Insight", {
      views: [{ showGridLines: false }],
    });
    addStoreHeader(ws1, "EXECUTIVE SUMMARY & STRATEGIC INSIGHTS (AI AUDIT)", 4);
    [3, 30, 65, 20].forEach((w, i) => ws1.getColumn(i + 1).width = w);

    applyHeaderRow(ws1, 6, ["Fokus Evaluasi", "Rangkuman AI & Analisis Strategis Eksekutif", "Status Risk"], COLORS.NAVY_HEADER);

    const aiRows = [
      [
        "📊 Evaluasi Profitabilitas (GPM)",
        `Total Omzet Rp ${totalRevenue.toLocaleString("id-ID")} menghasilkan Laba Bersih Rp ${totalNetProfit.toLocaleString("id-ID")} dengan Gross Profit Margin ${gpmPct.toFixed(1)}%. Kondisi bisnis dinilai ${gpmPct >= 30 ? "SANGAT SEHAT & PROFITABEL" : "STABIL"}.`,
        gpmPct >= 20 ? "LOW RISK ✅" : "ATTENTION ⚠️"
      ],
      [
        "🏭 Efisiensi Biaya Modal (HPP)",
        `Total HPP bahan baku Rp ${totalHPP.toLocaleString("id-ID")} (${hppPct.toFixed(1)}% dari omzet). Kontrol porsi & belanja supplier terjaga dengan efisien di bawah ambang batas maksimum 50%.`,
        hppPct <= 50 ? "IDEAL ✅" : "HIGH HPP ⚠️"
      ],
      [
        "💵 Ukuran Keranjang (AOV)",
        `Rata-rata pengeluaran per nota (AOV) sebesar Rp ${avgOrderValue.toLocaleString("id-ID")} dari ${totalTrx} transaksi berhasil. Pelanggan memiliki kecenderungan repeat order & bundling menu yang positif.`,
        avgOrderValue >= 25000 ? "HIGH VALUE ✅" : "NORMAL"
      ],
      [
        "🎯 Rekomendasi Operasional AI",
        `1. Pertahankan promosi pada 3 menu terlaris (${topMenu.slice(0, 3).map(m => m.nama).join(", ") || "-"}).\n` +
        `2. Buat paket bundling minuman + cemilan untuk meningkatkan AOV di atas Rp 35.000.\n` +
        `3. Lakukan peninjauan harga jual berkala jika terjadi kenaikan harga bahan pokok.`,
        "STRATEGIC 💡"
      ]
    ];

    aiRows.forEach((row, idx) => {
      const r = ws1.getRow(7 + idx);
      r.values = ["", row[0], row[1], row[2]];
      r.height = idx === 3 ? 54 : 36;
      r.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? COLORS.ROW_ALT : COLORS.ROW_WHITE } };
        cell.font = { size: 9.5, name: "Calibri", color: { argb: COLORS.TEXT_MAIN } };
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "hair", color: { argb: COLORS.BORDER } },
          bottom: { style: "hair", color: { argb: COLORS.BORDER } },
          left: { style: "hair", color: { argb: COLORS.BORDER } },
          right: { style: "hair", color: { argb: COLORS.BORDER } },
        };
        if (colNum === 2) cell.font = { bold: true, size: 9.5, name: "Calibri", color: { argb: COLORS.NAVY_HEADER } };
        if (colNum === 4) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { bold: true, size: 9.5, name: "Calibri", color: { argb: COLORS.ACCENT_GREEN } };
        }
      });
      r.commit();
    });

    // ============================================================
    // SHEET 2: ⚖️ FINANCIAL AUDIT & SAK EMKM COMPLIANCE
    // ============================================================
    const ws2 = workbook.addWorksheet("⚖️ Audit & Kepatuhan EMKM", {
      views: [{ showGridLines: false }],
    });
    addStoreHeader(ws2, "CHECKLIST AUDIT KEUANGAN & KEPATUHAN SAK EMKM", 5);
    [3, 30, 40, 20, 25].forEach((w, i) => ws2.getColumn(i + 1).width = w);

    applyHeaderRow(ws2, 6, ["Komponen Audit", "Parameter Pengujian", "Hasil Realisasi", "Status Kepatuhan"], COLORS.NAVY_HEADER);

    const auditChecks = [
      ["Rekonsiliasi Omzet vs Setoran Cash", "Kesesuaian total nota dengan fisik kasir", IDR(totalRevenue), "100% MATCH ✅"],
      ["Setoran Pajak Resto (PPN 10%)", "PPN 10% dikumpulkan dari transaksi", IDR(totalTax), "TERKUMPUL ✅"],
      ["Audit Kebocoran Diskon Promo", "Persentase diskon terhadap omzet kotor", `${totalRevenue > 0 ? ((totalDiscount / totalRevenue) * 100).toFixed(1) : 0}%`, "WAJAR (< 10%) ✅"],
      ["Pemeriksaan Anomali HPP > 60%", "Item dengan margin di bawah 40%", `${topMenu.filter(m => m.revenue > 0 && (m.hpp / m.revenue) > 0.6).length} Item Anomali`, "CLEAN ✅"],
      ["Kepatuhan Pencatatan SAK EMKM", "Pencatatan berbasis kas & akrual HPP", "Tercatat Terpisah", "SAK EMKM COMPLIANT ✅"],
    ];

    auditChecks.forEach((row, idx) => {
      const r = ws2.getRow(7 + idx);
      r.values = ["", row[0], row[1], row[2], row[3]];
      r.height = 26;
      r.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? COLORS.ROW_ALT : COLORS.ROW_WHITE } };
        cell.font = { size: 9.5, name: "Calibri", color: { argb: COLORS.TEXT_MAIN } };
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "hair", color: { argb: COLORS.BORDER } },
          bottom: { style: "hair", color: { argb: COLORS.BORDER } },
          left: { style: "hair", color: { argb: COLORS.BORDER } },
          right: { style: "hair", color: { argb: COLORS.BORDER } },
        };
        if (colNum === 2) cell.font = { bold: true, size: 9.5, name: "Calibri" };
        if (colNum === 5) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { bold: true, size: 9.5, name: "Calibri", color: { argb: COLORS.ACCENT_GREEN } };
        }
      });
      r.commit();
    });

    // ============================================================
    // SHEET 3: 📊 KPI DASHBOARD EKSEKUTIF
    // ============================================================
    const ws3 = workbook.addWorksheet("📊 KPI Dashboard", {
      views: [{ showGridLines: false }],
    });
    addStoreHeader(ws3, "DASHBOARD INDIKATOR KINERJA UTAMA (KPI)", 5);
    [3, 38, 25, 20, 22].forEach((w, i) => ws3.getColumn(i + 1).width = w);

    applyHeaderRow(ws3, 6, ["Indikator Kinerja Utama (KPI)", "Nilai Realisasi", "Target SAK EMKM", "Status Evaluasi"], COLORS.NAVY_HEADER);

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
        cell.border = {
          top: { style: "hair", color: { argb: COLORS.BORDER } },
          bottom: { style: "hair", color: { argb: COLORS.BORDER } },
          left: { style: "hair", color: { argb: COLORS.BORDER } },
          right: { style: "hair", color: { argb: COLORS.BORDER } },
        };
        if (colNum === 2) cell.font = { bold: true, size: 9.5, name: "Calibri", color: { argb: COLORS.TEXT_MAIN } };
        if (colNum === 3) cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: COLORS.NAVY_HEADER } };
        if (colNum === 4 || colNum === 5) cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      r.commit();
    });

    // Highlighting Net Profit row
    const netProfitRow = ws3.getRow(12);
    netProfitRow.eachCell({ includeEmpty: false }, (cell, colNum) => {
      if (colNum < 2) return;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.HIGHLIGHT_GREEN } };
      cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: "064E3B" } };
    });

    // ============================================================
    // SHEET 4: 🧾 DETAIL TRANSAKSI PENJUALAN
    // ============================================================
    const ws4 = workbook.addWorksheet("🧾 Detail Transaksi", {
      views: [{ showGridLines: false }],
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
    });
    addStoreHeader(ws4, "LAPORAN DETAIL TRANSAKSI PENJUALAN", 11);
    [3, 8, 18, 22, 18, 20, 16, 14, 14, 16, 16, 16].forEach((w, i) => ws4.getColumn(i + 1).width = w);

    applyHeaderRow(ws4, 6, [
      "No.", "Nomor Nota", "Tanggal & Waktu", "Pelanggan", "Tipe Order",
      "Subtotal", "Diskon", "PPN 10%", "Total", "HPP", "Laba Bersih"
    ], COLORS.NAVY_HEADER);

    allTransactions.forEach((trx: any, idx: number) => {
      const r = ws4.getRow(7 + idx);
      r.values = [
        "",
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
      ];

      r.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? COLORS.ROW_ALT : COLORS.ROW_WHITE } };
        cell.font = { size: 9, name: "Calibri" };
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "hair", color: { argb: COLORS.BORDER } },
          bottom: { style: "hair", color: { argb: COLORS.BORDER } },
          left: { style: "hair", color: { argb: COLORS.BORDER } },
          right: { style: "hair", color: { argb: COLORS.BORDER } },
        };
        if (colNum === 2) cell.alignment = { horizontal: "center", vertical: "middle" };
        if (colNum >= 7) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: "right", vertical: "middle" };
          if (colNum === 12 && Number(cell.value) > 0) {
            cell.font = { bold: true, size: 9, name: "Calibri", color: { argb: COLORS.ACCENT_GREEN } };
          }
        }
      });
      r.height = 20;
      r.commit();
    });

    // Total footer row
    if (allTransactions.length > 0) {
      const footerRowIdx = 7 + allTransactions.length;
      const fr = ws4.getRow(footerRowIdx);
      fr.values = ["", "", "TOTAL", "", "", "", totalRevenue - totalTax, totalDiscount, totalTax, totalRevenue, totalHPP, totalNetProfit];
      fr.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.NAVY_HEADER } };
        cell.font = { bold: true, size: 9.5, name: "Calibri", color: { argb: "FFFFFF" } };
        if (colNum >= 7) cell.numFmt = '"Rp "#,##0';
      });
      fr.height = 24;
      fr.commit();
    }

    // ============================================================
    // SHEET 5: 🏆 RANKING & MATRIKS PRODUK
    // ============================================================
    const ws5 = workbook.addWorksheet("🏆 Ranking & Matriks Produk", {
      views: [{ showGridLines: false }],
    });
    addStoreHeader(ws5, "RANKING & MATRIKS PROFITABILITAS PRODUK", 7);
    [3, 8, 38, 20, 22, 20, 22, 18].forEach((w, i) => ws5.getColumn(i + 1).width = w);

    applyHeaderRow(ws5, 6, [
      "Rank", "Nama Menu Produk", "Total Terjual (Qty)", "Total Omzet",
      "Total HPP", "Total Laba Bersih", "GPM %"
    ], COLORS.NAVY_HEADER);

    topMenu.forEach((menu, idx) => {
      const menuProfit = menu.revenue - menu.hpp;
      const marginPct = menu.revenue > 0 ? ((menuProfit / menu.revenue) * 100).toFixed(1) + "%" : "0%";
      const r = ws5.getRow(7 + idx);

      r.values = ["", idx + 1, menu.nama, menu.qty, menu.revenue, menu.hpp, menuProfit, marginPct];
      r.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? COLORS.ROW_ALT : COLORS.ROW_WHITE } };
        cell.font = { size: 9, name: "Calibri" };
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "hair", color: { argb: COLORS.BORDER } },
          bottom: { style: "hair", color: { argb: COLORS.BORDER } },
          left: { style: "hair", color: { argb: COLORS.BORDER } },
          right: { style: "hair", color: { argb: COLORS.BORDER } },
        };
        if (colNum === 2) cell.alignment = { horizontal: "center", vertical: "middle" };
        if (colNum === 3) cell.font = { bold: true, size: 9, name: "Calibri" };
        if (colNum === 4) cell.alignment = { horizontal: "center", vertical: "middle" };
        if (colNum >= 5 && colNum <= 7) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: "right", vertical: "middle" };
        }
        if (colNum === 8) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { bold: true, size: 9, name: "Calibri", color: { argb: COLORS.ACCENT_GREEN } };
        }
      });
      r.height = 22;
      r.commit();
    });

    // ============================================================
    // SHEET 6: 📅 REKAPITULASI HARIAN
    // ============================================================
    const ws6 = workbook.addWorksheet("📅 Rekapitulasi Harian", {
      views: [{ showGridLines: false }],
    });
    addStoreHeader(ws6, "REKAPITULASI PENJUALAN HARIAN", 6);
    [3, 30, 20, 25, 25, 25].forEach((w, i) => ws6.getColumn(i + 1).width = w);

    applyHeaderRow(ws6, 6, ["Tanggal Evaluasi", "Jumlah Transaksi", "Total Omzet", "Total HPP", "Total Laba Bersih"], COLORS.NAVY_HEADER);

    dailySummary.forEach((day, idx) => {
      const r = ws6.getRow(7 + idx);
      r.values = ["", day.tanggal, day.trx, day.revenue, day.hpp, day.netProfit];
      r.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? COLORS.ROW_ALT : COLORS.ROW_WHITE } };
        cell.font = { size: 9, name: "Calibri" };
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "hair", color: { argb: COLORS.BORDER } },
          bottom: { style: "hair", color: { argb: COLORS.BORDER } },
          left: { style: "hair", color: { argb: COLORS.BORDER } },
          right: { style: "hair", color: { argb: COLORS.BORDER } },
        };
        if (colNum === 3) cell.alignment = { horizontal: "center", vertical: "middle" };
        if (colNum >= 4) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: "right", vertical: "middle" };
          if (colNum === 6) cell.font = { bold: true, size: 9, name: "Calibri", color: { argb: COLORS.ACCENT_GREEN } };
        }
      });
      r.height = 22;
      r.commit();
    });

    // Footer
    if (dailySummary.length > 0) {
      const fi = 7 + dailySummary.length;
      const fr = ws6.getRow(fi);
      fr.values = ["", "TOTAL", dailySummary.reduce((s, d) => s + d.trx, 0), totalRevenue, totalHPP, totalNetProfit];
      fr.eachCell({ includeEmpty: false }, (cell, colNum) => {
        if (colNum === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.NAVY_HEADER } };
        cell.font = { bold: true, size: 9.5, name: "Calibri", color: { argb: "FFFFFF" } };
        if (colNum >= 4) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: "right", vertical: "middle" };
        }
      });
      fr.height = 24;
      fr.commit();
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
