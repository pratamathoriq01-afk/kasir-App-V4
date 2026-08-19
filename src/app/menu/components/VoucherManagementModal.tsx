"use client";

import { useState, useEffect } from "react";
import { Voucher } from "@/types";
import { broadcastPOSSync } from "@/lib/data-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertCircle,
  Percent,
  DollarSign,
  Calendar,
  Check,
} from "lucide-react";

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
      const res = await fetch(`/api/vouchers?t=${Date.now()}`, {
        cache: "no-store",
      });
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
    setDiscountValueStr(
      isFixed ? formatThousandInput(v.discountValue) : String(v.discountValue || 0)
    );
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

    const numDiscount =
      discountType === "fixed"
        ? parseThousandInput(discountValueStr)
        : parseFloat(discountValueStr) || 0;

    const numMaxDiscount = maxDiscountStr
      ? parseThousandInput(maxDiscountStr)
      : null;
    const numMinSubtotal = parseThousandInput(minSubtotalStr);

    const voucherId = editingVoucher?.id || `vcr-${Date.now()}`;
    const cleanCode = code.trim().toUpperCase();

    const optimisticVoucher: Voucher = {
      id: voucherId,
      code: cleanCode,
      title: title.trim(),
      description: description.trim(),
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
      loadVouchers();
    } catch (err) {
      console.error("Error toggle status voucher:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus voucher ini?")) return;

    // 0ms Optimistic UI
    const deletedVoucher = vouchers.find((v) => v.id === id);
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    if (deletedVoucher) {
      broadcastPOSSync("VOUCHER_UPDATED", { ...deletedVoucher, isActive: false });
    }

    try {
      await fetch(`/api/vouchers?id=${id}`, { method: "DELETE" });
      loadVouchers();
    } catch (err) {
      console.error("Error delete voucher:", err);
    }
  };

  if (!isOpen) return null;

  // Real-time calculation simulation sample (Subtotal Rp 100.000)
  const sampleSubtotal = 100000;
  const numVal =
    discountType === "fixed"
      ? parseThousandInput(discountValueStr)
      : parseFloat(discountValueStr) || 0;
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

  const percentPresets = [5, 10, 15, 20, 25, 30, 50, 75];
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] sm:w-[94vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl p-0 overflow-hidden rounded-3xl border-border shadow-2xl bg-card flex flex-col max-h-[90vh]"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-xs text-white rounded-2xl shadow-inner">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-white">
                Manajemen Voucher Promo Digital
              </DialogTitle>
              <p className="text-xs text-emerald-100 font-medium">
                Kode diskon otomatis tersinkronisasi realtime ke Kasir POS &amp; Menu Digital.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-2xl border border-border">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-bold text-xs sm:text-sm text-foreground">
                Total {vouchers.length} Voucher Promo Aktif &amp; Terdaftar
              </span>
            </div>

            <Button
              onClick={() => {
                if (isFormOpen) {
                  setIsFormOpen(false);
                  setEditingVoucher(null);
                } else {
                  handleOpenCreateForm();
                }
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs sm:text-sm h-10 px-5 rounded-xl gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isFormOpen ? "Tutup Form Input" : "+ Buat Voucher Baru"}</span>
            </Button>
          </div>

          {/* Form Create / Edit Voucher */}
          {isFormOpen && (
            <form
              onSubmit={handleSaveVoucher}
              className="bg-muted/30 p-4 sm:p-6 rounded-2xl border border-primary/30 space-y-5 animate-in slide-in-from-top duration-200 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2 text-sm font-black text-foreground uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    {editingVoucher
                      ? `Edit Voucher: ${editingVoucher.code}`
                      : "Form Buat Voucher Promo Baru"}
                  </span>
                </div>
                {editingVoucher && (
                  <Badge variant="secondary" className="text-xs font-mono font-bold">
                    ID: {editingVoucher.id}
                  </Badge>
                )}
              </div>

              {/* Responsive Grid: Single-column on mobile, 2-column on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                {/* Kode Voucher */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Kode Voucher (Unik) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: NYAMLENG20"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="uppercase font-mono font-black h-11 text-sm rounded-xl bg-background w-full"
                  />
                  <span className="text-xs text-muted-foreground block">
                    Pelanggan dapat memasukkan kode ini saat checkout di Menu Digital.
                  </span>
                </div>

                {/* Judul Voucher */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Judul Voucher Promo <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Promo Diskon 20% Sambut Weekend"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-bold h-11 text-sm rounded-xl bg-background w-full"
                  />
                  <span className="text-xs text-muted-foreground block">
                    Nama promo yang muncul di banner Menu Digital.
                  </span>
                </div>

                {/* Deskripsi Promo */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-foreground block">
                    Deskripsi Ringkas Promo
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: Potongan 20% maksimal diskon Rp 15.000 dengan min. belanja Rp 30.000"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="font-medium h-11 text-sm rounded-xl bg-background w-full"
                  />
                </div>

                {/* Skema Diskon Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Skema Tipe Diskon
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType("percent");
                        setDiscountValueStr("20");
                      }}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        discountType === "percent"
                          ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40 font-black"
                          : "bg-background border border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      <Percent className="w-4 h-4" />
                      <span>Persen (%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType("fixed");
                        setDiscountValueStr("10.000");
                      }}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        discountType === "fixed"
                          ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40 font-black"
                          : "bg-background border border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Nominal (Rp)</span>
                    </button>
                  </div>
                </div>

                {/* Nilai Diskon Input & Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground block">
                      {discountType === "percent" ? "Persentase Diskon (%)" : "Nominal Potongan (Rp)"} <span className="text-destructive">*</span>
                    </label>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {discountType === "percent" ? "Rentang: 1% - 100%" : "Nominal Tetap"}
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    {discountType === "fixed" && (
                      <span className="absolute left-3.5 font-bold font-mono text-muted-foreground text-sm select-none">
                        Rp
                      </span>
                    )}
                    <Input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder={
                        discountType === "percent" ? "Contoh: 20" : "Contoh: 10.000"
                      }
                      value={discountValueStr}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (discountType === "fixed") {
                          setDiscountValueStr(formatThousandInput(raw));
                        } else {
                          setDiscountValueStr(raw.replace(/[^\d.]/g, ""));
                        }
                      }}
                      className={`h-11 rounded-xl font-mono font-black text-sm bg-background w-full ${
                        discountType === "fixed" ? "pl-11 pr-3" : "pl-3 pr-9"
                      }`}
                    />
                    {discountType === "percent" && (
                      <span className="absolute right-3.5 font-black font-mono text-amber-600 dark:text-amber-400 text-sm select-none">
                        %
                      </span>
                    )}
                  </div>

                  {/* Preset Pills for Quick Selection */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-xs font-bold text-muted-foreground shrink-0 mr-1">
                      Pilihan Cepat:
                    </span>
                    {discountType === "percent"
                      ? percentPresets.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setDiscountValueStr(String(p))}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              discountValueStr === String(p)
                                ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                                : "bg-background border border-border text-foreground hover:bg-muted"
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
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                discountValueStr === formattedPreset
                                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                                  : "bg-background border border-border text-foreground hover:bg-muted"
                              }`}
                            >
                              Rp {formattedPreset}
                            </button>
                          );
                        })}
                  </div>
                </div>

                {/* Maksimal Diskon Caps Input (Full Width on Desktop) */}
                {discountType === "percent" && (
                  <div className="md:col-span-2 p-4 bg-background rounded-2xl border border-amber-500/30 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-foreground">
                        Batas Maksimal Potongan Diskon (Caps Rupiah){" "}
                        <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
                      </label>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {maxDiscountStr ? `Maksimal Potongan: Rp ${maxDiscountStr}` : "Tanpa Batas Maksimal"}
                      </span>
                    </div>

                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 font-bold font-mono text-muted-foreground text-sm select-none">
                        Rp
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Kosongkan jika tanpa batas (contoh: 15.000)"
                        value={maxDiscountStr}
                        onChange={(e) =>
                          setMaxDiscountStr(formatThousandInput(e.target.value))
                        }
                        className="pl-11 pr-3 h-11 rounded-xl font-mono font-bold text-sm bg-muted/20 w-full"
                      />
                    </div>

                    {/* Max Discount Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-xs font-bold text-muted-foreground shrink-0 mr-1">
                        Preset Batas:
                      </span>
                      {maxCapPresets.map((cap) => (
                        <button
                          key={cap.label}
                          type="button"
                          onClick={() => setMaxDiscountStr(cap.val)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            maxDiscountStr === cap.val
                              ? "bg-primary text-primary-foreground shadow-xs font-black"
                              : "bg-muted border border-border text-foreground hover:bg-muted/80"
                          }`}
                        >
                          {cap.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Minimal Subtotal Belanja */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Minimal Subtotal Belanja (Rp)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 font-bold font-mono text-muted-foreground text-sm select-none">
                      Rp
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={minSubtotalStr}
                      onChange={(e) =>
                        setMinSubtotalStr(formatThousandInput(e.target.value))
                      }
                      className="pl-11 pr-3 h-11 rounded-xl font-mono font-bold text-sm bg-background w-full"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground block">
                    Voucher hanya dapat digunakan jika subtotal pesanan mencapai nominal ini.
                  </span>
                </div>

                {/* Masa Berlaku */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Masa Berlaku Sampai Tanggal
                  </label>
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="font-bold h-11 text-sm rounded-xl bg-background w-full"
                  />
                  <span className="text-xs text-muted-foreground block">
                    Tanggal berakhirnya masa aktif voucher promo.
                  </span>
                </div>

                {/* Status Publikasi (Full Width on Desktop) */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Status Publikasi &amp; Ketersediaan
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsActive(true)}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isActive
                          ? "bg-emerald-600 text-white font-extrabold shadow-sm ring-2 ring-emerald-500/40"
                          : "bg-background border border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>🟢 Voucher Aktif (Bisa Diklaim Pembeli)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsActive(false)}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        !isActive
                          ? "bg-rose-600 text-white font-extrabold shadow-sm ring-2 ring-rose-500/40"
                          : "bg-background border border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>🔴 Nonaktifkan Sementara</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulation Helper Card */}
              <div className="p-4 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 rounded-2xl text-xs sm:text-sm font-medium text-foreground flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>
                  💡 <strong>Simulasi Potongan:</strong> Belanja Rp 100.000 → Hemat Diskon ={" "}
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-sm sm:text-base">
                    Rp {sampleDiscount.toLocaleString("id-ID")}
                  </strong>
                  {discountType === "percent" && numMax && numMax > 0
                    ? ` (Dibatasi Maksimal Rp ${numMax.toLocaleString("id-ID")})`
                    : ""}
                </span>
              </div>

              {/* Form Action Buttons (Single Unified Action Bar) */}
              <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingVoucher(null);
                  }}
                  className="rounded-xl h-11 px-6 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold rounded-xl h-11 px-8 text-xs sm:text-sm shadow-md cursor-pointer"
                >
                  {editingVoucher ? "Update Voucher Promo ✨" : "Simpan Voucher Promo ✨"}
                </Button>
              </div>
            </form>
          )}

          {/* Vouchers List Cards Grid (Roomy 1/2/3 Columns) */}
          {vouchers.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-2xl p-6">
              <Ticket className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="font-bold text-foreground text-sm">Belum Ada Voucher Promo Terdaftar</p>
              <p className="text-xs text-muted-foreground mt-1">
                Klik tombol <strong>&quot;+ Buat Voucher Baru&quot;</strong> di atas untuk membuat kode promo pertama.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vouchers.map((v) => (
                <div
                  key={v.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                    v.isActive
                      ? "bg-card border-border shadow-xs hover:border-primary/50 hover:shadow-md"
                      : "bg-muted/40 border-border/60 opacity-60"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Row with Badge and Status Pill */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge className="font-mono font-black text-xs sm:text-sm bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/40 px-3 py-1">
                        {v.code}
                      </Badge>

                      <button
                        onClick={() => handleToggleStatus(v)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold cursor-pointer transition-all ${
                          v.isActive
                            ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {v.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Voucher Title */}
                    <h3 className="font-extrabold text-foreground text-sm sm:text-base leading-snug">
                      {v.title}
                    </h3>

                    {/* Voucher Description */}
                    {v.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {v.description}
                      </p>
                    )}

                    {/* Discount Amount Pill */}
                    <div className="p-3 bg-muted/50 rounded-xl border border-border flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground font-semibold">Potongan Diskon:</span>
                      <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm sm:text-base">
                        {v.discountType === "percent"
                          ? `${v.discountValue}% ${
                              v.maxDiscount
                                ? `(Maks Rp ${v.maxDiscount.toLocaleString("id-ID")})`
                                : ""
                            }`
                          : `Rp ${(v.discountValue || 0).toLocaleString("id-ID")}`}
                      </span>
                    </div>

                    {/* Min Subtotal Info */}
                    {v.minSubtotal && v.minSubtotal > 0 ? (
                      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Min. Belanja:</span>
                        <span className="font-mono font-bold text-foreground">
                          Rp {v.minSubtotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">
                      Exp: {v.validUntil || "Selamanya"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditForm(v)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-muted cursor-pointer"
                        title="Edit Voucher"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(v.id)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Hapus Voucher"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Bar (Only when form is closed) */}
        {!isFormOpen && (
          <div className="p-4 border-t border-border flex justify-end shrink-0 bg-muted/20">
            <Button
              onClick={onClose}
              className="rounded-xl px-7 h-10 text-xs sm:text-sm font-extrabold cursor-pointer"
            >
              Tutup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
