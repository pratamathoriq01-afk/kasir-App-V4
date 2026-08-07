/**
 * Web Bluetooth Thermal Printer — SharkPOS PI58BT / Generic BT 58mm
 * Uses shared ESC/POS command builder from escpos-commands.ts
 * Optimized for high-speed streaming without motor stutter delay.
 */

import { Transaction } from "@/types";
import { buildCustomerReceiptESCPOS, buildKitchenReceiptESCPOS, loadLogoRaster } from "./escpos-commands";
import { printViaWebSerial } from "./serial-printer";

type PrintMode = "customer" | "kitchen";

const BT_SERVICE_UUIDS = [
  "0000ffe0-0000-1000-8000-00805f9b34fb", // ZJiang ZJ-5805 / ZJ-5809 / MP-58II
  "0000ffe1-0000-1000-8000-00805f9b34fb",
  "0000e7e0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb", // POS-58
  "000018f0-0000-1000-8000-00805f9b34fb", // SharkPOS PI58BT
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "0000af00-0000-1000-8000-00805f9b34fb",
  "00001101-0000-1000-8000-00805f9b34fb",
];

export async function printViaWebBluetooth(
  transaction: Transaction,
  mode: PrintMode = "customer"
): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !("bluetooth" in navigator)
  ) {
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

    // High-speed BLE transmission: 128-byte chunks, 0ms delay for writeWithoutResponse
    const CHUNK_SIZE = 128;
    const CHUNK_DELAY_MS = writeChar.properties.writeWithoutResponse ? 0 : 5;

    for (let i = 0; i < escposData.length; i += CHUNK_SIZE) {
      const chunk = escposData.slice(i, i + CHUNK_SIZE);
      if (writeChar.properties.writeWithoutResponse) {
        await writeChar.writeValueWithoutResponse(chunk);
      } else {
        await writeChar.writeValue(chunk);
      }
      if (CHUNK_DELAY_MS > 0 && i + CHUNK_SIZE < escposData.length) {
        await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
      }
    }

    return true;
  } catch (error) {
    const name = (error as Error)?.name;
    console.warn("Bluetooth GATT failed, switching to Serial COM fallback:", error);
    if (name !== "NotFoundError") {
      return await printViaWebSerial(transaction, mode);
    }
    return false;
  }
}

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
