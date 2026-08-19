"use client";

import React, { useState, useEffect } from "react";
import { Transaction } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { printViaWebUSB } from "@/lib/printer/usb-printer";
import { printViaWebBluetooth } from "@/lib/printer/bluetooth-printer";
import { printViaWebSerial } from "@/lib/printer/serial-printer";
import { Printer, Check, Usb, Bluetooth, FileText, Loader2, Cpu, Info } from "lucide-react";

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

type PrintMode = "customer" | "kitchen";

export default function ReceiptModal({
  transaction,
  isOpen,
  onClose,
}: ReceiptModalProps) {
  const [activeTab, setActiveTab] = useState<PrintMode>("customer");
  const [isPrinting, setIsPrinting] = useState(false);

  // Guarantee spinner is never stuck on open
  useEffect(() => {
    if (isOpen) {
      setIsPrinting(false);
    }
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const executePrint = async (
    printFn: (trx: Transaction, mode: PrintMode) => Promise<boolean>,
    label: string
  ) => {
    setIsPrinting(true);
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout (3s)")), 3500)
      );
      await Promise.race([printFn(transaction, activeTab), timeoutPromise]);
    } catch (err) {
      console.warn(`Cetak ${label} notice:`, err);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleUsbPrint = () => executePrint(printViaWebUSB, "USB");
  const handleSerialPrint = () => executePrint(printViaWebSerial, "Serial COM");
  const handleBluetoothPrint = () => executePrint(printViaWebBluetooth, "Bluetooth");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-[94vw] sm:w-full p-0 overflow-hidden rounded-3xl border-border shadow-2xl bg-card">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-extrabold text-base text-white">
                Transaksi Berhasil!
              </DialogTitle>
              <p className="text-xs text-slate-400 font-mono">
                Nomor Nota: {transaction.orderNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-4 pt-3 pb-1 bg-muted/40 border-b border-border">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as PrintMode)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full h-10 p-1 bg-muted rounded-xl">
              <TabsTrigger
                value="customer"
                className="text-xs font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Struk Customer</span>
              </TabsTrigger>
              <TabsTrigger
                value="kitchen"
                className="text-xs font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-500" />
                <span>Nota Dapur</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Receipt Preview */}
        <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/80 flex justify-center overflow-y-auto max-h-[46vh]">
          <div
            id="printable-receipt"
            className="bg-white h-full p-4 sm:p-5 rounded-xl shadow-md border border-slate-200 w-[280px] font-mono text-xs text-slate-900 leading-tight select-none"
          >
            {activeTab === "customer" ? (
              <div className="space-y-2">
                {/* Store Header */}
                <div className="text-center pb-2 border-b border-dashed border-slate-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-14 h-14 object-contain mx-auto mb-1 rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <p className="text-[9px] text-slate-600 font-semibold px-1 leading-tight">
                    Jl. Laksada Adi Sucipto Gg.14 No 42, Kel. Blimbing, Malang
                  </p>
                  <p className="text-[10px] font-bold text-slate-800 mt-0.5">
                    Telp/WA: 085113661387
                  </p>
                </div>

                {/* Order Info */}
                <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                  {[
                    ["Nota", transaction.orderNumber],
                    [
                      "Tgl",
                      new Date(transaction.createdAt as string).toLocaleString("id-ID"),
                    ],
                    ["Cust", transaction.customerName || "Pelanggan"],
                    [
                      "Order",
                      transaction.orderType === "dine-in"
                        ? `Dine-In (Meja ${transaction.tableNumber || "-"})`
                        : "Takeaway",
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-slate-500">{label}:</span>
                      <span className="font-bold text-right max-w-[60%] truncate">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div className="py-1 border-b border-dashed border-slate-300 space-y-1.5">
                  {transaction.items.map((item, idx) => (
                    <div key={idx} className="text-[11px]">
                      <div className="font-bold">{item.nameSnapshot}</div>
                      {item.addOnsSnapshot && (
                        <div className="text-[9.5px] text-amber-700 font-bold pl-1">
                          + {item.addOnsSnapshot}
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>
                          {item.qty}x Rp {item.priceSnapshot.toLocaleString("id-ID")}
                        </span>
                        <span className="font-bold text-slate-800">
                          Rp {(item.qty * item.priceSnapshot).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="text-[10px] space-y-0.5 pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp {transaction.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  {transaction.discountAmount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Diskon:</span>
                      <span>
                        -Rp {transaction.discountAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Pajak (10%):</span>
                    <span>Rp {transaction.tax.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black border-t border-slate-800 pt-1 mt-1">
                    <span>TOTAL:</span>
                    <span>Rp {transaction.total.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span>Tunai:</span>
                    <span>Rp {transaction.cashReceived.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembali:</span>
                    <span>
                      Rp {(transaction.cashReceived - transaction.total).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Footer Message */}
                <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px]">
                  <p className="font-bold">Matur Nuwun Sanget ! 😊</p>
                  <p className="text-slate-600">Kedai Nyamleng 💖</p>
                </div>
              </div>
            ) : (
              /* Kitchen Receipt */
              <div className="space-y-3">
                <div className="text-center pb-2 border-b border-slate-800">
                  <h4 className="font-black text-sm uppercase">NOTA DAPUR</h4>
                  <p className="text-xs font-bold text-slate-700">
                    # {transaction.orderNumber}
                  </p>
                </div>
                <div className="text-[11px] space-y-1">
                  <p>
                    Tipe: <strong className="uppercase">{transaction.orderType}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(transaction.createdAt as string).toLocaleTimeString("id-ID")}
                  </p>
                </div>
                <div className="space-y-2 py-2 border-b border-slate-300">
                  {transaction.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-0.5 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-xs border-2 border-slate-600 block shrink-0" />
                        <span className="text-amber-700 font-black text-base">
                          {item.qty}x
                        </span>
                        <span className="uppercase">{item.nameSnapshot}</span>
                      </div>
                      {item.addOnsSnapshot && (
                        <span className="text-[10px] text-slate-500 font-bold pl-6">
                          * Add-On: {item.addOnsSnapshot}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center text-[10px] text-slate-500 pt-1">
                  <p>Cust: {transaction.customerName || "Pelanggan"}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Print Action Buttons */}
        <div className="p-4 bg-muted/30 border-t border-border space-y-2.5">
          {/* First Time Setup Tip */}
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 leading-tight flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Tips Setup Awal:</strong> Pilih port <em>RPP02N / COM3</em> 1x di dialog awal. Setelahnya, USB &amp; Serial COM mencetak <strong>otomatis 100% tanpa dialog</strong>!
            </span>
          </div>

          {isPrinting && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-amber-600 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mencetak Struk... Mohon tunggu</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleBrowserPrint}
              disabled={isPrinting}
              className="h-14 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-xs"
              title="Cetak via Driver Spooler Windows"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Browser Print</span>
            </Button>

            <Button
              type="button"
              onClick={handleUsbPrint}
              disabled={isPrinting}
              className="h-14 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs"
              title="Cetak Langsung via WebUSB / USB Serial Bridge"
            >
              <Usb className="w-4 h-4" />
              <span>USB Thermal</span>
            </Button>

            <Button
              type="button"
              onClick={handleSerialPrint}
              disabled={isPrinting}
              className="h-14 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
              title="Cetak via Web Serial COM Port"
            >
              <Cpu className="w-4 h-4" />
              <span>Serial COM</span>
            </Button>

            <Button
              type="button"
              onClick={handleBluetoothPrint}
              disabled={isPrinting}
              className="h-14 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              title="Cetak via Web Bluetooth BLE"
            >
              <Bluetooth className="w-4 h-4" />
              <span>Bluetooth</span>
            </Button>
          </div>

          <Button
            type="button"
            onClick={onClose}
            className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl text-xs transition-all shadow-md active:scale-[0.99]"
          >
            Selesai &amp; Pesanan Baru
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
