"use client";

import { useState, useEffect } from "react";
import { Voucher } from "@/types";
import { Ticket, Plus, Trash2, Edit3, CheckCircle2, XCircle, X, Sparkles, AlertCircle } from "lucide-react";

interface VoucherManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoucherManagementModal({
  isOpen,
  onClose,
}: VoucherManagementModalProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscount, setMaxDiscount] = useState<string>("");
  const [minSubtotal, setMinSubtotal] = useState<number>(25000);
  const [validUntil, setValidUntil] = useState("2026-12-31");
  const [isActive, setIsActive] = useState<boolean>(true);

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

  const handleOpenCreateForm = () => {
    setEditingVoucher(null);
    setCode("");
    setTitle("");
    setDescription("");
    setDiscountType("percent");
    setDiscountValue(10);
    setMaxDiscount("");
    setMinSubtotal(25000);
    setValidUntil("2026-12-31");
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (v: Voucher) => {
    setEditingVoucher(v);
    setCode(v.code);
    setTitle(v.title);
    setDescription(v.description || "");
    setDiscountType(v.discountType === "fixed" ? "fixed" : "percent");
    setDiscountValue(v.discountValue);
    setMaxDiscount(v.maxDiscount ? String(v.maxDiscount) : "");
    setMinSubtotal(v.minSubtotal || 0);
    setValidUntil(v.validUntil || "2026-12-31");
    setIsActive(v.isActive ?? true);
    setIsFormOpen(true);
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !title) return;

    setLoading(true);
    const isEdit = Boolean(editingVoucher);

    const payload = {
      id: editingVoucher?.id,
      code: code.trim().toUpperCase(),
      title,
      description,
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      minSubtotal: Number(minSubtotal),
      validUntil,
      isActive,
    };

    try {
      const res = await fetch("/api/vouchers", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsFormOpen(false);
        setEditingVoucher(null);
        await loadVouchers();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan voucher.");
      }
    } catch (err) {
      console.error("Error save voucher:", err);
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

  // Calculation simulation sample (Subtotal Rp 100.000)
  const sampleSubtotal = 100000;
  let sampleDiscount = 0;
  if (discountType === "percent") {
    sampleDiscount = Math.round((sampleSubtotal * discountValue) / 100);
    if (maxDiscount && Number(maxDiscount) > 0) {
      sampleDiscount = Math.min(sampleDiscount, Number(maxDiscount));
    }
  } else {
    sampleDiscount = Math.min(discountValue, sampleSubtotal);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-sm">
              <Ticket className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manajemen Voucher Digital</h2>
              <p className="text-xs text-slate-500">
                Kelola kode promo, diskon persentase (%), nominal tetap (Rp), &amp; batasan diskon.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
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
              onClick={() => {
                if (isFormOpen) {
                  setIsFormOpen(false);
                  setEditingVoucher(null);
                } else {
                  handleOpenCreateForm();
                }
              }}
              className="py-2 px-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isFormOpen ? "Batal" : "Buat Voucher Baru"}</span>
            </button>
          </div>

          {/* Form Create / Edit Voucher */}
          {isFormOpen && (
            <form
              onSubmit={handleSaveVoucher}
              className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-300/80 space-y-3.5 animate-in slide-in-from-top duration-200 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>
                    {editingVoucher ? `✏️ Edit Voucher: ${editingVoucher.code}` : "✨ Form Buat Voucher Promo Baru"}
                  </span>
                </div>
                {editingVoucher && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                    ID: {editingVoucher.id}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Voucher (Unik)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: NYAMLENG20"
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
                    placeholder="Contoh: Diskon Promo 20% All Menu"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Deskripsi Promo Ringkas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Potongan 20% maksimal diskon Rp 15.000 min. belanja Rp 30.000"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skema Diskon</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                  >
                    <option value="percent">Persentase Diskon (%)</option>
                    <option value="fixed">Nominal Potongan Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {discountType === "percent" ? "Persentase Diskon (%)" : "Nominal Potongan (Rp)"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={discountType === "percent" ? 100 : undefined}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                {discountType === "percent" && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Maksimal Diskon Caps (Rp) <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Contoh: 15000 (Kosongkan jika tanpa batas)"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                  </div>
                )}

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
                  <label className="block font-bold text-slate-700 mb-1">Masa Berlaku Sampai</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Publikasi</label>
                  <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                  >
                    <option value="true">🟢 Aktif (Dapat Di-claim Pembeli)</option>
                    <option value="false">🔴 Nonaktif (Disembunyikan)</option>
                  </select>
                </div>
              </div>

              {/* Simulation Helper Pill */}
              <div className="p-2.5 bg-white/80 border border-amber-200 rounded-xl text-[11px] font-medium text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  💡 <strong>Simulasi Potongan:</strong> Belanja Rp 100.000 → Diskon = <strong>Rp {sampleDiscount.toLocaleString("id-ID")}</strong>
                  {discountType === "percent" && maxDiscount && Number(maxDiscount) > 0 ? ` (Dibatasi Maks. Rp ${Number(maxDiscount).toLocaleString("id-ID")})` : ""}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingVoucher(null);
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : editingVoucher ? "Update Voucher ✏️" : "Simpan Voucher ✨"}
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
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
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
                        ? `${v.discountValue}% ${v.maxDiscount ? `(Maks Rp ${v.maxDiscount.toLocaleString("id-ID")})` : ""}`
                        : `Rp ${v.discountValue.toLocaleString("id-ID")}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditForm(v)}
                      className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Voucher"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
            className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
