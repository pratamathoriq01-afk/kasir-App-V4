/**
 * Web Bluetooth Thermal Printer — SharkPOS PI58BT / Generic BT 58mm
 * Uses shared ESC/POS command builder from escpos-commands.ts
 *
 * Supported Bluetooth service UUIDs (SharkPOS PI58BT + common BT thermal):
 *   Primary:   000018f0-0000-1000-8000-00805f9b34fb  (BT serial port)
 *   Fallback:  e7810a71-73ae-499d-8c15-faa9aef0c3f2  (common thermal)
 *   Fallback2: 49535343-fe7d-4ae5-8fa9-9fafd205e455  (Hoin / Rongta)
 */

import { Transaction } from "@/types";
import { buildCustomerReceiptESCPOS, buildKitchenReceiptESCPOS, loadLogoRaster } from "./escpos-commands";

type PrintMode = "customer" | "kitchen";

const BT_SERVICE_UUIDS = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
];

export async function printViaWebBluetooth(
  transaction: Transaction,
  mode: PrintMode = "customer"
): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !("bluetooth" in navigator)
  ) {
    alert(
      "Browser ini tidak mendukung Web Bluetooth API.\nGunakan Google Chrome di PC / Android (bukan iOS)."
    );
    return false;
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

    // Show BT device picker
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BT_SERVICE_UUIDS,
    });

    const server = await device.gatt.connect();

    // Try each service UUID until one works
    let service: BTServiceLike | null = null;
    for (const uuid of BT_SERVICE_UUIDS) {
      try {
        service = await server.getPrimaryService(uuid);
        break;
      } catch {
        continue;
      }
    }

    if (!service) {
      throw new Error(
        "Tidak dapat menemukan layanan cetak Bluetooth yang kompatibel.\n" +
        "Pastikan ini adalah printer thermal SharkPOS / BT-58."
      );
    }

    const characteristics = await service.getCharacteristics();
    const writeChar = characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse
    );

    if (!writeChar) {
      throw new Error("Karakteristik tulis Bluetooth tidak ditemukan pada printer ini.");
    }

    // Build ESC/POS receipt data with logo
    const logoRaster = await loadLogoRaster(180); // Slightly smaller for BT (bandwidth)
    let escposData: Uint8Array;
    if (mode === "kitchen") {
      escposData = await buildKitchenReceiptESCPOS(transaction);
    } else {
      escposData = await buildCustomerReceiptESCPOS(transaction, logoRaster);
    }

    // Send in 512-byte chunks with 30ms delay between chunks
    // (Optimal for SharkPOS PI58BT BLE MTU = 512 bytes)
    const CHUNK_SIZE = 512;
    const CHUNK_DELAY_MS = 30;

    for (let i = 0; i < escposData.length; i += CHUNK_SIZE) {
      const chunk = escposData.slice(i, i + CHUNK_SIZE);
      if (writeChar.properties.writeWithoutResponse) {
        await writeChar.writeValueWithoutResponse(chunk);
      } else {
        await writeChar.writeValue(chunk);
      }
      // Delay between chunks to prevent BLE congestion/data loss
      if (i + CHUNK_SIZE < escposData.length) {
        await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
      }
    }

    return true;
  } catch (error) {
    const name = (error as Error)?.name;
    const msg  = error instanceof Error ? error.message : "Tidak dapat terhubung";
    // NotFoundError = user cancelled picker, NotSupportedError = BT off
    if (name !== "NotFoundError") {
      alert(`Gagal mencetak via Bluetooth:\n${msg}`);
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
    }>;
  };
}
