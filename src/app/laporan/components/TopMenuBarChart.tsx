"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Transaction } from "@/types";
import { Award, Flame } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TopMenuBarChartProps {
  transactions: Transaction[];
}

export default function TopMenuBarChart({ transactions }: TopMenuBarChartProps) {
  const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};

  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const key = item.nameSnapshot;
      if (!itemMap[key]) {
        itemMap[key] = { name: key, qty: 0, revenue: 0 };
      }
      itemMap[key].qty += item.qty;
      itemMap[key].revenue += item.qty * item.priceSnapshot;
    });
  });

  const sortedItems = Object.values(itemMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const labels = sortedItems.map((i) => i.name);
  const qtyData = sortedItems.map((i) => i.qty);
  const revData = sortedItems.map((i) => i.revenue);

  const data = {
    labels: labels.length > 0 ? labels : ["Belum ada transaksi"],
    datasets: [
      {
        label: "Porsi Terjual (Qty)",
        data: qtyData.length > 0 ? qtyData : [0],
        backgroundColor: "rgba(217, 119, 6, 0.85)", // Amber 600
        borderColor: "#D97706",
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options: any = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: function (context: any) {
            const idx = context.dataIndex;
            const item = sortedItems[idx];
            if (!item) return "";
            return [
              `  Terjual: ${item.qty} porsi`,
              `  Total Omzet: Rp ${item.revenue.toLocaleString("id-ID")}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(226, 232, 240, 0.6)" },
        ticks: { font: { size: 10, weight: "bold" }, color: "#64748B" },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: "bold" }, color: "#1E293B" },
      },
    },
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-88">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-xs">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Top 5 Menu Terlaris (Best Seller)</h3>
            <p className="text-[11px] text-slate-500">Paling banyak dipesan oleh pelanggan.</p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
          RANKING #1-#5
        </span>
      </div>

      <div className="flex-1 w-full relative">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
