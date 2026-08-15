"use client";

import { useState, useEffect } from "react";
import { Voucher } from "@/types";
import { fetchActiveVouchersFromDB } from "@/lib/data-service";
import { Ticket, Sparkles, CheckCircle2, AlertCircle, X, ArrowRight } from "lucide-react";

interface VoucherPickerModalProps {
  isOpen: boolean;
  subtotal: number;
  onClose: () => void;
  onSelectVoucher: (voucher: Voucher, discountAmount: number) => void;
}

export default function VoucherPickerModal({
  isOpen,
  subtotal,
  onClose,
  onSelectVoucher,
}: VoucherPickerModalProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadActiveVouchers();
    }
  }, [isOpen]);

  const loadActiveVouchers = async () => {
    setLoading(true);
    try {
      const data = await fetchActiveVouchersFromDB();
      setVouchers(data);
    } catch (err) {
      console.error("Gagal memuat voucher:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (voucher: Voucher): number => {
    if (voucher.discountType === "percent") {
      let calc = Math.round((subtotal * voucher.discountValue) / 100);
      if (voucher.maxDiscount && calc > voucher.maxDiscount) {
        calc = voucher.maxDiscount;
      }
      return Math.min(calc, subtotal);
    }
    return Math.min(voucher.discountValue, subtotal);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 relative overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Decorative Top Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md shadow-amber-500/30">
              <Ticket className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300/60">
                  1-Click Select
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  Offline &amp; POS Kasir
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                Pilih Voucher Digital
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtotal Info Banner */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between shrink-0 text-xs">
          <div>
            <span className="text-slate-500 font-medium block">Subtotal Belanja Kasir:</span>
            <span className="text-sm font-black font-mono text-slate-900">
              Rp {subtotal.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-amber-700 font-bold bg-amber-100/80 px-2 py-1 rounded-lg border border-amber-300/60 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" /> Realtime DB Sync
            </span>
          </div>
        </div>

        {/* Vouchers List Container */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-xs font-bold">
              Memuat voucher dari database Supabase...
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <Ticket className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">Belum Ada Voucher Aktif</p>
              <p className="text-xs text-slate-400 mt-1">
                Buat voucher baru di menu kelola voucher digital terlebih dahulu.
              </p>
            </div>
          ) : (
            vouchers.map((v) => {
              const isEligible = subtotal >= v.minSubtotal && subtotal > 0;
              const discAmount = calculateDiscount(v);
              const shortfall = v.minSubtotal - subtotal;

              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${
                    isEligible
                      ? "bg-white border-amber-300 shadow-sm hover:shadow-md hover:border-amber-500"
                      : "bg-slate-50/80 border-slate-200 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-black text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                          {v.code}
                        </span>
                        {isEligible ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dapat Digunakan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/70 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> Min. Rp {v.minSubtotal.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{v.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{v.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Hemat
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-600">
                        Rp {discAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Action Button / Shortfall Warning */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    {!isEligible ? (
                      <span className="text-[11px] font-medium text-slate-400">
                        {subtotal === 0
                          ? "Tambahkan item ke keranjang dulu"
                          : `Kurang Rp ${shortfall.toLocaleString("id-ID")} lagi`}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700">
                        Siap dipasangkan ke pesanan ini
                      </span>
                    )}

                    <button
                      disabled={!isEligible}
                      onClick={() => {
                        onSelectVoucher(v, discAmount);
                        onClose();
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                        isEligible
                          ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <span>Pilih Voucher</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Close */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
