"use client";

import { useState, useEffect } from "react";
import { Voucher } from "@/types";
import { broadcastPOSSync } from "@/lib/data-service";
import { Ticket, Plus, Trash2, Edit3, CheckCircle2, XCircle, X, Sparkles, AlertCircle } from "lucide-react";

interface VoucherManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to format string input with Indonesian dots (.) separator for thousands
function formatThousandInput(val: string | number): string {
  if (val === "" || val === null || val === undefined) return "";
  const rawNum = String(val).replace(/\D/g, "");
  if (!rawNum) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(rawNum, 10));
}

// Helper to parse clean number from formatted dot string
function parseThousandInput(val: string | number): number {
  if (!val) return 0;
  const clean = String(val).replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

export default function VoucherManagementModal({
  isOpen,
  onClose,
}: VoucherManagementModalProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State (Formatted strings with dot thousand separators)
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValueStr, setDiscountValueStr] = useState<string>("10");
  const [maxDiscountStr, setMaxDiscountStr] = useState<string>("");
  const [minSubtotalStr, setMinSubtotalStr] = useState<string>("25.000");
  const [validUntil, setValidUntil] = useState("2026-12-31");
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      loadVouchers();
    }
  }, [isOpen]);

  const loadVouchers = async () => {
    try {
      const res = await fetch(`/api/vouchers?t=${Date.now()}`, { cache: "no-store" });
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
    setDiscountValueStr("10");
    setMaxDiscountStr("");
    setMinSubtotalStr("25.000");
    setValidUntil("2026-12-31");
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (v: Voucher) => {
    setEditingVoucher(v);
    setCode(v.code);
    setTitle(v.title);
    setDescription(v.description || "");
    const isFixed = v.discountType === "fixed";
    setDiscountType(isFixed ? "fixed" : "percent");
    setDiscountValueStr(isFixed ? formatThousandInput(v.discountValue) : String(v.discountValue || 0));
    setMaxDiscountStr(v.maxDiscount ? formatThousandInput(v.maxDiscount) : "");
    setMinSubtotalStr(formatThousandInput(v.minSubtotal || 0));
    setValidUntil(v.validUntil || "2026-12-31");
    setIsActive(v.isActive ?? true);
    setIsFormOpen(true);
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !title) return;

    const isEdit = Boolean(editingVoucher);

    const numDiscount = discountType === "fixed"
      ? parseThousandInput(discountValueStr)
      : parseFloat(discountValueStr) || 0;

    const numMaxDiscount = maxDiscountStr ? parseThousandInput(maxDiscountStr) : null;
    const numMinSubtotal = parseThousandInput(minSubtotalStr);

    const voucherId = editingVoucher?.id || `vcr-${Date.now()}`;
    const cleanCode = code.trim().toUpperCase();

    const optimisticVoucher: Voucher = {
      id: voucherId,
      code: cleanCode,
      title,
      description,
      discountType,
      discountValue: numDiscount,
      maxDiscount: numMaxDiscount,
      minSubtotal: numMinSubtotal,
      validUntil,
      isActive,
    };

    // 0ms INSTANT OPTIMISTIC UI UPDATE
    const updatedList = isEdit
      ? vouchers.map((v) => (v.id === voucherId ? optimisticVoucher : v))
      : [optimisticVoucher, ...vouchers];

    setVouchers(updatedList);
    setIsFormOpen(false);
    setEditingVoucher(null);
    broadcastPOSSync("VOUCHER_UPDATED", optimisticVoucher);

    // Save in background
    try {
      await fetch("/api/vouchers", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimisticVoucher),
      });
      loadVouchers();
    } catch (err) {
      console.error("Error save voucher in background:", err);
    }
  };

  const handleToggleStatus = async (voucher: Voucher) => {
    const toggled = { ...voucher, isActive: !voucher.isActive };
    // 0ms Optimistic UI
    setVouchers((prev) => prev.map((v) => (v.id === voucher.id ? toggled : v)));
    broadcastPOSSync("VOUCHER_UPDATED", toggled);

    try {
      await fetch("/api/vouchers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: voucher.id,
          isActive: toggled.isActive,
        }),
      });
    } catch (err) {
      console.error("Error update status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    // 0ms Instant Optimistic Delete without blocking delay
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    broadcastPOSSync("VOUCHER_UPDATED", { deletedId: id });

    try {
      await fetch(`/api/vouchers?id=${id}`, {
        method: "DELETE",
      });
      loadVouchers();
    } catch (err) {
      console.error("Error delete voucher in background:", err);
    }
  };

  if (!isOpen) return null;

  // Real-time calculation simulation sample (Subtotal Rp 100.000)
  const sampleSubtotal = 100000;
  const numVal = discountType === "fixed" ? parseThousandInput(discountValueStr) : (parseFloat(discountValueStr) || 0);
  const numMax = maxDiscountStr ? parseThousandInput(maxDiscountStr) : null;
  let sampleDiscount = 0;
  if (discountType === "percent") {
    sampleDiscount = Math.round((sampleSubtotal * numVal) / 100);
    if (numMax && numMax > 0) {
      sampleDiscount = Math.min(sampleDiscount, numMax);
    }
  } else {
    sampleDiscount = Math.min(numVal, sampleSubtotal);
  }

  const percentPresets = [5, 10, 15, 20, 25, 30, 50, 75, 100];
  const fixedPresets = [2000, 5000, 10000, 15000, 20000, 25000, 50000];
  const maxCapPresets = [
    { label: "Tanpa Batas", val: "" },
    { label: "Maks 10rb", val: "10.000" },
    { label: "Maks 15rb", val: "15.000" },
    { label: "Maks 20rb", val: "20.000" },
    { label: "Maks 25rb", val: "25.000" },
    { label: "Maks 50rb", val: "50.000" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-sm">
              <Ticket className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Manajemen Voucher Digital</h2>
              <p className="text-xs text-slate-500">
                Kelola kode promo diskon realtime untuk Kasir POS &amp; Menu Digital.
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
        <div className="flex-1 overflow-y-auto py-3.5 space-y-3.5">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-800 font-mono">
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
              className="py-2 px-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isFormOpen ? "Batal" : "Buat Voucher Baru"}</span>
            </button>
          </div>

          {/* Form Create / Edit Voucher */}
          {isFormOpen && (
            <form
              onSubmit={handleSaveVoucher}
              className="bg-amber-50/80 p-4 sm:p-5 rounded-2xl border border-amber-300 space-y-3.5 animate-in slide-in-from-top duration-200 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 border-b border-amber-200 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>
                    {editingVoucher ? `✏️ Edit Voucher: ${editingVoucher.code}` : "✨ Form Buat Voucher Promo Baru"}
                  </span>
                </div>
                {editingVoucher && (
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md">
                    ID: {editingVoucher.id}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Kode Voucher (Unik) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: NYAMLENG20"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-950 placeholder:text-slate-400 border border-slate-300 rounded-xl uppercase font-mono font-black focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none shadow-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Judul Voucher Promo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Diskon Promo 20% All Menu"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-950 placeholder:text-slate-400 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none shadow-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">
                    Deskripsi Promo Ringkas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Potongan 20% maksimal diskon Rp 15.000 min. belanja Rp 30.000"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-950 placeholder:text-slate-400 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none shadow-xs"
                  />
                </div>

                {/* Skema Diskon Selector */}
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Skema Diskon</label>
                  <select
                    value={discountType}
                    onChange={(e) => {
                      const newType = e.target.value as "percent" | "fixed";
                      setDiscountType(newType);
                      if (newType === "fixed") {
                        setDiscountValueStr("10.000");
                      } else {
                        setDiscountValueStr("20");
                      }
                    }}
                    className="w-full px-3 py-2 bg-white text-slate-950 font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none cursor-pointer shadow-xs"
                  >
                    <option value="percent" className="text-slate-900 font-bold bg-white">Persentase Diskon (%)</option>
                    <option value="fixed" className="text-slate-900 font-bold bg-white">Nominal Potongan Tetap (Rp)</option>
                  </select>
                </div>

                {/* Flexible Discount Input Field with Dot Separator for Rp */}
                <div>
                  <label className="block font-bold text-slate-900 mb-1 flex items-center justify-between">
                    <span>{discountType === "percent" ? "Persentase Diskon (%)" : "Nominal Potongan (Rp)"}</span>
                    <span className="text-[10px] text-amber-800 font-extrabold">
                      {discountType === "percent" ? "1% - 100%" : "Nominal Tetap (Rp)"}
                    </span>
                  </label>
                  
                  <div className="relative flex items-center">
                    {discountType === "fixed" && (
                      <span className="absolute left-3 font-bold font-mono text-slate-700 text-xs select-none">
                        Rp
                      </span>
                    )}
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder={discountType === "percent" ? "Masukkan % (contoh: 20)" : "Masukkan Rp (contoh: 10.000)"}
                      value={discountValueStr}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (discountType === "fixed") {
                          setDiscountValueStr(formatThousandInput(raw));
                        } else {
                          setDiscountValueStr(raw.replace(/[^\d.]/g, ""));
                        }
                      }}
                      className={`w-full py-2 bg-white text-slate-950 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono font-black focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none shadow-xs ${
                        discountType === "fixed" ? "pl-9 pr-3" : "pl-3 pr-9"
                      }`}
                    />
                    {discountType === "percent" && (
                      <span className="absolute right-3 font-extrabold font-mono text-amber-800 text-xs select-none">
                        %
                      </span>
                    )}
                  </div>

                  {/* Preset Pills for Quick Selection */}
                  <div className="mt-1.5 flex items-center gap-1 overflow-x-auto pb-1">
                    <span className="text-[9px] font-bold text-slate-500 shrink-0">Pilihan Cepat:</span>
                    {discountType === "percent"
                      ? percentPresets.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setDiscountValueStr(String(p))}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all shrink-0 cursor-pointer ${
                              discountValueStr === String(p)
                                ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                                : "bg-white border border-slate-300 text-slate-800 hover:bg-amber-100"
                            }`}
                          >
                            {p}%
                          </button>
                        ))
                      : fixedPresets.map((p) => {
                          const formattedPreset = formatThousandInput(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setDiscountValueStr(formattedPreset)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all shrink-0 cursor-pointer ${
                                discountValueStr === formattedPreset
                                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                                  : "bg-white border border-slate-300 text-slate-800 hover:bg-amber-100"
                              }`}
                            >
                              Rp {formattedPreset}
                            </button>
                          );
                        })}
                  </div>
                </div>

                {/* Maksimal Diskon Caps Input with Dot Separator */}
                {discountType === "percent" && (
                  <div className="sm:col-span-2 bg-white/90 p-3 rounded-xl border border-amber-300 space-y-1.5 shadow-2xs">
                    <label className="block font-bold text-slate-900 flex items-center justify-between">
                      <span>Maksimal Diskon Caps (Rp) <span className="text-[10px] text-slate-500 font-normal">(Opsional)</span></span>
                      <span className="text-[10px] font-bold text-slate-700">
                        {maxDiscountStr ? `Maksimal Rp ${maxDiscountStr}` : "Tanpa Batas Maximum"}
                      </span>
                    </label>
                    
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-bold font-mono text-slate-700 text-xs select-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Kosongkan jika tanpa batas (contoh: 15.000)"
                        value={maxDiscountStr}
                        onChange={(e) => setMaxDiscountStr(formatThousandInput(e.target.value))}
                        className="w-full pl-9 pr-3 py-2 bg-white text-slate-950 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none shadow-xs"
                      />
                    </div>

                    {/* Max Discount Presets */}
                    <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                      <span className="text-[9px] font-bold text-slate-500 shrink-0">Batas Caps:</span>
                      {maxCapPresets.map((cap) => (
                        <button
                          key={cap.label}
                          type="button"
                          onClick={() => setMaxDiscountStr(cap.val)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all shrink-0 cursor-pointer ${
                            maxDiscountStr === cap.val
                              ? "bg-slate-900 text-white shadow-xs font-black"
                              : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          {cap.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Minimal Subtotal Belanja Input with Dot Separator */}
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Minimal Subtotal Belanja (Rp)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 font-bold font-mono text-slate-700 text-xs select-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={minSubtotalStr}
                      onChange={(e) => setMinSubtotalStr(formatThousandInput(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 bg-white text-slate-950 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Masa Berlaku Sampai</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-950 font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none shadow-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">Status Publikasi</label>
                  <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    className="w-full px-3 py-2 bg-white text-slate-950 font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none cursor-pointer shadow-xs"
                  >
                    <option value="true" className="text-slate-900 font-bold bg-white">🟢 Aktif (Dapat Di-claim &amp; Terbaca Realtime oleh Pembeli)</option>
                    <option value="false" className="text-slate-900 font-bold bg-white">🔴 Nonaktif (Disembunyikan dari Pembeli)</option>
                  </select>
                </div>
              </div>

              {/* Simulation Helper Pill */}
              <div className="p-3 bg-white border border-amber-300 rounded-xl text-xs font-medium text-amber-950 flex items-center gap-2.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  💡 <strong>Simulasi Perhitungan:</strong> Belanja Rp 100.000 → Hemat Diskon = <strong className="font-mono text-emerald-700 font-bold">Rp {sampleDiscount.toLocaleString("id-ID")}</strong>
                  {discountType === "percent" && numMax && numMax > 0 ? ` (Dibatasi Maks. Rp ${numMax.toLocaleString("id-ID")})` : ""}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingVoucher(null);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                >
                  {editingVoucher ? "Update Voucher ✏️" : "Simpan Voucher ✨"}
                </button>
              </div>
            </form>
          )}

          {/* Vouchers List Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  v.isActive
                    ? "bg-white border-slate-200 shadow-xs hover:border-amber-400"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-black text-sm bg-amber-100 text-amber-950 px-2 py-0.5 rounded-lg border border-amber-300">
                      {v.code}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(v)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-all ${
                        v.isActive
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {v.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Aktif</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-slate-500" />
                          <span>Nonaktif</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1">
                    {v.title}
                  </h3>

                  {v.description && (
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                      {v.description}
                    </p>
                  )}

                  <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Diskon:</span>
                    <span className="font-mono font-black text-amber-900 text-xs">
                      {v.discountType === "percent"
                        ? `${v.discountValue}% ${v.maxDiscount ? `(Maks Rp ${v.maxDiscount.toLocaleString("id-ID")})` : ""}`
                        : `Rp ${(v.discountValue || 0).toLocaleString("id-ID")}`}
                    </span>
                  </div>

                  {v.minSubtotal && v.minSubtotal > 0 ? (
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 px-1">
                      <span>Min. Belanja:</span>
                      <span className="font-mono font-bold text-slate-700">
                        Rp {v.minSubtotal.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Exp: {v.validUntil || "Selamanya"}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditForm(v)}
                      className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-lg text-xs transition-colors cursor-pointer"
                      title="Edit Voucher"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-lg text-xs transition-colors cursor-pointer"
                      title="Hapus Voucher"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl cursor-pointer transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
