import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { Voucher } from "@/types";
import VoucherPickerModal from "./VoucherPickerModal";
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header Cart */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base">Keranjang Pesanan</h2>
            <span className="text-xs text-slate-500">{items.length} jenis menu</span>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* Customer & Order Type Selector */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-2 text-xs">
        {/* Customer Name */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Nama Pemesan
          </label>
          <input
            type="text"
            placeholder="misal: Pelanggan 1"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-medium"
          />
        </div>

        {/* Order Type Buttons */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Tipe Pesanan
          </label>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setOrderType("dine-in")}
              className={`py-1 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                orderType === "dine-in"
                  ? "bg-amber-500 text-slate-950 font-extrabold shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              <Utensils className="w-3 h-3" />
              <span>Dine-In</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderType("takeaway")}
              className={`py-1 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                orderType === "takeaway"
                  ? "bg-amber-500 text-slate-950 font-extrabold shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Bungkus</span>
            </button>
          </div>
        </div>

        {/* Table Number (If Dine-In) */}
        {orderType === "dine-in" && (
          <div className="col-span-2 mt-1 flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
              No. Meja:
            </label>
            <input
              type="text"
              placeholder="01"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* Cart Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <ShoppingCart className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-400 mt-1">
              Klik menu di sebelah kiri untuk menambah pesanan
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.menuItem.id}
              className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {item.menuItem.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.menuItem.imageUrl}
                    alt={item.menuItem.name}
                    className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
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
                  <h4 className="font-semibold text-slate-800 text-xs truncate">
                    {item.menuItem.name}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Rp {item.menuItem.price.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => updateQty(item.menuItem.id, item.qty - 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-slate-100 text-slate-700 transition-colors active:scale-95 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 sm:w-8 text-center text-xs font-bold text-slate-800 font-mono">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.menuItem.id, item.qty + 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-slate-100 text-slate-700 transition-colors active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.menuItem.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors active:scale-90 cursor-pointer"
                  title="Hapus menu dari keranjang"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Digital Voucher Claim Section */}
      <div className="p-3 bg-amber-50/70 border-t border-amber-200/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
            <Ticket className="w-3.5 h-3.5 text-amber-600" /> Voucher Digital
          </span>
          
          <div className="flex items-center gap-2">
            {!appliedVoucher && (
              <button
                type="button"
                onClick={() => setIsVoucherPickerOpen(true)}
                className="text-[11px] text-amber-800 hover:text-amber-950 bg-amber-200/60 hover:bg-amber-300/80 px-2 py-0.5 rounded-lg font-extrabold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-700" /> Pilih Voucher (1-Click)
              </button>
            )}
            {appliedVoucher && (
              <button
                onClick={handleRemoveVoucher}
                className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <X className="w-3 h-3" /> Lepas Voucher
              </button>
            )}
          </div>
        </div>

        {appliedVoucher ? (
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-500 text-white rounded-lg">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="font-mono font-bold text-xs text-emerald-900 block">
                  {appliedVoucher.code}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">
                  {appliedVoucher.title}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-extrabold text-emerald-700">
              -Rp {discountAmount.toLocaleString("id-ID")}
            </span>
          </div>
        ) : (
          <form onSubmit={handleClaimVoucher} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Atau ketik kode voucher..."
              value={voucherCodeInput}
              onChange={(e) => setVoucherCodeInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs uppercase font-mono font-bold placeholder:normal-case placeholder:font-sans placeholder:font-normal outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              type="submit"
              disabled={claiming || !voucherCodeInput.trim()}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              {claiming ? "Klaim..." : "Klaim"}
            </button>
          </form>
        )}

        {voucherError && (
          <p className="text-[11px] font-medium text-rose-600 animate-in fade-in">
            ⚠️ {voucherError}
          </p>
        )}
        {voucherSuccess && (
          <p className="text-[11px] font-medium text-emerald-700 animate-in fade-in">
            🎉 {voucherSuccess}
          </p>
        )}
      </div>

      {/* Cart Footer Calculations & Payment Action */}
      <div className="p-4 bg-slate-900 text-white border-t border-slate-800 space-y-3">
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
              className="bg-slate-800 border border-slate-700 text-amber-400 text-xs rounded-md px-1.5 py-0.5 outline-none"
            >
              <option value="">Tidak ada</option>
              <option value="percent">% Persen</option>
              <option value="fixed">Rp Nominal</option>
            </select>
            {discountType && (
              <input
                type="number"
                placeholder="0"
                value={discountValue || ""}
                onChange={(e) => setDiscount(discountType, Number(e.target.value))}
                className="w-16 bg-slate-800 border border-slate-700 text-white text-xs rounded-md px-2 py-0.5 outline-none font-mono text-center"
              />
            )}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-1 text-xs border-t border-slate-800/80 pt-2 text-slate-300">
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

          <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
            <span>Total Tagihan</span>
            <span className="font-mono text-amber-400">
              Rp {total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Submit Payment Button */}
        <button
          disabled={items.length === 0}
          onClick={onOpenPaymentModal}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Bayar Sekarang</span>
          <span className="font-mono bg-slate-950/20 px-2 py-0.5 rounded-md text-xs">
            Rp {total.toLocaleString("id-ID")}
          </span>
        </button>
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
