/**
 * Web Serial Thermal Printer — SharkPOS / USB Serial / Bluetooth COM Port
 * Auto-reconnects to authorized ports without re-prompting browser picker.
 * Fallbacks to window.print() if COM port is busy or unavailable.
 */

import { Transaction } from "@/types";
import { buildCustomerReceiptESCPOS, buildKitchenReceiptESCPOS } from "./escpos-commands";

type PrintMode = "customer" | "kitchen";

export async function connectSerialPrinter(): Promise<boolean> {
  if (typeof window === "undefined" || !("serial" in navigator)) {
    return true;
  }
  try {
    const navSerial = (navigator as unknown as { serial: { requestPort: () => Promise<unknown> } }).serial;
    await navSerial.requestPort();
    return true;
  } catch (err) {
    if ((err as Error)?.name !== "NotFoundError") {
      console.warn("Connect Serial notice:", err);
    }
    return false;
  }
}

export async function printViaWebSerial(
  transaction: Transaction,
  mode: PrintMode = "customer"
): Promise<boolean> {
  if (typeof window === "undefined" || !("serial" in navigator)) {
    window.print();
    return true;
  }

  try {
    const navSerial = (navigator as unknown as {
      serial: {
        getPorts: () => Promise<SerialPortLike[]>;
        requestPort: (opts?: unknown) => Promise<SerialPortLike>;
      };
    }).serial;

    let port: SerialPortLike | null = null;
    const existingPorts = await navSerial.getPorts();
    
    // Try existing port first
    if (existingPorts.length > 0) {
      port = existingPorts[0];
      try {
        await port.open({ baudRate: 9600 });
      } catch (openErr) {
        console.warn("Serial existing port open notice:", openErr);
      }
    }

    // If existing port has no writable stream, request user selection
    if (!port || !port.writable) {
      try {
        port = await navSerial.requestPort();
        await port.open({ baudRate: 9600 });
      } catch (reqErr) {
        console.warn("Serial requestPort notice:", reqErr);
      }
    }

    // If port is still not writable (e.g. busy or claimed by Windows driver), fallback to Browser Print
    if (!port || !port.writable) {
      console.warn("Serial COM port not writable, falling back to Browser Print.");
      window.print();
      return true;
    }

    let escposData: Uint8Array;
    if (mode === "kitchen") {
      escposData = await buildKitchenReceiptESCPOS(transaction);
    } else {
      escposData = await buildCustomerReceiptESCPOS(transaction);
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
    console.warn("Web Serial error, executing Browser Print fallback:", error);
    window.print();
    return true;
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
  } | null;
}
