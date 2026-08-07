/**
 * Web Serial Thermal Printer — SharkPOS / USB Serial / Bluetooth COM Port
 * Compatible with Chrome & Edge on Windows / Laptop
 */

import { Transaction } from "@/types";
import { buildCustomerReceiptESCPOS, buildKitchenReceiptESCPOS, loadLogoRaster } from "./escpos-commands";

type PrintMode = "customer" | "kitchen";

export async function printViaWebSerial(
  transaction: Transaction,
  mode: PrintMode = "customer"
): Promise<boolean> {
  if (typeof window === "undefined" || !("serial" in navigator)) {
    alert(
      "Browser ini tidak mendukung Web Serial API.\nGunakan Google Chrome atau Microsoft Edge versi terbaru di Laptop / PC."
    );
    return false;
  }

  try {
    const navSerial = (navigator as unknown as { serial: { requestPort: (opts?: unknown) => Promise<SerialPortLike> } }).serial;
    
    // Prompt user to select Serial COM port (Virtual COM port from USB / Bluetooth driver)
    const port = await navSerial.requestPort();
    await port.open({ baudRate: 9600 }); // Standard baud rate for SharkPOS & 58mm POS printers

    // Build receipt data with raster logo
    const logoRaster = await loadLogoRaster(200);
    let escposData: Uint8Array;
    if (mode === "kitchen") {
      escposData = await buildKitchenReceiptESCPOS(transaction);
    } else {
      escposData = await buildCustomerReceiptESCPOS(transaction, logoRaster);
    }

    const writer = port.writable.getWriter();
    
    // Write data in 128-byte chunks to avoid buffer overflow on serial bridge
    const CHUNK_SIZE = 128;
    for (let i = 0; i < escposData.length; i += CHUNK_SIZE) {
      const chunk = escposData.slice(i, i + CHUNK_SIZE);
      await writer.write(chunk);
    }

    writer.releaseLock();
    await port.close();

    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gagal terhubung";
    if ((error as Error)?.name !== "NotFoundError") {
      alert(`Gagal mencetak via Web Serial (COM Port):\n${msg}\n\nPastikan port COM SharkPOS sudah dipilih.`);
    }
    return false;
  }
}

interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: {
    getWriter(): {
      write(data: Uint8Array): Promise<void>;
      releaseLock(): void;
    };
  };
}
