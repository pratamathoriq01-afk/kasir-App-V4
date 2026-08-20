"use client";

import { useState, useEffect } from "react";
import { StoreSettings, DaySchedule, WeeklySchedule } from "@/types";
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
  Layers,
  Check,
} from "lucide-react";

interface StoreOperationalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_DAYS: WeeklySchedule = [
  { dayName: "Senin", isOpen: true, openTime: "08:00", closeTime: "22:00" },
  { dayName: "Selasa", isOpen: true, openTime: "08:00", closeTime: "22:00" },
  { dayName: "Rabu", isOpen: true, openTime: "08:00", closeTime: "22:00" },
  { dayName: "Kamis", isOpen: true, openTime: "08:00", closeTime: "22:00" },
  { dayName: "Jumat", isOpen: true, openTime: "08:00", closeTime: "23:00" },
  { dayName: "Sabtu", isOpen: true, openTime: "08:00", closeTime: "23:00" },
  { dayName: "Minggu", isOpen: true, openTime: "08:00", closeTime: "22:00" },
];

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
  
  // 7-Day Weekly Schedule State
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(DEFAULT_DAYS);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "weekly">("weekly");

  // Current WIB time helper for live status calculation
  const [currentTimeWIB, setCurrentTimeWIB] = useState<string>("");
  const [currentDayName, setCurrentDayName] = useState<string>("Senin");

  const updateClockAndDay = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setCurrentTimeWIB(`${hours}:${minutes}`);

    const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    setCurrentDayName(daysMap[now.getDay()]);
  };

  useEffect(() => {
    updateClockAndDay();
    const timer = setInterval(updateClockAndDay, 5000);
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

      if (data.weeklySchedule) {
        try {
          const parsed = typeof data.weeklySchedule === "string"
            ? JSON.parse(data.weeklySchedule)
            : data.weeklySchedule;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWeeklySchedule(parsed);
          }
        } catch {
          setWeeklySchedule(DEFAULT_DAYS);
        }
      }
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
        if (payload.weeklySchedule) {
          try {
            const parsed = typeof payload.weeklySchedule === "string"
              ? JSON.parse(payload.weeklySchedule)
              : payload.weeklySchedule;
            if (Array.isArray(parsed)) setWeeklySchedule(parsed);
          } catch {}
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Determine today's schedule
  const todaySchedule = weeklySchedule.find((d) => d.dayName === currentDayName) || {
    dayName: currentDayName,
    isOpen: true,
    openTime: "08:00",
    closeTime: "22:00",
  };

  const isCurrentlyWithinHours = () => {
    if (!currentTimeWIB || !todaySchedule) return true;
    return (
      todaySchedule.isOpen &&
      currentTimeWIB >= todaySchedule.openTime &&
      currentTimeWIB <= todaySchedule.closeTime
    );
  };

  const effectiveStatus = isAutoSchedule
    ? isCurrentlyWithinHours() && isOpenState
    : isOpenState;

  const handleUpdateDay = (
    index: number,
    field: "isOpen" | "openTime" | "closeTime",
    val: any
  ) => {
    const updated = [...weeklySchedule];
    updated[index] = { ...updated[index], [field]: val };
    setWeeklySchedule(updated);
  };

  const handleApplyToAllDays = (sourceDay: DaySchedule) => {
    if (!confirm(`Terapkan jam buka ${sourceDay.openTime} - ${sourceDay.closeTime} ke seluruh 7 hari?`)) return;
    const updated = weeklySchedule.map((d) => ({
      ...d,
      openTime: sourceDay.openTime,
      closeTime: sourceDay.closeTime,
    }));
    setWeeklySchedule(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<StoreSettings> = {
        isOpen: isOpenState,
        openTime: todaySchedule.openTime || openTime,
        closeTime: todaySchedule.closeTime || closeTime,
        isAutoSchedule,
        closedReason,
        storeName,
        whatsapp,
        address,
        weeklySchedule: JSON.stringify(weeklySchedule),
      };

      // 0ms Optimistic UI + Instant Broadcast
      await saveStoreSettingsOptimistic(payload, settings);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 800);
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
        className="w-[96vw] sm:w-[94vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl flex flex-col"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-inner">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-white">
                Jam Operasional 7 Hari Toko
              </DialogTitle>
              <p className="text-xs text-emerald-100 font-medium">
                Atur jadwal buka &amp; tutup 7 hari kedepan (Senin–Minggu) realtime 0ms.
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

        {/* Live Operational Status Banner */}
        <div className="p-4 sm:px-6 pt-4 shrink-0">
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
                  effectiveStatus ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                }`}
              >
                {effectiveStatus ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <XCircle className="w-5 h-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider block opacity-80">
                  Status Live Menu Digital — Hari Ini ({currentDayName}, {currentTimeWIB} WIB)
                </span>
                <span className="text-sm sm:text-base font-black flex items-center gap-1.5">
                  {effectiveStatus ? "🟢 SEDANG BUKA (Menerima Pesanan)" : "🔴 SEDANG TUTUP (Tidak Menerima Order)"}
                </span>
              </div>
            </div>

            <Badge
              variant={effectiveStatus ? "default" : "destructive"}
              className="text-xs font-mono font-bold px-3.5 py-1 rounded-xl"
            >
              {todaySchedule.openTime} - {todaySchedule.closeTime} WIB
            </Badge>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("weekly")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "weekly"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Jadwal 7 Hari Kedepan (Senin–Minggu)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "general"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Saklar Manual &amp; Profil Toko</span>
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable Area */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 pt-2 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: 7-DAY WEEKLY SCHEDULE */}
          {activeTab === "weekly" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  Atur Jam Buka &amp; Tutup Masing-Masing Hari:
                </span>
                <span className="text-xs text-muted-foreground">
                  Menu Digital otomatis buka/tutup sesuai jam hari berjalan.
                </span>
              </div>

              <div className="space-y-2.5">
                {weeklySchedule.map((day, idx) => {
                  const isToday = day.dayName === currentDayName;
                  return (
                    <div
                      key={day.dayName}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
                        isToday
                          ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30"
                          : day.isOpen
                          ? "bg-background border-border"
                          : "bg-muted/40 border-border/60 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateDay(idx, "isOpen", !day.isOpen)}
                          className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                            day.isOpen
                              ? "bg-emerald-600 text-white font-extrabold shadow-xs"
                              : "bg-muted border border-border text-muted-foreground"
                          }`}
                          title={day.isOpen ? "Status: Buka" : "Status: Tutup"}
                        >
                          {day.isOpen ? "ON" : "OFF"}
                        </button>

                        <div>
                          <span className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                            {day.dayName}
                            {isToday && (
                              <Badge className="bg-amber-500 text-slate-950 font-black text-[9.5px] px-1.5 py-0">
                                HARI INI
                              </Badge>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {day.isOpen ? "Status: Buka Menerima Order" : "Status: Libur / Tutup"}
                          </span>
                        </div>
                      </div>

                      {/* Open & Close Time Inputs */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-background p-1 rounded-xl border border-border">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground ml-2" />
                          <Input
                            type="time"
                            disabled={!day.isOpen}
                            value={day.openTime}
                            onChange={(e) => handleUpdateDay(idx, "openTime", e.target.value)}
                            className="h-9 w-24 text-xs font-mono font-bold border-0 bg-transparent p-0 focus-visible:ring-0 text-center"
                          />
                          <span className="text-xs text-muted-foreground font-bold">s/d</span>
                          <Input
                            type="time"
                            disabled={!day.isOpen}
                            value={day.closeTime}
                            onChange={(e) => handleUpdateDay(idx, "closeTime", e.target.value)}
                            className="h-9 w-24 text-xs font-mono font-bold border-0 bg-transparent p-0 focus-visible:ring-0 text-center"
                          />
                          <span className="text-xs font-bold text-muted-foreground mr-2">WIB</span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApplyToAllDays(day)}
                          className="h-9 px-2.5 text-[11px] font-bold text-muted-foreground hover:text-foreground cursor-pointer rounded-xl shrink-0"
                          title="Samakan jam hari ini ke 7 hari"
                        >
                          Samakan
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL PROFIL & MANUAL SWITCH */}
          {activeTab === "general" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Saklar Utama Buka / Tutup Toko */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Saklar Manual Override (Paksa Buka / Tutup)
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
                    <span>🟢 Paksa TOKO BUKA</span>
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
                    <span>🔴 Paksa TOKO TUTUP</span>
                  </button>
                </div>
              </div>

              {/* Mode Otomatis Checkbox */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAutoSchedule}
                  onChange={(e) => setIsAutoSchedule(e.target.checked)}
                  className="w-5 h-5 rounded-md border-border text-primary accent-primary cursor-pointer"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-foreground block">
                    Aktifkan Mode Jadwal Otomatis 7 Hari
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Menu Digital otomatis buka/tutup sesuai jam operasional masing-masing hari.
                  </span>
                </div>
              </label>

              {/* Pesan Saat Tutup */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Pesan Pemberitahuan Saat Kedai Tutup
                </label>
                <Input
                  type="text"
                  value={closedReason}
                  onChange={(e) => setClosedReason(e.target.value)}
                  placeholder="Contoh: Kedai sedang istirahat. Kembali buka besok jam 08:00 WIB."
                  className="h-11 text-xs sm:text-sm font-medium bg-background rounded-xl w-full"
                />
              </div>

              {/* Profil Toko */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Nama Kedai / Usaha</label>
                  <Input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="h-11 font-bold text-xs sm:text-sm bg-background rounded-xl w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Nomor WA Layanan</label>
                  <Input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="h-11 font-mono font-bold text-xs sm:text-sm bg-background rounded-xl w-full"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-foreground">Alamat Usaha Lengkap</label>
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-11 text-xs sm:text-sm bg-background rounded-xl w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Action Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-3 shrink-0">
            {saveSuccess ? (
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Jadwal Operasional Berhasil Disimpan &amp; Tersinkron Realtime! ✨</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                Disinkronkan otomatis 0ms ke Supabase DB &amp; Menu Digital.
              </span>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 px-6 text-xs sm:text-sm font-bold rounded-xl cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-11 px-8 text-xs sm:text-sm font-extrabold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{saving ? "Menyimpan..." : "Simpan Jadwal 7 Hari ✨"}</span>
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
