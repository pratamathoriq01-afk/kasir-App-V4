/**
 * WebUSB Thermal Printer — SharkPOS / POS-58 / PI58BT profile
 * Uses shared ESC/POS command builder from escpos-commands.ts
 *
 * SharkPOS POS-58 typical USB identifiers:
 *   VID: 0x0483 (STMicroelectronics), 0x04b8 (Epson), 0x0519 (Star)
 *   PID: varies by model — we use open filter (all USB devices)
 *
 * ESC/POS full command data is sent via bulk transfer to endpoint OUT.
 */

import { Transaction } from "@/types";
import { buildCustomerReceiptESCPOS, buildKitchenReceiptESCPOS, loadLogoRaster } from "./escpos-commands";

type PrintMode = "customer" | "kitchen";

export async function printViaWebUSB(
  transaction: Transaction,
  mode: PrintMode = "customer"
): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !("usb" in (navigator as unknown as { usb: unknown }))
  ) {
    alert(
      "Browser ini tidak mendukung Web USB API.\nGunakan Google Chrome atau Microsoft Edge versi terbaru di PC."
    );
    return false;
  }

  try {
    const nav = navigator as unknown as {
      usb: {
        requestDevice: (opts: { filters: unknown[] }) => Promise<USBDeviceLike>;
        getDevices: () => Promise<USBDeviceLike[]>;
      };
    };

    // Try to reuse already-permitted device first
    let device: USBDeviceLike | null = null;
    const paired = await nav.usb.getDevices();
    if (paired.length > 0) {
      device = paired[0];
    } else {
      // Show USB device picker — user selects the thermal printer
      device = await nav.usb.requestDevice({ filters: [] });
    }

    await device.open();

    // Select configuration 1 (standard for most thermal printers)
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    // Claim first interface
    const interfaceNum = device.configuration?.interfaces?.[0]?.interfaceNumber ?? 0;
    await device.claimInterface(interfaceNum);

    // Find BULK OUT endpoint
    const iface    = device.configuration?.interfaces?.[0];
    const alternate = iface?.alternates?.[0] ?? iface?.alternate;
    const endpoint  = alternate?.endpoints?.find(
      (e: { direction: string }) => e.direction === "out"
    );
    const endpointNumber = endpoint?.endpointNumber ?? 1;

    // Load logo and build receipt ESC/POS data
    const logoRaster = await loadLogoRaster(200);
    let escposData: Uint8Array;
    if (mode === "kitchen") {
      escposData = await buildKitchenReceiptESCPOS(transaction);
    } else {
      escposData = await buildCustomerReceiptESCPOS(transaction, logoRaster);
    }

    // Send in 512-byte chunks for SharkPOS / POS-58 USB bulk transfer
    const CHUNK_SIZE = 512;
    for (let i = 0; i < escposData.length; i += CHUNK_SIZE) {
      const chunk = escposData.slice(i, i + CHUNK_SIZE);
      await device.transferOut(endpointNumber, chunk);
    }

    // Release interface after print
    await device.releaseInterface(interfaceNum);

    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Tidak dapat terhubung";
    if ((error as Error)?.name !== "NotFoundError") {
      // NotFoundError = user cancelled the picker, don't show error
      alert(`Gagal mencetak via USB Thermal:\n${msg}\n\nPastikan driver SharkPOS sudah terinstall dan printer dinyalakan.`);
    }
    return false;
  }
}

// USB Device type shim
interface USBDeviceLike {
  open(): Promise<void>;
  selectConfiguration(value: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: Uint8Array): Promise<unknown>;
  configuration: {
    interfaces: Array<{
      interfaceNumber: number;
      alternates?: Array<{ endpoints: Array<{ direction: string; endpointNumber: number }> }>;
      alternate?: { endpoints: Array<{ direction: string; endpointNumber: number }> };
    }>;
  } | null;
}
