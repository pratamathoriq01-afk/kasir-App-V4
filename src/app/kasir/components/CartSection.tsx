"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { Voucher } from "@/types";
import VoucherPickerModal from "./VoucherPickerModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingCart, Tag, Utensils, ShoppingBag, Ticket, Check, X, Sparkles } from "lucide-react";

interface CartSectionProps {
  onOpenPaymentModal: () => void;
}

export default function CartSection({ onOpenPaymentModal }: CartSectionProps) {
  const {
    items,
    customerName,
    orderType,
    tableNumber,
    discountType,
    discountValue,
    appliedVoucher,
    setCustomerName,
    setOrderType,
    setTableNumber,
    setDiscount,
    setVoucher,
    updateQty,
    removeItem,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
  } = useCartStore();

  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [isVoucherPickerOpen, setIsVoucherPickerOpen] = useState(false);

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const taxAmount = getTaxAmount();
  const total = getTotal();

  const handleClaimVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError("");
    setVoucherSuccess("");

    if (!voucherCodeInput.trim()) return;

    setClaiming(true);
    try {
      const res = await fetch("/api/vouchers/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voucherCodeInput.trim(),
          subtotal,
        }),
      });

      const data = await res.json();
      if (data.valid && data.voucher) {
        setVoucher(data.voucher, data.discountAmount);
        setVoucherSuccess(data.message);
        setVoucherCodeInput("");
      } else {
        setVoucherError(data.message || "Voucher tidak valid.");
      }
    } catch (err) {
      setVoucherError("Gagal memproses klaim voucher.");
    } finally {
      setClaiming(false);
    }
  };

  const handleSelectVoucherFromPicker = (voucher: Voucher, calculatedDiscountAmount: number) => {
    setVoucher(voucher, calculatedDiscountAmount);
    setVoucherSuccess(`Voucher ${voucher.code} berhasil digunakan!`);
    setVoucherError("");
  };

  const handleRemoveVoucher = () => {
    setVoucher(null);
    setVoucherSuccess("");
    setVoucherError("");
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs flex flex-col h-full overflow-hidden transition-colors">
      {/* Header Cart */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base">Keranjang Pesanan</h2>
            <span className="text-xs text-muted-foreground">{items.length} jenis menu</span>
          </div>
        </div>

        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2 gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </Button>
        )}
      </div>

      {/* Customer & Order Type Selector */}
      <div className="p-3.5 bg-muted/20 border-b border-border grid grid-cols-2 gap-2 text-xs">
        {/* Customer Name */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            Nama Pemesan
          </label>
          <Input
            type="text"
            placeholder="misal: Pelanggan 1"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="h-8 text-xs font-medium bg-background border-input rounded-lg"
          />
        </div>

        {/* Order Type Buttons */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            Tipe Pesanan
          </label>
          <div className="grid grid-cols-2 gap-1">
            <Button
              type="button"
              variant={orderType === "dine-in" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrderType("dine-in")}
              className="h-8 text-[11px] font-semibold gap-1 rounded-lg cursor-pointer"
            >
              <Utensils className="w-3 h-3" />
              <span>Dine-In</span>
            </Button>

            <Button
              type="button"
              variant={orderType === "takeaway" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrderType("takeaway")}
              className="h-8 text-[11px] font-semibold gap-1 rounded-lg cursor-pointer"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Bungkus</span>
            </Button>
          </div>
        </div>

        {/* Table Number (If Dine-In) */}
        {orderType === "dine-in" && (
          <div className="col-span-2 mt-1 flex items-center gap-2">
            <label className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
              No. Meja:
            </label>
            <Input
              type="text"
              placeholder="01"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-20 h-7 text-center font-bold text-xs bg-background border-input rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Cart Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
            <ShoppingCart className="w-12 h-12 stroke-1 mb-2 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">Keranjang Masih Kosong</p>
            <p className="text-xs text-muted-foreground mt-1">
              Klik menu di sebelah kiri untuk menambah pesanan
            </p>
          </div>
        ) : (
          items.map((item) => {
            const lineId = item.id || item.menuItem.id;
            const addOnsExtra = (item.selectedAddOns || []).reduce((s, a) => s + (a.price || 0), 0);
            const unitPrice = Number(item.menuItem.price) + addOnsExtra;

            return (
              <div
                key={lineId}
                className="bg-muted/40 p-2.5 rounded-xl border border-border flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {item.menuItem.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.menuItem.imageUrl}
                      alt={item.menuItem.name}
                      className="w-9 h-9 rounded-lg object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <span className="text-xl shrink-0">
                      {item.menuItem.category === "Makanan"
                        ? "🍽️"
                        : item.menuItem.category === "Minuman"
                        ? "🥤"
                        : "🍟"}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-semibold text-foreground text-xs truncate">
                      {item.menuItem.name}
                    </h4>

                    {/* Add-On Chips Display */}
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.selectedAddOns.map((addon) => (
                          <span
                            key={addon.id}
                            className="text-[9.5px] bg-primary/15 text-primary font-extrabold px-1.5 py-0.2 rounded-md"
                          >
                            + {addon.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="text-[11px] text-muted-foreground font-mono">
                      Rp {unitPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateQty(lineId, item.qty - 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-muted text-foreground transition-colors active:scale-95 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-foreground font-mono">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(lineId, item.qty + 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-muted text-foreground transition-colors active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeItem(lineId)}
                    className="text-muted-foreground hover:text-destructive cursor-pointer"
                    title="Hapus menu dari keranjang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Digital Voucher Claim Section */}
      <div className="p-3 bg-accent/10 border-t border-accent/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-accent-foreground uppercase tracking-wider flex items-center gap-1">
            <Ticket className="w-3.5 h-3.5 text-accent-foreground" /> Voucher Digital
          </span>
          
          <div className="flex items-center gap-2">
            {!appliedVoucher && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsVoucherPickerOpen(true)}
                className="text-[11px] font-extrabold gap-1 cursor-pointer border-accent/30 text-accent-foreground hover:bg-accent/20"
              >
                <Sparkles className="w-3 h-3 text-amber-500" /> Pilih Voucher (1-Click)
              </Button>
            )}
            {appliedVoucher && (
              <button
                onClick={handleRemoveVoucher}
                className="text-[10px] text-destructive hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <X className="w-3 h-3" /> Lepas Voucher
              </button>
            )}
          </div>
        </div>

        {appliedVoucher ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-600 text-white rounded-lg">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="font-mono font-bold text-xs text-foreground block">
                  {appliedVoucher.code}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {appliedVoucher.title}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              -Rp {discountAmount.toLocaleString("id-ID")}
            </span>
          </div>
        ) : (
          <form onSubmit={handleClaimVoucher} className="flex gap-1.5">
            <Input
              type="text"
              placeholder="Atau ketik kode voucher..."
              value={voucherCodeInput}
              onChange={(e) => setVoucherCodeInput(e.target.value)}
              className="flex-1 h-8 text-xs uppercase font-mono font-bold bg-background border-input"
            />
            <Button
              type="submit"
              size="sm"
              disabled={claiming || !voucherCodeInput.trim()}
              className="h-8 text-xs font-extrabold cursor-pointer"
            >
              {claiming ? "Klaim..." : "Klaim"}
            </Button>
          </form>
        )}

        {voucherError && (
          <p className="text-[11px] font-medium text-destructive animate-in fade-in">
            ⚠️ {voucherError}
          </p>
        )}
        {voucherSuccess && (
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            🎉 {voucherSuccess}
          </p>
        )}
      </div>

      {/* Cart Footer Calculations & Payment Action */}
      <div className="p-4 bg-slate-900 dark:bg-card text-white border-t border-border space-y-3">
        {/* Manual Discount Row */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-amber-400" /> Diskon Manual
          </span>
          <div className="flex items-center gap-1.5">
            <select
              value={discountType || ""}
              onChange={(e) => {
                const val = e.target.value as "percent" | "fixed" | "";
                setDiscount(val || null, discountValue);
              }}
              className="bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 text-amber-400 text-xs rounded-md px-1.5 py-0.5 outline-none"
            >
              <option value="">Tidak ada</option>
              <option value="percent">% Persen</option>
              <option value="fixed">Rp Nominal</option>
            </select>
            {discountType && (
              <Input
                type="number"
                placeholder="0"
                value={discountValue || ""}
                onChange={(e) => setDiscount(discountType, Number(e.target.value))}
                className="w-16 h-7 bg-slate-800 dark:bg-slate-900 border-slate-700 dark:border-slate-800 text-white text-xs rounded-md px-2 py-0.5 font-mono text-center"
              />
            )}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-1 text-xs border-t border-slate-800 dark:border-border pt-2 text-slate-300 dark:text-muted-foreground">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono">Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-amber-400 font-medium">
              <span>Diskon ({appliedVoucher ? `Voucher ${appliedVoucher.code}` : "Manual"})</span>
              <span className="font-mono">- Rp {discountAmount.toLocaleString("id-ID")}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Pajak Resto (10%)</span>
            <span className="font-mono">Rp {taxAmount.toLocaleString("id-ID")}</span>
          </div>

          <Separator className="my-1 bg-slate-800 dark:bg-border" />

          <div className="flex justify-between text-base font-bold text-white dark:text-foreground pt-1">
            <span>Total Tagihan</span>
            <span className="font-mono text-amber-400 dark:text-primary">
              Rp {total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Submit Payment Button */}
        <Button
          disabled={items.length === 0}
          onClick={onOpenPaymentModal}
          className="w-full py-3 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-sm transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Bayar Sekarang</span>
          <span className="font-mono bg-black/20 dark:bg-white/20 px-2 py-0.5 rounded-md text-xs">
            Rp {total.toLocaleString("id-ID")}
          </span>
        </Button>
      </div>

      {/* 1-Click Voucher Picker Modal */}
      <VoucherPickerModal
        isOpen={isVoucherPickerOpen}
        subtotal={subtotal}
        onClose={() => setIsVoucherPickerOpen(false)}
        onSelectVoucher={handleSelectVoucherFromPicker}
      />
    </div>
  );
}


