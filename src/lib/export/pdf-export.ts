import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "@/types";

/** Renders a Chart.js config to a Base64 PNG string for embedding in jsPDF */
async function renderChartToBase64(
  config: any,
  width: number = 900,
  height: number = 320
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.style.visibility = "hidden";
      canvas.style.position = "absolute";
      canvas.style.left = "-9999px";
      document.body.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        document.body.removeChild(canvas);
        reject(new Error("Gagal membuat 2D context untuk Canvas PDF"));
        return;
      }

      import("chart.js/auto").then(({ default: Chart }) => {
        const chartInstance = new Chart(ctx, {
          ...config,
          options: {
            ...config.options,
            animation: false,
            responsive: false,
            maintainAspectRatio: false,
          },
        });

        setTimeout(() => {
          const base64Img = chartInstance.toBase64Image("image/png", 1.0);
          chartInstance.destroy();
          document.body.removeChild(canvas);
          resolve(base64Img);
        }, 120);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Design Tokens
const C = {
  NAVY:      [15, 23, 42]    as [number,number,number],
  GOLD:      [217, 119, 6]   as [number,number,number],
  WHITE:     [255, 255, 255] as [number,number,number],
  SLATE_200: [226, 232, 240] as [number,number,number],
  TEXT_MAIN: [15, 23, 42]    as [number,number,number],
  TEXT_AMB:  [180, 83, 9]    as [number,number,number],
  TEXT_EMR:  [5, 150, 105]   as [number,number,number],
  TEXT_RED:  [220, 38, 38]   as [number,number,number],
  ROW_ALT:   [248, 250, 252] as [number,number,number],
  AMB_LIGHT: [254, 243, 199] as [number,number,number],
  EMR_LIGHT: [240, 253, 244] as [number,number,number],
};

function drawSectionLabel(doc: jsPDF, num: string, title: string, x: number, y: number, cw: number) {
  doc.setFillColor(...C.NAVY);
  doc.roundedRect(x, y, cw, 8, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.WHITE);
  doc.text(`${num}  ${title}`, x + 4, y + 5.6);
}

function drawPageFooter(doc: jsPDF, page: number, total: number, pw: number) {
  doc.setFillColor(...C.NAVY);
  doc.rect(0, 284, pw, 13, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.WHITE);
  doc.text(
    `Halaman ${page} dari ${total}  |  Laporan Resmi Kedai Nyamleng Malang  |  Standar SAK EMKM`,
    pw / 2,
    290,
    { align: "center" }
  );
}

export async function exportTransactionsToPDF(
  transactions: Transaction[],
  periodLabel: string = "Semua Periode"
) {
  const doc = new jsPDF("p", "mm", "a4");
  const PW = 210;
  const ML = 14;
  const CW = PW - ML * 2;

  // Financial metrics
  const totalRevenue   = transactions.reduce((s, t) => s + t.total, 0);
  const totalHpp       = transactions.reduce((s, t) => s + t.hppTotal, 0);
  const totalNetProfit = transactions.reduce((s, t) => s + t.netProfit, 0);
  const totalTax       = transactions.reduce((s, t) => s + t.tax, 0);
  const totalDiscount  = transactions.reduce((s, t) => s + t.discountAmount, 0);
  const txCount        = transactions.length;
  const avgOrderValue  = txCount > 0 ? Math.round(totalRevenue / txCount) : 0;
  const gpmPct         = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
  const hppPct         = totalRevenue > 0 ? (totalHpp / totalRevenue) * 100 : 0;
  const isHealthy      = gpmPct >= 20;
  const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  // ── Header Banner ──────────────────────────────────────────────────────────
  doc.setFillColor(...C.NAVY);
  doc.rect(0, 0, PW, 40, "F");
  doc.setFillColor(...C.GOLD);
  doc.rect(0, 37.5, PW, 2.5, "F");
  doc.setFillColor(8, 14, 32);
  doc.rect(0, 0, 12, 40, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...C.WHITE);
  doc.text("KEDAI NYAMLENG MALANG", ML + 2, 11);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.GOLD);
  doc.text("LAPORAN AUDIT PENJUALAN & EKSEKUTIF KEUANGAN", ML + 2, 18.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text("Jl. Laksada Adi Sucipto Gg.14 No 42, Kel. Blimbing, Malang  \u00B7  WA: 085113661387", ML + 2, 25);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Periode: ${periodLabel}   \u00B7   Tanggal Cetak: ${new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`,
    ML + 2,
    31
  );

  const badgeFill = isHealthy ? [16, 185, 129] as [number,number,number] : [239, 68, 68] as [number,number,number];
  doc.setFillColor(...badgeFill);
  doc.roundedRect(PW - ML - 34, 9, 34, 11, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.WHITE);
  doc.text(isHealthy ? "PROFIT SEHAT OK" : "PERLU EVALUASI", PW - ML - 17, 15.5, { align: "center" });

  let curY = 46;

  // ── KPI Scorecard Table ────────────────────────────────────────────────────
  drawSectionLabel(doc, "01", "RINGKASAN KINERJA EKSEKUTIF \u2014 KPI SCORECARD", ML, curY, CW);
  curY += 12;

  autoTable(doc, {
    startY: curY,
    head: [["Metrik Kinerja Utama", "Nilai Realisasi (Rp)", "% Omzet", "Target SAK EMKM", "Status"]],
    body: [
      ["Total Omzet Penjualan (Kotor)", fmt(totalRevenue), "100.0%", "Baseline Omzet", "NORMAL"],
      ["Total Biaya Modal (HPP)", fmt(totalHpp), `${hppPct.toFixed(1)}%`, "< 50.0% HPP", hppPct < 50 ? "EFISIEN" : "PERHATIKAN"],
      ["Laba Bersih (Net Profit)", fmt(totalNetProfit), `${gpmPct.toFixed(1)}%`, "GPM >= 20%", gpmPct >= 30 ? "EXCELLENT" : gpmPct >= 20 ? "SEHAT" : "RENDAH"],
      ["Setoran Pajak PPN (10%)", fmt(totalTax), `${totalRevenue > 0 ? ((totalTax / totalRevenue) * 100).toFixed(1) : 0}%`, "10.0% PPN", "TERKUMPUL"],
      ["Total Diskon Promo", fmt(totalDiscount), `${totalRevenue > 0 ? ((totalDiscount / totalRevenue) * 100).toFixed(1) : 0}%`, "< 10.0% Diskon", "TERKENDALI"],
      ["Rata-Rata Nilai Transaksi (AOV)", fmt(avgOrderValue), "\u2014", "Per Nota", avgOrderValue >= 30000 ? "HIGH SPEND" : "NORMAL"],
    ],
    theme: "grid",
    headStyles: {
      fillColor: C.GOLD,
      textColor: C.WHITE,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.8,
      textColor: C.TEXT_MAIN,
      lineColor: C.SLATE_200,
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: C.ROW_ALT },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: "bold" },
      1: { cellWidth: 42, halign: "right" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 32, halign: "center" },
      4: { cellWidth: 28, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === 2) {
        data.cell.styles.fillColor = C.EMR_LIGHT;
        data.cell.styles.textColor = C.TEXT_EMR;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.section === "body" && data.column.index === 4) {
        const txt = String(data.cell.raw);
        if (["EFISIEN","TERKUMPUL","TERKENDALI","SEHAT","EXCELLENT","HIGH SPEND","NORMAL"].some(k => txt.includes(k))) {
          data.cell.styles.textColor = C.TEXT_EMR;
        }
        if (txt === "RENDAH" || txt === "PERHATIKAN") {
          data.cell.styles.textColor = C.TEXT_RED;
        }
      }
    },
    margin: { left: ML, right: ML },
  });

  curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

  // ── AI Executive Summary Box ───────────────────────────────────────────────
  const aiBoxH = 34;
  doc.setFillColor(...C.AMB_LIGHT);
  doc.setDrawColor(...C.GOLD);
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, curY, CW, aiBoxH, 2.5, 2.5, "FD");
  doc.setFillColor(...C.GOLD);
  doc.roundedRect(ML, curY, 4, aiBoxH, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.TEXT_AMB);
  doc.text("AI EXECUTIVE BUSINESS SUMMARY & REKOMENDASI OPERASIONAL", ML + 8, curY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.TEXT_MAIN);
  const top3Names = ((): string => {
    const m: Record<string, number> = {};
    transactions.forEach(t => t.items.forEach(i => { m[i.nameSnapshot] = (m[i.nameSnapshot] || 0) + i.qty; }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]).join(", ");
  })();
  const aiText =
    `- Profitabilitas: Omzet ${fmt(totalRevenue)}, Laba Bersih ${fmt(totalNetProfit)} (GPM ${gpmPct.toFixed(1)}%). Status: ${gpmPct >= 30 ? "EXCELLENT & Sangat Profitabel" : gpmPct >= 20 ? "SEHAT" : "Perlu Perhatian"}.\n` +
    `- Efisiensi HPP: Biaya modal ${fmt(totalHpp)} (${hppPct.toFixed(1)}% dari omzet). Target < 50% \u2014 ${hppPct < 50 ? "Terjaga Efisien." : "Perlu Evaluasi Supplier."}\n` +
    `- AOV & Volume: Rata-rata ${fmt(avgOrderValue)} per nota dari ${txCount} transaksi. Menu Unggulan: ${top3Names || "\u2014"}.\n` +
    `- Rekomendasi: Pertahankan bundling menu margin tinggi & tinjau stok bahan baku ber-HPP tinggi secara berkala.`;
  const splitAI = doc.splitTextToSize(aiText, CW - 12);
  doc.text(splitAI, ML + 8, curY + 12);
  curY += aiBoxH + 7;

  // ── Line Chart ─────────────────────────────────────────────────────────────
  drawSectionLabel(doc, "02", "GRAFIK TREN OMZET & LABA BERSIH HARIAN", ML, curY, CW);
  curY += 12;

  const dailyMap: Record<string, { omzet: number; laba: number }> = {};
  transactions.forEach(t => {
    const key = new Date(t.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    if (!dailyMap[key]) dailyMap[key] = { omzet: 0, laba: 0 };
    dailyMap[key].omzet += t.total;
    dailyMap[key].laba  += t.netProfit;
  });
  const chartLabels = Object.keys(dailyMap);
  const chartOmzet  = chartLabels.map(k => dailyMap[k].omzet);
  const chartLaba   = chartLabels.map(k => dailyMap[k].laba);

  const lineChartImg = await renderChartToBase64({
    type: "line",
    data: {
      labels: chartLabels.length > 0 ? chartLabels : ["Hari 1"],
      datasets: [
        {
          label: "Omzet Kotor (Rp)", data: chartOmzet.length > 0 ? chartOmzet : [0],
          borderColor: "#D97706", backgroundColor: "rgba(217,119,6,0.12)", tension: 0.4, fill: true,
          borderWidth: 3, pointRadius: 5, pointBackgroundColor: "#D97706", pointBorderColor: "#fff", pointBorderWidth: 2,
        },
        {
          label: "Laba Bersih (Rp)", data: chartLaba.length > 0 ? chartLaba : [0],
          borderColor: "#059669", backgroundColor: "rgba(5,150,105,0.1)", tension: 0.4, fill: true,
          borderWidth: 3, pointRadius: 5, pointBackgroundColor: "#059669", pointBorderColor: "#fff", pointBorderWidth: 2,
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "top", labels: { font: { size: 12, weight: "bold" }, usePointStyle: true } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { grid: { color: "rgba(0,0,0,0.06)" }, ticks: { callback: (v: any) => `Rp ${(v / 1000).toFixed(0)}k`, font: { size: 10 } } },
      },
    },
  }, 900, 310);

  const lineH = (CW * 310) / 900;
  doc.addImage(lineChartImg, "PNG", ML, curY, CW, lineH);

  drawPageFooter(doc, 1, 2, PW);

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 2
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  curY = 14;

  // ── Donut Chart ────────────────────────────────────────────────────────────
  drawSectionLabel(doc, "03", "PROPORSI OMZET PRODUK TERLARIS (DONUT CHART)", ML, curY, CW);
  curY += 12;

  const productMap: Record<string, { qty: number; revenue: number }> = {};
  transactions.forEach(t => {
    t.items.forEach(item => {
      if (!productMap[item.nameSnapshot]) productMap[item.nameSnapshot] = { qty: 0, revenue: 0 };
      productMap[item.nameSnapshot].qty     += item.qty;
      productMap[item.nameSnapshot].revenue += item.qty * item.priceSnapshot;
    });
  });
  const sortedProducts = Object.entries(productMap).sort((a, b) => b[1].revenue - a[1].revenue);
  const topProducts    = sortedProducts.slice(0, 5);
  const otherRevenue   = sortedProducts.slice(5).reduce((s, p) => s + p[1].revenue, 0);
  const pieLabels = topProducts.map(p => {
    const pct = totalRevenue > 0 ? ((p[1].revenue / totalRevenue) * 100).toFixed(1) : 0;
    return `${p[0]} (${pct}%)`;
  });
  const pieData = topProducts.map(p => p[1].revenue);
  if (otherRevenue > 0) {
    const pct = totalRevenue > 0 ? ((otherRevenue / totalRevenue) * 100).toFixed(1) : 0;
    pieLabels.push(`Lainnya (${pct}%)`);
    pieData.push(otherRevenue);
  }

  const pieImg = await renderChartToBase64({
    type: "doughnut",
    data: {
      labels: pieLabels,
      datasets: [{ data: pieData, backgroundColor: ["#D97706","#0F172A","#059669","#8B5CF6","#F59E0B","#94A3B8"], borderWidth: 3, borderColor: "#fff" }],
    },
    options: {
      cutout: "62%",
      plugins: {
        legend: { position: "right", labels: { font: { size: 12 }, padding: 16, usePointStyle: true } },
      },
    },
  }, 900, 260);

  const pieH = (CW * 260) / 900;
  doc.addImage(pieImg, "PNG", ML, curY, CW, pieH);
  curY += pieH + 8;

  // ── Product Performance Table ──────────────────────────────────────────────
  drawSectionLabel(doc, "04", "ANALISIS PERFORMA PRODUK & KONTRIBUSI OMZET", ML, curY, CW);
  curY += 12;

  const productRows = sortedProducts.slice(0, 8).map((p, idx) => {
    const pct = totalRevenue > 0 ? ((p[1].revenue / totalRevenue) * 100).toFixed(1) : "0.0";
    return [`#${idx + 1}`, p[0], `${p[1].qty} porsi`, fmt(p[1].revenue), `${pct}%`];
  });

  autoTable(doc, {
    startY: curY,
    head: [["Rank", "Nama Menu / Produk", "Qty Terjual", "Total Omzet (Rp)", "% Kontribusi"]],
    body: productRows,
    theme: "grid",
    headStyles: { fillColor: C.NAVY, textColor: C.WHITE, fontStyle: "bold", fontSize: 8, cellPadding: 3 },
    styles: { font: "helvetica", fontSize: 7.8, cellPadding: 2.5, textColor: C.TEXT_MAIN, lineColor: C.SLATE_200, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: C.ROW_ALT },
    columnStyles: {
      0: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 72, fontStyle: "bold" },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 36, halign: "right" },
      4: { cellWidth: 28, halign: "center", fontStyle: "bold" },
    },
    margin: { left: ML, right: ML },
  });

  curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Transaction Audit Table ────────────────────────────────────────────────
  drawSectionLabel(doc, "05", "RINCIAN AUDIT SELURUH TRANSAKSI NOTA", ML, curY, CW);
  curY += 12;

  const txRows = transactions.slice(0, 20).map((t) => [
    t.orderNumber || "\u2014",
    new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "2-digit" }),
    t.customerName || "Pelanggan",
    t.orderType === "dine-in" ? "Dine-In" : "Takeaway",
    fmt(t.hppTotal),
    fmt(t.tax),
    fmt(t.total),
    fmt(t.netProfit),
  ]);

  autoTable(doc, {
    startY: curY,
    head: [["No. Nota", "Tanggal", "Pelanggan", "Tipe", "HPP (Rp)", "PPN (Rp)", "Omzet (Rp)", "Laba (Rp)"]],
    body: txRows,
    theme: "grid",
    headStyles: { fillColor: C.NAVY, textColor: C.WHITE, fontStyle: "bold", fontSize: 7.5, cellPadding: 2.8 },
    styles: { font: "helvetica", fontSize: 7.5, cellPadding: 2.2, textColor: C.TEXT_MAIN, lineColor: C.SLATE_200, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: C.ROW_ALT },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: "bold" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 30 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 18, halign: "right" },
      6: { cellWidth: 24, halign: "right", fontStyle: "bold" },
      7: { cellWidth: 22, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 7) {
        data.cell.styles.textColor = C.TEXT_EMR;
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: ML, right: ML },
  });

  drawPageFooter(doc, 2, 2, PW);

  const reportDate = new Date().toISOString().split("T")[0];
  doc.save(`Laporan_Audit_Kedai_Nyamleng_${reportDate}.pdf`);
}
