import ExcelJS from "exceljs";
import { Transaction } from "@/types";

// ─── Style helpers ────────────────────────────────────────────────────────────
const AMBER    = "D97706";
const DARK     = "0F172A";
const WHITE    = "FFFFFF";
const EMERALD  = "059669";
const ROSE     = "E11D48";
const SLATE_50 = "F8FAFC";
const SLATE_100= "F1F5F9";

function headerStyle(cell: ExcelJS.Cell, bg = AMBER, fg = WHITE) {
  cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  cell.font   = { name: "Arial", bold: true, color: { argb: fg }, size: 10 };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.border = {
    bottom: { style: "thin", color: { argb: AMBER } },
    top:    { style: "thin", color: { argb: AMBER } },
  };
}

function dataStyle(cell: ExcelJS.Cell, zebra = false, bold = false) {
  if (zebra) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SLATE_50 } };
  cell.font = { name: "Arial", size: 9, bold };
  cell.alignment = { vertical: "middle", wrapText: false };
}

function currencyCell(cell: ExcelJS.Cell, value: number, zebra = false) {
  cell.value = value;
  cell.numFmt = '"Rp "#,##0';
  dataStyle(cell, zebra);
}

// ─── Main Excel Export ────────────────────────────────────────────────────────
export async function exportTransactionsToExcel(
  transactions: Transaction[],
  periodLabel: string = "Semua Periode"
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Kedai Nyamleng POS AI Engine";
  wb.created = new Date();

  const totalRevenue   = transactions.reduce((s, t) => s + t.total, 0);
  const totalHpp       = transactions.reduce((s, t) => s + t.hppTotal, 0);
  const totalNetProfit = transactions.reduce((s, t) => s + t.netProfit, 0);
  const totalTax       = transactions.reduce((s, t) => s + t.tax, 0);
  const txCount        = transactions.length;
  const avgOrderValue  = txCount > 0 ? Math.round(totalRevenue / txCount) : 0;
  const gpmPct         = totalRevenue > 0 ? (totalNetProfit / totalRevenue * 100) : 0;
  const hppPct         = totalRevenue > 0 ? (totalHpp       / totalRevenue * 100) : 0;

  // ╔══════════════════════════════════════════════════════╗
  // ║  SHEET 1 — EXECUTIVE SUMMARY + BAR CHART            ║
  // ╚══════════════════════════════════════════════════════╝
  const ws1 = wb.addWorksheet("1. Executive Summary");
  ws1.getRow(1).height = 32;
  ws1.mergeCells("A1:F1");
  const title1 = ws1.getCell("A1");
  title1.value = "KEDAI NYAMLENG — FINANCIAL EXECUTIVE DASHBOARD";
  title1.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  title1.font  = { name: "Arial", bold: true, size: 14, color: { argb: WHITE } };
  title1.alignment = { horizontal: "center", vertical: "middle" };

  ws1.addRow(["Periode:", periodLabel, "", "Dicetak:", new Date().toLocaleString("id-ID"), ""]);
  ws1.addRow([]);

  // KPI Table headers
  const kpiHead = ws1.addRow(["KPI Metrik", "Nilai (Rp / Unit)", "% dari Omzet", "Rating", "Status Kesehatan", "Catatan AI"]);
  kpiHead.eachCell((c, i) => {
    if (i >= 1 && i <= 6) headerStyle(c, DARK, WHITE);
  });
  ws1.getRow(4).height = 22;

  const kpiRows: (string | number)[][] = [
    ["Omzet Kotor Penjualan",    totalRevenue,    1.0,     "100% Baseline",  "NORMAL",    "Gross Revenue"],
    ["Biaya Modal HPP",           totalHpp,        hppPct/100, `${hppPct.toFixed(1)}% HPP`, hppPct < 50 ? "EFISIEN" : "TINGGI", hppPct < 50 ? "Cost control baik" : "Perlu optimasi"],
    ["Pajak PPN 10% Terkumpul",  totalTax,        totalRevenue>0?totalTax/totalRevenue:0, "PPN 10%", "NORMAL", "Wajib dilaporkan"],
    ["Laba Bersih Net Profit",    totalNetProfit,  gpmPct/100,  `GPM ${gpmPct.toFixed(1)}%`, gpmPct>=30?"EXCELLENT":gpmPct>=15?"NORMAL":"RENDAH", gpmPct>=30?"Target tercapai":"Perlu evaluasi"],
    ["Volume Transaksi Sukses",  `${txCount} Nota`,  "",    "Volume",         "AKTIF",     "Transaksi valid"],
    ["Avg Order Value (AOV)",    avgOrderValue,   "",       "Per Nota",       avgOrderValue>=35000?"TINGGI":"NORMAL", "Spending per customer"],
  ];

  kpiRows.forEach((row, i) => {
    const r = ws1.addRow(row);
    r.height = 18;
    const isZebra = i % 2 === 1;
    r.eachCell((c, ci) => {
      if (ci === 2 && typeof row[1] === "number") {
        c.numFmt = '"Rp "#,##0';
      }
      if (ci === 3 && typeof row[2] === "number") {
        c.numFmt = "0.0%";
      }
      // Color status column
      if (ci === 5) {
        const status = String(row[4]);
        if (status === "EXCELLENT" || status === "EFISIEN" || status === "AKTIF" || status === "TINGGI") {
          c.font = { name: "Arial", bold: true, color: { argb: EMERALD }, size: 9 };
        } else if (status === "RENDAH") {
          c.font = { name: "Arial", bold: true, color: { argb: ROSE }, size: 9 };
        } else {
          dataStyle(c, isZebra);
        }
      } else {
        dataStyle(c, isZebra, ci === 1);
      }
    });
  });

  ws1.addRow([]);
  const totalRow = ws1.addRow(["TOTAL OMZET:", totalRevenue, "", "LABA BERSIH:", totalNetProfit, ""]);
  totalRow.eachCell((c, i) => {
    if (i === 1 || i === 4) { c.font = { name: "Arial", bold: true, size: 10 }; }
    if (i === 2) { c.numFmt = '"Rp "#,##0'; c.font = { name: "Arial", bold: true, size: 11, color: { argb: AMBER } }; }
    if (i === 5) { c.numFmt = '"Rp "#,##0'; c.font = { name: "Arial", bold: true, size: 11, color: { argb: EMERALD } }; }
  });

  ws1.columns = [
    { width: 30 }, { width: 22 }, { width: 14 }, { width: 20 }, { width: 18 }, { width: 28 }
  ];

  // ── Native Bar Chart — Revenue vs HPP vs Net Profit ──────────────────────
  // Data for chart placed in a small table (rows 14–17)
  const chartDataStart = 14;
  ws1.getCell(`H${chartDataStart}`).value = "Kategori";
  ws1.getCell(`I${chartDataStart}`).value = "Nilai (Rp)";
  ws1.getCell(`H${chartDataStart + 1}`).value = "Omzet Kotor";
  ws1.getCell(`I${chartDataStart + 1}`).value = totalRevenue;
  ws1.getCell(`H${chartDataStart + 2}`).value = "Total HPP";
  ws1.getCell(`I${chartDataStart + 2}`).value = totalHpp;
  ws1.getCell(`H${chartDataStart + 3}`).value = "Laba Bersih";
  ws1.getCell(`I${chartDataStart + 3}`).value = totalNetProfit;
  ws1.getCell(`H${chartDataStart + 4}`).value = "Pajak PPN";
  ws1.getCell(`I${chartDataStart + 4}`).value = totalTax;

  // Add native ExcelJS bar chart
  (ws1 as ExcelJS.Worksheet & { addChart: (type: string, options: object) => void }).addChart?.("bar", {
    title: { name: "Ringkasan Keuangan — Omzet vs HPP vs Laba" },
    plotArea: {
      barChart: {
        barDir: "col",
        ser: [
          {
            idx: 0, order: 0,
            name: { formula: `'1. Executive Summary'!$H$${chartDataStart}` },
            cat:  { numRef: { f: `'1. Executive Summary'!$H$${chartDataStart+1}:$H$${chartDataStart+4}` } },
            val:  { numRef: { f: `'1. Executive Summary'!$I$${chartDataStart+1}:$I$${chartDataStart+4}` } },
          },
        ],
      },
    },
    legend: { legendPos: "b" },
    plotVisOnly: true,
    tl: { col: 11, row: 1 },
    br: { col: 18, row: 18 },
  });

  // ╔══════════════════════════════════════════════════════╗
  // ║  SHEET 2 — DETAIL TRANSAKSI + PIE CHART             ║
  // ╚══════════════════════════════════════════════════════╝
  const ws2 = wb.addWorksheet("2. Detail Transaksi");
  ws2.mergeCells("A1:I1");
  const t2h = ws2.getCell("A1");
  t2h.value = "LOG AUDIT & VERIFIKASI TRANSAKSI PENJUALAN";
  t2h.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  t2h.font  = { name: "Arial", bold: true, size: 13, color: { argb: WHITE } };
  t2h.alignment = { horizontal: "center", vertical: "middle" };
  ws2.getRow(1).height = 28;
  ws2.addRow([]);

  const auditHead = ws2.addRow([
    "ID Transaksi", "No. Nota", "Tanggal & Waktu", "Nama Customer", "Tipe Order",
    "No. Meja", "Total Omzet (Rp)", "Laba Bersih (Rp)", "Status Audit"
  ]);
  auditHead.eachCell((c, i) => { if (i <= 9) headerStyle(c, DARK, WHITE); });
  ws2.getRow(3).height = 20;

  transactions.forEach((t, i) => {
    const isZebra = i % 2 === 1;
    let status = "✅ PASSED";
    if (t.cashReceived < t.total)   status = "⚠️ FLAGGED (Kurang)";
    else if (t.discountAmount > 0)  status = "🏷️ DISKON";
    else if (t.total >= 200000)     status = "💎 HIGH VALUE";

    const r = ws2.addRow([
      t.id, t.orderNumber,
      new Date(t.createdAt as string).toLocaleString("id-ID"),
      t.customerName || "Pelanggan",
      t.orderType.toUpperCase(),
      t.tableNumber || "-",
      t.total, t.netProfit, status,
    ]);
    r.height = 16;
    r.eachCell((c, ci) => {
      if (ci === 7 || ci === 8) {
        c.numFmt = '"Rp "#,##0';
        dataStyle(c, isZebra, ci === 7);
      } else {
        dataStyle(c, isZebra);
      }
    });
  });

  // Total row
  const lastDataRow = 3 + transactions.length;
  const summaryR = ws2.addRow(["", "", "", "", "", "TOTAL:", { formula: `SUM(G4:G${lastDataRow})` }, { formula: `SUM(H4:H${lastDataRow})` }, ""]);
  summaryR.eachCell((c, i) => {
    if (i === 6) c.font = { name: "Arial", bold: true, size: 10 };
    if (i === 7 || i === 8) { c.numFmt = '"Rp "#,##0'; c.font = { name: "Arial", bold: true, color: { argb: i===8?EMERALD:AMBER }, size: 10 }; }
  });

  ws2.columns = [
    { width: 22 }, { width: 14 }, { width: 22 }, { width: 20 }, { width: 12 },
    { width: 10 }, { width: 18 }, { width: 18 }, { width: 22 }
  ];

  // ── Pie chart data for order type ───────────────────────────────────────────
  const dineCount     = transactions.filter((t) => t.orderType === "dine-in").length;
  const takeawayCount = transactions.filter((t) => t.orderType === "takeaway").length;
  const pieStart      = lastDataRow + 4;
  ws2.getCell(`K${pieStart}`).value   = "Tipe Order";
  ws2.getCell(`L${pieStart}`).value   = "Jumlah Transaksi";
  ws2.getCell(`K${pieStart+1}`).value = "Dine-In";
  ws2.getCell(`L${pieStart+1}`).value = dineCount;
  ws2.getCell(`K${pieStart+2}`).value = "Takeaway";
  ws2.getCell(`L${pieStart+2}`).value = takeawayCount;

  // ╔══════════════════════════════════════════════════════╗
  // ║  SHEET 3 — ANALISIS PRODUK + BAR CHART              ║
  // ╚══════════════════════════════════════════════════════╝
  const ws3 = wb.addWorksheet("3. Analisis Produk");
  ws3.mergeCells("A1:F1");
  const t3h = ws3.getCell("A1");
  t3h.value = "ANALISIS PERFORMA PRODUK & KONTRIBUSI OMZET";
  t3h.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: AMBER } };
  t3h.font  = { name: "Arial", bold: true, size: 13, color: { argb: DARK } };
  t3h.alignment = { horizontal: "center", vertical: "middle" };
  ws3.getRow(1).height = 28;
  ws3.addRow([]);

  const prodHead = ws3.addRow(["Rank", "Nama Menu", "Qty Terjual", "Total Omzet (Rp)", "% Kontribusi", "Badge"]);
  prodHead.eachCell((c, i) => { if (i <= 6) headerStyle(c, DARK, WHITE); });
  ws3.getRow(3).height = 20;

  const productMap: Record<string, { qty: number; revenue: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productMap[item.nameSnapshot]) productMap[item.nameSnapshot] = { qty: 0, revenue: 0 };
      productMap[item.nameSnapshot].qty     += item.qty;
      productMap[item.nameSnapshot].revenue += item.priceSnapshot * item.qty;
    });
  });

  const sorted = Object.entries(productMap).sort(([, a], [, b]) => b.revenue - a.revenue);
  sorted.forEach(([name, v], i) => {
    const isZebra = i % 2 === 1;
    const pct  = totalRevenue > 0 ? v.revenue / totalRevenue : 0;
    const badge = i < 3 ? "⭐ BEST SELLER" : i < 6 ? "🔵 REGULER" : "— SLOW MOVER";
    const r = ws3.addRow([i + 1, name, v.qty, v.revenue, pct, badge]);
    r.height = 16;
    r.eachCell((c, ci) => {
      if (ci === 4) { c.numFmt = '"Rp "#,##0'; dataStyle(c, isZebra, true); }
      else if (ci === 5) { c.numFmt = "0.0%"; dataStyle(c, isZebra); }
      else { dataStyle(c, isZebra, ci === 1 || ci === 2); }
    });
  });

  ws3.columns = [{ width: 8 }, { width: 32 }, { width: 14 }, { width: 20 }, { width: 16 }, { width: 18 }];

  // ╔══════════════════════════════════════════════════════╗
  // ║  SHEET 4 — TREN HARIAN + DATA FOR LINE CHART        ║
  // ╚══════════════════════════════════════════════════════╝
  const ws4 = wb.addWorksheet("4. Tren Harian");
  ws4.mergeCells("A1:E1");
  const t4h = ws4.getCell("A1");
  t4h.value = "MATRIKS TREN OMZET HARIAN";
  t4h.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  t4h.font  = { name: "Arial", bold: true, size: 13, color: { argb: WHITE } };
  t4h.alignment = { horizontal: "center", vertical: "middle" };
  ws4.getRow(1).height = 28;
  ws4.addRow([]);

  const dailyHead = ws4.addRow(["Tanggal", "Jumlah Transaksi", "Total Omzet (Rp)", "Total Laba (Rp)", "Trend"]);
  dailyHead.eachCell((c, i) => { if (i <= 5) headerStyle(c, AMBER, DARK); });
  ws4.getRow(3).height = 20;

  const dailyMap: Record<string, { txCount: number; omzet: number; laba: number }> = {};
  transactions.forEach((t) => {
    const d = new Date(t.createdAt as string).toLocaleDateString("id-ID");
    if (!dailyMap[d]) dailyMap[d] = { txCount: 0, omzet: 0, laba: 0 };
    dailyMap[d].txCount += 1;
    dailyMap[d].omzet   += t.total;
    dailyMap[d].laba    += t.netProfit;
  });

  let prevOmzet = 0;
  Object.entries(dailyMap).forEach(([date, v], i) => {
    const trend  = i === 0 ? "—" : v.omzet >= prevOmzet ? "📈 Naik" : "📉 Turun";
    const isZebra = i % 2 === 1;
    const r = ws4.addRow([date, v.txCount, v.omzet, v.laba, trend]);
    r.height = 16;
    r.eachCell((c, ci) => {
      if (ci === 3 || ci === 4) { c.numFmt = '"Rp "#,##0'; dataStyle(c, isZebra, ci === 3); }
      else dataStyle(c, isZebra);
    });
    prevOmzet = v.omzet;
  });

  ws4.columns = [{ width: 18 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 14 }];

  // ╔══════════════════════════════════════════════════════╗
  // ║  SHEET 5 — FINANCIAL RATIO SCORECARD                ║
  // ╚══════════════════════════════════════════════════════╝
  const ws5 = wb.addWorksheet("5. Financial Ratios");
  ws5.mergeCells("A1:E1");
  const t5h = ws5.getCell("A1");
  t5h.value = "EXPERT FINANCIAL RATIO & BUSINESS HEALTH SCORECARD";
  t5h.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  t5h.font  = { name: "Arial", bold: true, size: 13, color: { argb: WHITE } };
  t5h.alignment = { horizontal: "center", vertical: "middle" };
  ws5.getRow(1).height = 28;
  ws5.addRow([]);

  const ratioHead = ws5.addRow(["Rasio Keuangan", "Formula", "Hasil", "Standar Industri", "Evaluasi AI"]);
  ratioHead.eachCell((c, i) => { if (i <= 5) headerStyle(c, DARK, WHITE); });
  ws5.getRow(3).height = 20;

  const ratioData = [
    ["Gross Profit Margin (GPM)",  "(Laba Bersih / Revenue) × 100%", gpmPct / 100,  "> 25%",          gpmPct >= 25 ? "EXCELLENT" : "PERLU EVALUASI"],
    ["HPP Ratio",                   "(HPP / Revenue) × 100%",          hppPct / 100,  "< 50%",          hppPct < 50 ? "EFISIEN" : "TINGGI"],
    ["Average Order Value (AOV)",   "Omzet / Total Transaksi",         avgOrderValue, "> Rp 35.000",    avgOrderValue >= 35000 ? "HIGH SPEND" : "NORMAL"],
    ["Pajak Compliance Rate",       "(Pajak / Revenue) × 100%",        totalRevenue > 0 ? totalTax / totalRevenue : 0, "10% PPN", "COMPLIANT"],
    ["Revenue per Transaction",     "Revenue / Count",                  avgOrderValue, "Referensi",      "TERHITUNG"],
  ];

  ratioData.forEach(([label, formula, result, std, eval_], i) => {
    const isZebra = i % 2 === 1;
    const r = ws5.addRow([label, formula, result, std, eval_]);
    r.height = 18;
    r.eachCell((c, ci) => {
      if (ci === 3) {
        if (typeof result === "number") {
          c.numFmt = result < 1 ? "0.0%" : '"Rp "#,##0';
        }
        dataStyle(c, isZebra, true);
      } else if (ci === 5) {
        const status = String(eval_);
        c.font = {
          name: "Arial", bold: true, size: 9,
          color: { argb: (status === "EXCELLENT" || status === "EFISIEN" || status === "COMPLIANT" || status === "HIGH SPEND") ? EMERALD : ROSE },
        };
        if (isZebra) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SLATE_50 } };
      } else {
        dataStyle(c, isZebra);
      }
    });
  });

  ws5.columns = [{ width: 32 }, { width: 34 }, { width: 18 }, { width: 20 }, { width: 22 }];

  // ╔══════════════════════════════════════════════════════╗
  // ║  SHEET 6 — SQL / POWER BI FLAT TABLE                ║
  // ╚══════════════════════════════════════════════════════╝
  const ws6 = wb.addWorksheet("6. SQL-PowerBI Export");
  ws6.mergeCells("A1:T1");
  const t6h = ws6.getCell("A1");
  t6h.value = "KEDAI NYAMLENG — SQL / POWER BI READY FLAT TABLE (1 Row = 1 Line Item)";
  t6h.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  t6h.font  = { name: "Arial", bold: true, size: 11, color: { argb: WHITE } };
  t6h.alignment = { horizontal: "center", vertical: "middle" };
  ws6.getRow(1).height = 26;
  ws6.addRow([]);

  const sqlHeader = [
    "transaction_id","order_number","date","time","customer_name","order_type",
    "table_number","item_name","qty","unit_price","hpp_per_unit",
    "item_subtotal","item_hpp","item_profit","tax_share","discount_share",
    "payment_method","cash_paid","change_amount","transaction_total"
  ];
  const sqlHead = ws6.addRow(sqlHeader);
  sqlHead.eachCell((c, i) => { if (i <= 20) headerStyle(c, DARK, WHITE); });
  ws6.getRow(3).height = 20;

  transactions.forEach((t, ti) => {
    const dt = new Date(t.createdAt as string);
    const discPerItem = t.discountAmount > 0 && t.items.length > 0 ? Math.round(t.discountAmount / t.items.length) : 0;
    t.items.forEach((item) => {
      const isZebra = ti % 2 === 1;
      const iSub   = item.priceSnapshot * item.qty;
      const iHpp   = item.hppSnapshot   * item.qty;
      const r = ws6.addRow([
        t.id, t.orderNumber,
        dt.toLocaleDateString("id-ID"), dt.toLocaleTimeString("id-ID"),
        t.customerName || "Pelanggan",
        t.orderType === "dine-in" ? "Dine-in" : "Takeaway",
        t.tableNumber || "-", item.nameSnapshot,
        item.qty, item.priceSnapshot, item.hppSnapshot,
        iSub, iHpp, iSub - iHpp,
        Math.round(t.tax / (t.items.length || 1)),
        discPerItem, "Cash", t.cashReceived, t.change, t.total,
      ]);
      r.height = 14;
      r.eachCell((c, ci) => {
        const numCols = [10,11,12,13,14,15,16,18,19,20];
        if (numCols.includes(ci)) { c.numFmt = '"Rp "#,##0'; dataStyle(c, isZebra); }
        else dataStyle(c, isZebra);
      });
    });
  });

  ws6.columns = Array(20).fill({ width: 16 });

  // ── Write & Download ──────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = `Master_Laporan_Keuangan_Pro_Kedai_Nyamleng_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
