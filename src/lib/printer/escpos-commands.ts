/**
 * ESC/POS Command Builder — Kedai Nyamleng POS
 * Compatible with: SharkPOS PI58BT, POS-58mm, XP-58, Epson TM-T20
 *
 * ESC/POS Reference:
 *  ESC @         — Initialize printer
 *  ESC ! n       — Select print mode (0=normal, 8=double height, 16=double width, 56=double both)
 *  ESC a n       — Justify (0=left, 1=center, 2=right)
 *  ESC E n       — Bold on/off
 *  GS ! n        — Character size (0x00=1x1, 0x11=2x2)
 *  GS v 0        — Print raster bitmap
 *  GS V          — Paper cut
 *  ESC 3 n       — Set line spacing (24=default, 0=none)
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
export const ESC_LINE_SPACE_24= new Uint8Array([0x1b, 0x33, 24]);
export const ESC_LINE_SPACE_0 = new Uint8Array([0x1b, 0x33, 0]);
export const ESC_FEED_1      = new Uint8Array([0x0a]);
export const ESC_FEED_2      = new Uint8Array([0x0a, 0x0a]);
export const ESC_FEED_3      = new Uint8Array([0x0a, 0x0a, 0x0a]);
export const ESC_CUT_PARTIAL = new Uint8Array([0x1d, 0x56, 0x41, 0x05]); // partial cut with feed

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
function divider(ch = "-", len = CHARS_PER_LINE): string {
  return ch.repeat(len) + "\n";
}

// ─── Logo Raster Bitmap (GS v 0) ─────────────────────────────────────────────
/**
 * Convert an HTMLImageElement to a 1-bit ESC/POS raster bitmap.
 * @param imgEl - Already-loaded HTMLImageElement
 * @param targetWidth - Width in dots (must be multiple of 8). Default: 200 for logo
 */
function imgToESCPOSRaster(imgEl: HTMLImageElement, targetWidth = 200): Uint8Array {
  // Draw to offscreen canvas at target size
  const aspect = imgEl.naturalHeight / imgEl.naturalWidth;
  const h = Math.round(targetWidth * aspect);

  const canvas = document.createElement("canvas");
  canvas.width  = targetWidth;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetWidth, h);
  ctx.drawImage(imgEl, 0, 0, targetWidth, h);

  const imageData = ctx.getImageData(0, 0, targetWidth, h);
  const { data } = imageData;

  // Ensure width is a multiple of 8
  const byteWidth = Math.ceil(targetWidth / 8);
  const rasterBytes: number[] = [];

  for (let row = 0; row < h; row++) {
    for (let byteIdx = 0; byteIdx < byteWidth; byteIdx++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = byteIdx * 8 + bit;
        if (x < targetWidth) {
          const pixelIdx = (row * targetWidth + x) * 4;
          const r = data[pixelIdx];
          const g = data[pixelIdx + 1];
          const b = data[pixelIdx + 2];
          // Luminance threshold — pixels darker than 128 = black dot
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          if (luminance < 128) {
            byte |= (0x80 >> bit);
          }
        }
      }
      rasterBytes.push(byte);
    }
  }

  // GS v 0 header: [0x1d, 0x76, 0x30, mode, xL, xH, yL, yH]
  const xL = byteWidth & 0xff;
  const xH = (byteWidth >> 8) & 0xff;
  const yL = h & 0xff;
  const yH = (h >> 8) & 0xff;

  const header = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
  const result  = new Uint8Array(header.length + rasterBytes.length);
  result.set(header, 0);
  result.set(new Uint8Array(rasterBytes), header.length);
  return result;
}

// ─── Logo loader ──────────────────────────────────────────────────────────────
/**
 * Load /public/logo.png and convert to ESC/POS raster bitmap.
 * Returns null if loading fails (print without logo).
 */
export async function loadLogoRaster(logoWidth = 200): Promise<Uint8Array | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload  = () => resolve();
      img.onerror = () => reject(new Error("Logo load failed"));
      img.src = `/logo.png?v=${Date.now()}`;
    });

    return imgToESCPOSRaster(img, logoWidth);
  } catch (e) {
    console.warn("Logo raster skipped:", e);
    return null;
  }
}

// ─── Concat helper ────────────────────────────────────────────────────────────
function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

// ─── Main receipt builder ─────────────────────────────────────────────────────
export async function buildCustomerReceiptESCPOS(
  transaction: Transaction,
  logoRaster?: Uint8Array | null
): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];

  // 1. Init printer
  parts.push(ESC_INIT);
  parts.push(ESC_LINE_SPACE_24);

  // 2. Logo (centered)
  if (logoRaster && logoRaster.length > 0) {
    parts.push(ESC_ALIGN_CENTER);
    parts.push(logoRaster);
    parts.push(ESC_FEED_1);
  }

  // 3. Store header
  parts.push(ESC_ALIGN_CENTER);
  parts.push(ESC_BOLD_ON);
  parts.push(ESC_SIZE_2X);
  parts.push(encBytes("KEDAI NYAMLENG\n"));
  parts.push(ESC_SIZE_NORMAL);
  parts.push(ESC_BOLD_OFF);
  parts.push(encBytes("Jl. LA. Sucipto XIV/42 Malang\n"));
  parts.push(encBytes("Telp: 0341-XXXXXXX\n"));

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
  parts.push(encBytes(`Kasir : Kedai Nyamleng POS\n`));
  parts.push(encBytes(`Cust  : ${transaction.customerName || "Pelanggan"}\n`));
  parts.push(encBytes(`Order : ${transaction.orderType === "dine-in" ? `Dine-In (Meja ${transaction.tableNumber || "-"})` : "Takeaway / Bungkus"}\n`));
  parts.push(encBytes(divider("-", CHARS_PER_LINE)));

  // 6. Items
  transaction.items.forEach((item) => {
    const itemTotal = item.priceSnapshot * item.qty;
    // Line 1: item name
    parts.push(ESC_BOLD_ON);
    parts.push(encBytes(`${item.nameSnapshot.slice(0, CHARS_PER_LINE)}\n`));
    parts.push(ESC_BOLD_OFF);
    // Line 2: qty x price = total
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

  // 8. Footer
  parts.push(ESC_ALIGN_CENTER);
  parts.push(ESC_BOLD_ON);
  parts.push(encBytes("Matur Nuwun Sampun Mampir!\n"));
  parts.push(ESC_BOLD_OFF);
  parts.push(encBytes("Terimakasih sudah mampir di\n"));
  parts.push(encBytes("Kedai Nyamleng — Malang\n"));
  parts.push(ESC_FEED_3);

  // 9. Paper cut
  parts.push(ESC_CUT_PARTIAL);

  return concat(...parts);
}

// ─── Kitchen note builder ─────────────────────────────────────────────────────
export async function buildKitchenReceiptESCPOS(
  transaction: Transaction,
): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];

  parts.push(ESC_INIT);
  parts.push(ESC_LINE_SPACE_24);
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
  parts.push(ESC_FEED_3);
  parts.push(ESC_CUT_PARTIAL);

  return concat(...parts);
}
