import fs from "fs";

const pagePath = "D:\\Menu digital Integrasi V2\\src\\app\\page.tsx";
let content = fs.readFileSync(pagePath, "utf-8");

// 1. Add fetchSupabaseVouchers import
if (!content.includes("fetchSupabaseVouchers")) {
  content = content.replace(
    "import { fetchSupabaseMenuItems } from '@/services/supabaseMenuService';",
    "import { fetchSupabaseMenuItems, fetchSupabaseVouchers } from '@/services/supabaseMenuService';"
  );
  if (!content.includes("fetchSupabaseVouchers")) {
    content = "import { fetchSupabaseVouchers } from '@/services/supabaseMenuService';\n" + content;
  }
}

// 2. Add 3-second voucher poller inside useEffect
const oldEffectStart = `useEffect(() => {
    fetchMenuItems();`;

const newEffectStart = `useEffect(() => {
    fetchMenuItems();

    // Auto 3s realtime voucher sync poller
    const voucherPoller = setInterval(() => {
      fetchSupabaseVouchers().then((vouchers) => {
        if (vouchers && Array.isArray(vouchers)) {
          useCartStore.setState({ availableVouchers: vouchers });
        }
      }).catch(() => {});
    }, 3000);`;

if (content.includes(oldEffectStart)) {
  content = content.replace(oldEffectStart, newEffectStart);
  console.log("Successfully added voucherPoller to useEffect in page.tsx!");
} else {
  console.warn("Could not find exact oldEffectStart in page.tsx");
}

fs.writeFileSync(pagePath, content, "utf-8");
console.log("Finished updating D:\\Menu digital Integrasi V2\\src\\app\\page.tsx");
