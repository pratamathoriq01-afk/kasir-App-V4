import { supabase } from "../src/lib/supabase";

async function testCreateOrder() {
  console.log("=== TESTING CREATING AN ONLINE ORDER VIA DIRECT SUPABASE REST ===");
  const testId = `trx-test-${Date.now()}`;
  const orderNum = `KDN-${Math.floor(100000 + Math.random() * 900000)}`;

  const { data: newTrx, error: tErr } = await supabase
    .from("Transaction")
    .insert({
      id: testId,
      orderNumber: orderNum,
      customerName: "Kakak (Test Online)",
      orderType: "dine-in",
      tableNumber: "Meja 05",
      subtotal: 35000,
      tax: 3500,
      total: 38500,
      hppTotal: 18000,
      netProfit: 17000,
      cashReceived: 38500,
      change: 0,
      orderStatus: "NEW_ORDER",
      orderNotes: "DIGITAL_ORDER_UNCONFIRMED",
      paymentStatus: "PAID",
      paymentMethod: "QRIS",
    })
    .select()
    .single();

  if (tErr) {
    console.error("Failed to insert test transaction:", tErr);
    return;
  }

  console.log("Transaction successfully created in Supabase:", newTrx);

  const { data: items, error: iErr } = await supabase
    .from("TransactionItem")
    .insert([
      {
        id: `item-1-${Date.now()}`,
        transactionId: testId,
        nameSnapshot: "Nasi Goreng Nyamleng",
        priceSnapshot: 20000,
        hppSnapshot: 10000,
        qty: 1,
      },
      {
        id: `item-2-${Date.now()}`,
        transactionId: testId,
        nameSnapshot: "Es Jeruk Peras",
        priceSnapshot: 15000,
        hppSnapshot: 8000,
        qty: 1,
      },
    ])
    .select();

  if (iErr) {
    console.error("Failed to insert items:", iErr);
  } else {
    console.log("Items successfully inserted:", items);
  }
}

testCreateOrder();
