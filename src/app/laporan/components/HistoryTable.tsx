"use client";

import React, { useState } from "react";
import { Transaction } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface HistoryTableProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export default function HistoryTable({
  transactions,
  onDeleteTransaction,
}: HistoryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden transition-colors">
      <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-foreground text-sm">Tabel Riwayat Transaksi</h3>
        <span className="text-xs text-muted-foreground font-medium">{transactions.length} Transaksi</span>
      </div>

      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-extrabold text-xs">Nota / Waktu</TableHead>
            <TableHead className="font-extrabold text-xs">Customer</TableHead>
            <TableHead className="font-extrabold text-xs">Tipe Pesanan</TableHead>
            <TableHead className="font-extrabold text-xs">Omzet Total</TableHead>
            <TableHead className="font-extrabold text-xs">Laba Bersih</TableHead>
            <TableHead className="font-extrabold text-xs text-center">Detail</TableHead>
            <TableHead className="font-extrabold text-xs text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Belum ada riwayat transaksi.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((t) => {
              const isExpanded = expandedId === t.id;
              return (
                <React.Fragment key={t.id}>
                  <TableRow className="hover:bg-muted/40 transition-colors">
                    <TableCell className="py-3">
                      <span className="font-bold font-mono text-foreground block">
                        {t.orderNumber}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(t.createdAt).toLocaleString("id-ID")}
                      </span>
                    </TableCell>

                    <TableCell className="font-semibold text-foreground">
                      {t.customerName || "Pelanggan"}
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase">
                        {t.orderType}{" "}
                        {t.orderType === "dine-in" ? `(${t.tableNumber})` : ""}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-bold font-mono text-primary">
                      Rp {t.total.toLocaleString("id-ID")}
                    </TableCell>

                    <TableCell className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      +Rp {t.netProfit.toLocaleString("id-ID")}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => toggleExpand(t.id)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDeleteTransaction(t.id)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={7} className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider">
                            Rincian Item Transaksi:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                            {t.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-card p-2.5 rounded-xl border border-border flex justify-between items-center"
                              >
                                <span className="font-semibold text-foreground">
                                  {item.qty}x {item.nameSnapshot}
                                </span>
                                <span className="font-mono text-muted-foreground">
                                  @ Rp {item.priceSnapshot.toLocaleString("id-ID")} = Rp{" "}
                                  {(item.qty * item.priceSnapshot).toLocaleString("id-ID")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

