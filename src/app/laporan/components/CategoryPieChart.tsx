"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Transaction } from "@/types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryPieChartProps {
  transactions: Transaction[];
}

export default function CategoryPieChart({ transactions }: CategoryPieChartProps) {
  let makananRev = 0;
  let minumanRev = 0;
  let cemilanRev = 0;

  transactions.forEach((t) => {
    const trxGross = t.items.reduce(
      (sum, i) => sum + i.qty * Number(i.priceSnapshot || 0),
      0
    );
    const discountAmount = Number(t.discountAmount || 0);
    const netRatio = trxGross > 0 ? Math.max(0, (trxGross - discountAmount) / trxGross) : 1;

    t.items.forEach((item) => {
      const itemCat = (item as any).category || (item as any).categorySnapshot;
      const grossRev = Number(item.priceSnapshot || 0) * item.qty;
      const rev = Math.round(grossRev * netRatio);
      const name = item.nameSnapshot.toLowerCase();

      if (itemCat === "Minuman" || itemCat === "Beverage" || itemCat === "Menu Minuman") {
        minumanRev += rev;
      } else if (itemCat === "Cemilan" || itemCat === "Snack" || itemCat === "Cemilan & Snack") {
        cemilanRev += rev;
      } else if (itemCat === "Makanan" || itemCat === "Food" || itemCat === "Menu Ayam Nyamleng" || itemCat === "Menu Ikan Nyamleng") {
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
          color: "#94a3b8",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            const pct = totalCatRev > 0 ? Math.round((val / totalCatRev) * 100) : 0;
            return ` ${context.label}: Rp ${val.toLocaleString("id-ID")} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-card p-4 rounded-2xl border border-border shadow-xs flex flex-col justify-between transition-colors">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
        <div>
          <h3 className="font-bold text-foreground text-sm">Proporsi Omzet Kategori</h3>
          <p className="text-xs text-muted-foreground">Distribusi pendapatan per jenis menu</p>
        </div>
      </div>

      <div className="relative h-[190px] w-full flex items-center justify-center my-2">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
            TOTAL OMZET
          </span>
          <span className="text-sm sm:text-base font-black text-foreground font-mono">
            Rp {totalCatRev.toLocaleString("id-ID")}
          </span>
        </div>
      </div>
    </div>
  );
}
