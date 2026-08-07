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
    t.items.forEach((item) => {
      const name = item.nameSnapshot.toLowerCase();
      if (
        name.includes("es ") ||
        name.includes("kopi") ||
        name.includes("teh") ||
        name.includes("jeruk") ||
        name.includes("minuman")
      ) {
        minumanRev += item.priceSnapshot * item.qty;
      } else if (
        name.includes("tahu") ||
        name.includes("pisang") ||
        name.includes("cemilan") ||
        name.includes("snack")
      ) {
        cemilanRev += item.priceSnapshot * item.qty;
      } else {
        makananRev += item.priceSnapshot * item.qty;
      }
    });
  });

  const data = {
    labels: ["Makanan", "Minuman", "Cemilan"],
    datasets: [
      {
        data: [makananRev || 1, minumanRev || 1, cemilanRev || 1],
        backgroundColor: [
          "rgba(217, 119, 6, 0.85)",
          "rgba(59, 130, 246, 0.85)",
          "rgba(16, 185, 129, 0.85)",
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: { family: "sans-serif", size: 11 },
        },
      },
    },
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 text-sm">Proporsi Omzet Kategori</h3>
        <span className="text-xs text-slate-400 font-medium">Persentase</span>
      </div>
      <div className="flex-1 w-full relative flex items-center justify-center">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}
