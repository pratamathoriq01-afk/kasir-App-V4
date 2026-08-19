/**
 * Persistent Thermal Printer Manager — Zero-Delay ESC/POS Stream
 * Maintains keep-alive device handles in-memory so cashier NEVER has to reconnect repeatedly.
 */

import { Transaction } from "@/types";
import { buildCustomerReceiptESCPOS, buildKitchenReceiptESCPOS } from "./escpos-commands";

type PrintMode = "customer" | "kitchen";

interface USBDeviceSession {
  device: any;
  endpointNumber: number;
  ifaceNumber: number;
  isOpen: boolean;
}

interface SerialSession {
  port: any;
  writer: any;
  isOpen: boolean;
}

interface BluetoothSession {
  device: any;
  characteristic: any;
  isOpen: boolean;
}

class ThermalPrinterManager {
  private static instance: ThermalPrinterManager;
  private usbSession: USBDeviceSession | null = null;
  private serialSession: SerialSession | null = null;
  private btSession: BluetoothSession | null = null;
  private isConnecting = false;

  private constructor() {
    if (typeof window !== "undefined") {
      this.autoRestorePairedDevices();
    }
  }

  public static getInstance(): ThermalPrinterManager {
    if (!ThermalPrinterManager.instance) {
      ThermalPrinterManager.instance = new ThermalPrinterManager();
    }
    return ThermalPrinterManager.instance;
  }

  /**
   * Auto-restores existing paired USB / Serial / Bluetooth printers on boot
   */
  public async autoRestorePairedDevices(): Promise<void> {
    if (typeof window === "undefined") return;

    // 1. Try restoring WebUSB
    if ("usb" in (navigator as any)) {
      try {
        const paired = await (navigator as any).usb.getDevices();
        if (paired && paired.length > 0) {
          await this.initUSBDevice(paired[0]);
        }
      } catch (e) {
        console.warn("[PrinterManager] USB Auto-restore note:", e);
      }
    }

    // 2. Try restoring Web Serial
    if ("serial" in (navigator as any)) {
      try {
        const ports = await (navigator as any).serial.getPorts();
        if (ports && ports.length > 0) {
          await this.initSerialPort(ports[0]);
        }
      } catch (e) {
        console.warn("[PrinterManager] Serial Auto-restore note:", e);
      }
    }
  }

  private async initUSBDevice(device: any): Promise<boolean> {
    try {
      if (!device.opened) {
        await device.open();
      }

      if (device.configuration === null) {
        try {
          await device.selectConfiguration(1);
        } catch {
          // Pass
        }
      }

      const ifaceNumber = device.configuration?.interfaces?.[0]?.interfaceNumber ?? 0;
      try {
        await device.claimInterface(ifaceNumber);
      } catch {
        // May already be claimed
      }

      let endpointNumber = 1;
      const iface = device.configuration?.interfaces?.[0];
      const alternates = iface?.alternates ?? (iface?.alternate ? [iface.alternate] : []);
      for (const alt of alternates) {
        const found = alt.endpoints?.find((e: any) => e.direction === "out");
        if (found) {
          endpointNumber = found.endpointNumber;
          break;
        }
      }

      this.usbSession = {
        device,
        endpointNumber,
        ifaceNumber,
        isOpen: true,
      };
      console.log("[PrinterManager] WebUSB keep-alive session established!");
      return true;
    } catch (err) {
      console.warn("[PrinterManager] initUSBDevice note:", err);
      this.usbSession = null;
      return false;
    }
  }

  private async initSerialPort(port: any): Promise<boolean> {
    try {
      if (!port.readable || !port.writable) {
        await port.open({ baudRate: 9600 });
      }
      this.serialSession = {
        port,
        writer: port.writable.getWriter(),
        isOpen: true,
      };
      console.log("[PrinterManager] Web Serial keep-alive session established!");
      return true;
    } catch (err) {
      console.warn("[PrinterManager] initSerialPort note:", err);
      this.serialSession = null;
      return false;
    }
  }

  /**
   * Cashier connects USB Printer (Persisted across sessions)
   */
  public async connectUSB(): Promise<boolean> {
    if (typeof window === "undefined" || !("usb" in (navigator as any))) return false;
    try {
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      return await this.initUSBDevice(device);
    } catch (err) {
      if ((err as Error)?.name !== "NotFoundError") {
        console.warn("[PrinterManager] USB connect error:", err);
      }
      return false;
    }
  }

  /**
   * Cashier connects Web Serial COM Port (Persisted across sessions)
   */
  public async connectSerial(): Promise<boolean> {
    if (typeof window === "undefined" || !("serial" in (navigator as any))) return false;
    try {
      const port = await (navigator as any).serial.requestPort();
      return await this.initSerialPort(port);
    } catch (err) {
      if ((err as Error)?.name !== "NotFoundError") {
        console.warn("[PrinterManager] Serial connect error:", err);
      }
      return false;
    }
  }

  /**
   * Cashier connects Web Bluetooth
   */
  public async connectBluetooth(): Promise<boolean> {
    if (typeof window === "undefined" || !("bluetooth" in (navigator as any))) return false;
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb", "e7810a71-73ae-499d-8c15-faa9aef0c3f2"],
      });
      const server = await device.gatt?.connect();
      const services = await server?.getPrimaryServices();
      let targetChar: any = null;
      if (services) {
        for (const service of services) {
          const chars = await service.getCharacteristics();
          targetChar = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
          if (targetChar) break;
        }
      }
      if (targetChar) {
        this.btSession = { device, characteristic: targetChar, isOpen: true };
        console.log("[PrinterManager] Bluetooth session established!");
        return true;
      }
      return false;
    } catch (err) {
      if ((err as Error)?.name !== "NotFoundError") {
        console.warn("[PrinterManager] Bluetooth connect error:", err);
      }
      return false;
    }
  }

  public isConnected(): boolean {
    return Boolean(
      (this.usbSession && this.usbSession.isOpen) ||
      (this.serialSession && this.serialSession.isOpen) ||
      (this.btSession && this.btSession.isOpen)
    );
  }

  /**
   * 0ms Direct Stream Print — Streams raw ESC/POS binary data in <50ms without reconnecting
   */
  public async print(transaction: Transaction, mode: PrintMode = "customer"): Promise<boolean> {
    const escposData: Uint8Array =
      mode === "kitchen"
        ? await buildKitchenReceiptESCPOS(transaction)
        : await buildCustomerReceiptESCPOS(transaction);

    // 1. Try Persistent USB Stream
    if (this.usbSession && this.usbSession.isOpen) {
      try {
        const { device, endpointNumber } = this.usbSession;
        const CHUNK_SIZE = 128;
        for (let i = 0; i < escposData.length; i += CHUNK_SIZE) {
          const chunk = escposData.slice(i, i + CHUNK_SIZE);
          await device.transferOut(endpointNumber, chunk);
        }
        return true;
      } catch (err) {
        console.warn("[PrinterManager] USB stream error, attempting fallback:", err);
        this.usbSession = null;
      }
    }

    // 2. Try Persistent Serial COM Stream
    if (this.serialSession && this.serialSession.isOpen) {
      try {
        const { writer } = this.serialSession;
        await writer.write(escposData);
        return true;
      } catch (err) {
        console.warn("[PrinterManager] Serial stream error, attempting fallback:", err);
        this.serialSession = null;
      }
    }

    // 3. Try Persistent Bluetooth Stream
    if (this.btSession && this.btSession.isOpen) {
      try {
        const { characteristic } = this.btSession;
        const CHUNK_SIZE = 100;
        for (let i = 0; i < escposData.length; i += CHUNK_SIZE) {
          const chunk = escposData.slice(i, i + CHUNK_SIZE);
          if (characteristic.writeValueWithoutResponse) {
            await characteristic.writeValueWithoutResponse(chunk);
          } else {
            await characteristic.writeValue(chunk);
          }
        }
        return true;
      } catch (err) {
        console.warn("[PrinterManager] Bluetooth stream error, attempting fallback:", err);
        this.btSession = null;
      }
    }

    // 4. If not connected yet, try auto-connecting to previously paired USB device
    if (typeof window !== "undefined" && "usb" in (navigator as any)) {
      try {
        const paired = await (navigator as any).usb.getDevices();
        if (paired && paired.length > 0) {
          const ok = await this.initUSBDevice(paired[0]);
          if (ok && this.usbSession) {
            return await this.print(transaction, mode);
          }
        }
      } catch {
        // Pass
      }
    }

    return false;
  }
}

export const printerManager = ThermalPrinterManager.getInstance();
