import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "@/types";
import {
  Chart,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";

// Register Chart.js components
Chart.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─── Chart Canvas Offscreen Renderer ──────────────────────────────────────────
async function renderChartToBase64(
  type: "line" | "bar" | "doughnut",
  data: object,
  options: object,
  width = 900,
  height = 400
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = "none";
  document.body.appendChild(canvas);

  try {
    const chart = new Chart(canvas, {
      type,
      data: data as never,
      options: {
        animation: false,
        responsive: false,
        devicePixelRatio: 2,
        ...(options as object),
      } as never,
    });

    await new Promise((r) => setTimeout(r, 150));
    const base64 = canvas.toDataURL("image/png", 0.95);
    chart.destroy();
    if (canvas.parentNode) document.body.removeChild(canvas);
    return base64;
  } catch (err) {
    console.warn("Chart render fallback:", err);
    if (canvas.parentNode) document.body.removeChild(canvas);
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  }
}

// ─── Main Executive PDF Export Engine ─────────────────────────────────────────
export async function exportTransactionsToPDF(
  transactions: Transaction[],
  periodLabel: string = "Semua Periode"
) {
  const doc = new jsPDF("p", "mm", "a4");
  const PW = 210;
  const ML = 14;
  const CW = PW - ML * 2; // content width (182mm)

  // Computed KPIs
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
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, PW, 38, "F");

  doc.setFillColor(217, 119, 6); // Amber accent bar
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

  // ── PAGE 1: EXECUTIVE SCORECARD & AI AUDIT SUMMARY ───────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("1. Ringkasan Kinerja Eksekutif (KPI Scorecard)", ML, curY);
  curY += 4;

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
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 42, halign: "right" },
      2: { cellWidth: 26, halign: "center" },
      3: { cellWidth: 29, halign: "center" },
      4: { cellWidth: 30, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        // Highlight Net Profit Row
        if (data.row.index === 2) {
          data.cell.styles.fillColor = [230, 244, 234];
          data.cell.styles.textColor = [6, 95, 70];
          data.cell.styles.fontStyle = "bold";
        }
        // Style status pills in column 4
        if (data.column.index === 4) {
          const text = String(data.cell.raw);
          if (text === "EXCELLENT" || text === "EFISIEN" || text === "SEHAT") {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = "bold";
          } else if (text === "HIGH SPEND" || text === "TERKULPUL") {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = "bold";
          }
        }
      }
    },
    margin: { left: ML, right: ML },
  });

  curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── 2. AI Executive Summary & Audit Insight Box ─────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("2. Analisis Strategis AI & Audit Keuangan (SAK EMKM)", ML, curY);
  curY += 4;

  const p1 = `• KINERJA OMZET & PROFITABILITAS: Total omzet Rp ${totalRevenue.toLocaleString("id-ID")} menghasilkan Net Profit Rp ${totalNetProfit.toLocaleString("id-ID")} (GPM ${gpmPct.toFixed(1)}%). Evaluasi bisnis: ${gpmPct >= 30 ? "Sangat Sehat & Profitabel" : "Stabil"}.`;
  const p2 = `• PENGENDALIAN HPP BAHAN BAKU: Biaya modal HPP sebesar Rp ${totalHpp.toLocaleString("id-ID")} (${hppPct.toFixed(1)}% dari omzet). Bahan baku terjaga efisien di bawah ambang batas maksimum SAK EMKM (50%).`;
  const p3 = `• TRAFIK & UKURAN NOTA (AOV): Rata-rata belanja per nota sebesar Rp ${avgOrderValue.toLocaleString("id-ID")} dari total ${txCount} transaksi berhasil.`;
  const p4 = `• REKOMENDASI OPERASIONAL: Pertahankan promosi bundling menu margin tinggi (>50%) & lakukan evaluasi berkala pada stok bahan baku ber-HPP tinggi.`;

  const paragraphs = [p1, p2, p3, p4];
  const allLines: string[] = [];
  paragraphs.forEach((p) => {
    const wrapped = doc.splitTextToSize(p, CW - 12);
    allLines.push(...wrapped);
  });

  const computedBoxH = Math.max(48, allLines.length * 4.8 + 8);
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(ML, curY, CW, computedBoxH, 3, 3, "FD");

  // Left Amber Accent Stripe
  doc.setFillColor(217, 119, 6);
  doc.rect(ML, curY, 3.5, computedBoxH, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85); // Slate 700

  let textY = curY + 7;
  paragraphs.forEach((p) => {
    const lines = doc.splitTextToSize(p, CW - 12);
    doc.text(lines, ML + 7, textY);
    textY += lines.length * 4.8 + 2;
  });

  curY += computedBoxH + 10;

  // Sign-off Stamp on Page 1
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Laporan ini disusun otomatis oleh AI Financial Engine Kedai Nyamleng POS.", ML, curY);

  // ── PAGE 2: VISUAL ANALYTICS & CHARTS ─────────────────────────────────────────
  doc.addPage();
  curY = 16;

  // ── 3. Line Chart — Tren Omzet & Laba Harian ───────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("3. Grafik Tren Omzet & Laba Harian", ML, curY);
  curY += 4;

  const dailyMap: Record<string, { omzet: number; laba: number; hpp: number }> = {};
  [...transactions]
    .sort((a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime())
    .forEach((t) => {
      const d = new Date(t.createdAt as string).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      if (!dailyMap[d]) dailyMap[d] = { omzet: 0, laba: 0, hpp: 0 };
      dailyMap[d].omzet += t.total;
      dailyMap[d].laba += t.netProfit;
      dailyMap[d].hpp += t.hppTotal;
    });

  const dateLabels = Object.keys(dailyMap).length > 0 ? Object.keys(dailyMap) : ["Tidak Ada Data"];
  const omzetVals = Object.values(dailyMap).map((v) => v.omzet);
  const labaVals = Object.values(dailyMap).map((v) => v.laba);

  const lineChartImg = await renderChartToBase64(
    "line",
    {
      labels: dateLabels,
      datasets: [
        {
          label: "Omzet Kotor (Rp)",
          data: omzetVals.length > 0 ? omzetVals : [0],
          borderColor: "rgb(217, 119, 6)",
          backgroundColor: "rgba(217, 119, 6, 0.12)",
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: "rgb(217, 119, 6)",
          fill: true,
          tension: 0.35,
        },
        {
          label: "Laba Bersih (Rp)",
          data: labaVals.length > 0 ? labaVals : [0],
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: "rgb(16, 185, 129)",
          fill: true,
          tension: 0.35,
        },
      ],
    },
    {
      plugins: {
        legend: { position: "top", labels: { font: { size: 12 }, padding: 12 } },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 10 },
            callback: (v: number) => "Rp " + (v / 1000).toFixed(0) + "k",
          },
        },
        x: { ticks: { font: { size: 10 } } },
      },
    },
    900,
    340
  );

  const lineH = (CW * 340) / 900;
  doc.addImage(lineChartImg, "PNG", ML, curY, CW, lineH);
  curY += lineH + 12;

  // ── 4. Doughnut Chart — Proporsi Omzet Produk ──────────────────────────────
  const productMap: Record<string, { qty: number; revenue: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productMap[item.nameSnapshot]) productMap[item.nameSnapshot] = { qty: 0, revenue: 0 };
      productMap[item.nameSnapshot].qty += item.qty;
      productMap[item.nameSnapshot].revenue += item.priceSnapshot * item.qty;
    });
  });

  const sortedProds = Object.entries(productMap).sort(([, a], [, b]) => b.revenue - a.revenue);
  const top5Prods = sortedProds.slice(0, 5);
  const otherProds = sortedProds.slice(5);
  const otherRev = otherProds.reduce((s, [, v]) => s + v.revenue, 0);

  const pieLabels: string[] = [];
  const pieData: number[] = [];
  const pieColors = ["#D97706", "#0284C7", "#059669", "#8B5CF6", "#F59E0B", "#94A3B8"];

  top5Prods.forEach(([name, v]) => {
    const pct = totalRevenue > 0 ? ((v.revenue / totalRevenue) * 100).toFixed(1) : "0.0";
    pieLabels.push(`${name} (${pct}%)`);
    pieData.push(v.revenue);
  });

  if (otherRev > 0) {
    const pct = totalRevenue > 0 ? ((otherRev / totalRevenue) * 100).toFixed(1) : "0.0";
    pieLabels.push(`Lainnya (${pct}%)`);
    pieData.push(otherRev);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("4. Donut Chart — Proporsi Omzet Produk Terlaris", ML, curY);
  curY += 4;

  const pieImg = await renderChartToBase64(
    "doughnut",
    {
      labels: pieLabels,
      datasets: [
        {
          data: pieData.length > 0 ? pieData : [1],
          backgroundColor: pieColors,
          borderWidth: 2,
          borderColor: "#FFFFFF",
        },
      ],
    },
    {
      plugins: {
        legend: { position: "right", labels: { font: { size: 11 }, padding: 14 } },
      },
    },
    900,
    320
  );

  const pieH = (CW * 320) / 900;
  doc.addImage(pieImg, "PNG", ML, curY, CW, pieH);

  // ── PAGE 3: DETAILED TABLES ──────────────────────────────────────────────────
  doc.addPage();
  curY = 16;

  // ── 5. Product Performance Table ────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("5. Tabel Analisis Performa Produk & Kontribusi Omzet", ML, curY);
  curY += 4;

  autoTable(doc, {
    startY: curY,
    head: [["Rank", "Nama Menu Produk", "Porsi Terjual", "Total Omzet (Rp)", "% Kontribusi Omzet"]],
    body: sortedProds.map(([name, v], i) => [
      `#${i + 1}`,
      name,
      `${v.qty} porsi`,
      `Rp ${v.revenue.toLocaleString("id-ID")}`,
      `${totalRevenue > 0 ? ((v.revenue / totalRevenue) * 100).toFixed(1) : 0}%`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 16, halign: "center" },
      1: { cellWidth: 70 },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 40, halign: "right" },
      4: { cellWidth: 28, halign: "center" },
    },
    margin: { left: ML, right: ML },
  });

  curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── 6. Full Transaction History Audit Table ─────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("6. Rincian Audit Seluruh Transaksi Nota", ML, curY);
  curY += 4;

  autoTable(doc, {
    startY: curY,
    head: [["No. Nota", "Tanggal", "Pelanggan", "Order", "HPP (Rp)", "Pajak (Rp)", "Total Omzet (Rp)", "Laba (Rp)"]],
    body: transactions.map((t) => [
      t.orderNumber,
      new Date(t.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      t.customerName || "Pelanggan",
      t.orderType === "dine-in" ? `Dine-In (${t.tableNumber})` : "Takeaway",
      `Rp ${t.hppTotal.toLocaleString("id-ID")}`,
      `Rp ${t.tax.toLocaleString("id-ID")}`,
      `Rp ${t.total.toLocaleString("id-ID")}`,
      `Rp ${t.netProfit.toLocaleString("id-ID")}`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    styles: { font: "helvetica", fontSize: 7.5, cellPadding: 1.8 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 20 },
      2: { cellWidth: 32 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 22, halign: "right" },
      7: { cellWidth: 20, halign: "right" },
    },
    margin: { left: ML, right: ML },
  });

  // Footer / Page numbers
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Halaman ${i} dari ${pageCount}  |  Dokumen Laporan Keuangan Resmi Kedai Nyamleng Malang`,
      PW / 2,
      290,
      { align: "center" }
    );
  }

  doc.save(`Laporan_PDF_Kedai_Nyamleng_${new Date().toISOString().slice(0, 10)}.pdf`);
}
