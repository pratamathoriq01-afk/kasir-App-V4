/**
 * Web Bluetooth Thermal Printer — SharkPOS PI58BT / Generic BT 58mm
 * Uses shared ESC/POS command builder from escpos-commands.ts
 */

import { Transaction } from "@/types";
import { buildCustomerReceiptESCPOS, buildKitchenReceiptESCPOS, loadLogoRaster } from "./escpos-commands";
import { printViaWebSerial } from "./serial-printer";

type PrintMode = "customer" | "kitchen";

const BT_SERVICE_UUIDS = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Primary SharkPOS PI58BT
  "000018f1-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb", // Rongta / ZJ-58
  "0000ffe0-0000-1000-8000-00805f9b34fb", // HM-10 / BLE SPP
  "0000ffe1-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Generic Thermal
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Hoin
  "0000af00-0000-1000-8000-00805f9b34fb", // MPT-II
  "00001101-0000-1000-8000-00805f9b34fb", // SPP 16-bit
];

export async function printViaWebBluetooth(
  transaction: Transaction,
  mode: PrintMode = "customer"
): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !("bluetooth" in navigator)
  ) {
    // If Web Bluetooth is unavailable, try Web Serial fallback
    return await printViaWebSerial(transaction, mode);
  }

  try {
    const nav = navigator as unknown as {
      bluetooth: {
        requestDevice: (opts: {
          acceptAllDevices?: boolean;
          optionalServices?: string[];
        }) => Promise<BTDeviceLike>;
      };
    };

    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BT_SERVICE_UUIDS,
    });

    const server = await device.gatt.connect();

    let service: BTServiceLike | null = null;
    
    if (server.getPrimaryServices) {
      try {
        const services = await server.getPrimaryServices();
        if (services.length > 0) {
          service = services[0];
        }
      } catch (e) {
        console.warn("Primary services scan fallback:", e);
      }
    }

    if (!service) {
      for (const uuid of BT_SERVICE_UUIDS) {
        try {
          service = await server.getPrimaryService(uuid);
          break;
        } catch {
          continue;
        }
      }
    }

    if (!service) {
      throw new Error("Service GATT Bluetooth tidak ditemukan.");
    }

    const characteristics = await service.getCharacteristics();
    const writeChar = characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse
    );

    if (!writeChar) {
      throw new Error("Karakteristik tulis Bluetooth tidak ditemukan.");
    }

    // Build ESC/POS receipt data
    const logoRaster = await loadLogoRaster(180);
    let escposData: Uint8Array;
    if (mode === "kitchen") {
      escposData = await buildKitchenReceiptESCPOS(transaction);
    } else {
      escposData = await buildCustomerReceiptESCPOS(transaction, logoRaster);
    }

    // Send in 64-byte chunks with 25ms delay
    const CHUNK_SIZE = 64;
    const CHUNK_DELAY_MS = 25;

    for (let i = 0; i < escposData.length; i += CHUNK_SIZE) {
      const chunk = escposData.slice(i, i + CHUNK_SIZE);
      if (writeChar.properties.writeWithoutResponse) {
        await writeChar.writeValueWithoutResponse(chunk);
      } else {
        await writeChar.writeValue(chunk);
      }
      if (i + CHUNK_SIZE < escposData.length) {
        await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
      }
    }

    return true;
  } catch (error) {
    const name = (error as Error)?.name;
    console.warn("Bluetooth GATT failed, switching to Serial COM fallback:", error);
    if (name !== "NotFoundError") {
      // Windows Classic BT SPP printer (SharkPOS PI58BT) requires Web Serial COM port fallback!
      return await printViaWebSerial(transaction, mode);
    }
    return false;
  }
}

// ─── Type shims ───────────────────────────────────────────────────────────────
interface BTServiceLike {
  getCharacteristics(): Promise<BTCharLike[]>;
}
interface BTCharLike {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValue(value: Uint8Array): Promise<void>;
  writeValueWithoutResponse(value: Uint8Array): Promise<void>;
}
interface BTDeviceLike {
  gatt: {
    connect(): Promise<{
      getPrimaryService(uuid: string): Promise<BTServiceLike>;
      getPrimaryServices?(): Promise<BTServiceLike[]>;
    }>;
  };
}
