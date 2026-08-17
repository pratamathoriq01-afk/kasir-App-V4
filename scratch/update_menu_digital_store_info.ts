import fs from "fs";

const posTypesPath = "D:\\Menu digital Integrasi V2\\src\\types\\pos.ts";
let content = fs.readFileSync(posTypesPath, "utf-8");

const oldWA = "export const OFFICIAL_STORE_WA = process.env.NEXT_PUBLIC_STORE_WA || '';";
const newWA = "export const OFFICIAL_STORE_WA = process.env.NEXT_PUBLIC_STORE_WA || '085113661387';";

const oldLoc = "export const STORE_LOCATION = process.env.NEXT_PUBLIC_STORE_LOCATION || '';";
const newLoc = "export const STORE_LOCATION = process.env.NEXT_PUBLIC_STORE_LOCATION || 'Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kecamatan Blimbing, Kota Malang, Jawa Timur';";

if (content.includes(oldWA)) {
  content = content.replace(oldWA, newWA);
}
if (content.includes(oldLoc)) {
  content = content.replace(oldLoc, newLoc);
}

fs.writeFileSync(posTypesPath, content, "utf-8");
console.log("Updated store location and WhatsApp in Menu Digital pos.ts");
