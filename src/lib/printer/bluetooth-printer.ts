/**
 * Web Bluetooth Thermal Printer — SharkPOS PI58BT / Generic BT 58mm
 * Fully Automated Bluetooth Engine with In-Memory Caching & Instant 0-Delay Printing.
 */

import { Transaction } from "@/types";
import { printerManager } from "./printer-manager";

type PrintMode = "customer" | "kitchen";

export async function connectBluetoothPrinter(): Promise<boolean> {
  return await printerManager.connectBluetooth();
}

export async function printViaWebBluetooth(
  transaction: Transaction,
  mode: PrintMode = "customer"
): Promise<boolean> {
  return await printerManager.print(transaction, mode);
}
