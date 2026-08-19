"use client";

import React, { useState } from "react";
import { Transaction } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Printer, CheckCircle2, Clock, Utensils, RefreshCw, ShoppingBag, ArrowRight, Check, Sparkles, AlertCircle } from "lucide-react";

import { printViaWebUSB } from "@/lib/printer/usb-printer";
import { printViaWebSerial } from "@/lib/printer/serial-printer";
import { printViaWebBluetooth } from "@/lib/printer/bluetooth-printer";

interface IncomingOrdersDrawerProps {
  isOpen: boolean;
  orders: Transaction[];
  onClose: () => void;
  onRefresh: () => void;
  onPrintReceipt: (trx: Transaction) => void;
  onUpdateStatus: (trxId: string, status: "IN_PROCESSED" | "ORDER_FINISH" | "CANCELLED") => void;
}

export default function IncomingOrdersDrawer({
  isOpen,
  orders,
  onClose,
  onRefresh,
  onPrintReceipt,
  onUpdateStatus,
}: IncomingOrdersDrawerProps) {
  const [activeTab, setActiveTab] = useState<"NEW_ORDER" | "IN_PROCESSED" | "ORDER_FINISH">("NEW_ORDER");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const showNotificationToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDirectPrint = async (trx: Transaction, mode: "customer" | "kitchen") => {
    const id = trx.id || trx.orderNumber;
    setPrintingId(`${id}-${mode}`);
    showNotificationToast(`🖨️ Mencetak ${mode === "kitchen" ? "Nota Dapur" : "Struk"} #${trx.orderNumber}...`);
    try {
      const success = await printViaWebUSB(trx, mode);
      if (!success) {
        onPrintReceipt(trx);
      }
    } catch (err) {
      console.warn("Direct thermal print notice:", err);
      onPrintReceipt(trx);
    } finally {
      setPrintingId(null);
    }
  };

  // Filter 3 Tabs
  const newOrders = orders.filter(
    (o) => !o.orderStatus || o.orderStatus === "NEW_ORDER" || o.orderStatus === "PENDING" || o.orderStatus === "ORDER_ACCEPTED"
  );
  const inProcessedOrders = orders.filter(
    (o) => o.orderStatus === "IN_PROCESSED" || o.orderStatus === "PROCESSED" || o.orderStatus === "COOKING"
  );
  const finishedOrders = orders.filter(
    (o) => o.orderStatus === "ORDER_FINISH" || o.orderStatus === "COMPLETED" || o.orderStatus === "PAID" || o.orderStatus === "DONE"
  );

  const filteredOrders =
    activeTab === "NEW_ORDER"
      ? newOrders
      : activeTab === "IN_PROCESSED"
      ? inProcessedOrders
      : finishedOrders;

  const handleActionClick = (trx: Transaction, targetStatus: "IN_PROCESSED" | "ORDER_FINISH") => {
    const id = trx.id || trx.orderNumber;
    setProcessingId(id);
    setTimeout(() => {
      onUpdateStatus(id, targetStatus);
      setProcessingId(null);
      if (targetStatus === "IN_PROCESSED") {
        showNotificationToast(`🔥 Pesanan ${trx.orderNumber} diterima & diteruskan ke Dapur!`);
        setActiveTab("IN_PROCESSED");
      } else if (targetStatus === "ORDER_FINISH") {
        showNotificationToast(`✅ Pesanan ${trx.orderNumber} selesai & masuk ke Riwayat Nota!`);
      }
    }, 250);
  };


  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-card text-card-foreground border-border flex flex-col h-full">
        {/* Toast Notifikasi Status Update */}
        {toastMessage && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-emerald-600 text-white font-bold text-xs p-3.5 rounded-2xl shadow-xl border border-emerald-400 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-200 animate-spin" />
              <span>{toastMessage}</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          </div>
        )}

        {/* Drawer Header */}
        <SheetHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 border-amber-500/40 bg-amber-500/20">
                  Real-time DB Sync
                </Badge>
              </div>
              <SheetTitle className="text-sm sm:text-base font-black text-white mt-0.5 tracking-tight truncate">
                Wadah Pesanan Masuk ({orders.length})
              </SheetTitle>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
              title="Refresh Data Supabase"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Clean 3-Tab Bar (1. Baru | 2. Diproses | 3. Selesai) */}
        <div className="p-2 sm:p-3 bg-muted/50 border-b border-border grid grid-cols-3 gap-1.5 sm:gap-2 shrink-0 text-[10px] sm:text-xs">
          <Button
            type="button"
            variant={activeTab === "NEW_ORDER" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("NEW_ORDER")}
            className="font-black text-xs h-9 justify-between cursor-pointer"
          >
            <span className="truncate">1. Baru</span>
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {newOrders.length}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={activeTab === "IN_PROCESSED" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("IN_PROCESSED")}
            className="font-black text-xs h-9 justify-between cursor-pointer"
          >
            <span className="truncate">2. Diproses</span>
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {inProcessedOrders.length}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={activeTab === "ORDER_FINISH" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("ORDER_FINISH")}
            className="font-black text-xs h-9 justify-between cursor-pointer"
          >
            <span className="truncate">3. Selesai</span>
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {finishedOrders.length}
            </Badge>
          </Button>
        </div>

        {/* Orders List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-muted/20">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-card rounded-3xl border border-border p-8 shadow-xs my-auto animate-in fade-in duration-300">
              <Bell className="w-12 h-12 stroke-1 mx-auto mb-2 text-muted-foreground/40 animate-bounce" />
              <p className="font-bold text-foreground text-base">Tidak Ada Pesanan</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                {activeTab === "NEW_ORDER"
                  ? "Belum ada pesanan baru dari Menu Digital v2."
                  : activeTab === "IN_PROCESSED"
                  ? "Tidak ada pesanan yang sedang dimasak di dapur."
                  : "Belum ada riwayat pesanan selesai."}
              </p>
            </div>
          ) : (
            filteredOrders.map((trx) => {
              const statusUpper = (trx.orderStatus || "NEW_ORDER").toUpperCase();
              const isNew = !trx.orderStatus || statusUpper === "NEW_ORDER" || statusUpper === "PENDING" || statusUpper === "ORDER_ACCEPTED";
              const isProcessed = statusUpper === "IN_PROCESSED" || statusUpper === "PROCESSED" || statusUpper === "COOKING";
              const isFinished = statusUpper === "ORDER_FINISH" || statusUpper === "COMPLETED" || statusUpper === "PAID" || statusUpper === "DONE";

              const formattedTime = new Date(trx.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={trx.id}
                  className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md hover:border-primary/50 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  {/* Distinct Color Header Bar for 3 Stages */}
                  <div
                    className={`px-4 py-2.5 flex items-center justify-between font-bold text-xs ${
                      isNew
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950"
                        : isProcessed
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm tracking-tight">
                        {trx.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/20 text-white border border-white/20">
                        {isNew
                          ? "1. BARU"
                          : isProcessed
                          ? "2. DIPROSES"
                          : "3. SELESAI"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono opacity-90">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formattedTime}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    {/* Customer & Table Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 p-2.5 rounded-xl border border-border">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                          Nama Pemesan
                        </span>
                        <span className="font-extrabold text-foreground text-sm">
                          {trx.customerName || "Pelanggan"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                          Tipe / Meja
                        </span>
                        <span className="font-bold text-primary flex items-center gap-1 text-xs">
                          {trx.orderType === "dine-in" ? (
                            <>
                              <Utensils className="w-3.5 h-3.5" /> Meja {trx.tableNumber || "-"}
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" /> Bungkus
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Purchased Menu List */}
                    <div className="space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Daftar Menu ({trx.items?.length || 0}):
                      </span>
                      <div className="divide-y divide-border max-h-36 overflow-y-auto pr-1">
                        {trx.items?.map((item, idx) => (
                          <div key={idx} className="py-1.5 first:pt-0 flex justify-between items-center text-foreground">
                            <span>
                              <strong className="font-mono text-primary mr-1.5 text-sm">{item.qty}x</strong>{" "}
                              {item.nameSnapshot}
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              Rp {(item.priceSnapshot * item.qty).toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                          Total Tagihan
                        </span>
                        <span className="text-base font-black font-mono text-primary">
                          Rp {trx.total.toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Direct 1-Click Print Kitchen Note */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={printingId === `${trx.id || trx.orderNumber}-kitchen`}
                          onClick={() => handleDirectPrint(trx, "kitchen")}
                          className="h-8 font-bold text-[11px] gap-1 px-2 cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-border"
                          title="Cetak Cepat Nota Dapur (1-Click)"
                        >
                          {printingId === `${trx.id || trx.orderNumber}-kitchen` ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                          ) : (
                            <Printer className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>Dapur</span>
                        </Button>

                        {/* Direct 1-Click Print Customer Receipt */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={printingId === `${trx.id || trx.orderNumber}-customer`}
                          onClick={() => handleDirectPrint(trx, "customer")}
                          className="h-8 font-bold text-[11px] gap-1 px-2 cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-border"
                          title="Cetak Cepat Struk Customer (1-Click)"
                        >
                          {printingId === `${trx.id || trx.orderNumber}-customer` ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                          ) : (
                            <Printer className="w-3 h-3 text-amber-500" />
                          )}
                          <span>Struk</span>
                        </Button>

                        {/* 3-Stage Workflow Action Buttons */}
                        {isNew && (
                          <Button
                            size="sm"
                            onClick={() => handleActionClick(trx, "IN_PROCESSED")}
                            disabled={processingId === (trx.id || trx.orderNumber)}
                            className="h-8 font-black text-xs gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          >
                            {processingId === (trx.id || trx.orderNumber) ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Memproses...</span>
                              </>
                            ) : (
                              <>
                                <span>Terima</span>
                                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                              </>
                            )}
                          </Button>
                        )}

                        {isProcessed && (
                          <Button
                            size="sm"
                            onClick={() => handleActionClick(trx, "ORDER_FINISH")}
                            className="h-8 font-black text-xs gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Selesai</span>
                          </Button>
                        )}

                        {isFinished && (
                          <Badge variant="outline" className="py-1 px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="font-mono flex items-center gap-2 text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Supabase DB Connected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 font-bold text-xs bg-slate-800 border-slate-700 text-white hover:bg-slate-700 cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
