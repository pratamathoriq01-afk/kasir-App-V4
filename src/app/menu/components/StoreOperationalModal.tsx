"use client";

import { useState, useEffect } from "react";
import { StoreSettings } from "@/types";
import {
  saveStoreSettingsOptimistic,
  fetchStoreSettingsFromDB,
  getStoredStoreSettings,
  subscribePOSSync,
} from "@/lib/data-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Store,
  CheckCircle2,
  XCircle,
  Sparkles,
  Save,
  Radio,
  AlertTriangle,
  MapPin,
  Phone,
  Calendar,
} from "lucide-react";

interface StoreOperationalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StoreOperationalModal({
  isOpen,
  onClose,
}: StoreOperationalModalProps) {
  const [settings, setSettings] = useState<StoreSettings>(() => getStoredStoreSettings());
  const [isOpenState, setIsOpenState] = useState<boolean>(true);
  const [openTime, setOpenTime] = useState<string>("08:00");
  const [closeTime, setCloseTime] = useState<string>("22:00");
  const [isAutoSchedule, setIsAutoSchedule] = useState<boolean>(true);
  const [closedReason, setClosedReason] = useState<string>("Kedai sedang istirahat / tutup sementara.");
  const [storeName, setStoreName] = useState<string>("Kedai Nyamleng");
  const [whatsapp, setWhatsapp] = useState<string>("085113661387");
  const [address, setAddress] = useState<string>("Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kota Malang");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Current WIB time helper for live status calculation
  const [currentTimeWIB, setCurrentTimeWIB] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTimeWIB(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const loadSettings = () => {
    fetchStoreSettingsFromDB().then((data) => {
      setSettings(data);
      setIsOpenState(data.isOpen ?? true);
      setOpenTime(data.openTime || "08:00");
      setCloseTime(data.closeTime || "22:00");
      setIsAutoSchedule(data.isAutoSchedule ?? true);
      setClosedReason(data.closedReason || "Kedai sedang istirahat / tutup sementara.");
      setStoreName(data.storeName || "Kedai Nyamleng");
      setWhatsapp(data.whatsapp || "085113661387");
      setAddress(data.address || "Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kota Malang");
    });
  };

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      setSaveSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = subscribePOSSync((type, payload) => {
      if (type === "STORE_SETTINGS_UPDATED" && payload) {
        setSettings(payload);
        setIsOpenState(payload.isOpen ?? true);
        setOpenTime(payload.openTime || "08:00");
        setCloseTime(payload.closeTime || "22:00");
        setIsAutoSchedule(payload.isAutoSchedule ?? true);
        setClosedReason(payload.closedReason || "Kedai sedang istirahat / tutup sementara.");
      }
    });
    return () => unsubscribe();
  }, []);

  // Determine effective operational status
  const isCurrentlyWithinHours = () => {
    if (!currentTimeWIB || !openTime || !closeTime) return true;
    return currentTimeWIB >= openTime && currentTimeWIB <= closeTime;
  };

  const effectiveStatus = isAutoSchedule
    ? isCurrentlyWithinHours() && isOpenState
    : isOpenState;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<StoreSettings> = {
        isOpen: isOpenState,
        openTime,
        closeTime,
        isAutoSchedule,
        closedReason,
        storeName,
        whatsapp,
        address,
      };

      await saveStoreSettingsOptimistic(payload, settings);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed to save operational settings:", err);
      alert("Gagal menyimpan pengaturan operasional toko.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-xl p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 p-4 sm:p-5 text-white flex items-center justify-between border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-inner">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-white">
                Jam Buka &amp; Operasional Toko
              </DialogTitle>
              <p className="text-xs text-emerald-100 font-medium">
                Sinkronisasi otomatis &amp; realtime dengan Menu Digital pembeli.
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Live Status Card */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              effectiveStatus
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  effectiveStatus
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-rose-600 text-white shadow-xs"
                }`}
              >
                {effectiveStatus ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <XCircle className="w-5 h-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
                  Status Menu Digital Saat Ini (WIB {currentTimeWIB})
                </span>
                <span className="text-sm sm:text-base font-black flex items-center gap-1.5">
                  {effectiveStatus ? "🟢 SEDANG BUKA (Menerima Pesanan)" : "🔴 SEDANG TUTUP (Tidak Menerima Order)"}
                </span>
              </div>
            </div>

            <Badge
              variant={effectiveStatus ? "default" : "destructive"}
              className="text-xs font-mono font-bold px-3 py-1"
            >
              {openTime} - {closeTime} WIB
            </Badge>
          </div>

          {/* 1. Saklar Utama Buka / Tutup Toko */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">
              Saklar Manual Status Kedai
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsOpenState(true)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isOpenState
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/40"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>🟢 Toko BUKA</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpenState(false)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !isOpenState
                    ? "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/40"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>🔴 Toko TUTUP</span>
              </button>
            </div>
          </div>

          {/* 2. Jam Operasional Harian */}
          <div className="p-3.5 bg-muted/40 rounded-2xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Jam Operasional Harian (WIB)
              </span>
              
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isAutoSchedule}
                  onChange={(e) => setIsAutoSchedule(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-border accent-emerald-600 cursor-pointer"
                />
                <span>Jadwal Otomatis (Auto-Schedule)</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Jam Buka Toko
                </label>
                <Input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="h-10 text-xs font-mono font-bold bg-background border-input rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Jam Tutup Toko
                </label>
                <Input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="h-10 text-xs font-mono font-bold bg-background border-input rounded-xl"
                  required
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              💡 <em>Jika <strong>Jadwal Otomatis</strong> aktif, pembeli di Menu Digital akan secara otomatis melihat status <strong>TUTUP</strong> sebelum pukul {openTime} WIB dan setelah pukul {closeTime} WIB.</em>
            </p>
          </div>

          {/* 3. Pesan saat Toko Tutup */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Pesan Banner Saat Toko Tutup
            </label>
            <Input
              type="text"
              value={closedReason}
              onChange={(e) => setClosedReason(e.target.value)}
              placeholder="misal: Kedai sedang istirahat. Buka kembali pukul 08:00 WIB."
              className="h-10 text-xs bg-background border-input rounded-xl font-medium"
            />
            <span className="text-[10px] text-muted-foreground block">
              Pesan ini akan muncul sebagai banner peringatan di menu digital pembeli.
            </span>
          </div>

          {/* 4. Info Kontak & Alamat Kedai */}
          <div className="p-3.5 bg-muted/20 rounded-2xl border border-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5" /> Nama Usaha / Kedai
              </label>
              <Input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="h-9 text-xs bg-background border-input rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> WhatsApp Konfirmasi
              </label>
              <Input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="h-9 text-xs bg-background border-input rounded-xl font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Alamat Lengkap Kedai
              </label>
              <Input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-9 text-xs bg-background border-input rounded-xl font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 text-xs font-bold rounded-xl cursor-pointer"
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={saving}
              className="h-10 px-5 text-xs font-extrabold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
            >
              {saving ? (
                <span>Menyimpan...</span>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan &amp; Terapkan Realtime</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
