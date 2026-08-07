/**
 * WebUSB Thermal Printer — SharkPOS / POS-58 / ZJ-5805 profile
 * Directly streams ESC/POS raw bytes over WebUSB or Web Serial (COM)
 * NEVER launches laptop browser print dialogs.
 */

import { Transaction } from "@/types";
import { buildCustomerReceiptESCPOS, buildKitchenReceiptESCPOS } from "./escpos-commands";
import { printViaWebSerial } from "./serial-printer";

type PrintMode = "customer" | "kitchen";

export async function connectUSBPrinter(): Promise<boolean> {
  if (typeof window === "undefined" || !("usb" in (navigator as unknown as { usb: unknown }))) {
    return true;
  }
  try {
    const nav = navigator as unknown as {
      usb: { requestDevice: (opts: { filters: unknown[] }) => Promise<unknown> };
    };
    await nav.usb.requestDevice({ filters: [] });
    return true;
  } catch (err) {
    if ((err as Error)?.name !== "NotFoundError") {
      console.warn("Connect USB notice:", err);
    }
    return false;
  }
}

export async function printViaWebUSB(
  transaction: Transaction,
  mode: PrintMode = "customer"
): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !("usb" in (navigator as unknown as { usb: unknown }))
  ) {
    return await printViaWebSerial(transaction, mode, false);
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
      console.warn("Chrome WebUSB Protected Class / Driver active, checking Serial COM silently:", claimErr);
      return await printViaWebSerial(transaction, mode, false);
    }

    // Dynamic BULK OUT endpoint discovery
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

    let escposData: Uint8Array;
    if (mode === "kitchen") {
      escposData = await buildKitchenReceiptESCPOS(transaction);
    } else {
      escposData = await buildCustomerReceiptESCPOS(transaction);
    }

    // Send in 128-byte chunks for USB bulk transfer
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
    console.warn("WebUSB stream notice:", error);
    if ((error as Error)?.name !== "NotFoundError") {
      return await printViaWebSerial(transaction, mode, false);
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
