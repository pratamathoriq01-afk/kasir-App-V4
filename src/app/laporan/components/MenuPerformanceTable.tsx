"use client";

import { Transaction } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MenuPerformanceTableProps {
  transactions: Transaction[];
}

export default function MenuPerformanceTable({ transactions }: MenuPerformanceTableProps) {
  const itemMap: Record<
    string,
    { name: string; qty: number; revenue: number; hpp: number }
  > = {};

  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!itemMap[item.nameSnapshot]) {
        itemMap[item.nameSnapshot] = {
          name: item.nameSnapshot,
          qty: 0,
          revenue: 0,
          hpp: 0,
        };
      }
      itemMap[item.nameSnapshot].qty += item.qty;
      itemMap[item.nameSnapshot].revenue += item.qty * item.priceSnapshot;
      itemMap[item.nameSnapshot].hpp += item.qty * item.hppSnapshot;
    });
  });

  const sortedList = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden transition-colors">
      <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-foreground text-sm">Analisis Performa Per Menu</h3>
        <span className="text-xs text-muted-foreground font-medium">Diurutkan Berdasarkan Omzet</span>
      </div>

      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-extrabold text-xs">Nama Menu</TableHead>
            <TableHead className="font-extrabold text-xs text-center">Terjual (Qty)</TableHead>
            <TableHead className="font-extrabold text-xs">Total Omzet (Rp)</TableHead>
            <TableHead className="font-extrabold text-xs">Total HPP (Rp)</TableHead>
            <TableHead className="font-extrabold text-xs text-right">Laba Bersih (Rp)</TableHead>
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
              const profit = item.revenue - item.hpp;
              return (
                <TableRow key={idx} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-bold text-foreground">{item.name}</TableCell>
                  <TableCell className="text-center font-mono font-bold text-foreground">
                    {item.qty}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-primary">
                    Rp {item.revenue.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    Rp {item.hpp.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +Rp {profit.toLocaleString("id-ID")}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

