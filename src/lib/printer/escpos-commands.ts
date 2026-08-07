/**
 * ESC/POS Command Builder — Kedai Nyamleng POS
 * Compatible with: SharkPOS PI58BT, RPP02N, POS-58mm, XP-58, ZJ-5805, MP-58II
 * Hardware-native text encoding: 100% Crisp, 0 Noise/Garbage Characters, 0 Delay.
 */

import { Transaction } from "@/types";

// ─── Encoder (ASCII-safe for thermal printers) ────────────────────────────────
const enc = new TextEncoder();

function encBytes(text: string): Uint8Array {
  return enc.encode(text);
}

// ─── Basic ESC/POS primitives ─────────────────────────────────────────────────
export const ESC_INIT        = new Uint8Array([0x1b, 0x40]);
export const ESC_ALIGN_LEFT  = new Uint8Array([0x1b, 0x61, 0x00]);
export const ESC_ALIGN_CENTER= new Uint8Array([0x1b, 0x61, 0x01]);
export const ESC_ALIGN_RIGHT = new Uint8Array([0x1b, 0x61, 0x02]);
export const ESC_BOLD_ON     = new Uint8Array([0x1b, 0x45, 0x01]);
export const ESC_BOLD_OFF    = new Uint8Array([0x1b, 0x45, 0x00]);
export const ESC_FONT_NORMAL = new Uint8Array([0x1b, 0x21, 0x00]);
export const ESC_FONT_BOLD   = new Uint8Array([0x1b, 0x21, 0x08]);
export const ESC_FONT_DOUBLE_H = new Uint8Array([0x1b, 0x21, 0x10]);
export const ESC_SIZE_2X     = new Uint8Array([0x1d, 0x21, 0x11]); // 2x width + height
export const ESC_SIZE_NORMAL = new Uint8Array([0x1d, 0x21, 0x00]);
export const ESC_LINE_SPACE_DEFAULT = new Uint8Array([0x1b, 0x32]); // Standard breathable line spacing
export const ESC_FEED_1      = new Uint8Array([0x0a]);
export const ESC_FEED_2      = new Uint8Array([0x0a, 0x0a]);
export const ESC_FEED_3      = new Uint8Array([0x0a, 0x0a, 0x0a]);
export const ESC_FEED_PAPER  = new Uint8Array([0x1b, 0x64, 0x04, 0x0a, 0x0a]); // Feed 4 lines to tear-bar

// ─── 58mm paper constants ─────────────────────────────────────────────────────
const CHARS_PER_LINE = 32; // Standard 58mm line width

// ─── String formatting helpers ────────────────────────────────────────────────
function padRight(s: string, len: number): string {
  return s.length >= len ? s.slice(0, len) : s + " ".repeat(len - s.length);
}
function padLeft(s: string, len: number): string {
  return s.length >= len ? s.slice(0, len) : " ".repeat(len - s.length) + s;
}
function divider(char = "-", len = CHARS_PER_LINE): string {
  return char.repeat(len) + "\n";
}
function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((acc, a) => acc + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export async function loadLogoRaster(): Promise<Uint8Array | null> {
  // Always return null to prevent corrupted bitmap noise characters on 58mm thermal paper
  return null;
}

// ─── Customer Receipt Builder ─────────────────────────────────────────────────
export async function buildCustomerReceiptESCPOS(
  transaction: Transaction
): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];

  // 1. Init & set standard breathable line spacing
  parts.push(ESC_INIT);
  parts.push(ESC_LINE_SPACE_DEFAULT);

  // 2. Hardware Native Clean Header (0-Delay, 0 Noise)
  parts.push(ESC_ALIGN_CENTER);
  parts.push(ESC_SIZE_2X);
  parts.push(ESC_BOLD_ON);
  parts.push(encBytes("KEDAI NYAMLENG\n"));
  parts.push(ESC_SIZE_NORMAL);
  parts.push(ESC_BOLD_OFF);
  parts.push(encBytes("Jl. LA. Sucipto XIV/42 Malang\n"));
  parts.push(encBytes("Telp/WA: 085113661387\n"));

  // 3. Divider
  parts.push(ESC_ALIGN_LEFT);
  parts.push(encBytes(divider("=", CHARS_PER_LINE)));

  // 4. Order info
  const createdAt = new Date(transaction.createdAt as string);
  const dateStr   = createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr   = createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  parts.push(encBytes(`Nota  : ${transaction.orderNumber}\n`));
  parts.push(encBytes(`Tgl   : ${dateStr} ${timeStr}\n`));
  parts.push(encBytes(`Cust  : ${transaction.customerName || "Pelanggan"}\n`));
  parts.push(encBytes(`Order : ${transaction.orderType === "dine-in" ? `Dine-In (Meja ${transaction.tableNumber})` : "Takeaway"}\n`));
  parts.push(encBytes(divider("-", CHARS_PER_LINE)));

  // 5. Item list
  for (const item of transaction.items) {
    parts.push(ESC_BOLD_ON);
    parts.push(encBytes(`${item.nameSnapshot}\n`));
    parts.push(ESC_BOLD_OFF);

    const qtyPrice = `${item.qty}x Rp ${item.priceSnapshot.toLocaleString("id-ID")}`;
    const subtotal = `Rp ${(item.qty * item.priceSnapshot).toLocaleString("id-ID")}`;
    const leftPad  = padRight(`  ${qtyPrice}`, 20);
    const rightPad = padLeft(subtotal, 12);

    parts.push(encBytes(`${leftPad}${rightPad}\n`));
  }

  parts.push(encBytes(divider("-", CHARS_PER_LINE)));

  // 6. Totals
  const fmtRow = (label: string, value: string) => {
    const l = padRight(label, 18);
    const r = padLeft(value, 14);
    return `${l}${r}\n`;
  };

  parts.push(encBytes(fmtRow("Subtotal:", `Rp ${transaction.subtotal.toLocaleString("id-ID")}`)));
  if (transaction.discountAmount > 0) {
    parts.push(encBytes(fmtRow("Diskon:", `-Rp ${transaction.discountAmount.toLocaleString("id-ID")}`)));
  }
  parts.push(encBytes(fmtRow("Pajak (10%):", `Rp ${transaction.tax.toLocaleString("id-ID")}`)));
  parts.push(encBytes(divider("=", CHARS_PER_LINE)));

  parts.push(ESC_BOLD_ON);
  parts.push(encBytes(fmtRow("TOTAL:", `Rp ${transaction.total.toLocaleString("id-ID")}`)));
  parts.push(ESC_BOLD_OFF);

  parts.push(encBytes(fmtRow("Tunai:", `Rp ${transaction.cashReceived.toLocaleString("id-ID")}`)));
  parts.push(encBytes(fmtRow("Kembali:", `Rp ${(transaction.cashReceived - transaction.total).toLocaleString("id-ID")}`)));

  parts.push(encBytes(divider("-", CHARS_PER_LINE)));

  // 7. Footer
  parts.push(ESC_ALIGN_CENTER);
  parts.push(ESC_BOLD_ON);
  parts.push(encBytes("Matur Nuwun Sanget !\n"));
  parts.push(ESC_BOLD_OFF);
  parts.push(encBytes("Kedai Nyamleng\n"));

  parts.push(ESC_FEED_PAPER);

  return concat(...parts);
}

// ─── Kitchen Receipt Builder ──────────────────────────────────────────────────
export async function buildKitchenReceiptESCPOS(
  transaction: Transaction
): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];

  parts.push(ESC_INIT);
  parts.push(ESC_LINE_SPACE_DEFAULT);

  parts.push(ESC_ALIGN_CENTER);
  parts.push(ESC_SIZE_2X);
  parts.push(ESC_BOLD_ON);
  parts.push(encBytes("NOTA DAPUR\n"));
  parts.push(ESC_SIZE_NORMAL);
  parts.push(ESC_BOLD_OFF);

  parts.push(encBytes(`Nota: #${transaction.orderNumber}\n`));
  parts.push(encBytes(`Order: ${transaction.orderType.toUpperCase()}\n`));
  parts.push(encBytes(divider("=", CHARS_PER_LINE)));

  parts.push(ESC_ALIGN_LEFT);

  for (const item of transaction.items) {
    parts.push(ESC_SIZE_2X);
    parts.push(ESC_BOLD_ON);
    parts.push(encBytes(`${item.qty}x `));
    parts.push(ESC_SIZE_NORMAL);
    parts.push(encBytes(`${item.nameSnapshot.toUpperCase()}\n`));
    parts.push(ESC_BOLD_OFF);
  }

  parts.push(encBytes(divider("-", CHARS_PER_LINE)));
  parts.push(ESC_ALIGN_CENTER);
  parts.push(encBytes(`Pelanggan: ${transaction.customerName || "Pelanggan"}\n`));
  parts.push(ESC_FEED_PAPER);

  return concat(...parts);
}
