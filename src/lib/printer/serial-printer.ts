/**
 * Web Serial Thermal Printer — SharkPOS / USB Serial / Bluetooth COM Port
 * Auto-reconnects to remembered ports with persistent session.
 */

import { Transaction } from "@/types";
import { printerManager } from "./printer-manager";

type PrintMode = "customer" | "kitchen";

export async function connectSerialPrinter(): Promise<boolean> {
  return await printerManager.connectSerial();
}

export async function printViaWebSerial(
  transaction: Transaction,
  mode: PrintMode = "customer"
): Promise<boolean> {
  return await printerManager.print(transaction, mode);
}
