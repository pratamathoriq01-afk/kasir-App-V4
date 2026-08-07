"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ShoppingCart, ClipboardList, BarChart3, Usb, Bluetooth } from "lucide-react";
import { printViaWebUSB } from "@/lib/printer/usb-printer";
import { printViaWebBluetooth } from "@/lib/printer/bluetooth-printer";
import { Transaction } from "@/types";

export default function Navbar() {
  const pathname = usePathname();
  const [usbConnected, setUsbConnected] = useState<boolean>(false);
  const [btConnected, setBtConnected] = useState<boolean>(false);
  const [printerMsg, setPrinterMsg] = useState<string>("");

  // Minimal test transaction for printer connectivity check
  const TEST_TRANSACTION: Transaction = {
    id: "test-001",
    orderNumber: "TES-001",
    customerName: "Test Print",
    orderType: "dine-in",
    tableNumber: "-",
    subtotal: 15000,
    discountType: null,
    discountValue: 0,
    discountAmount: 0,
    tax: 1500,
    total: 16500,
    hppTotal: 7000,
    netProfit: 8000,
    cashReceived: 20000,
    change: 3500,
    createdAt: new Date().toISOString(),
    items: [{ nameSnapshot: "TES PRINT — KEDAI NYAMLENG", priceSnapshot: 15000, hppSnapshot: 7000, qty: 1 }],
  };

  const handleConnectUsb = async () => {
    try {
      const success = await printViaWebUSB(TEST_TRANSACTION, "customer");
      if (success) {
        setUsbConnected(true);
        setPrinterMsg("USB Terhubung & Tes Cetak OK!");
        setTimeout(() => setPrinterMsg(""), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectBt = async () => {
    try {
      const success = await printViaWebBluetooth(TEST_TRANSACTION, "customer");
      if (success) {
        setBtConnected(true);
        setPrinterMsg("Bluetooth Terhubung & Tes Cetak OK!");
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
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Kedai Nyamleng
                <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                  POS v4
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Jl. LA. Sucipto XIV/42, Kota Malang
              </p>
            </div>
          </div>

          {/* Center: Printer Hardware Status Controls */}
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
              title="Hubungkan Printer Thermal via USB"
            >
              <Usb className="w-3.5 h-3.5" />
              <span>{usbConnected ? "USB Aktif" : "Tes USB"}</span>
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

          {/* Navigation Links with Active State & Tactile Press Animations */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 transform active:scale-95 cursor-pointer select-none ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-amber-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
