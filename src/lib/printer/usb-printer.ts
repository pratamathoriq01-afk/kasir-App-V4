/**
 * WebUSB Thermal Printer — SharkPOS / POS-58 / PI58BT profile
 * Uses shared ESC/POS command builder from escpos-commands.ts
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
    window.print();
    return true;
  }

  try {
    const nav = navigator as unknown as {
      usb: {
        requestDevice: (opts: { filters: unknown[] }) => Promise<USBDeviceLike>;
        getDevices: () => Promise<USBDeviceLike[]>;
      };
    };

    let device: USBDeviceLike | null = null;
    const paired = await nav.usb.getDevices();
    if (paired.length > 0) {
      device = paired[0];
    } else {
      device = await nav.usb.requestDevice({ filters: [] });
    }

    await device.open();

    // Select configuration 1 safely
    try {
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
    } catch (e) {
      console.warn("Select configuration notice:", e);
    }

    // Find interface & claim
    const ifaceNumber = device.configuration?.interfaces?.[0]?.interfaceNumber ?? 0;
    try {
      await device.claimInterface(ifaceNumber);
    } catch (claimErr) {
      console.warn("Chrome WebUSB Protected Class / Driver active, auto-switching to System Print:", claimErr);
      // Windows driver owns USB printing support (USB_CLASS_PRINTER). Trigger System Print automatically!
      window.print();
      return true;
    }

    // Dynamic BULK OUT endpoint discovery across all interfaces
    let endpointNumber = 1;
    const iface = device.configuration?.interfaces?.[0];
    const alternates = iface?.alternates ?? (iface?.alternate ? [iface.alternate] : []);
    
    for (const alt of alternates) {
      const found = alt.endpoints?.find((e) => e.direction === "out");
      if (found) {
        endpointNumber = found.endpointNumber;
        break;
      }
    }

    // Load logo and build receipt ESC/POS data
    const logoRaster = await loadLogoRaster(200);
    let escposData: Uint8Array;
    if (mode === "kitchen") {
      escposData = await buildKitchenReceiptESCPOS(transaction);
    } else {
      escposData = await buildCustomerReceiptESCPOS(transaction, logoRaster);
    }

    // Send in 128-byte chunks for SharkPOS / POS-58 USB bulk transfer
    const CHUNK_SIZE = 128;
    for (let i = 0; i < escposData.length; i += CHUNK_SIZE) {
      const chunk = escposData.slice(i, i + CHUNK_SIZE);
      await device.transferOut(endpointNumber, chunk);
    }

    try {
      await device.releaseInterface(ifaceNumber);
    } catch (e) {
      console.warn("Release interface notice:", e);
    }

    return true;
  } catch (error) {
    console.warn("WebUSB fallback triggered:", error);
    if ((error as Error)?.name !== "NotFoundError") {
      // Auto fallback to browser system print for Windows SharkPOS driver
      window.print();
      return true;
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
