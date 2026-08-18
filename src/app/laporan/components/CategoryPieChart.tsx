"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Transaction } from "@/types";
import { PieChart } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryPieChartProps {
  transactions: Transaction[];
}

export default function CategoryPieChart({ transactions }: CategoryPieChartProps) {
  let makananRev = 0;
  let minumanRev = 0;
  let cemilanRev = 0;

  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const itemCat = (item as any).category || (item as any).categorySnapshot;
      const rev = item.priceSnapshot * item.qty;
      const name = item.nameSnapshot.toLowerCase();

      if (itemCat === "Minuman" || itemCat === "Beverage") {
        minumanRev += rev;
      } else if (itemCat === "Cemilan" || itemCat === "Snack") {
        cemilanRev += rev;
      } else if (itemCat === "Makanan" || itemCat === "Food") {
        makananRev += rev;
      } else if (
        name.includes("es ") ||
        name.includes("kopi") ||
        name.includes("teh") ||
        name.includes("jeruk") ||
        name.includes("minuman") ||
        name.includes("susu") ||
        name.includes("jus")
      ) {
        minumanRev += rev;
      } else if (
        name.includes("tahu") ||
        name.includes("pisang") ||
        name.includes("cemilan") ||
        name.includes("snack") ||
        name.includes("kentang") ||
        name.includes("cireng")
      ) {
        cemilanRev += rev;
      } else {
        makananRev += rev;
      }
    });
  });

  const totalCatRev = makananRev + minumanRev + cemilanRev;

  const data = {
    labels: ["Makanan Utama", "Minuman Segar", "Cemilan & Snack"],
    datasets: [
      {
        data: [makananRev, minumanRev, cemilanRev],
        backgroundColor: [
          "#D97706", // Amber 600
          "#0284C7", // Sky 600
          "#059669", // Emerald 600
        ],
        hoverBackgroundColor: [
          "#B45309",
          "#0369A1",
          "#047857",
        ],
        borderWidth: 3,
        borderColor: "#FFFFFF",
        hoverOffset: 6,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 14,
          font: { family: "sans-serif", size: 10, weight: "bold" },
          color: "#334155",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: function (context: any) {
            const val = context.parsed || 0;
            const pct = totalCatRev > 0 ? ((val / totalCatRev) * 100).toFixed(1) : "0.0";
            return `  ${context.label}: Rp ${val.toLocaleString("id-ID")} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-card p-5 rounded-3xl border border-border shadow-xs flex flex-col h-88 transition-colors">
      <div className="flex items-center justify-between mb-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-400 rounded-xl">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Proporsi Omzet Kategori</h3>
            <p className="text-[11px] text-muted-foreground">Distribusi pendapatan per jenis menu.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center">
        <Doughnut data={data} options={options} />
        {/* Center Total Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
          <span className="text-[10px] uppercase font-extrabold text-muted-foreground">Total Omzet</span>
          <span className="text-xs font-black text-foreground font-mono">
            Rp {(totalCatRev / 1000).toFixed(0)}rb
          </span>
        </div>
      </div>
    </div>
  );
}

