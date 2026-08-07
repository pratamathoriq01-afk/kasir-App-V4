/**
 * Web Serial Thermal Printer — SharkPOS / USB Serial / Bluetooth COM Port
 * Auto-reconnects to authorized ports without re-prompting browser picker
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
    const navSerial = (navigator as unknown as {
      serial: {
        getPorts: () => Promise<SerialPortLike[]>;
        requestPort: (opts?: unknown) => Promise<SerialPortLike>;
      };
    }).serial;

    // Check for previously authorized port first (AUTO RE-CONNECT)
    let port: SerialPortLike | null = null;
    const existingPorts = await navSerial.getPorts();
    if (existingPorts.length > 0) {
      port = existingPorts[0];
    } else {
      // Prompt user once if no port authorized yet
      port = await navSerial.requestPort();
    }

    try {
      await port.open({ baudRate: 9600 });
    } catch (openErr) {
      console.warn("Serial port already open or re-opening:", openErr);
    }

    // Build receipt data
    const logoRaster = await loadLogoRaster(180);
    let escposData: Uint8Array;
    if (mode === "kitchen") {
      escposData = await buildKitchenReceiptESCPOS(transaction);
    } else {
      escposData = await buildCustomerReceiptESCPOS(transaction, logoRaster);
    }

    const writer = port.writable.getWriter();

    // Stream chunks efficiently over serial bridge
    const CHUNK_SIZE = 128;
    for (let i = 0; i < escposData.length; i += CHUNK_SIZE) {
      const chunk = escposData.slice(i, i + CHUNK_SIZE);
      await writer.write(chunk);
    }

    writer.releaseLock();
    try {
      await port.close();
    } catch (closeErr) {
      console.warn("Serial port close notice:", closeErr);
    }

    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gagal terhubung";
    if ((error as Error)?.name !== "NotFoundError") {
      alert(`Gagal mencetak via Web Serial (COM Port):\n${msg}\n\nPastikan port COM SharkPOS terhubung.`);
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
