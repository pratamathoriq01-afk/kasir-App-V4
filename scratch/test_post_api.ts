import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../src/lib/prisma";

async function testPost() {
  console.log("Testing POST /api/transactions with dotenv...");

  const payload = {
    orderNumber: `KDN-${Math.floor(100000 + Math.random() * 900000)}`,
    customerName: "Tes Buyer Menu Digital Terbaru",
    customerEmail: "tesbuyer@gmail.com",
    customerPhone: "081234567890",
    orderType: "takeaway",
    tableNumber: "-",
    subtotal: 35000,
    tax: 3500,
    total: 38500,
    hppTotal: 15000,
    netProfit: 20000,
    cashReceived: 50000,
    change: 11500,
    orderStatus: "NEW_ORDER",
    items: [
      {
        nameSnapshot: "Nasi Goreng Nyamleng",
        priceSnapshot: 25000,
        hppSnapshot: 10000,
        qty: 1,
      },
      {
        nameSnapshot: "Es Teh Manis Jumbo",
        priceSnapshot: 10000,
        hppSnapshot: 5000,
        qty: 1,
      },
    ],
  };

  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  console.log("DB URL exists:", Boolean(dbUrl));
  console.log("Prisma client exists:", Boolean(prisma));

  if (prisma) {
    try {
      const created = await (prisma as any).transaction.create({
        data: {
          orderNumber: payload.orderNumber,
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
          customerPhone: payload.customerPhone,
          orderType: payload.orderType,
          tableNumber: payload.tableNumber,
          subtotal: payload.subtotal,
          tax: payload.tax,
          total: payload.total,
          hppTotal: payload.hppTotal,
          netProfit: payload.netProfit,
          cashReceived: payload.cashReceived,
          change: payload.change,
          orderStatus: "NEW_ORDER",
          items: {
            create: payload.items.map((i) => ({
              nameSnapshot: i.nameSnapshot,
              priceSnapshot: i.priceSnapshot,
              hppSnapshot: i.hppSnapshot,
              qty: i.qty,
            })),
          },
        },
        include: { items: true },
      });
      console.log("Direct Prisma Create SUCCESS! Created ID:", created.id, "orderNumber:", created.orderNumber, "status:", created.orderStatus);
    } catch (err) {
      console.error("Direct Prisma Create FAILED:", err);
    }
  }

  if (prisma) {
    await (prisma as any).$disconnect();
  }
}

testPost();
