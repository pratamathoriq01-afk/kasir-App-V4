import ExcelJS from "exceljs";
import { Transaction } from "@/types";

// ─── Color Tokens ─────────────────────────────────────────────────────────────
const DARK      = "0F172A"; // Slate 900
const AMBER     = "D97706"; // Amber 600
const EMERALD   = "059669"; // Emerald 600
const ROSE      = "E11D48"; // Rose 600
const WHITE     = "FFFFFF";
const SLATE_50  = "F8FAFC";
const SLATE_100 = "F1F5F9";
const AMBER_50  = "FEF3C7";

function headerStyle(cell: ExcelJS.Cell, bg = DARK, fg = WHITE) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  cell.font = { name: "Arial", bold: true, color: { argb: fg }, size: 10 };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.border = {
    top:    { style: "thin", color: { argb: "CBD5E1" } },
    bottom: { style: "medium", color: { argb: "94A3B8" } },
    left:   { style: "thin", color: { argb: "CBD5E1" } },
    right:  { style: "thin", color: { argb: "CBD5E1" } },
  };
}

function dataStyle(cell: ExcelJS.Cell, zebra = false, bold = false, align: "left" | "center" | "right" = "left") {
  if (zebra) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SLATE_50 } };
  }
  cell.font = { name: "Arial", size: 9, bold };
  cell.alignment = { horizontal: align, vertical: "middle", wrapText: false };
  cell.border = {
    top:    { style: "thin", color: { argb: "E2E8F0" } },
    bottom: { style: "thin", color: { argb: "E2E8F0" } },
    left:   { style: "thin", color: { argb: "E2E8F0" } },
    right:  { style: "thin", color: { argb: "E2E8F0" } },
  };
}

// ─── Main Excel Export Generator ──────────────────────────────────────────────
export async function exportTransactionsToExcel(
  transactions: Transaction[],
  periodLabel: string = "Semua Periode"
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Kedai Nyamleng POS AI Engine";
  wb.created = new Date();

  // Computations
  const totalRevenue   = transactions.reduce((s, t) => s + t.total, 0);
  const totalHpp       = transactions.reduce((s, t) => s + t.hppTotal, 0);
  const totalNetProfit = transactions.reduce((s, t) => s + t.netProfit, 0);
  const totalTax       = transactions.reduce((s, t) => s + t.tax, 0);
  const txCount        = transactions.length;
  const avgOrderValue  = txCount > 0 ? Math.round(totalRevenue / txCount) : 0;
  const gpmPct         = totalRevenue > 0 ? (totalNetProfit / totalRevenue) : 0;
  const hppPct         = totalRevenue > 0 ? (totalHpp / totalRevenue) : 0;

  // ╔══════════════════════════════════════════════════════╗
  // ║  SHEET 1 — RINGKASAN & KPI BISNIS                   ║
  // ╚══════════════════════════════════════════════════════╝
  const ws1 = wb.addWorksheet("Ringkasan & KPI Bisnis");
  
  // Title Banner
  ws1.getRow(1).height = 36;
  ws1.mergeCells("A1:F1");
  const title1 = ws1.getCell("A1");
  title1.value = "KEDAI NYAMLENG — DASHBOARD KEUNTUNGAN & KINERJA BISNIS";
  title1.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  title1.font  = { name: "Arial", bold: true, size: 13, color: { argb: WHITE } };
  title1.alignment = { horizontal: "center", vertical: "middle" };

  ws1.getRow(2).height = 20;
  ws1.getCell("A2").value = `Periode Laporan: ${periodLabel}`;
  ws1.getCell("A2").font = { name: "Arial", italic: true, size: 9, color: { argb: "475569" } };
  ws1.getCell("D2").value = `Dicetak: ${new Date().toLocaleString("id-ID")}`;
  ws1.getCell("D2").font = { name: "Arial", italic: true, size: 9, color: { argb: "475569" } };

  ws1.addRow([]); // Row 3 spacer

  // Table 1: KPI Header
  const kpiHead = ws1.addRow(["KPI Metrik Utama", "Nilai Realized", "% dari Omzet", "Rating Target", "Status Evaluasi", "Rekomendasi Operasional"]);
  kpiHead.height = 24;
  kpiHead.eachCell((c) => headerStyle(c, AMBER, WHITE));

  const kpiRows: [string, number | string, number | string, string, string, string][] = [
    ["Total Omzet Penjualan Kotor", totalRevenue, 1.0, "100% Baseline", "NORMAL", "Total pendapatan penjualan kotor"],
    ["Total Biaya Modal (HPP)", totalHpp, hppPct, `${(hppPct * 100).toFixed(1)}% HPP`, hppPct < 0.5 ? "EFISIEN" : "TINGGI", hppPct < 0.5 ? "Pengendalian modal bahan baku baik" : "Evaluasi supplier & porsi bahan"],
    ["Total Pajak PPN 10%", totalTax, totalRevenue > 0 ? totalTax / totalRevenue : 0, "10.0%", "NORMAL", "Setoran pajak terkumpul"],
    ["Total Laba Bersih (Net Profit)", totalNetProfit, gpmPct, `GPM ${(gpmPct * 100).toFixed(1)}%`, gpmPct >= 0.3 ? "EXCELLENT" : gpmPct >= 0.15 ? "SEHAT" : "RENDAH", gpmPct >= 0.3 ? "Profitabilitas bisnis sangat tinggi" : "Optimalkan menu margin tinggi"],
    ["Total Volume Transaksi", `${txCount} Nota`, "-", "Nota Terbit", "AKTIF", "Jumlah pesanan berhasil diproses"],
    ["Rata-Rata Belanja (AOV)", avgOrderValue, "-", "Per Transaksi", avgOrderValue >= 35000 ? "HIGH SPEND" : "NORMAL", "Nilai rata-rata belanja pelanggan"],
  ];

  kpiRows.forEach((row, i) => {
    const r = ws1.addRow(row);
    r.height = 20;
    const isZebra = i % 2 === 1;

    r.eachCell((c, ci) => {
      dataStyle(c, isZebra, ci === 1);
      if (ci === 2 && typeof row[1] === "number") {
        c.numFmt = '"Rp "#,##0';
        c.alignment = { horizontal: "right", vertical: "middle" };
      }
      if (ci === 3 && typeof row[2] === "number") {
        c.numFmt = "0.0%";
        c.alignment = { horizontal: "center", vertical: "middle" };
      }
      if (ci === 4) {
        c.alignment = { horizontal: "center", vertical: "middle" };
      }
      if (ci === 5) {
        c.alignment = { horizontal: "center", vertical: "middle" };
        const status = String(row[4]);
        if (status === "EXCELLENT" || status === "EFISIEN" || status === "SEHAT" || status === "HIGH SPEND" || status === "AKTIF") {
          c.font = { name: "Arial", bold: true, color: { argb: EMERALD }, size: 9 };
        } else if (status === "RENDAH" || status === "TINGGI") {
          c.font = { name: "Arial", bold: true, color: { argb: ROSE }, size: 9 };
        }
      }
    });
  });

  ws1.addRow([]); // Row 11 spacer

  // AI Executive Insight Table
  ws1.mergeCells("A12:F12");
  const aiTitle = ws1.getCell("A12");
  aiTitle.value = "🤖 REALTIME AI BUSINESS INSIGHT & EXECUTIVE SUMMARY";
  aiTitle.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: AMBER_50 } };
  aiTitle.font  = { name: "Arial", bold: true, size: 10, color: { argb: AMBER } };
  aiTitle.alignment = { horizontal: "left", vertical: "middle" };
  ws1.getRow(12).height = 24;

  const aiNotes = [
    `• Tingkat Keuntungan (GPM): Bisnis mencatatkan Gross Profit Margin sebesar ${(gpmPct * 100).toFixed(1)}% dengan total laba bersih Rp ${totalNetProfit.toLocaleString("id-ID")}.`,
    `• Efisiensi Modal HPP: Beban pokok penjualan (HPP) tercatat sebesar ${(hppPct * 100).toFixed(1)}% dari total omzet. ${hppPct < 0.5 ? "Alokasi HPP efisien sesuai standar SAK EMKM." : "Rekomendasi: Lakukan negosiasi harga bahan baku."}`,
    `• Rata-rata Belanja (AOV): Rp ${avgOrderValue.toLocaleString("id-ID")} per transaksi dari total ${txCount} nota terbit.`,
    `• Strategi Menu: Dorong penjualan bundling minuman dan cemilan untuk menaikkan nilai keranjang belanja pelanggan.`
  ];

  aiNotes.forEach((note) => {
    const r = ws1.addRow([note, "", "", "", "", ""]);
    r.height = 18;
    ws1.mergeCells(`A${r.number}:F${r.number}`);
    const c = ws1.getCell(`A${r.number}`);
    c.font = { name: "Arial", size: 9, color: { argb: DARK } };
    c.alignment = { horizontal: "left", vertical: "middle" };
  });

  ws1.columns = [
    { width: 32 }, { width: 22 }, { width: 14 }, { width: 18 }, { width: 18 }, { width: 38 }
  ];

  // ╔══════════════════════════════════════════════════════╗
  // ║  SHEET 2 — ANALISIS MENU & PRODUK                   ║
  // ╚══════════════════════════════════════════════════════╝
  const ws2 = wb.addWorksheet("Analisis Menu & Produk");
  
  ws2.getRow(1).height = 32;
  ws2.mergeCells("A1:G1");
  const title2 = ws2.getCell("A1");
  title2.value = "ANALISIS PERFORMA PENJUALAN & MARGIN KUNTUNGAN PER MENU";
  title2.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  title2.font  = { name: "Arial", bold: true, size: 12, color: { argb: WHITE } };
  title2.alignment = { horizontal: "center", vertical: "middle" };

  ws2.addRow([]);

  const menuHead = ws2.addRow(["Peringkat", "Nama Menu / Produk", "Qty Terjual", "Total Omzet (Rp)", "Total HPP (Rp)", "Laba Bersih (Rp)", "% Kontribusi Omzet"]);
  menuHead.height = 24;
  menuHead.eachCell((c) => headerStyle(c, DARK, WHITE));

  // Compute Product breakdown
  const productMap: Record<string, { qty: number; revenue: number; hpp: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productMap[item.nameSnapshot]) {
        productMap[item.nameSnapshot] = { qty: 0, revenue: 0, hpp: 0 };
      }
      productMap[item.nameSnapshot].qty     += item.qty;
      productMap[item.nameSnapshot].revenue += item.priceSnapshot * item.qty;
      productMap[item.nameSnapshot].hpp     += item.hppSnapshot * item.qty;
    });
  });

  const sortedProds = Object.entries(productMap).sort(([, a], [, b]) => b.revenue - a.revenue);

  sortedProds.forEach(([name, data], i) => {
    const isZebra = i % 2 === 1;
    const netProfit = data.revenue - data.hpp;
    const pct = totalRevenue > 0 ? data.revenue / totalRevenue : 0;

    const r = ws2.addRow([
      i + 1,
      name,
      data.qty,
      data.revenue,
      data.hpp,
      netProfit,
      pct,
    ]);
    r.height = 18;

    r.eachCell((c, ci) => {
      dataStyle(c, isZebra, ci === 2);
      if (ci === 1 || ci === 3) {
        c.alignment = { horizontal: "center", vertical: "middle" };
      }
      if (ci === 4 || ci === 5 || ci === 6) {
        c.numFmt = '"Rp "#,##0';
        c.alignment = { horizontal: "right", vertical: "middle" };
      }
      if (ci === 7) {
        c.numFmt = "0.0%";
        c.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  });

  // Summary Row with SUM formulas
  const lastProdRow = 3 + sortedProds.length;
  const prodSummary = ws2.addRow([
    "TOTAL",
    "SEMUA MENU",
    { formula: `SUM(C4:C${lastProdRow})` },
    { formula: `SUM(D4:D${lastProdRow})` },
    { formula: `SUM(E4:E${lastProdRow})` },
    { formula: `SUM(F4:F${lastProdRow})` },
    1.0,
  ]);
  prodSummary.height = 22;
  prodSummary.eachCell((c, ci) => {
    c.font = { name: "Arial", bold: true, size: 10, color: { argb: DARK } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AMBER_50 } };
    c.border = { top: { style: "double", color: { argb: AMBER } }, bottom: { style: "double", color: { argb: AMBER } } };
    if (ci === 1 || ci === 3) c.alignment = { horizontal: "center", vertical: "middle" };
    if (ci === 4 || ci === 5 || ci === 6) {
      c.numFmt = '"Rp "#,##0';
      c.alignment = { horizontal: "right", vertical: "middle" };
    }
    if (ci === 7) {
      c.numFmt = "0.0%";
      c.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  ws2.columns = [
    { width: 12 }, { width: 34 }, { width: 14 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 20 }
  ];

  // ╔══════════════════════════════════════════════════════╗
  // ║  SHEET 3 — AUDIT TRANSAKSI LENGKAP                  ║
  // ╚══════════════════════════════════════════════════════╝
  const ws3 = wb.addWorksheet("Audit Transaksi Lengkap");

  ws3.getRow(1).height = 32;
  ws3.mergeCells("A1:K1");
  const title3 = ws3.getCell("A1");
  title3.value = "LOG AUDIT & VERIFIKASI TRANSAKSI PENJUALAN";
  title3.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  title3.font  = { name: "Arial", bold: true, size: 12, color: { argb: WHITE } };
  title3.alignment = { horizontal: "center", vertical: "middle" };

  ws3.addRow([]);

  const auditHead = ws3.addRow([
    "No. Nota", "Tanggal & Waktu", "Nama Customer", "Tipe Order",
    "Subtotal (Rp)", "Diskon (Rp)", "Pajak (Rp)", "Total Omzet (Rp)",
    "Total HPP (Rp)", "Laba Bersih (Rp)", "Status Verifikasi"
  ]);
  auditHead.height = 24;
  auditHead.eachCell((c) => headerStyle(c, DARK, WHITE));

  transactions.forEach((t, i) => {
    const isZebra = i % 2 === 1;
    let status = "✅ PASSED";
    if (t.cashReceived < t.total) status = "⚠️ FLAGGED";
    else if (t.discountAmount > 0) status = "🏷️ DISKON";
    else if (t.total >= 100000) status = "💎 HIGH VALUE";

    const r = ws3.addRow([
      t.orderNumber,
      new Date(t.createdAt as string).toLocaleString("id-ID"),
      t.customerName || "Pelanggan",
      t.orderType.toUpperCase(),
      t.subtotal,
      t.discountAmount,
      t.tax,
      t.total,
      t.hppTotal,
      t.netProfit,
      status,
    ]);
    r.height = 18;

    r.eachCell((c, ci) => {
      dataStyle(c, isZebra, ci === 1);
      if (ci === 1 || ci === 4 || ci === 11) {
        c.alignment = { horizontal: "center", vertical: "middle" };
      }
      if (ci >= 5 && ci <= 10) {
        c.numFmt = '"Rp "#,##0';
        c.alignment = { horizontal: "right", vertical: "middle" };
      }
    });
  });

  // Summary Row with SUM formulas
  const lastAuditRow = 3 + transactions.length;
  const auditSummary = ws3.addRow([
    "TOTAL",
    `${txCount} Transaksi`,
    "-",
    "-",
    { formula: `SUM(E4:E${lastAuditRow})` },
    { formula: `SUM(F4:F${lastAuditRow})` },
    { formula: `SUM(G4:G${lastAuditRow})` },
    { formula: `SUM(H4:H${lastAuditRow})` },
    { formula: `SUM(I4:I${lastAuditRow})` },
    { formula: `SUM(J4:J${lastAuditRow})` },
    "AUDITED",
  ]);
  auditSummary.height = 22;
  auditSummary.eachCell((c, ci) => {
    c.font = { name: "Arial", bold: true, size: 10, color: { argb: DARK } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AMBER_50 } };
    c.border = { top: { style: "double", color: { argb: AMBER } }, bottom: { style: "double", color: { argb: AMBER } } };
    if (ci <= 4 || ci === 11) c.alignment = { horizontal: "center", vertical: "middle" };
    if (ci >= 5 && ci <= 10) {
      c.numFmt = '"Rp "#,##0';
      c.alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  ws3.columns = [
    { width: 14 }, { width: 22 }, { width: 20 }, { width: 14 },
    { width: 18 }, { width: 16 }, { width: 16 }, { width: 20 },
    { width: 20 }, { width: 20 }, { width: 18 }
  ];

  // Write & Download Buffer
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = `Laporan_Excel_Kedai_Nyamleng_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
