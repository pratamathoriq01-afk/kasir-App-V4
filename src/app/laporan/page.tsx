"use client";

import { useState, useEffect } from "react";
import { Transaction } from "@/types";
import { fetchTransactionsFromDB, saveTransactions } from "@/lib/data-service";
import { exportTransactionsToPDF } from "@/lib/export/pdf-export";
import StatsCards from "./components/StatsCards";
import SalesTrendChart from "./components/SalesTrendChart";
import CategoryPieChart from "./components/CategoryPieChart";
import TopMenuBarChart from "./components/TopMenuBarChart";
import AiInsightCard from "./components/AiInsightCard";
import MenuPerformanceTable from "./components/MenuPerformanceTable";
import HistoryTable from "./components/HistoryTable";
import { FileText, RotateCcw, Calendar, Loader2, Sparkles, Sheet } from "lucide-react";

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [periodFilter, setPeriodFilter] = useState<"today" | "7days" | "month" | "all">("all");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      await exportTransactionsToPDF(filteredTransactions, getPeriodLabel());
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Gagal mengunduh PDF: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExportingPdf(false);
    }
  };



  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const now = new Date();
      let from: string | undefined;
      if (periodFilter === "today") {
        from = now.toISOString().split("T")[0];
      } else if (periodFilter === "7days") {
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      } else if (periodFilter === "month") {
        from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      }
      const to = now.toISOString().split("T")[0];

      const url = from
        ? `/api/export/excel?from=${from}&to=${to}`
        : `/api/export/excel`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Laporan_Kedai_Nyamleng_${now.toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Gagal mengunduh Excel: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExportingExcel(false);
    }
  };

  useEffect(() => {
    const loadData = () => {
      fetchTransactionsFromDB().then((trxs) => setTransactions(trxs));
    };
    loadData();
    const interval = setInterval(loadData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const trxDate = new Date(t.createdAt);
    const now = new Date();

    if (periodFilter === "today") {
      return (
        trxDate.getDate() === now.getDate() &&
        trxDate.getMonth() === now.getMonth() &&
        trxDate.getFullYear() === now.getFullYear()
      );
    }
    if (periodFilter === "7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return trxDate >= sevenDaysAgo;
    }
    if (periodFilter === "month") {
      return (
        trxDate.getMonth() === now.getMonth() &&
        trxDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  const handleDeleteTransaction = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveTransactions(updated);
  };

  const handleResetHistory = () => {
    if (!confirm("PERINGATAN: Semua riwayat transaksi akan dihapus! Lanjutkan?")) return;
    setTransactions([]);
    saveTransactions([]);
  };

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalHpp = filteredTransactions.reduce((sum, t) => sum + t.hppTotal, 0);
  const totalNetProfit = filteredTransactions.reduce((sum, t) => sum + t.netProfit, 0);
  const totalTax = filteredTransactions.reduce((sum, t) => sum + t.tax, 0);

  const getPeriodLabel = () => {
    if (periodFilter === "today") return "Hari Ini";
    if (periodFilter === "7days") return "7 Hari Terakhir";
    if (periodFilter === "month") return "Bulan Ini";
    return "Semua Periode";
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>Dashboard Laporan &amp; Analytics Eksekutif</span>
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan omzet, laba bersih SAK EMKM, grafik tren harian, 5 menu terlaris, dan integrasi Google Sheets.
          </p>
        </div>

        {/* Action Buttons: Export PDF, Direct Google Sheets API, Seed Demo Data, Reset */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              const demo = [
                {
                  id: `trx-demo-1`,
                  orderNumber: "ORD-101",
                  customerName: "Budi Santoso",
                  orderType: "dine-in" as const,
                  tableNumber: "02",
                  subtotal: 45000,
                  discountType: null,
                  discountValue: 0,
                  discountAmount: 0,
                  tax: 4500,
                  total: 49500,
                  hppTotal: 22000,
                  netProfit: 23000,
                  cashReceived: 50000,
                  change: 500,
                  createdAt: new Date().toISOString(),
                  items: [
                    { id: "i1", menuItemId: "m1", nameSnapshot: "Nasi Goreng Nyamleng", priceSnapshot: 25000, hppSnapshot: 12000, qty: 1 },
                    { id: "i2", menuItemId: "m4", nameSnapshot: "Es Teh Manis Jumbo", priceSnapshot: 10000, hppSnapshot: 4000, qty: 2 }
                  ]
                },
                {
                  id: `trx-demo-2`,
                  orderNumber: "ORD-102",
                  customerName: "Siti Rahma",
                  orderType: "takeaway" as const,
                  tableNumber: "-",
                  subtotal: 60000,
                  discountType: "percent" as const,
                  discountValue: 10,
                  discountAmount: 6000,
                  tax: 5400,
                  total: 59400,
                  hppTotal: 28000,
                  netProfit: 26000,
                  cashReceived: 100000,
                  change: 40600,
                  createdAt: new Date(Date.now() - 3600000).toISOString(),
                  items: [
                    { id: "i3", menuItemId: "m3", nameSnapshot: "Ayam Geprek Sambal Korek", priceSnapshot: 28000, hppSnapshot: 14000, qty: 2 },
                    { id: "i4", menuItemId: "m6", nameSnapshot: "Kopi Tubruk Malang", priceSnapshot: 12000, hppSnapshot: 5000, qty: 1 }
                  ]
                }
              ];
              const updated = [...transactions, ...demo];
              setTransactions(updated);
              saveTransactions(updated);
            }}
            className="py-2 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span className="truncate">Data Demo</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="py-2 px-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span className="truncate">{isExportingPdf ? "Mengunduh..." : "Export PDF"}</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="py-2 px-3 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sheet className="w-3.5 h-3.5" />
            )}
            <span className="truncate">{isExportingExcel ? "Membuat..." : "Export Excel 📊"}</span>
          </button>



          <button
            onClick={handleResetHistory}
            className="py-2 px-2.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="truncate">Reset Data</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Calendar className="w-4 h-4 text-amber-500" />
          <span>Periode Laporan:</span>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { key: "today", label: "Hari Ini" },
            { key: "7days", label: "7 Hari Terakhir" },
            { key: "month", label: "Bulan Ini" },
            { key: "all", label: "Semua Periode" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodFilter(p.key as typeof periodFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                periodFilter === p.key
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Financial Stat Cards */}
      <StatsCards
        totalRevenue={totalRevenue}
        totalHpp={totalHpp}
        netProfit={totalNetProfit}
        totalTax={totalTax}
      />

      {/* AI Narrative Insight Card */}
      <AiInsightCard transactions={filteredTransactions} />

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SalesTrendChart transactions={filteredTransactions} />
        </div>
        <div className="lg:col-span-1">
          <CategoryPieChart transactions={filteredTransactions} />
        </div>
      </div>

      {/* Best Seller Top 5 Menu Chart & Performance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <TopMenuBarChart transactions={filteredTransactions} />
        </div>
        <div className="lg:col-span-2">
          <MenuPerformanceTable transactions={filteredTransactions} />
        </div>
      </div>

      {/* Full Transaction History Table */}
      <HistoryTable
        transactions={filteredTransactions}
        onDeleteTransaction={handleDeleteTransaction}
      />
    </div>
  );
}
