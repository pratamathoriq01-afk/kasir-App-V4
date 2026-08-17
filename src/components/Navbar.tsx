"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingCart, ClipboardList, BarChart3, Usb, Bluetooth, Cpu, Clock } from "lucide-react";
import { connectUSBPrinter, printViaWebUSB } from "@/lib/printer/usb-printer";
import { connectBluetoothPrinter, printViaWebBluetooth } from "@/lib/printer/bluetooth-printer";
import { connectSerialPrinter, printViaWebSerial } from "@/lib/printer/serial-printer";
import { Transaction } from "@/types";

export default function Navbar() {
  const pathname = usePathname();
  const [usbConnected, setUsbConnected] = useState<boolean>(false);
  const [btConnected, setBtConnected] = useState<boolean>(false);
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const [printerMsg, setPrinterMsg] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Live Realtime Clock Effect
  useEffect(() => {
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
    return () => clearInterval(timer);
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

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 shrink-0 bg-white">
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
                <span className="truncate max-w-[120px] sm:max-w-none">Kedai Nyamleng</span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                  POS v4
                </span>
                <span className="hidden sm:inline-flex bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Core v2 Online
                </span>
              </h1>
              {currentTime && (
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-400 font-mono font-medium truncate max-w-[180px] sm:max-w-none">
                  <Clock className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
                  <span className="hidden sm:inline">{currentTime}</span>
                  <span className="sm:hidden">{currentTime.split(" • ")[1] || currentTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Printer Hardware Status Controls */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Thermal Printer:</span>
            
            <button
              type="button"
              onClick={handleConnectUsb}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                usbConnected
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600"
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
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600"
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
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600"
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
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 transform active:scale-95 cursor-pointer select-none ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-950" : "text-amber-400"}`} />
                  <span className="hidden sm:inline">{link.label}</span>
                  <span className="sm:hidden">{mobileLabel}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
