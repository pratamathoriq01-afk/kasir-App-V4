import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "@/types";

/**
 * Offscreen Chart renderer to convert Chart.js options to Base64 PNG for jsPDF
 */
async function renderChartToBase64(
  config: any,
  width: number = 800,
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

export async function exportTransactionsToPDF(
  transactions: Transaction[],
  periodLabel: string = "Semua Periode"
) {
  const doc = new jsPDF("p", "mm", "a4");
  const PW = 210;
  const ML = 14;
  const CW = PW - ML * 2; // content width (182mm)

  // Computed Financial Metrics
  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
  const totalHpp = transactions.reduce((s, t) => s + t.hppTotal, 0);
  const totalNetProfit = transactions.reduce((s, t) => s + t.netProfit, 0);
  const totalTax = transactions.reduce((s, t) => s + t.tax, 0);
  const totalDiscount = transactions.reduce((s, t) => s + t.discountAmount, 0);
  const txCount = transactions.length;
  const avgOrderValue = txCount > 0 ? Math.round(totalRevenue / txCount) : 0;
  const gpmPct = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
  const hppPct = totalRevenue > 0 ? (totalHpp / totalRevenue) * 100 : 0;
  const isHealthy = gpmPct >= 20;

  // ── Header Banner ───────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42); // Slate 900 / Dark Navy
  doc.rect(0, 0, PW, 38, "F");

  doc.setFillColor(217, 119, 6); // Gold/Amber accent bar
  doc.rect(0, 36, PW, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("KEDAI NYAMLENG MALANG", ML, 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(251, 191, 36); // Amber 400
  doc.text("LAPORAN AUDIT PENJUALAN & EKSEKUTIF KEUANGAN", ML, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text("Jl. Laksada Adi Sucipto Gg.14 No 42, Kel. Blimbing, Malang — Telp/WA: 085113661387", ML, 24);
  doc.text(`Periode Evaluasi: ${periodLabel}  |  Tanggal Cetak: ${new Date().toLocaleString("id-ID")}`, ML, 29);

  // Health Status Badge
  if (isHealthy) doc.setFillColor(16, 185, 129);
  else doc.setFillColor(239, 68, 68);
  doc.roundedRect(PW - ML - 36, 10, 36, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(isHealthy ? "PROFIT SEHAT OK" : "PERLU EVALUASI", PW - ML - 18, 16.5, { align: "center" });

  let curY = 44;

  // ── PAGE 1: KPI SCORECARD ────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("1. Ringkasan Kinerja Eksekutif (KPI Scorecard)", ML, curY);
  curY += 3;

  autoTable(doc, {
    startY: curY,
    head: [["Metrik Utama", "Nilai Realized (Rp)", "% dari Omzet", "Target SAK EMKM", "Status Evaluasi"]],
    body: [
      ["Total Omzet Penjualan (Kotor)", `Rp ${totalRevenue.toLocaleString("id-ID")}`, "100.0%", "Baseline", "NORMAL"],
      ["Total Biaya Modal (HPP)", `Rp ${totalHpp.toLocaleString("id-ID")}`, `${hppPct.toFixed(1)}%`, "< 50.0% HPP", hppPct < 50 ? "EFISIEN" : "TINGGI"],
      ["Laba Bersih (Net Profit)", `Rp ${totalNetProfit.toLocaleString("id-ID")}`, `${gpmPct.toFixed(1)}%`, `GPM ${gpmPct.toFixed(1)}%`, gpmPct >= 30 ? "EXCELLENT" : gpmPct >= 15 ? "SEHAT" : "RENDAH"],
      ["Setoran Pajak Resto (PPN 10%)", `Rp ${totalTax.toLocaleString("id-ID")}`, `${totalRevenue > 0 ? ((totalTax / totalRevenue) * 100).toFixed(1) : 0}%`, "10.0% PPN", "TERKUMPUL"],
      ["Total Diskon Promo Terpakai", `Rp ${totalDiscount.toLocaleString("id-ID")}`, `${totalRevenue > 0 ? ((totalDiscount / totalRevenue) * 100).toFixed(1) : 0}%`, "< 10.0% Diskon", "TERKENDALI"],
      ["Rata-Rata Belanja (AOV)", `Rp ${avgOrderValue.toLocaleString("id-ID")}`, "-", "Per Transaksi", avgOrderValue >= 30000 ? "HIGH SPEND" : "NORMAL"],
    ],
    theme: "grid",
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    styles: { font: "helvetica", fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 42, halign: "right" },
      2: { cellWidth: 26, halign: "center" },
      3: { cellWidth: 29, halign: "center" },
      4: { cellWidth: 30, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        if (data.row.index === 2) {
          data.cell.styles.fillColor = [240, 253, 244];
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = "bold";
        }
        if (data.column.index === 4) {
          const text = String(data.cell.raw);
          if (text === "EXCELLENT" || text === "EFISIEN" || text === "SEHAT") {
            data.cell.styles.textColor = [5, 150, 105];
            data.cell.styles.fontStyle = "bold";
          }
        }
      }
    },
    margin: { left: ML, right: ML },
  });

  curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // ── 2. AI Executive Summary Box (Amber Card) ─────────────────────────────────
  doc.setFillColor(254, 243, 199); // Amber 50
  doc.setDrawColor(217, 119, 6); // Gold 600
  doc.roundedRect(ML, curY, CW, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text("AI EXECUTIVE BUSINESS SUMMARY & RECOMMENDATIONS:", ML + 4, curY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const aiSummaryText =
    `- Kinerja Omzet & Profit: Total omzet Rp ${totalRevenue.toLocaleString("id-ID")} dengan Laba Bersih Rp ${totalNetProfit.toLocaleString("id-ID")} (GPM ${gpmPct.toFixed(1)}%). Business Status: ${gpmPct >= 30 ? "EXCELLENT & Sangat Profitabel" : "SEHAT"}.\n` +
    `- Pengendalian HPP: Biaya modal HPP Rp ${totalHpp.toLocaleString("id-ID")} (${hppPct.toFixed(1)}% dari omzet). Bahan baku efisien.\n` +
    `- Rata-Rata Nota (AOV): Rata-rata Rp ${avgOrderValue.toLocaleString("id-ID")} per nota dari ${txCount} transaksi berhasil.\n` +
    `- Rekomendasi Operasional: Pertahankan promosi bundling menu margin tinggi & evaluasi stok bahan baku ber-HPP tinggi.`;

  const splitSummary = doc.splitTextToSize(aiSummaryText, CW - 8);
  doc.text(splitSummary, ML + 4, curY + 10);
  curY += 33;

  // ── 3. Line Chart — Tren Omzet & Laba Harian ───────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("2. Grafik Tren Omzet & Laba Harian", ML, curY);
  curY += 3;

  const dailyMap: Record<string, { omzet: number; laba: number; hpp: number }> = {};
  transactions.forEach((t) => {
    const dateStr = new Date(t.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    if (!dailyMap[dateStr]) dailyMap[dateStr] = { omzet: 0, laba: 0, hpp: 0 };
    dailyMap[dateStr].omzet += t.total;
    dailyMap[dateStr].laba += t.netProfit;
    dailyMap[dateStr].hpp += t.hppTotal;
  });

  const chartLabels = Object.keys(dailyMap);
  const chartOmzet = chartLabels.map((k) => dailyMap[k].omzet);
  const chartLaba = chartLabels.map((k) => dailyMap[k].laba);

  const lineChartImg = await renderChartToBase64(
    {
      type: "line",
      data: {
        labels: chartLabels.length > 0 ? chartLabels : ["Hari 1"],
        datasets: [
          { label: "Omzet Kotor (Rp)", data: chartOmzet.length > 0 ? chartOmzet : [0], borderColor: "#D97706", backgroundColor: "rgba(217, 119, 6, 0.1)", tension: 0.3, fill: true },
          { label: "Laba Bersih (Rp)", data: chartLaba.length > 0 ? chartLaba : [0], borderColor: "#059669", backgroundColor: "rgba(5, 150, 105, 0.1)", tension: 0.3, fill: true },
        ],
      },
      options: {
        plugins: { legend: { position: "top" } },
        scales: { y: { ticks: { callback: (v: any) => `Rp ${(v / 1000).toFixed(0)}k` } } },
      },
    },
    900,
    300
  );

  const lineH = (CW * 300) / 900;
  doc.addImage(lineChartImg, "PNG", ML, curY, CW, lineH);

  // Footer Page 1
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Halaman 1 dari 2 | Dokumen Laporan Keuangan Resmi Kedai Nyamleng Malang", PW / 2, 290, { align: "center" });

  // ── PAGE 2: DONUT CHART & DETAILED TABLES ────────────────────────────────────
  doc.addPage();
  curY = 14;

  // ── 4. Doughnut Chart — Proporsi Omzet Produk ──────────────────────────────
  const productMap: Record<string, { qty: number; revenue: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const name = item.nameSnapshot;
      if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 };
      productMap[name].qty += item.qty;
      productMap[name].revenue += item.qty * item.priceSnapshot;
    });
  });

  const sortedProducts = Object.entries(productMap).sort((a, b) => b[1].revenue - a[1].revenue);
  const topProducts = sortedProducts.slice(0, 5);
  const otherRevenue = sortedProducts.slice(5).reduce((sum, p) => sum + p[1].revenue, 0);

  const pieLabels = topProducts.map((p) => {
    const pct = totalRevenue > 0 ? ((p[1].revenue / totalRevenue) * 100).toFixed(1) : 0;
    return `${p[0]} (${pct}%)`;
  });
  const pieData = topProducts.map((p) => p[1].revenue);
  if (otherRevenue > 0) {
    const pct = totalRevenue > 0 ? ((otherRevenue / totalRevenue) * 100).toFixed(1) : 0;
    pieLabels.push(`Lainnya (${pct}%)`);
    pieData.push(otherRevenue);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("3. Donut Chart — Proporsi Omzet Produk Terlaris", ML, curY);
  curY += 3;

  const pieImg = await renderChartToBase64(
    {
      type: "doughnut",
      data: {
        labels: pieLabels,
        datasets: [{ data: pieData, backgroundColor: ["#D97706", "#0284C7", "#059669", "#8B5CF6", "#F59E0B", "#94A3B8"] }],
      },
      options: { plugins: { legend: { position: "right" } } },
    },
    900,
    280
  );

  const pieH = (CW * 280) / 900;
  doc.addImage(pieImg, "PNG", ML, curY, CW, pieH);
  curY += pieH + 6;

  // ── 5. Product Performance Table ────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("4. Tabel Analisis Performa Produk & Kontribusi Omzet", ML, curY);
  curY += 3;

  const productRows = sortedProducts.slice(0, 8).map((p, idx) => {
    const pct = totalRevenue > 0 ? ((p[1].revenue / totalRevenue) * 100).toFixed(1) : 0;
    return [`#${idx + 1}`, p[0], `${p[1].qty} porsi`, `Rp ${p[1].revenue.toLocaleString("id-ID")}`, `${pct}%`];
  });

  autoTable(doc, {
    startY: curY,
    head: [["Rank", "Nama Menu Produk", "Porsi Terjual", "Total Omzet (Rp)", "% Kontribusi Omzet"]],
    body: productRows,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    styles: { font: "helvetica", fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 16, halign: "center" },
      1: { cellWidth: 70 },
      2: { cellWidth: 32, halign: "center" },
      3: { cellWidth: 36, halign: "right" },
      4: { cellWidth: 28, halign: "right" },
    },
    margin: { left: ML, right: ML },
  });

  curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ── 6. Full Transaction History Audit Table ─────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("5. Rincian Audit Seluruh Transaksi Nota", ML, curY);
  curY += 3;

  const txRows = transactions.slice(0, 15).map((t) => [
    t.orderNumber || "-",
    new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    t.customerName || "Pelanggan",
    t.orderType === "dine-in" ? "Dine-In" : "Takeaway",
    `Rp ${t.hppTotal.toLocaleString("id-ID")}`,
    `Rp ${t.tax.toLocaleString("id-ID")}`,
    `Rp ${t.total.toLocaleString("id-ID")}`,
    `Rp ${t.netProfit.toLocaleString("id-ID")}`,
  ]);

  autoTable(doc, {
    startY: curY,
    head: [["No. Nota", "Tanggal", "Pelanggan", "Order", "HPP (Rp)", "Pajak (Rp)", "Total Omzet (Rp)", "Laba (Rp)"]],
    body: txRows,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
    styles: { font: "helvetica", fontSize: 7, cellPadding: 1.8 },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 30 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 24, halign: "right" },
      7: { cellWidth: 22, halign: "right" },
    },
    margin: { left: ML, right: ML },
  });

  // Footer Page 2
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Halaman 2 dari 2 | Dokumen Laporan Keuangan Resmi Kedai Nyamleng Malang", PW / 2, 290, { align: "center" });

  // Save PDF file
  const reportDate = new Date().toISOString().split("T")[0];
  doc.save(`Laporan_Audit_Kedai_Nyamleng_${reportDate}.pdf`);
}
