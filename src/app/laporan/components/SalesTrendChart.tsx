"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Transaction } from "@/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesTrendChartProps {
  transactions: Transaction[];
}

export default function SalesTrendChart({ transactions }: SalesTrendChartProps) {
  const grouped: Record<string, { omzet: number; laba: number }> = {};

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sorted.forEach((t) => {
    const dateStr = new Date(t.createdAt).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
    if (!grouped[dateStr]) {
      grouped[dateStr] = { omzet: 0, laba: 0 };
    }
    grouped[dateStr].omzet += t.total;
    grouped[dateStr].laba += t.netProfit;
  });

  const labels = Object.keys(grouped);
  const omzetData = Object.values(grouped).map((g) => g.omzet);
  const labaData = Object.values(grouped).map((g) => g.laba);

  const data = {
    labels: labels.length > 0 ? labels : ["Hari ini"],
    datasets: [
      {
        fill: true,
        label: "Omzet (Rp)",
        data: omzetData.length > 0 ? omzetData : [0],
        borderColor: "rgb(217, 119, 6)",
        backgroundColor: "rgba(217, 119, 6, 0.1)",
        tension: 0.35,
        pointRadius: 4,
      },
      {
        fill: true,
        label: "Laba Bersih (Rp)",
        data: labaData.length > 0 ? labaData : [0],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.35,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { family: "sans-serif", size: 11 },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function (val: string | number) {
            return "Rp " + Number(val).toLocaleString("id-ID");
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 text-sm">Grafik Tren Penjualan & Laba</h3>
        <span className="text-xs text-slate-400 font-medium">Harian</span>
      </div>
      <div className="flex-1 w-full relative">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
