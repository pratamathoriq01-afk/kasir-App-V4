"use client";

import { useState, useEffect } from "react";
import { Voucher } from "@/types";
import { Ticket, Plus, Trash2, CheckCircle2, XCircle, X, Sparkles } from "lucide-react";

interface VoucherManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoucherManagementModal({
  isOpen,
  onClose,
}: VoucherManagementModalProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState(10);
  const [minSubtotal, setMinSubtotal] = useState(25000);
  const [validUntil, setValidUntil] = useState("2026-12-31");

  useEffect(() => {
    if (isOpen) {
      loadVouchers();
    }
  }, [isOpen]);

  const loadVouchers = async () => {
    try {
      const res = await fetch("/api/vouchers");
      if (res.ok) {
        const data = await res.json();
        setVouchers(data);
      }
    } catch (err) {
      console.error("Gagal memuat voucher:", err);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !title) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          title,
          description,
          discountType,
          discountValue: Number(discountValue),
          minSubtotal: Number(minSubtotal),
          validUntil,
          isActive: true,
        }),
      });

      if (res.ok) {
        setCode("");
        setTitle("");
        setDescription("");
        setIsAdding(false);
        await loadVouchers();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal membuat voucher.");
      }
    } catch (err) {
      console.error("Error create voucher:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (voucher: Voucher) => {
    try {
      const res = await fetch("/api/vouchers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: voucher.id,
          isActive: !voucher.isActive,
        }),
      });
      if (res.ok) {
        await loadVouchers();
      }
    } catch (err) {
      console.error("Error update status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus voucher ini secara permanen dari Supabase?")) return;
    try {
      const res = await fetch(`/api/vouchers?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadVouchers();
      }
    } catch (err) {
      console.error("Error delete voucher:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-sm">
              <Ticket className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manajemen Voucher Digital</h2>
              <p className="text-xs text-slate-500">
                Kelola kode promo &amp; voucher diskon yang dapat di-claim pembeli.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 font-mono">
              Total {vouchers.length} Voucher Terdaftar
            </span>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="py-2 px-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? "Batal" : "Buat Voucher Baru"}</span>
            </button>
          </div>

          {/* Form Create Voucher */}
          {isAdding && (
            <form
              onSubmit={handleCreateVoucher}
              className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3 animate-in slide-in-from-top duration-200"
            >
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Form Buat Voucher Digital Baru</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Voucher (Unik)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: HEMAT10K"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl uppercase font-mono font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Judul Voucher Promo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Promo Diskon 10%"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Deskripsi Ringkas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Potongan 10% minimal belanja Rp 25.000"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Diskon</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                  >
                    <option value="percent">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nilai Diskon ({discountType === "percent" ? "%" : "Rp"})
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Minimal Subtotal Belanja (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minSubtotal}
                    onChange={(e) => setMinSubtotal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Berlaku Sampai</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs shadow-md shadow-amber-500/20"
                >
                  {loading ? "Menyimpan..." : "Simpan Voucher"}
                </button>
              </div>
            </form>
          )}

          {/* Vouchers List Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  v.isActive
                    ? "bg-white border-slate-200 shadow-xs hover:border-amber-400"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-black text-sm text-slate-900 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-300/60">
                      {v.code}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(v)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {v.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{v.isActive ? "Aktif" : "Nonaktif"}</span>
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs">{v.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{v.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nilai Diskon:</span>
                    <span className="font-mono font-black text-emerald-600">
                      {v.discountType === "percent"
                        ? `${v.discountValue}%`
                        : `Rp ${v.discountValue.toLocaleString("id-ID")}`}
                    </span>
                  </div>

                  <div className="text-right">
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Voucher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
