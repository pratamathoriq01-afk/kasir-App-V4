"use client";

import { useState, useEffect } from "react";
import { MenuItem, Transaction } from "@/types";
import { fetchMenuItemsFromDB, addTransaction, getNextOrderNumber } from "@/lib/data-service";
import { useCartStore } from "@/store/cart-store";
import MenuGrid from "./components/MenuGrid";
import CartSection from "./components/CartSection";
import PaymentModal from "./components/PaymentModal";
import ReceiptModal from "./components/ReceiptModal";

export default function KasirPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  const {
    items,
    customerName,
    orderType,
    tableNumber,
    discountType,
    discountValue,
    cashReceived,
    clearCart,
    getSubtotal,
    getHppTotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    getNetProfit,
    getChange,
  } = useCartStore();

  useEffect(() => {
    fetchMenuItemsFromDB().then((loaded) => setMenuItems(loaded));
  }, []);

  const handleConfirmPayment = async () => {
    const orderNumber = getNextOrderNumber();

    const transaction: Transaction = {
      id: `trx-${Date.now()}`,
      orderNumber,
      customerName: customerName.trim() || "Pelanggan",
      orderType,
      tableNumber: orderType === "dine-in" ? tableNumber || "01" : "-",
      subtotal: getSubtotal(),
      discountType,
      discountValue,
      discountAmount: getDiscountAmount(),
      tax: getTaxAmount(),
      total: getTotal(),
      hppTotal: getHppTotal(),
      netProfit: getNetProfit(),
      cashReceived,
      change: getChange(),
      createdAt: new Date().toISOString(),
      items: items.map((i) => ({
        id: `ti-${Date.now()}-${Math.random()}`,
        menuItemId: i.menuItem.id,
        nameSnapshot: i.menuItem.name,
        priceSnapshot: i.menuItem.price,
        hppSnapshot: i.menuItem.hpp,
        qty: i.qty,
      })),
    };

    addTransaction(transaction);
    setCompletedTransaction(transaction);

    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    }).catch(() => {});

    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    setCompletedTransaction(null);
    clearCart();
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Column: Menu Items & Filter (7 cols) */}
      <div className="lg:col-span-7 xl:col-span-8 h-full overflow-hidden flex flex-col">
        <MenuGrid items={menuItems} />
      </div>

      {/* Right Column: Cart & Summary (5 cols) */}
      <div className="lg:col-span-5 xl:col-span-4 h-full overflow-hidden flex flex-col">
        <CartSection onOpenPaymentModal={() => setIsPaymentModalOpen(true)} />
      </div>

      {/* Payment Dialog */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Receipt & Thermal Print Dialog */}
      <ReceiptModal
        transaction={completedTransaction}
        isOpen={isReceiptModalOpen}
        onClose={handleCloseReceipt}
      />
    </div>
  );
}
