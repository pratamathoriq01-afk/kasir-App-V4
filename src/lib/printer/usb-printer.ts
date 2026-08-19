/**
 * WebUSB Thermal Printer — SharkPOS / POS-58 / ZJ-5805 profile
 * Directly streams ESC/POS raw bytes over WebUSB or Web Serial (COM) with persistent session
 */

import { Transaction } from "@/types";
import { printerManager } from "./printer-manager";

type PrintMode = "customer" | "kitchen";

export async function connectUSBPrinter(): Promise<boolean> {
  return await printerManager.connectUSB();
}

export async function printViaWebUSB(
  transaction: Transaction,
  mode: PrintMode = "customer"
): Promise<boolean> {
  return await printerManager.print(transaction, mode);
}
