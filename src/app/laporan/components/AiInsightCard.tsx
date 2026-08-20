"use client";

import { Transaction } from "@/types";
import { Sparkles, TrendingUp, Lightbulb, Target } from "lucide-react";

interface AiInsightCardProps {
  transactions: Transaction[];
}

export default function AiInsightCard({ transactions }: AiInsightCardProps) {
  const totalTrx = transactions.length;
  const totalNetOmzet = transactions.reduce((acc, t) => acc + (t.total - (t.tax || 0)), 0);
  const totalLaba = transactions.reduce((acc, t) => acc + t.netProfit, 0);
  const avgBill = totalTrx > 0 ? Math.round(totalNetOmzet / totalTrx) : 0;

  const itemMap: Record<string, { qty: number; revenue: number }> = {};
  let dineInCount = 0;
  let takeawayCount = 0;

  transactions.forEach((t) => {
    if (t.orderType === "dine-in") dineInCount++;
    else takeawayCount++;

    t.items.forEach((i) => {
      if (!itemMap[i.nameSnapshot]) {
        itemMap[i.nameSnapshot] = { qty: 0, revenue: 0 };
      }
      itemMap[i.nameSnapshot].qty += i.qty;
      itemMap[i.nameSnapshot].revenue += i.qty * i.priceSnapshot;
    });
  });

  const sortedItems = Object.entries(itemMap).sort((a, b) => b[1].qty - a[1].qty);
  const topItem = sortedItems[0] ? sortedItems[0][0] : "Belum ada transaksi";
  const topItemQty = sortedItems[0] ? sortedItems[0][1].qty : 0;

  const popularType = dineInCount >= takeawayCount ? "Dine-In (Makan di Tempat)" : "Takeaway (Bungkus)";

  return (
    <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 text-white p-6 rounded-3xl shadow-xl border border-amber-400/30 relative overflow-hidden">
      <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-amber-200">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">AI Executive Summary & Insight</h3>
            <p className="text-xs text-amber-200">Analisis Otomatis Kedai Nyamleng Malang</p>
          </div>
        </div>
        <span className="bg-white/20 text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/30 backdrop-blur-xs">
          Real-time Engine
        </span>
      </div>

      <div className="bg-slate-950/30 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-3 text-xs leading-relaxed">
        <p className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <span>
            <strong>Performa Keuangan:</strong> Kedai Nyamleng mencatatkan total <strong>{totalTrx} transaksi</strong> dengan omzet netto sebesar <strong className="text-amber-300 font-mono">Rp {totalNetOmzet.toLocaleString("id-ID")}</strong> dan laba bersih sebesar <strong className="text-emerald-300 font-mono">Rp {totalLaba.toLocaleString("id-ID")}</strong>. Rata-rata pengeluaran per transaksi sebesar <strong>Rp {avgBill.toLocaleString("id-ID")}</strong>.
          </span>
        </p>

        <p className="flex items-start gap-2">
          <Target className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <span>
            <strong>Menu Paling Laris:</strong> Produk terfavorit pelanggan adalah <strong>"{topItem}"</strong> yang telah terjual sebanyak <strong>{topItemQty} porsi</strong>. Tipe pesanan paling banyak adalah <strong>{popularType}</strong>.
          </span>
        </p>

        <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-amber-100">
          <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Rekomendasi Strategis AI:</strong>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-100">
              <li>Buat <em>Paket Bundling Hemat</em> gabungan antara {topItem} dan Es Teh Manis Jumbo untuk menaikkan nilai rata-rata transaksi (Average Order Value).</li>
              <li>Pertahankan persediaan bahan baku untuk menu {topItem} agar tidak sampai habis pada jam sibuk.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
