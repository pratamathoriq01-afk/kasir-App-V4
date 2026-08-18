"use client";

import React, { useState, useEffect } from "react";
import { Voucher } from "@/types";
import { fetchActiveVouchersFromDB } from "@/lib/data-service";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] p-6 bg-card text-card-foreground border-border flex flex-col">
        {/* Header */}
        <SheetHeader className="pb-3 border-b border-border text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary text-primary-foreground rounded-2xl shadow-md">
              <Ticket className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-extrabold uppercase tracking-wider text-primary border-primary/30 bg-primary/10">
                  1-Click Select
                </Badge>
                <span className="text-[10px] font-bold text-muted-foreground">
                  Offline &amp; POS Kasir
                </span>
              </div>
              <SheetTitle className="text-lg font-black text-foreground mt-0.5">
                Pilih Voucher Digital
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        {/* Subtotal Info Banner */}
        <div className="mt-3 p-3 bg-muted/50 border border-border rounded-2xl flex items-center justify-between shrink-0 text-xs">
          <div>
            <span className="text-muted-foreground font-medium block">Subtotal Belanja Kasir:</span>
            <span className="text-sm font-black font-mono text-foreground">
              Rp {subtotal.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> Realtime DB Sync
            </span>
          </div>
        </div>

        {/* Vouchers List Container */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-xs font-bold">
              Memuat voucher dari database Supabase...
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-2xl border border-border p-6">
              <Ticket className="w-10 h-10 stroke-1 mx-auto mb-2 text-muted-foreground/40" />
              <p className="font-bold text-foreground text-sm">Belum Ada Voucher Aktif</p>
              <p className="text-xs text-muted-foreground mt-1">
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
                      ? "bg-card border-primary/40 shadow-xs hover:border-primary"
                      : "bg-muted/30 border-border opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-black text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                          {v.code}
                        </span>
                        {isEligible ? (
                          <Badge variant="outline" className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Dapat Digunakan
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                            <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Min. Rp {v.minSubtotal.toLocaleString("id-ID")}
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-foreground text-xs sm:text-sm">{v.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{v.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">
                        Hemat
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                        Rp {discAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Action Button / Shortfall Warning */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2 text-xs">
                    {!isEligible ? (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {subtotal === 0
                          ? "Tambahkan item ke keranjang dulu"
                          : `Kurang Rp ${shortfall.toLocaleString("id-ID")} lagi`}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Siap dipasangkan ke pesanan ini
                      </span>
                    )}

                    <Button
                      disabled={!isEligible}
                      size="sm"
                      onClick={() => {
                        onSelectVoucher(v, discAmount);
                        onClose();
                      }}
                      className="h-8 font-extrabold text-xs gap-1.5 cursor-pointer"
                    >
                      <span>Pilih Voucher</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Close */}
        <div className="pt-3 border-t border-border flex justify-end shrink-0">
          <Button variant="outline" onClick={onClose} className="h-9 px-5 font-bold text-xs cursor-pointer">
            Tutup
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

