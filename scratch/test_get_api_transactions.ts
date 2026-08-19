import { GET } from "../src/app/api/transactions/route";

async function testGetTransactionsAPI() {
  console.log("=== TESTING GET /api/transactions ===");
  const req = new Request("http://localhost:3000/api/transactions");
  const res = await GET(req);
  const data = await res.json();
  console.log(`GET /api/transactions returned ${data?.length || 0} items:`);
  data.slice(0, 5).forEach((t: any, idx: number) => {
    console.log(`[${idx + 1}] Order#: ${t.orderNumber} | Customer: ${t.customerName} | Status: ${t.orderStatus} | Total: ${t.total} | Items: ${t.items?.length || 0}`);
  });
}

testGetTransactionsAPI();
