/**
 * ESC/POS Command Builder — Kedai Nyamleng POS
 * Compatible with: SharkPOS PI58BT, RPP02N, POS-58mm, XP-58, ZJ-5805, MP-58II
 * Standard ESC/POS Column Mode (ESC * 33) Logo Printing with In-Memory Pre-Caching (0ms Delay).
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
export const ESC_SIZE_NORMAL = new Uint8Array([0x1d, 0x21, 0x00]);
export const ESC_LINE_SPACE_DEFAULT = new Uint8Array([0x1b, 0x32]); // Standard breathable line spacing
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

// In-Memory Pre-Cache for Instant 0ms Logo Transmission
let cachedLogoBytes: Uint8Array | null = null;

// ─── Standard ESC/POS Column Mode (ESC * 33) Logo Generator ─────────────────
export async function loadLogoESCPOS(maxWidth = 160): Promise<Uint8Array | null> {
  if (cachedLogoBytes) return cachedLogoBytes;
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
    const width = Math.min(maxWidth, 160); // 160 dots wide centered on 58mm paper
    const height = Math.round(width * aspect);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    const parts: Uint8Array[] = [];
    parts.push(ESC_ALIGN_CENTER);
    parts.push(new Uint8Array([0x1b, 0x33, 24])); // Set line spacing to 24 dots for 24-dot bit image band

    // Slice image into 24-dot high horizontal bands (ESC * 33 column mode)
    for (let y = 0; y < height; y += 24) {
      const nL = width & 0xff;
      const nH = (width >> 8) & 0xff;
      parts.push(new Uint8Array([0x1b, 0x2a, 33, nL, nH]));

      const bandBytes = new Uint8Array(width * 3);
      for (let x = 0; x < width; x++) {
        for (let b = 0; b < 24; b++) {
          const py = y + b;
          if (py < height) {
            const idx = (py * width + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const bVal = pixels[idx + 2];
            const luminance = 0.299 * r + 0.587 * g + 0.114 * bVal;

            if (luminance < 150) { // Black pixel threshold
              const byteIdx = x * 3 + Math.floor(b / 8);
              const bitPos = 7 - (b % 8);
              bandBytes[byteIdx] |= (1 << bitPos);
            }
          }
        }
      }
      parts.push(bandBytes);
      parts.push(new Uint8Array([0x1b, 0x4a, 24])); // Feed 24 dots line spacing to next band
    }

    parts.push(ESC_LINE_SPACE_DEFAULT); // Reset line spacing
    cachedLogoBytes = concat(...parts);
    return cachedLogoBytes;
  } catch (err) {
    console.warn("Could not load ESC/POS logo:", err);
    return null;
  }
}

export async function loadLogoRaster(): Promise<Uint8Array | null> {
  return await loadLogoESCPOS(160);
}

// ─── Customer Receipt Builder ─────────────────────────────────────────────────
export async function buildCustomerReceiptESCPOS(
  transaction: Transaction
): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];

  // 1. Init & set standard line spacing
  parts.push(ESC_INIT);
  parts.push(ESC_LINE_SPACE_DEFAULT);

  // 2. Logo Image ONLY (rendered via standard ESC * 33 column mode, pre-cached 0ms)
  const logoBytes = await loadLogoESCPOS(160);
  if (logoBytes) {
    parts.push(logoBytes);
  }

  // 3. Store Address & Telp ONLY (NO big bold text "Kedai Nyamleng", ONLY logo above address!)
  parts.push(ESC_ALIGN_CENTER);
  parts.push(ESC_FONT_NORMAL);
  parts.push(encBytes("Jl. LA. Sucipto XIV/42 Malang\n"));
  parts.push(encBytes("Telp/WA: 085113661387\n"));

  // 4. Divider
  parts.push(ESC_ALIGN_LEFT);
  parts.push(encBytes(divider("=", CHARS_PER_LINE)));

  // 5. Order info
  const createdAt = new Date(transaction.createdAt as string);
  const dateStr   = createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr   = createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  parts.push(encBytes(`Nota  : ${transaction.orderNumber}\n`));
  parts.push(encBytes(`Tgl   : ${dateStr} ${timeStr}\n`));
  parts.push(encBytes(`Cust  : ${transaction.customerName || "Pelanggan"}\n`));
  parts.push(encBytes(`Order : ${transaction.orderType === "dine-in" ? `Dine-In (Meja ${transaction.tableNumber})` : "Takeaway"}\n`));
  parts.push(encBytes(divider("-", CHARS_PER_LINE)));

  // 6. Item list
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

  // 7. Totals
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

  // 8. Footer
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
  parts.push(ESC_BOLD_ON);
  parts.push(encBytes("NOTA DAPUR\n"));
  parts.push(ESC_BOLD_OFF);

  parts.push(encBytes(`Nota: #${transaction.orderNumber}\n`));
  parts.push(encBytes(`Order: ${transaction.orderType.toUpperCase()}\n`));
  parts.push(encBytes(divider("=", CHARS_PER_LINE)));

  parts.push(ESC_ALIGN_LEFT);

  for (const item of transaction.items) {
    parts.push(ESC_BOLD_ON);
    parts.push(encBytes(`${item.qty}x `));
    parts.push(encBytes(`${item.nameSnapshot.toUpperCase()}\n`));
    parts.push(ESC_BOLD_OFF);
  }

  parts.push(encBytes(divider("-", CHARS_PER_LINE)));
  parts.push(ESC_ALIGN_CENTER);
  parts.push(encBytes(`Pelanggan: ${transaction.customerName || "Pelanggan"}\n`));
  parts.push(ESC_FEED_PAPER);

  return concat(...parts);
}
