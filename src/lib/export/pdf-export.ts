import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "@/types";
import {
  Chart,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";

// Register Chart.js components (needed for offscreen rendering)
Chart.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─── Chart Canvas Renderer (offscreen, 800×400) ─────────────────────────────
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

    await new Promise((r) => setTimeout(r, 100));
    const base64 = canvas.toDataURL("image/png", 0.95);
    chart.destroy();
    document.body.removeChild(canvas);
    return base64;
  } catch (err) {
    console.warn("Chart render fallback:", err);
    if (canvas.parentNode) document.body.removeChild(canvas);
    // Return empty 1x1 png pixel
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  }
}

// ─── Main PDF Export ──────────────────────────────────────────────────────────
export async function exportTransactionsToPDF(
  transactions: Transaction[],
  periodLabel: string = "Semua Periode"
) {
  const doc = new jsPDF("p", "mm", "a4");
  const PW  = 210;
  const ML  = 14;
  const CW  = PW - ML * 2; // content width

  // ── Computed KPIs ──────────────────────────────────────────────────────────
  const totalRevenue    = transactions.reduce((s, t) => s + t.total, 0);
  const totalHpp        = transactions.reduce((s, t) => s + t.hppTotal, 0);
  const totalNetProfit  = transactions.reduce((s, t) => s + t.netProfit, 0);
  const totalTax        = transactions.reduce((s, t) => s + t.tax, 0);
  const txCount         = transactions.length;
  const avgOrderValue   = txCount > 0 ? Math.round(totalRevenue / txCount) : 0;
  const gpmPct          = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
  const hppPct          = totalRevenue > 0 ? (totalHpp / totalRevenue) * 100 : 0;

  const isHealthy = gpmPct >= 25;

  // ── Page 1: Header Banner ──────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PW, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("KEDAI NYAMLENG", ML, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text("Jl. LA. Sucipto XIV/42, Kota Malang", ML, 21);
  doc.text(`Laporan Keuangan & Penjualan  |  Periode: ${periodLabel}`, ML, 27);
  doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, ML, 33);

  // Health badge
  if (isHealthy) doc.setFillColor(16, 185, 129);
  else            doc.setFillColor(239, 68, 68);
  doc.roundedRect(PW - ML - 42, 8, 42, 13, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255);
  doc.text(isHealthy ? "BISNIS SEHAT ✓" : "PERLU PERHATIAN", PW - ML - 21, 16, { align: "center" });

  let curY = 46;

  // ── KPI Summary Table ───────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("1. Ringkasan Kinerja Utama (Executive KPI)", ML, curY);
  curY += 4;

  const kpiColor = (v: number, good: number, ok: number) =>
    v >= good ? [16, 185, 129] as [number,number,number] :
    v >= ok   ? [217, 119, 6] as [number,number,number] :
                [239, 68, 68] as [number,number,number];

  autoTable(doc, {
    startY: curY,
    head: [["KPI Metrik", "Nilai", "% dari Omzet", "Rating", "Status"]],
    body: [
      ["Total Omzet Kotor",    `Rp ${totalRevenue.toLocaleString("id-ID")}`,   "100%",            "—",             "BASELINE"],
      ["Total Biaya Modal (HPP)", `Rp ${totalHpp.toLocaleString("id-ID")}`,    `${hppPct.toFixed(1)}%`,  `${hppPct.toFixed(1)}% HPP`, hppPct < 50 ? "EFISIEN" : "TINGGI"],
      ["Pajak PPN Terkumpul",  `Rp ${totalTax.toLocaleString("id-ID")}`,      `${totalRevenue>0?((totalTax/totalRevenue)*100).toFixed(1):0}%`, "10% PPN", "NORMAL"],
      ["Laba Bersih (Net Profit)", `Rp ${totalNetProfit.toLocaleString("id-ID")}`, `${gpmPct.toFixed(1)}%`, `GPM ${gpmPct.toFixed(1)}%`, gpmPct>=30?"EXCELLENT":gpmPct>=15?"NORMAL":"RENDAH"],
      ["Volume Transaksi",     `${txCount} Nota`,                              "—",               "Volume",        "AKTIF"],
      ["Avg. Order Value (AOV)", `Rp ${avgOrderValue.toLocaleString("id-ID")}`, "—",              "Per Transaksi", avgOrderValue>=35000?"TINGGI":"NORMAL"],
    ],
    theme: "grid",
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2.2 },
    columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 42 }, 2: { cellWidth: 28 }, 3: { cellWidth: 28 }, 4: { cellWidth: 29 } },
    margin: { left: ML, right: ML },
    didParseCell: (hookData) => {
      if (hookData.column.index === 4 && hookData.section === "body") {
        const v = hookData.cell.text[0];
        if (v === "EXCELLENT" || v === "EFISIEN" || v === "NORMAL" || v === "AKTIF" || v === "TINGGI") {
          hookData.cell.styles.textColor = kpiColor(1, 1, 0.5);
          hookData.cell.styles.fontStyle = "bold";
        } else if (v === "RENDAH" || v === "TINGGI") {
          hookData.cell.styles.textColor = [239, 68, 68];
          hookData.cell.styles.fontStyle = "bold";
        }
      }
    }
  });

  curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── Chart 1: Line Chart — Tren Omzet & Laba Harian ─────────────────────────
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(15, 23, 42);
  doc.text("2. Grafik Tren Penjualan & Laba Harian (Line Chart)", ML, curY);
  curY += 4;

  // Build daily grouped data
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
      legend: { position: "top", labels: { font: { size: 13 }, padding: 16 } },
      title: { display: true, text: "Tren Omzet, Laba Bersih & HPP Harian", font: { size: 14, weight: "bold" } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { font: { size: 11 }, callback: (v: number) => "Rp " + (v/1000).toFixed(0) + "k" },
        grid: { color: "rgba(0,0,0,0.06)" },
      },
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  }, 900, 420);

  const lineChartH = (CW * 420) / 900;
  if (curY + lineChartH > 270) { doc.addPage(); curY = 16; }
  doc.addImage(lineChartImg, "PNG", ML, curY, CW, lineChartH);
  curY += lineChartH + 10;

  // ── Chart 2: Bar Chart — Omzet per Menu ─────────────────────────────────────
  const productMap: Record<string, { qty: number; revenue: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productMap[item.nameSnapshot]) productMap[item.nameSnapshot] = { qty: 0, revenue: 0 };
      productMap[item.nameSnapshot].qty     += item.qty;
      productMap[item.nameSnapshot].revenue += item.priceSnapshot * item.qty;
    });
  });
  const sortedProds = Object.entries(productMap).sort(([, a], [, b]) => b.revenue - a.revenue).slice(0, 8);
  const prodLabels  = sortedProds.map(([name]) => name.length > 14 ? name.slice(0, 12) + "…" : name);
  const prodRevs    = sortedProds.map(([, v]) => v.revenue);
  const prodQtys    = sortedProds.map(([, v]) => v.qty);
  const barColors   = ["#D97706","#F59E0B","#FBBF24","#FCD34D","#FDE68A","#F59E0B","#D97706","#B45309"];

  if (curY + 60 > 270) { doc.addPage(); curY = 16; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(15, 23, 42);
  doc.text("3. Bar Chart — Performa Omzet per Menu (Top 8)", ML, curY);
  curY += 4;

  const barChartImg = await renderChartToBase64("bar", {
    labels: prodLabels,
    datasets: [
      {
        label: "Omzet (Rp)",
        data: prodRevs.length > 0 ? prodRevs : [0],
        backgroundColor: barColors,
        borderColor: barColors.map(c => c),
        borderWidth: 1.5, borderRadius: 6,
      },
      {
        label: "Qty Terjual",
        data: prodQtys.length > 0 ? prodQtys : [0],
        backgroundColor: "rgba(99,102,241,0.75)",
        borderColor: "rgb(99,102,241)",
        borderWidth: 1.5, borderRadius: 6,
        yAxisID: "y2",
      },
    ],
  }, {
    plugins: {
      legend: { position: "top", labels: { font: { size: 12 }, padding: 14 } },
      title: { display: true, text: "Omzet & Qty per Produk (Top 8)", font: { size: 13, weight: "bold" } },
    },
    scales: {
      y:  { beginAtZero: true, ticks: { font: { size: 11 }, callback: (v: number) => "Rp " + (v/1000).toFixed(0) + "k" } },
      y2: { beginAtZero: true, position: "right", ticks: { font: { size: 11 }, callback: (v: number) => v + " pcs" }, grid: { display: false } },
      x:  { ticks: { font: { size: 10 } } },
    },
  }, 900, 380);

  const barH = (CW * 380) / 900;
  if (curY + barH > 270) { doc.addPage(); curY = 16; }
  doc.addImage(barChartImg, "PNG", ML, curY, CW, barH);
  curY += barH + 10;

  // ── Chart 3: Doughnut — Proporsi Kategori ───────────────────────────────────
  // Category grouping using item name keywords
  let makananRev = 0, minumanRev = 0, cemilanRev = 0;
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const n = item.nameSnapshot.toLowerCase();
      const rev = item.priceSnapshot * item.qty;
      if (n.includes("es ") || n.includes("kopi") || n.includes("teh") || n.includes("jeruk") || n.includes("minuman")) {
        minumanRev += rev;
      } else if (n.includes("tahu") || n.includes("pisang") || n.includes("cemilan") || n.includes("snack") || n.includes("kerupuk")) {
        cemilanRev += rev;
      } else {
        makananRev += rev;
      }
    });
  });

  const doughnutTotal = makananRev + minumanRev + cemilanRev || 1;
  const doughnutPct   = [
    ((makananRev / doughnutTotal) * 100).toFixed(1),
    ((minumanRev / doughnutTotal) * 100).toFixed(1),
    ((cemilanRev / doughnutTotal) * 100).toFixed(1),
  ];

  if (curY + 70 > 270) { doc.addPage(); curY = 16; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(15, 23, 42);
  doc.text("4. Pie Chart — Proporsi Omzet per Kategori (dengan %)", ML, curY);
  curY += 4;

  const pieImg = await renderChartToBase64("doughnut", {
    labels: [
      `Makanan (${doughnutPct[0]}%)`,
      `Minuman (${doughnutPct[1]}%)`,
      `Cemilan (${doughnutPct[2]}%)`,
    ],
    datasets: [{
      data: [makananRev || 1, minumanRev || 1, cemilanRev || 1],
      backgroundColor: ["rgba(217,119,6,0.88)", "rgba(59,130,246,0.88)", "rgba(16,185,129,0.88)"],
      borderColor: ["#D97706", "#3B82F6", "#10B981"],
      borderWidth: 2.5, hoverOffset: 12,
    }],
  }, {
    cutout: "52%",
    plugins: {
      legend: { position: "right", labels: { font: { size: 14 }, padding: 16, boxWidth: 14 } },
      title: { display: true, text: "Proporsi Omzet — Makanan vs Minuman vs Cemilan", font: { size: 14, weight: "bold" } },
      tooltip: { callbacks: { label: (ctx: { label: string; raw: number }) => `${ctx.label}: Rp ${ctx.raw.toLocaleString("id-ID")}` } },
    },
  }, 750, 380);

  const pieH = (CW * 380) / 750;
  if (curY + pieH > 270) { doc.addPage(); curY = 16; }
  doc.addImage(pieImg, "PNG", ML, curY, CW, pieH);
  curY += pieH + 10;

  // ── Page N: Product Ranking Table ───────────────────────────────────────────
  doc.addPage(); curY = 16;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(15, 23, 42);
  doc.text("5. Ranking Menu Terlaris", ML, curY);
  curY += 4;

  const sortedProdAll = Object.entries(productMap).sort(([, a], [, b]) => b.revenue - a.revenue);
  autoTable(doc, {
    startY: curY,
    head: [["Rank", "Nama Menu", "Qty Terjual", "Total Omzet (Rp)", "% Kontribusi", "Badge"]],
    body: sortedProdAll.map(([name, v], i) => [
      i + 1,
      name,
      `${v.qty} Porsi`,
      `Rp ${v.revenue.toLocaleString("id-ID")}`,
      `${totalRevenue > 0 ? ((v.revenue / totalRevenue) * 100).toFixed(1) : 0}%`,
      i < 3 ? "⭐ BEST SELLER" : "Regular",
    ]),
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 65 }, 2: { cellWidth: 22 }, 3: { cellWidth: 38 }, 4: { cellWidth: 25 }, 5: { cellWidth: 20 } },
    margin: { left: ML, right: ML },
  });

  // ── Audit Log ──────────────────────────────────────────────────────────────
  curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  if (curY > 220) { doc.addPage(); curY = 16; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(15, 23, 42);
  doc.text("6. Log Audit Transaksi Lengkap", ML, curY);
  curY += 4;

  autoTable(doc, {
    startY: curY,
    head: [["#", "Nota", "Tanggal & Waktu", "Customer", "Tipe", "Omzet", "HPP", "Laba Bersih"]],
    body: transactions.map((t, i) => [
      i + 1,
      t.orderNumber,
      new Date(t.createdAt as string).toLocaleString("id-ID"),
      t.customerName || "-",
      t.orderType.toUpperCase(),
      `Rp ${t.total.toLocaleString("id-ID")}`,
      `Rp ${t.hppTotal.toLocaleString("id-ID")}`,
      `Rp ${t.netProfit.toLocaleString("id-ID")}`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    styles: { font: "helvetica", fontSize: 7.5, cellPadding: 1.8 },
    margin: { left: ML, right: ML },
  });

  // ── Page numbers footer ────────────────────────────────────────────────────
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 285, PW, 12, "F");
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    doc.text(`Kedai Nyamleng POS  |  Laporan ${periodLabel}  |  Halaman ${i} dari ${pageCount}`, 105, 292, { align: "center" });
  }

  doc.save(`Laporan_Pro_Kedai_Nyamleng_${new Date().toISOString().slice(0, 10)}.pdf`);
}
