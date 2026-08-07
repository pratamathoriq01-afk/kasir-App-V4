/**
 * ESC/POS Command Builder — Kedai Nyamleng POS
 * Compatible with: SharkPOS PI58BT, POS-58mm, XP-58, ZJ-5805, MP-58II
 */

import { Transaction } from "@/types";

// ─── Encoder (ASCII-safe + Latin1 for Indonesian chars) ──────────────────────
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
export const ESC_LINE_SPACE_DEFAULT = new Uint8Array([0x1b, 0x32]); // Standard 30-dot spacing (breathable text)
export const ESC_LINE_SPACE_WIDE    = new Uint8Array([0x1b, 0x33, 34]); // 34-dot wide spacing
export const ESC_FEED_1      = new Uint8Array([0x0a]);
export const ESC_FEED_2      = new Uint8Array([0x0a, 0x0a]);
export const ESC_FEED_3      = new Uint8Array([0x0a, 0x0a, 0x0a]);
export const ESC_FEED_PAPER = new Uint8Array([0x1b, 0x64, 0x04, 0x0a, 0x0a]); // Feed 4 lines to tear-bar
export const ESC_CUT_PARTIAL = new Uint8Array([0x1b, 0x64, 0x04, 0x0a, 0x0a]);

// ─── 58mm paper constants ─────────────────────────────────────────────────────
const PAPER_WIDTH_DOTS = 384; // 58mm paper @ 8 dots/mm
const CHARS_PER_LINE   = 32;  // usable chars at normal font

// ─── String helpers ───────────────────────────────────────────────────────────
function padRight(s: string, len: number): string {
  return s.length >= len ? s.slice(0, len) : s + " ".repeat(len - s.length);
}
function padLeft(s: string, len: number): string {
  return s.length >= len ? s.slice(0, len) : " ".repeat(len - s.length) + s;
}
function centerText(s: string, len: number): string {
  if (s.length >= len) return s.slice(0, len);
  const pad = Math.floor((len - s.length) / 2);
  return " ".repeat(pad) + s + " ".repeat(len - s.length - pad);
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

// ─── Logo raster loader ───────────────────────────────────────────────────────
export async function loadLogoRaster(maxWidth = 200): Promise<Uint8Array | null> {
  if (typeof window === "undefined") return null;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/logo.png";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const aspect = img.height / img.width;
    const targetWidth = Math.min(maxWidth, PAPER_WIDTH_DOTS);
    const targetHeight = Math.round(targetWidth * aspect);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const pixels = imgData.data;

    const widthBytes = Math.ceil(targetWidth / 8);
    const bitmap = new Uint8Array(widthBytes * targetHeight);

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const idx = (y * targetWidth + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luminance < 140) {
          const byteIdx = y * widthBytes + Math.floor(x / 8);
          const bitPos = 7 - (x % 8);
          bitmap[byteIdx] |= 1 << bitPos;
        }
      }
    }

    const xL = widthBytes & 0xff;
    const xH = (widthBytes >> 8) & 0xff;
    const yL = targetHeight & 0xff;
    const yH = (targetHeight >> 8) & 0xff;

    const header = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
    return concat(ESC_ALIGN_CENTER, header, bitmap, ESC_FEED_1);
  } catch (err) {
    console.warn("Could not load logo raster:", err);
    return null;
  }
}

// ─── Customer Receipt Builder ─────────────────────────────────────────────────
export async function buildCustomerReceiptESCPOS(
  transaction: Transaction,
  logoRaster: Uint8Array | null = null
): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];

  // 1. Init & set standard breathable line spacing
  parts.push(ESC_INIT);
  parts.push(ESC_LINE_SPACE_DEFAULT);

  // 2. Logo
  if (logoRaster) {
    parts.push(logoRaster);
  }

  // 3. Header
  parts.push(ESC_ALIGN_CENTER);
  parts.push(ESC_FONT_NORMAL);
  parts.push(encBytes("Jl. LA. Sucipto XIV/42 Malang\n"));
  parts.push(encBytes("Telp/WA: 085113661387\n"));

  // 4. Divider
  parts.push(ESC_ALIGN_LEFT);
  parts.push(encBytes(divider("=", CHARS_PER_LINE)));

  // 5. Order info
  parts.push(ESC_FONT_NORMAL);
  const createdAt = new Date(transaction.createdAt as string);
  const dateStr   = createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr   = createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  parts.push(encBytes(`Nota  : ${transaction.orderNumber}\n`));
  parts.push(encBytes(`Tgl   : ${dateStr} ${timeStr}\n`));
  parts.push(encBytes(`Cust  : ${transaction.customerName || "Pelanggan"}\n`));
  parts.push(encBytes(`Order : ${transaction.orderType === "dine-in" ? `Dine-In (Meja ${transaction.tableNumber || "-"})` : "Takeaway / Bungkus"}\n`));
  parts.push(encBytes(divider("-", CHARS_PER_LINE)));

  // 6. Items
  transaction.items.forEach((item) => {
    const itemTotal = item.priceSnapshot * item.qty;
    parts.push(ESC_BOLD_ON);
    parts.push(encBytes(`${item.nameSnapshot.slice(0, CHARS_PER_LINE)}\n`));
    parts.push(ESC_BOLD_OFF);
    const qtyLine = `  ${item.qty}x @${item.priceSnapshot.toLocaleString("id-ID")}`;
    const totalRight = `Rp ${itemTotal.toLocaleString("id-ID")}`;
    const spacer = " ".repeat(Math.max(1, CHARS_PER_LINE - qtyLine.length - totalRight.length));
    parts.push(encBytes(`${qtyLine}${spacer}${totalRight}\n`));
  });

  parts.push(encBytes(divider("-", CHARS_PER_LINE)));

  // 7. Totals
  const addRow = (label: string, val: string, bold = false) => {
    const row = `${padRight(label, CHARS_PER_LINE - val.length - 1)}${val}`;
    if (bold) {
      parts.push(ESC_BOLD_ON);
      parts.push(encBytes(row + "\n"));
      parts.push(ESC_BOLD_OFF);
    } else {
      parts.push(encBytes(row + "\n"));
    }
  };

  addRow("Subtotal:", `Rp ${transaction.subtotal.toLocaleString("id-ID")}`);
  if (transaction.discountAmount > 0) {
    addRow("Diskon:", `-Rp ${transaction.discountAmount.toLocaleString("id-ID")}`);
  }
  addRow(`Pajak (10%):`, `Rp ${transaction.tax.toLocaleString("id-ID")}`);
  parts.push(encBytes(divider("=", CHARS_PER_LINE)));
  addRow("TOTAL:", `Rp ${transaction.total.toLocaleString("id-ID")}`, true);
  parts.push(encBytes(divider("-", CHARS_PER_LINE)));
  addRow("Tunai:", `Rp ${transaction.cashReceived.toLocaleString("id-ID")}`);
  addRow("Kembali:", `Rp ${transaction.change.toLocaleString("id-ID")}`);
  parts.push(encBytes(divider("=", CHARS_PER_LINE)));

  // 8. Footer (Optimized clean text)
  parts.push(ESC_FEED_1);
  parts.push(ESC_ALIGN_CENTER);
  parts.push(ESC_BOLD_ON);
  parts.push(encBytes("Matur Nuwun Sanget !\n"));
  parts.push(ESC_BOLD_OFF);
  parts.push(encBytes("Kedai Nyamleng\n"));
  parts.push(ESC_FEED_2);

  // 9. Paper feed to tear-bar
  parts.push(ESC_FEED_PAPER);

  return concat(...parts);
}

// ─── Kitchen Note Builder ─────────────────────────────────────────────────────
export async function buildKitchenReceiptESCPOS(
  transaction: Transaction,
): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];

  parts.push(ESC_INIT);
  parts.push(ESC_LINE_SPACE_DEFAULT);
  parts.push(ESC_ALIGN_CENTER);
  parts.push(ESC_BOLD_ON);
  parts.push(ESC_SIZE_2X);
  parts.push(encBytes("NOTA DAPUR\n"));
  parts.push(ESC_SIZE_NORMAL);
  parts.push(ESC_BOLD_OFF);
  parts.push(encBytes(divider("=", CHARS_PER_LINE)));

  parts.push(ESC_ALIGN_LEFT);
  parts.push(ESC_BOLD_ON);
  parts.push(encBytes(`Nota: ${transaction.orderNumber}\n`));
  parts.push(ESC_BOLD_OFF);

  const timeStr = new Date(transaction.createdAt as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  parts.push(encBytes(`Pukul: ${timeStr}\n`));
  parts.push(encBytes(`Tipe : ${transaction.orderType === "dine-in" ? `DINE-IN MEJA ${transaction.tableNumber || "-"}` : "TAKEAWAY"}\n`));
  parts.push(encBytes(`Cust : ${transaction.customerName || "Pelanggan"}\n`));
  parts.push(encBytes(divider("-", CHARS_PER_LINE)));

  transaction.items.forEach((item) => {
    parts.push(ESC_SIZE_2X);
    parts.push(ESC_BOLD_ON);
    parts.push(encBytes(`[ ] ${item.qty}x\n`));
    parts.push(ESC_SIZE_NORMAL);
    parts.push(ESC_BOLD_OFF);
    parts.push(encBytes(`    ${item.nameSnapshot.toUpperCase().slice(0, 28)}\n`));
  });

  parts.push(encBytes(divider("=", CHARS_PER_LINE)));
  parts.push(ESC_FEED_2);
  parts.push(ESC_FEED_PAPER);

  return concat(...parts);
}
