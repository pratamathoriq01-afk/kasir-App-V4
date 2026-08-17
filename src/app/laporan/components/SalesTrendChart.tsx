"use client";

import { useRef } from "react";
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
import { TrendingUp, DollarSign } from "lucide-react";

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
  const chartRef = useRef<any>(null);

  const grouped: Record<string, { omzet: number; laba: number; count: number }> = {};

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sorted.forEach((t) => {
    const dateStr = new Date(t.createdAt).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
    if (!grouped[dateStr]) {
      grouped[dateStr] = { omzet: 0, laba: 0, count: 0 };
    }
    grouped[dateStr].omzet += t.total;
    grouped[dateStr].laba += t.netProfit;
    grouped[dateStr].count += 1;
  });

  const labels = Object.keys(grouped);
  const omzetData = Object.values(grouped).map((g) => g.omzet);
  const labaData = Object.values(grouped).map((g) => g.laba);

  const data = {
    labels: labels.length > 0 ? labels : ["Hari ini"],
    datasets: [
      {
        fill: true,
        label: "Total Omzet (Kotor)",
        data: omzetData.length > 0 ? omzetData : [0],
        borderColor: "#D97706", // Amber 600
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(217, 119, 6, 0.1)";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(217, 119, 6, 0.28)");
          gradient.addColorStop(1, "rgba(217, 119, 6, 0.0)");
          return gradient;
        },
        borderWidth: 3,
        tension: 0.38,
        pointRadius: 4,
        pointBackgroundColor: "#D97706",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: "#D97706",
        pointHoverBorderColor: "#FFFFFF",
        pointHoverBorderWidth: 3,
      },
      {
        fill: true,
        label: "Laba Bersih (Net Profit)",
        data: labaData.length > 0 ? labaData : [0],
        borderColor: "#059669", // Emerald 600
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(5, 150, 105, 0.1)";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(5, 150, 105, 0.28)");
          gradient.addColorStop(1, "rgba(5, 150, 105, 0.0)");
          return gradient;
        },
        borderWidth: 3,
        tension: 0.38,
        pointRadius: 4,
        pointBackgroundColor: "#059669",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: "#059669",
        pointHoverBorderColor: "#FFFFFF",
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 16,
          font: { family: "sans-serif", size: 11, weight: "bold" },
          color: "#334155",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 12,
        boxPadding: 6,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y || 0;
            return `  ${label}: Rp ${value.toLocaleString("id-ID")}`;
          },
          afterBody: function (items: any[]) {
            if (!items.length) return "";
            const idx = items[0].dataIndex;
            const omzet = omzetData[idx] || 0;
            const laba = labaData[idx] || 0;
            const marginPct = omzet > 0 ? ((laba / omzet) * 100).toFixed(1) : "0.0";
            return `-------------------------\n  Profit Margin (GPM): ${marginPct}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11, weight: "600" },
          color: "#64748B",
        },
      },
      y: {
        grid: {
          color: "rgba(226, 232, 240, 0.8)",
          drawBorder: false,
        },
        ticks: {
          font: { size: 10, weight: "600" },
          color: "#64748B",
          callback: function (val: string | number) {
            const num = Number(val);
            if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}M`;
            if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}rb`;
            return "Rp " + num.toLocaleString("id-ID");
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-88">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Grafik Tren Penjualan &amp; Margin Laba</h3>
            <p className="text-[11px] text-slate-500">
              Evaluasi performa omzet kotor vs laba bersih harian Kedai Nyamleng.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
          {labels.length} Hari Terdata
        </span>
      </div>

      <div className="flex-1 w-full relative">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}
