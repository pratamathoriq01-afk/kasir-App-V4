import { Transaction } from "@/types";

// OAuth 2.0 Client Credential
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "815527702419-o2hfl7mo9i3onb96urr7dr0hlbun72uf.apps.googleusercontent.com";

export function getGoogleOAuthRedirectUri(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/oauth2callback`;
  }
  return "https://app-kasir-kedai-nyamleng.vercel.app/oauth2callback";
}

export function triggerGoogleOAuthConnect() {
  const clientId = GOOGLE_CLIENT_ID;
  const redirectUri = encodeURIComponent(getGoogleOAuthRedirectUri());
  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file"
  );
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&include_granted_scopes=true`;

  window.location.href = authUrl;
}

/**
 * Export Transactions directly formatted for Google Sheets
 * Builds a UTF-8 BOM CSV compatible with Google Sheets & opens Google Sheets web importer
 */
export async function exportTransactionsToGoogleSheets(
  transactions: Transaction[],
  periodLabel: string = "Semua Periode"
) {
  // Computed KPIs
  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
  const totalHpp = transactions.reduce((s, t) => s + t.hppTotal, 0);
  const totalNetProfit = transactions.reduce((s, t) => s + t.netProfit, 0);
  const totalTax = transactions.reduce((s, t) => s + t.tax, 0);
  const totalDiscount = transactions.reduce((s, t) => s + t.discountAmount, 0);
  const txCount = transactions.length;

  const rows: string[][] = [];

  // Header Banner
  rows.push(["KEDAI NYAMLENG — LAPORAN PENJUALAN & AUDIT KEUANGAN"]);
  rows.push(["Alamat: Jl. Laksada Adi Sucipto Gg.14 No 42 Malang | WA: 085113661387"]);
  rows.push([`Periode Laporan: ${periodLabel}`, `Dicetak: ${new Date().toLocaleString("id-ID")}`]);
  rows.push([]);

  // Executive Summary Box
  rows.push(["SUMMARY EXECUTIVE AUDIT"]);
  rows.push(["Total Omzet Kotor (Revenue)", `Rp ${totalRevenue.toLocaleString("id-ID")}`]);
  rows.push(["Total Biaya Modal (HPP)", `Rp ${totalHpp.toLocaleString("id-ID")}`]);
  rows.push(["Total Laba Bersih (Net Profit)", `Rp ${totalNetProfit.toLocaleString("id-ID")}`]);
  rows.push(["Total Pajak Resto 10%", `Rp ${totalTax.toLocaleString("id-ID")}`]);
  rows.push(["Total Diskon Promo Terpakai", `Rp ${totalDiscount.toLocaleString("id-ID")}`]);
  rows.push(["Total Volume Transaksi", `${txCount} Nota`]);
  rows.push([]);

  // Transactions Table Header
  rows.push([
    "No. Nota",
    "Tanggal & Waktu",
    "Nama Pelanggan",
    "Tipe Order",
    "Meja",
    "Metode Pembayaran",
    "Subtotal (Rp)",
    "Diskon (Rp)",
    "Pajak 10% (Rp)",
    "Total Omzet (Rp)",
    "Biaya Modal HPP (Rp)",
    "Laba Bersih (Rp)",
    "Status Pesanan",
  ]);

  // Transactions Data Rows
  transactions.forEach((t) => {
    const tDate = new Date(t.createdAt).toLocaleString("id-ID");
    const orderTypeStr = t.orderType === "dine-in" ? "Dine-In" : "Takeaway";
    
    rows.push([
      t.orderNumber,
      tDate,
      t.customerName || "Pelanggan Umum",
      orderTypeStr,
      t.tableNumber || "-",
      t.paymentMethod || "QRIS",
      t.subtotal.toString(),
      t.discountAmount.toString(),
      t.tax.toString(),
      t.total.toString(),
      t.hppTotal.toString(),
      t.netProfit.toString(),
      t.orderStatus || "SELESAI",
    ]);
  });

  // Summary Totals Row
  rows.push([]);
  rows.push([
    "TOTAL KESELURUHAN",
    "-",
    "-",
    "-",
    "-",
    "-",
    transactions.reduce((s, t) => s + t.subtotal, 0).toString(),
    totalDiscount.toString(),
    totalTax.toString(),
    totalRevenue.toString(),
    totalHpp.toString(),
    totalNetProfit.toString(),
    "LUNAS",
  ]);

  // Convert to CSV with UTF-8 BOM
  const csvContent =
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((cell) => {
            const escaped = cell.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      )
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const fileName = `Kedai_Nyamleng_Laporan_GoogleSheets_${new Date().toISOString().slice(0, 10)}.csv`;

  // Download file locally first
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Automatically open Google Sheets Web Importer
  setTimeout(() => {
    window.open("https://docs.google.com/spreadsheets/u/0/?tgif=c", "_blank");
  }, 600);
}
