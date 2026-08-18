"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, CheckCircle } from "lucide-react";

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

  const handleCashShortcut = (amount: number) => {
    setCashReceived(amount);
    setCustomInput(amount ? amount.toLocaleString("id-ID") : "");
  };

  const handleInputChange = (val: string) => {
    const raw = val.replace(/\D/g, "");
    const num = Number(raw);
    setCustomInput(num ? num.toLocaleString("id-ID") : "");
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card text-card-foreground border-border rounded-3xl">
        {/* Header */}
        <DialogHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/20 text-primary-foreground">
              <DollarSign className="w-5 h-5" />
            </div>
            <DialogTitle className="font-bold text-base text-white">Pembayaran Tunai</DialogTitle>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Customer Name Input */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              Nama Pemesan / Pelanggan
            </label>
            <Input
              type="text"
              placeholder="misal: Mas Budi / Pelanggan 1"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-9 text-xs font-semibold bg-background border-input"
            />
          </div>
          {/* Total Tagihan Box */}
          <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20 text-center">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
              Total Tagihan
            </span>
            <span className="text-3xl font-black text-primary font-mono mt-1 block">
              Rp {total.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Cash Input */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              Nominal Tunai Diterima (Rp)
            </label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={customInput}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full text-center text-xl font-bold font-mono h-12 bg-background border-input"
            />
          </div>

          {/* Quick Shortcuts */}
          <div>
            <span className="block text-xs font-semibold text-muted-foreground mb-2">
              Nominal Cepat:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {shortcuts.map((sc, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant={cashReceived === sc.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCashShortcut(sc.value)}
                  className="h-9 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {sc.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Kembalian Box */}
          <div className="bg-muted/50 rounded-2xl p-3.5 border border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Kembalian:</span>
            <span
              className={`text-lg font-bold font-mono ${
                cashReceived >= total ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`}
            >
              Rp {change.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/30 border-t border-border flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-10 font-semibold cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={cashReceived < total || total === 0}
            onClick={onConfirmPayment}
            className="flex-1 h-10 font-bold gap-1.5 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Selesai & Cetak</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

