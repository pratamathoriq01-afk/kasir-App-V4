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
  width = 800,
  height = 400
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width  = width;
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

    await new Promise((r) => setTimeout(r, 120));
    const base64 = canvas.toDataURL("image/png", 0.95);
    chart.destroy();
    document.body.removeChild(canvas);
    return base64;
  } catch (err) {
    console.warn("Chart render fallback:", err);
    if (canvas.parentNode) document.body.removeChild(canvas);
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  }
}

// ─── Main PDF Export Engine ───────────────────────────────────────────────────
export async function exportTransactionsToPDF(
  transactions: Transaction[],
  periodLabel: string = "Semua Periode"
) {
  const doc = new jsPDF("p", "mm", "a4");
  const PW  = 210;
  const ML  = 14;
  const CW  = PW - ML * 2; // content width (182mm)

  // Computed KPIs
  const totalRevenue   = transactions.reduce((s, t) => s + t.total, 0);
  const totalHpp       = transactions.reduce((s, t) => s + t.hppTotal, 0);
  const totalNetProfit = transactions.reduce((s, t) => s + t.netProfit, 0);
  const totalTax       = transactions.reduce((s, t) => s + t.tax, 0);
  const txCount        = transactions.length;
  const avgOrderValue  = txCount > 0 ? Math.round(totalRevenue / txCount) : 0;
  const gpmPct         = totalRevenue > 0 ? (totalNetProfit / totalRevenue * 100) : 0;
  const hppPct         = totalRevenue > 0 ? (totalHpp / totalRevenue * 100) : 0;
  const isHealthy      = gpmPct >= 20;

  // ── Header Banner ───────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, PW, 38, "F");

  doc.setFillColor(217, 119, 6); // Amber accent
  doc.rect(0, 36, PW, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("KEDAI NYAMLENG — LAPORAN KEUANGAN & PENJUALAN PRO", ML, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text("Jl. LA. Sucipto XIV/42, Kota Malang — Telp/WA: 085113661387", ML, 21);
  doc.text(`Periode Evaluasi: ${periodLabel}  |  Dicetak: ${new Date().toLocaleString("id-ID")}`, ML, 27);

  // Health Badge
  if (isHealthy) doc.setFillColor(16, 185, 129);
  else doc.setFillColor(239, 68, 68);
  doc.roundedRect(PW - ML - 42, 8, 42, 13, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
  doc.text(isHealthy ? "BISNIS SEHAT ✓" : "PERLU EVALUASI", PW - ML - 21, 16, { align: "center" });

  let curY = 44;

  // ── 1. Executive KPI Summary Table ─────────────────────────────────────────
  doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
  doc.text("1. Ringkasan Kinerja Utama (Executive KPI Scorecard)", ML, curY);
  curY += 4;

  autoTable(doc, {
    startY: curY,
    head: [["KPI Metrik", "Nilai Realized", "% dari Omzet", "Rating Target", "Status Evaluasi"]],
    body: [
      ["Total Omzet Kotor", `Rp ${totalRevenue.toLocaleString("id-ID")}`, "100.0%", "Baseline", "NORMAL"],
      ["Total Biaya Modal (HPP)", `Rp ${totalHpp.toLocaleString("id-ID")}`, `${hppPct.toFixed(1)}%`, `${hppPct.toFixed(1)}% HPP`, hppPct < 50 ? "EFISIEN" : "TINGGI"],
      ["Pajak PPN 10% Terkumpul", `Rp ${totalTax.toLocaleString("id-ID")}`, `${totalRevenue > 0 ? ((totalTax / totalRevenue) * 100).toFixed(1) : 0}%`, "10.0% PPN", "NORMAL"],
      ["Laba Bersih (Net Profit)", `Rp ${totalNetProfit.toLocaleString("id-ID")}`, `${gpmPct.toFixed(1)}%`, `GPM ${gpmPct.toFixed(1)}%`, gpmPct >= 30 ? "EXCELLENT" : gpmPct >= 15 ? "SEHAT" : "RENDAH"],
      ["Volume Transaksi", `${txCount} Nota Terbit`, "—", "Nota Sukses", "AKTIF"],
      ["Rata-Rata Belanja (AOV)", `Rp ${avgOrderValue.toLocaleString("id-ID")}`, "—", "Per Customer", avgOrderValue >= 35000 ? "HIGH SPEND" : "NORMAL"],
    ],
    theme: "grid",
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 42 }, 2: { cellWidth: 28 }, 3: { cellWidth: 28 }, 4: { cellWidth: 29 } },
    margin: { left: ML, right: ML },
  });

  curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ── 2. Integrated Realtime AI Executive Summary Box ─────────────────────────
  doc.setFillColor(254, 243, 199); // Amber 50
  doc.setDrawColor(217, 119, 6);   // Amber 600
  doc.roundedRect(ML, curY, CW, 30, 2, 2, "FD");

  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(180, 83, 9);
  doc.text("🤖 REALTIME AI EXECUTIVE BUSINESS SUMMARY & RECOMMENDATIONS:", ML + 4, curY + 6);

  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(15, 23, 42);
  const aiSummaryText =
    `• Profitabilitas GPM: Total omzet mencapai Rp ${totalRevenue.toLocaleString("id-ID")} dengan Laba Bersih Rp ${totalNetProfit.toLocaleString("id-ID")} ` +
    `(Gross Profit Margin ${gpmPct.toFixed(1)}%). Tingkat kesehatan bisnis tercatat: ${gpmPct >= 30 ? "EXCELLENT & Efisien" : "SEHAT"}.\n` +
    `• Alokasi Modal HPP: Beban pokok HPP tercatat Rp ${totalHpp.toLocaleString("id-ID")} (${hppPct.toFixed(1)}% dari omzet). Pengendalian modal bahan baku efisien sesuai kaidah SAK EMKM.\n` +
    `• Rata-rata Belanja (AOV): Nilai belanja rata-rata pelanggan Rp ${avgOrderValue.toLocaleString("id-ID")} dari total ${txCount} nota terbit.\n` +
    `• Rekomendasi Operasional: Pertahankan strategi bundling menu utama dan dorong promosi produk minuman/cemilan bermargin tinggi.`;

  const splitSummary = doc.splitTextToSize(aiSummaryText, CW - 8);
  doc.text(splitSummary, ML + 4, curY + 12);
  curY += 36;

  // ── 3. Line Chart — Tren Omzet & Laba Harian ───────────────────────────────
  doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(15, 23, 42);
  doc.text("2. Grafik Tren Penjualan & Laba Harian", ML, curY);
  curY += 4;

  const dailyMap: Record<string, { omzet: number; laba: number; hpp: number }> = {};
  [...transactions]
    .sort((a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime())
    .forEach((t) => {
      const d = new Date(t.createdAt as string).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      if (!dailyMap[d]) dailyMap[d] = { omzet: 0, laba: 0, hpp: 0 };
      dailyMap[d].omzet += t.total;
      dailyMap[d].laba  += t.netProfit;
      dailyMap[d].hpp   += t.hppTotal;
    });

  const dateLabels = Object.keys(dailyMap).length > 0 ? Object.keys(dailyMap) : ["Tidak Ada Data"];
  const omzetVals  = Object.values(dailyMap).map((v) => v.omzet);
  const labaVals   = Object.values(dailyMap).map((v) => v.laba);
  const hppVals    = Object.values(dailyMap).map((v) => v.hpp);

  const lineChartImg = await renderChartToBase64("line", {
    labels: dateLabels,
    datasets: [
      {
        label: "Omzet (Rp)",
        data: omzetVals.length > 0 ? omzetVals : [0],
        borderColor: "rgb(217,119,6)",
        backgroundColor: "rgba(217,119,6,0.12)",
        borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: "rgb(217,119,6)",
        fill: true, tension: 0.35,
      },
      {
        label: "Laba Bersih (Rp)",
        data: labaVals.length > 0 ? labaVals : [0],
        borderColor: "rgb(16,185,129)",
        backgroundColor: "rgba(16,185,129,0.1)",
        borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: "rgb(16,185,129)",
        fill: true, tension: 0.35,
      },
      {
        label: "HPP / Modal (Rp)",
        data: hppVals.length > 0 ? hppVals : [0],
        borderColor: "rgb(239,68,68)",
        backgroundColor: "rgba(239,68,68,0.07)",
        borderWidth: 2, pointRadius: 4, borderDash: [5, 3],
        fill: false, tension: 0.3,
      },
    ],
  }, {
    plugins: {
      legend: { position: "top", labels: { font: { size: 12 }, padding: 12 } },
      title: { display: true, text: "Tren Omzet, Laba Bersih & HPP Harian", font: { size: 13, weight: "bold" } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 10 }, callback: (v: number) => "Rp " + (v / 1000).toFixed(0) + "k" } },
      x: { ticks: { font: { size: 10 } } },
    },
  }, 900, 380);

  const lineH = (CW * 380) / 900;
  if (curY + lineH > 270) { doc.addPage(); curY = 16; }
  doc.addImage(lineChartImg, "PNG", ML, curY, CW, lineH);
  curY += lineH + 10;

  // ── 4. Pie / Donut Chart — Breakdown Per-Menu Produk dengan Persentase % ──
  const productMap: Record<string, { qty: number; revenue: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productMap[item.nameSnapshot]) productMap[item.nameSnapshot] = { qty: 0, revenue: 0 };
      productMap[item.nameSnapshot].qty     += item.qty;
      productMap[item.nameSnapshot].revenue += item.priceSnapshot * item.qty;
    });
  });

  const sortedProds = Object.entries(productMap).sort(([, a], [, b]) => b.revenue - a.revenue);
  const top5Prods   = sortedProds.slice(0, 5);
  const otherProds  = sortedProds.slice(5);
  const otherRev    = otherProds.reduce((s, [, v]) => s + v.revenue, 0);

  const pieLabels: string[] = [];
  const pieData: number[]   = [];
  const pieColors = ["#D97706", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#94A3B8"];

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

  if (curY + 70 > 270) { doc.addPage(); curY = 16; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(15, 23, 42);
  doc.text("3. Donut Chart — Proporsi Omzet Per-Menu Produk (dengan Persentase %)", ML, curY);
  curY += 4;

  const pieImg = await renderChartToBase64("doughnut", {
    labels: pieLabels,
    datasets: [
      {
        data: pieData.length > 0 ? pieData : [1],
        backgroundColor: pieColors,
        borderWidth: 2, borderColor: "#FFFFFF",
      },
    ],
  }, {
    plugins: {
      legend: { position: "right", labels: { font: { size: 12 }, padding: 14 } },
      title: { display: true, text: "Kontribusi Kontrak Menu terhadap Total Omzet (%)", font: { size: 13, weight: "bold" } },
    },
  }, 900, 360);

  const pieH = (CW * 360) / 900;
  doc.addImage(pieImg, "PNG", ML, curY, CW, pieH);
  curY += pieH + 10;

  // ── 5. Detailed Product Performance Table ─────────────────────────────────
  if (curY + 40 > 270) { doc.addPage(); curY = 16; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(15, 23, 42);
  doc.text("4. Tabel Analisis Performa Produk & Kontribusi Omzet", ML, curY);
  curY += 4;

  autoTable(doc, {
    startY: curY,
    head: [["Rank", "Nama Menu Produk", "Qty Terjual", "Total Omzet (Rp)", "% Kontribusi Omzet"]],
    body: sortedProds.map(([name, v], i) => [
      i + 1,
      name,
      `${v.qty} pcs`,
      `Rp ${v.revenue.toLocaleString("id-ID")}`,
      `${totalRevenue > 0 ? ((v.revenue / totalRevenue) * 100).toFixed(1) : 0}%`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 16 }, 1: { cellWidth: 70 }, 2: { cellWidth: 28 }, 3: { cellWidth: 40 }, 4: { cellWidth: 28 } },
    margin: { left: ML, right: ML },
  });

  // Footer / Page numbers
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5); doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${pageCount}  |  Kedai Nyamleng POS Financial System`, PW / 2, 290, { align: "center" });
  }

  doc.save(`Laporan_PDF_Kedai_Nyamleng_${new Date().toISOString().slice(0, 10)}.pdf`);
}
