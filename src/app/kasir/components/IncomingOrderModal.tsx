"use client";

import { Transaction } from "@/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BellRing, Printer, Utensils } from "lucide-react";

interface IncomingOrderModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintAndProcess: (trx: Transaction) => void;
}

export default function IncomingOrderModal({
  transaction,
  isOpen,
  onClose,
  onPrintAndProcess,
}: IncomingOrderModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[92vw] sm:w-full p-0 overflow-hidden border-amber-500/40 shadow-2xl rounded-3xl bg-card">
        {/* Top Decorative Alert Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950 text-amber-400 rounded-2xl shadow-md animate-bounce">
              <BellRing className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="bg-slate-950/10 text-slate-950 border-slate-950/20 font-extrabold text-[10px] uppercase">
                  Menu Digital Realtime
                </Badge>
                <Badge className="bg-emerald-600 text-white font-black text-[10px]">
                  Pesanan Baru!
                </Badge>
              </div>
              <DialogTitle className="text-base sm:text-lg font-black text-slate-950 mt-1 tracking-tight">
                Order #{transaction.orderNumber}
              </DialogTitle>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Customer & Table Info Box */}
          <div className="bg-muted/60 p-3.5 rounded-2xl border border-border grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Nama Pemesan
              </span>
              <span className="font-extrabold text-foreground text-sm truncate block mt-0.5">
                {transaction.customerName || "Pelanggan"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Tipe / Meja
              </span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm block mt-0.5">
                {transaction.orderType === "dine-in"
                  ? `Dine-In (Meja ${transaction.tableNumber || "-"})`
                  : "Takeaway"}
              </span>
            </div>
          </div>

          {/* Purchased Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5" />
                Daftar Pesanan ({transaction.items?.length || 0} Menu):
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-border">
              {transaction.items?.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold text-[11px] flex items-center justify-center font-mono shrink-0">
                      {item.qty}x
                    </span>
                    <span className="font-bold text-foreground">{item.nameSnapshot}</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    Rp {(item.priceSnapshot * item.qty).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Total */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                Total Tagihan Digital
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Termasuk Pajak &amp; Diskon
              </span>
            </div>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
              Rp {transaction.total.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-2xl h-11 text-xs font-bold"
            >
              Nanti Dulu
            </Button>

            <Button
              onClick={() => onPrintAndProcess(transaction)}
              className="flex-2 rounded-2xl h-11 text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 gap-2"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Cetak Nota &amp; Proses</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
