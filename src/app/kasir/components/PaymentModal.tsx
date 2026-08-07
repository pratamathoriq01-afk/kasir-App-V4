"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { X, DollarSign, CheckCircle } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onConfirmPayment,
}: PaymentModalProps) {
  const { getTotal, cashReceived, setCashReceived, getChange, customerName, setCustomerName } = useCartStore();

  const total = getTotal();
  const change = getChange();
  const [customInput, setCustomInput] = useState<string>(
    cashReceived ? String(cashReceived) : ""
  );

  if (!isOpen) return null;

  const handleCashShortcut = (amount: number) => {
    setCashReceived(amount);
    setCustomInput(String(amount));
  };

  const handleInputChange = (val: string) => {
    const num = Number(val.replace(/\D/g, ""));
    setCustomInput(val);
    setCashReceived(num);
  };

  const shortcuts = [
    { label: "Uang Pas", value: total },
    { label: "Rp 10.000", value: 10000 },
    { label: "Rp 20.000", value: 20000 },
    { label: "Rp 50.000", value: 50000 },
    { label: "Rp 100.000", value: 100000 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Pembayaran Tunai</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Customer Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Pemesan / Pelanggan
            </label>
            <input
              type="text"
              placeholder="misal: Mas Budi / Pelanggan 1"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>
          {/* Total Tagihan Box */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 text-center">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
              Total Tagihan
            </span>
            <span className="text-3xl font-black text-amber-600 font-mono mt-1 block">
              Rp {total.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Cash Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nominal Tunai Diterima (Rp)
            </label>
            <input
              type="number"
              placeholder="0"
              value={customInput}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full text-center text-xl font-bold font-mono py-2.5 px-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-900"
            />
          </div>

          {/* Quick Shortcuts */}
          <div>
            <span className="block text-xs font-semibold text-slate-500 mb-2">
              Nominal Cepat:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {shortcuts.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCashShortcut(sc.value)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                    cashReceived === sc.value
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kembalian Box */}
          <div className="bg-slate-100 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Kembalian:</span>
            <span
              className={`text-lg font-bold font-mono ${
                cashReceived >= total ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              Rp {change.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
          >
            Batal
          </button>
          <button
            disabled={cashReceived < total || total === 0}
            onClick={onConfirmPayment}
            className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Selesai & Cetak</span>
          </button>
        </div>
      </div>
    </div>
  );
}
