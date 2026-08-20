"use client";

import { Transaction } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MenuPerformanceTableProps {
  transactions: Transaction[];
}

export default function MenuPerformanceTable({ transactions }: MenuPerformanceTableProps) {
  const itemMap: Record<
    string,
    { name: string; qty: number; grossRevenue: number; netRevenue: number; hpp: number }
  > = {};

  transactions.forEach((t) => {
    const trxGross = t.items.reduce(
      (sum, i) => sum + i.qty * Number(i.priceSnapshot || 0),
      0
    );
    const discountAmount = Number(t.discountAmount || 0);
    const netRatio = trxGross > 0 ? Math.max(0, (trxGross - discountAmount) / trxGross) : 1;

    t.items.forEach((item) => {
      const name = item.nameSnapshot;
      if (!itemMap[name]) {
        itemMap[name] = {
          name,
          qty: 0,
          grossRevenue: 0,
          netRevenue: 0,
          hpp: 0,
        };
      }
      const itemGross = item.qty * Number(item.priceSnapshot || 0);
      const itemNet = Math.round(itemGross * netRatio);

      itemMap[name].qty += item.qty;
      itemMap[name].grossRevenue += itemGross;
      itemMap[name].netRevenue += itemNet;
      itemMap[name].hpp += item.qty * Number(item.hppSnapshot || 0);
    });
  });

  const sortedList = Object.values(itemMap).sort((a, b) => b.netRevenue - a.netRevenue);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden transition-colors">
      <div className="p-4 bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h3 className="font-bold text-foreground text-sm">Analisis Performa Per Menu</h3>
          <p className="text-xs text-muted-foreground">
            Omzet bersih &amp; laba bersih dihitung akurat setelah alokasi diskon voucher.
          </p>
        </div>
        <span className="text-xs text-muted-foreground font-medium">Diurutkan Berdasarkan Omzet Bersih</span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-extrabold text-xs whitespace-nowrap">Nama Menu</TableHead>
              <TableHead className="font-extrabold text-xs text-center whitespace-nowrap">Terjual (Qty)</TableHead>
              <TableHead className="font-extrabold text-xs whitespace-nowrap">Omzet Netto (Rp)</TableHead>
              <TableHead className="font-extrabold text-xs whitespace-nowrap">Total HPP (Rp)</TableHead>
              <TableHead className="font-extrabold text-xs text-right whitespace-nowrap">Laba Bersih (Rp)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Belum ada data item terjual dalam periode ini.
                </TableCell>
              </TableRow>
            ) : (
              sortedList.map((item, idx) => {
                const profit = item.netRevenue - item.hpp;
                return (
                  <TableRow key={idx} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-bold text-foreground">{item.name}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-foreground">
                      {item.qty}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-primary">
                      Rp {item.netRevenue.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      Rp {item.hpp.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-black ${
                      profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                    }`}>
                      {profit >= 0 ? `+Rp ${profit.toLocaleString("id-ID")}` : `-Rp ${Math.abs(profit).toLocaleString("id-ID")}`}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
