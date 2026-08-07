/**
 * Web Bluetooth Thermal Printer — SharkPOS PI58BT / Generic BT 58mm
 * Fully Automated Bluetooth Engine with In-Memory Caching & Instant 0-Delay Printing.
 */

import { Transaction } from "@/types";
import { buildCustomerReceiptESCPOS, buildKitchenReceiptESCPOS } from "./escpos-commands";
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

// In-memory cache for instant automated re-use
let cachedDevice: BTDeviceLike | null = null;
let cachedWriteChar: BTCharacteristicLike | null = null;

export async function connectBluetoothPrinter(): Promise<boolean> {
  if (typeof window === "undefined" || !("bluetooth" in navigator)) {
    return true;
  }
  try {
    const nav = navigator as unknown as {
      bluetooth: { requestDevice: (opts: unknown) => Promise<BTDeviceLike> };
    };
    cachedDevice = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BT_SERVICE_UUIDS,
    });
    return true;
  } catch (err) {
    if ((err as Error)?.name !== "NotFoundError") {
      console.warn("Connect BT notice:", err);
    }
    return false;
  }
}

export async function printViaWebBluetooth(
  transaction: Transaction,
  mode: PrintMode = "customer"
): Promise<boolean> {
  if (typeof window === "undefined" || !("bluetooth" in navigator)) {
    return await printViaWebSerial(transaction, mode);
  }

  try {
    const nav = navigator as unknown as {
      bluetooth: {
        getDevices?: () => Promise<BTDeviceLike[]>;
        requestDevice: (opts: {
          acceptAllDevices?: boolean;
          optionalServices?: string[];
        }) => Promise<BTDeviceLike>;
      };
    };

    // 1. FAST PATH: Re-use cached active write characteristic if connected
    if (cachedDevice && cachedDevice.gatt?.connected && cachedWriteChar) {
      try {
        await sendESCPOSData(cachedWriteChar, transaction, mode);
        return true;
      } catch (cachedErr) {
        console.warn("Cached Bluetooth write failed, re-connecting:", cachedErr);
        cachedDevice = null;
        cachedWriteChar = null;
      }
    }

    // 2. AUTOMATED GET DEVICES: Try remembered devices before requesting dialog
    let device: BTDeviceLike | null = cachedDevice;
    if (!device && nav.bluetooth.getDevices) {
      try {
        const existingDevices = await nav.bluetooth.getDevices();
        if (existingDevices.length > 0) {
          device = existingDevices[0];
        }
      } catch (getErr) {
        console.warn("getDevices notice:", getErr);
      }
    }

    // 3. Request device if no paired device available
    if (!device) {
      device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BT_SERVICE_UUIDS,
      });
    }

    cachedDevice = device;

    const server = await device.gatt.connect();

    let service: BTServiceLike | null = null;
    if (server.getPrimaryServices) {
      try {
        const services = await server.getPrimaryServices();
        if (services.length > 0) service = services[0];
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

    cachedWriteChar = writeChar;

    await sendESCPOSData(writeChar, transaction, mode);
    return true;
  } catch (error) {
    cachedDevice = null;
    cachedWriteChar = null;
    const name = (error as Error)?.name;
    console.warn("Bluetooth GATT fallback to Serial/Browser:", error);
    if (name !== "NotFoundError") {
      return await printViaWebSerial(transaction, mode);
    }
    return false;
  }
}

async function sendESCPOSData(
  writeChar: BTCharacteristicLike,
  transaction: Transaction,
  mode: PrintMode
) {
  let escposData: Uint8Array;
  if (mode === "kitchen") {
    escposData = await buildKitchenReceiptESCPOS(transaction);
  } else {
    escposData = await buildCustomerReceiptESCPOS(transaction);
  }

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
}

interface BTDeviceLike {
  name?: string;
  gatt: {
    connected?: boolean;
    connect(): Promise<{
      getPrimaryServices?(): Promise<BTServiceLike[]>;
      getPrimaryService(uuid: string): Promise<BTServiceLike>;
    }>;
  };
}

interface BTServiceLike {
  getCharacteristics(): Promise<BTCharacteristicLike[]>;
}

interface BTCharacteristicLike {
  uuid: string;
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
  };
  writeValue(data: Uint8Array): Promise<void>;
  writeValueWithoutResponse(data: Uint8Array): Promise<void>;
}
