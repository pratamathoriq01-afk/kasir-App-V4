"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingCart, ClipboardList, BarChart3, Usb, Bluetooth, Cpu, Clock, Store } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { connectUSBPrinter } from "@/lib/printer/usb-printer";
import { connectBluetoothPrinter } from "@/lib/printer/bluetooth-printer";
import { connectSerialPrinter } from "@/lib/printer/serial-printer";
import {
  fetchStoreSettingsFromDB,
  getStoredStoreSettings,
  subscribePOSSync,
} from "@/lib/data-service";
import { StoreSettings } from "@/types";
import StoreOperationalModal from "@/app/menu/components/StoreOperationalModal";

export default function Navbar() {
  const pathname = usePathname();
  const [usbConnected, setUsbConnected] = useState<boolean>(false);
  const [btConnected, setBtConnected] = useState<boolean>(false);
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const [printerMsg, setPrinterMsg] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Store Operational State
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => getStoredStoreSettings());
  const [isStoreModalOpen, setIsStoreModalOpen] = useState<boolean>(false);

  // Live Realtime Clock Effect & Store Settings Sync
  useEffect(() => {
    fetchStoreSettingsFromDB().then((data) => setStoreSettings(data));

    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(`${dateStr} • ${timeStr} WIB`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);

    const unsubscribe = subscribePOSSync((type, payload) => {
      if (type === "STORE_SETTINGS_UPDATED" && payload) {
        setStoreSettings(payload);
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  // Auto-restore printer connection status on mount / page refresh
  useEffect(() => {
    const autoRestore = async () => {
      const preferred = localStorage.getItem("preferred_printer_method");
      try {
        const { printerManager } = await import("@/lib/printer/printer-manager");
        await printerManager.autoRestorePairedDevices();

        const status = printerManager.getPrinterStatus();
        if (status.isUsb) setUsbConnected(true);
        if (status.isSerial) setSerialConnected(true);
        if (status.isBt) setBtConnected(true);

        if (!status.isUsb && !status.isSerial && !status.isBt && preferred) {
          if (preferred === "usb") setUsbConnected(true);
          if (preferred === "serial") setSerialConnected(true);
          if (preferred === "bluetooth") setBtConnected(true);
        }
      } catch (e) {
        console.warn("Auto restore printer notice:", e);
      }
    };
    autoRestore();
  }, []);

  const handleConnectUsb = async () => {
    try {
      const success = await connectUSBPrinter();
      if (success) {
        setUsbConnected(true);
        localStorage.setItem("preferred_printer_method", "usb");
        setPrinterMsg("USB Terhubung!");
        setTimeout(() => setPrinterMsg(""), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectSerial = async () => {
    try {
      const success = await connectSerialPrinter();
      if (success) {
        setSerialConnected(true);
        localStorage.setItem("preferred_printer_method", "serial");
        setPrinterMsg("Port COM Terhubung!");
        setTimeout(() => setPrinterMsg(""), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectBt = async () => {
    try {
      const success = await connectBluetoothPrinter();
      if (success) {
        setBtConnected(true);
        localStorage.setItem("preferred_printer_method", "bluetooth");
        setPrinterMsg("Bluetooth Terhubung!");
        setTimeout(() => setPrinterMsg(""), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const navLinks = [
    {
      href: "/kasir",
      label: "Kasir (POS)",
      icon: ShoppingCart,
    },
    {
      href: "/menu",
      label: "Kelola Menu",
      icon: ClipboardList,
    },
    {
      href: "/laporan",
      label: "Laporan & AI",
      icon: BarChart3,
    },
  ];

  // Calculate current store status
  const isStoreOpen = storeSettings.isOpen ?? true;
  const openTime = storeSettings.openTime || "08:00";
  const closeTime = storeSettings.closeTime || "22:00";

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white shadow-lg shadow-slate-950/10 border-b border-slate-800/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 shrink-0 bg-white ring-2 ring-amber-500/30">
                <Image
                  src="/logo.png"
                  alt="Kedai Nyamleng Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover"
                  priority
                />
              </div>
              <div>
                <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
                  <span className="truncate max-w-[120px] sm:max-w-none font-extrabold tracking-tight">Kedai Nyamleng</span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                    POS v4
                  </span>
                  
                  {/* Store Operational Status Indicator Button */}
                  <button
                    type="button"
                    onClick={() => setIsStoreModalOpen(true)}
                    className={`cursor-pointer text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 transition-all active:scale-95 ${
                      isStoreOpen
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 animate-pulse"
                    }`}
                    title="Atur Jam Buka / Tutup Operasional Toko"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isStoreOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                    <span>{isStoreOpen ? `Buka (${openTime}-${closeTime})` : "Tutup"}</span>
                  </button>
                </h1>
                {currentTime && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-400/90 font-mono font-medium truncate max-w-[180px] sm:max-w-none">
                    <Clock className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
                    <span className="hidden sm:inline">{currentTime}</span>
                    <span className="sm:hidden">{currentTime.split(" • ")[1] || currentTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Center/Right Section: Hardware Controls, Theme Switcher & Nav */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Printer Hardware Status Controls */}
              <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 dark:bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
                <span className="text-[11px] font-medium text-slate-400 mr-0.5">Printer:</span>
                
                <button
                  type="button"
                  onClick={handleConnectUsb}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    usbConnected
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 border border-slate-600/60"
                  }`}
                  title="Hubungkan Printer Thermal via WebUSB"
                >
                  <Usb className="w-3.5 h-3.5" />
                  <span>{usbConnected ? "USB Aktif" : "Tes USB"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConnectSerial}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    serialConnected
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                      : "bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 border border-slate-600/60"
                  }`}
                  title="Hubungkan Printer Thermal via Web Serial (COM Port)"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{serialConnected ? "COM Aktif" : "Tes COM"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConnectBt}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    btConnected
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 border border-slate-600/60"
                  }`}
                  title="Hubungkan Printer Thermal via Bluetooth"
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>{btConnected ? "BT Aktif" : "Tes BT"}</span>
                </button>

                {printerMsg && (
                  <span className="text-[11px] text-amber-300 font-semibold animate-pulse ml-1">
                    {printerMsg}
                  </span>
                )}
              </div>

              {/* Theme Toggle Button (Light / Dark / System Auto) */}
              <ThemeToggle />

              {/* Navigation Links with Active State & Compact Mobile View */}
              <nav className="flex items-center space-x-1 sm:space-x-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || pathname.startsWith(link.href);

                  const mobileLabel = link.href === "/kasir" ? "Kasir" : link.href === "/menu" ? "Menu" : "Laporan";

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={true}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 transform active:scale-95 cursor-pointer select-none ${
                        isActive
                          ? "bg-emerald-700 text-white dark:bg-amber-400 dark:text-slate-950 shadow-md shadow-emerald-900/30 dark:shadow-amber-500/25 scale-[1.02]"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-800"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white dark:text-slate-950" : "text-amber-400"}`} />
                      <span className="hidden sm:inline">{link.label}</span>
                      <span className="sm:hidden">{mobileLabel}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Store Operational Hours Modal */}
      <StoreOperationalModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
      />
    </>
  );
}

