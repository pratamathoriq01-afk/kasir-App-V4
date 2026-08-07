/**
 * Web Serial Thermal Printer — SharkPOS / USB Serial / Bluetooth COM Port
 * Auto-reconnects to remembered ports with 0ms in-memory port caching.
 */

import { Transaction } from "@/types";
import { buildCustomerReceiptESCPOS, buildKitchenReceiptESCPOS } from "./escpos-commands";

type PrintMode = "customer" | "kitchen";

let cachedPort: SerialPortLike | null = null;

export async function connectSerialPrinter(): Promise<boolean> {
  if (typeof window === "undefined" || !("serial" in navigator)) {
    return true;
  }
  try {
    const navSerial = (navigator as unknown as { serial: { requestPort: () => Promise<SerialPortLike> } }).serial;
    cachedPort = await navSerial.requestPort();
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
  mode: PrintMode = "customer",
  allowPrompt = true
): Promise<boolean> {
  if (typeof window === "undefined" || !("serial" in navigator)) {
    console.warn("Web Serial API unavailable in this browser.");
    return false;
  }

  try {
    const navSerial = (navigator as unknown as {
      serial: {
        getPorts: () => Promise<SerialPortLike[]>;
        requestPort: (opts?: unknown) => Promise<SerialPortLike>;
      };
    }).serial;

    let port: SerialPortLike | null = cachedPort;

    // Fast path: try cached open port
    if (port && port.writable) {
      try {
        await sendSerialBytes(port, transaction, mode);
        return true;
      } catch (e) {
        console.warn("Cached serial port write failed, re-opening:", e);
        cachedPort = null;
        port = null;
      }
    }

    // Try existing granted ports
    if (!port) {
      const existingPorts = await navSerial.getPorts();
      if (existingPorts.length > 0) {
        port = existingPorts[0];
        try {
          await port.open({ baudRate: 9600 });
        } catch (openErr) {
          console.warn("Serial existing port open notice:", openErr);
        }
      }
    }

    // Request port only if allowed and no granted port available
    if ((!port || !port.writable) && allowPrompt) {
      try {
        port = await navSerial.requestPort();
        await port.open({ baudRate: 9600 });
      } catch (reqErr) {
        console.warn("Serial requestPort notice:", reqErr);
      }
    }

    if (!port || !port.writable) {
      return false;
    }

    cachedPort = port;
    await sendSerialBytes(port, transaction, mode);
    return true;
  } catch (error) {
    cachedPort = null;
    console.warn("Web Serial stream notice:", error);
    return false;
  }
}

async function sendSerialBytes(
  port: SerialPortLike,
  transaction: Transaction,
  mode: PrintMode
) {
  if (!port.writable) throw new Error("Port not writable");

  let escposData: Uint8Array;
  if (mode === "kitchen") {
    escposData = await buildKitchenReceiptESCPOS(transaction);
  } else {
    escposData = await buildCustomerReceiptESCPOS(transaction);
  }

  const writer = port.writable.getWriter();
  const CHUNK_SIZE = 128;
  for (let i = 0; i < escposData.length; i += CHUNK_SIZE) {
    const chunk = escposData.slice(i, i + CHUNK_SIZE);
    await writer.write(chunk);
  }
  writer.releaseLock();
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
