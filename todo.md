# Kedai Nyamleng — Migrasi ke Next.js

Rencana desain & MVP untuk convert aplikasi kasir "Kedai Nyamleng" dari vanilla HTML/CSS/JS ke Next.js, dengan database beneran (bukan localStorage lagi) dan styling Tailwind.

---

## 1. Ringkasan Project Lama

Repo asal: `pratamathoriq01-afk/kedainyamleng` — 1 halaman (`index.html`) + `app.js` + `style.css`, semua vanilla JS, data disimpan di `localStorage`. 3 tab utama:

1. **Kasir (POS)** — grid menu + filter kategori, keranjang, nama pemesan, tipe pesanan (dine-in/takeaway + no. meja), diskon (%/Rp), pajak 10%, modal pembayaran (uang tunai + kembalian + shortcut nominal), cetak struk (USB / Bluetooth thermal printer / print browser), nota dapur terpisah dari nota customer.
2. **Kelola Menu** — CRUD menu (nama, kategori, harga jual, HPP/modal, pajak per item, ikon emoji, foto produk), search.
3. **Dashboard Laporan** — filter periode (hari ini / 7 hari / bulan ini), kartu statistik (omzet, HPP, laba bersih, margin, pajak terkumpul), grafik tren (line chart) & proporsi (doughnut chart) pakai Chart.js, analisis "AI narrative" otomatis + rekomendasi, tabel analitik per menu, arsip laporan bulanan, tabel riwayat transaksi, export PDF (jsPDF) & Excel (ExcelJS/SheetJS), reset riwayat.

Info toko dari struk: **Kedai Nyamleng**, Jl. LA. Sucipto XIV/42, Kota Malang.

---

## 2. Tech Stack Baru

| Layer | Pilihan |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via **Supabase** |
| ORM | Prisma |
| Auth (opsional MVP) | Supabase Auth (email/password) — 1 akun kasir dulu, role bisa ditambah nanti |
| State di client | React state + Zustand untuk cart (state keranjang yang kompleks) |
| Server komunikasi | Next.js Server Actions / Route Handlers (tanpa REST terpisah) |
| Chart | Chart.js tetap (via `react-chartjs-2`) |
| Export PDF | jsPDF + jspdf-autotable (tetap, jalan di client) |
| Export Excel | ExcelJS (tetap) |
| Icon | lucide-react (pengganti Lucide CDN) |
| Print struk | Web USB API & Web Bluetooth API tetap dipakai (browser-only, jalan di client component) |
| Upload foto menu | Supabase Storage (bucket `menu-images`) — pengganti base64 di localStorage |
| Deploy | Vercel |

---

## 3. Skema Database (Prisma / Postgres)

```prisma
model MenuItem {
  id          String   @id @default(cuid())
  name        String
  category    String   // "Makanan" | "Minuman" | "Cemilan"
  price       Int      // harga jual, Rupiah
  hpp         Int      // harga pokok / modal
  taxPercent  Int      @default(10)
  icon        String?  // emoji
  imageUrl    String?  // Supabase Storage URL
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  items       TransactionItem[]
}

model Transaction {
  id            String   @id @default(cuid())
  orderNumber   String   @unique   // #001, #002, ...
  customerName  String?
  orderType     String   // "dine-in" | "takeaway"
  tableNumber   String?
  subtotal      Int
  discountType  String?  // "percent" | "fixed"
  discountValue Int      @default(0)
  discountAmount Int     @default(0)
  tax           Int
  total         Int
  hppTotal      Int      // total modal, untuk hitung laba
  netProfit     Int
  cashReceived  Int
  change        Int
  createdAt     DateTime @default(now())
  items         TransactionItem[]
}

model TransactionItem {
  id            String       @id @default(cuid())
  transaction   Transaction  @relation(fields: [transactionId], references: [id])
  transactionId String
  menuItem      MenuItem?    @relation(fields: [menuItemId], references: [id])
  menuItemId    String?
  nameSnapshot  String       // nama menu saat transaksi (jaga2 kalau menu dihapus/diubah)
  priceSnapshot Int
  hppSnapshot   Int
  qty           Int
}

model MonthlyArchive {
  id           String   @id @default(cuid())
  month        Int
  year         Int
  totalRevenue Int
  totalHpp     Int
  netProfit    Int
  totalTax     Int
  createdAt    DateTime @default(now())
}
```

Catatan: `nameSnapshot`/`priceSnapshot`/`hppSnapshot` di `TransactionItem` penting supaya riwayat transaksi lama tidak berubah kalau menu di-edit/dihapus belakangan — beda dari versi lama yang cuma nyimpen array datar di localStorage.

---

## 4. Struktur Folder (App Router)

```
kedai-nyamleng/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                    # redirect ke /kasir
│  ├─ kasir/
│  │  ├─ page.tsx
│  │  └─ components/ (MenuGrid, Cart, PaymentModal, ReceiptPrint...)
│  ├─ menu/
│  │  ├─ page.tsx
│  │  └─ components/ (MenuTable, MenuFormModal...)
│  ├─ laporan/
│  │  ├─ page.tsx
│  │  └─ components/ (StatsCards, SalesTrendChart, PieChart, AiInsightCard, ArchiveGrid, HistoryTable...)
│  └─ api/
│     ├─ transactions/route.ts
│     ├─ menu/route.ts
│     └─ reports/route.ts
├─ lib/
│  ├─ prisma.ts
│  ├─ supabase.ts
│  ├─ printer/ (usb.ts, bluetooth.ts — logic Web USB/Bluetooth dipisah dari UI)
│  └─ pdf-export.ts, excel-export.ts
├─ store/
│  └─ cart-store.ts               # Zustand
├─ prisma/
│  └─ schema.prisma
└─ tailwind.config.ts
```

---

## 5. Design Tokens (Tailwind)

Berdasarkan warna yang kepakai di kartu AI Insight & status badge versi lama (amber/orange sebagai aksen, plus semantic colors):

```js
// tailwind.config.ts (extend.colors)
{
  primary:   { DEFAULT: '#d97706', light: '#fef3c7', dark: '#92400e' }, // amber/orange, warna khas kedai
  success:   '#10b981',
  danger:    '#dc2626',
  warning:   '#f59e0b',
  info:      '#3b82f6',
  purple:    '#8b5cf6',
}
```
Font: **Outfit** (UI) + **Space Mono** (angka/struk thermal) — tetap dari Google Fonts, di-load lewat `next/font/google`.

> Catatan: aku belum baca isi `style.css` yang sebenarnya (file itu tidak sempat kebaca lewat fetch), jadi token warna di atas hasil tebakan dari elemen yang terlihat di `index.html`. Pas mulai coding, aku akan cocokkan ulang ke `style.css` asli biar warna & spacing persis sama.

---

## 6. Cakupan MVP (Full Rewrite Sekaligus — sesuai request)

- [x] Setup project Next.js + Tailwind + Prisma + Supabase
- [x] Skema database + migrasi
- [x] **Tab Kasir**: grid menu dari DB, filter kategori, cart (Zustand), hitung subtotal/pajak/diskon/total, modal pembayaran + kembalian, simpan transaksi ke DB, cetak struk customer & dapur (USB/Bluetooth/print browser)
- [x] **Tab Kelola Menu**: list + search, tambah/edit/hapus menu, upload foto ke Supabase Storage
- [x] **Tab Dashboard Laporan**: filter periode, stats cards, line chart + doughnut chart, tabel analitik per menu, tabel riwayat transaksi + detail, export PDF, export Excel, arsip bulanan, reset riwayat
- [x] AI narrative insight (bisa versi rule-based dulu seperti aslinya, atau nanti diupgrade pakai LLM beneran)

---

## 7. Hal yang Perlu Dikonfirmasi Sebelum Mulai Coding

1. **Supabase**: kamu sudah punya project Supabase (URL + anon key + service role key), atau perlu aku pandu bikin dari nol?
2. **Auth**: MVP ini mau pakai login (misal 1 akun kasir) atau bebas akses dulu (khusus internal warung, belum perlu auth)?
3. **Isi `style.css` & `app.js` asli** — supaya port-nya presisi (warna, animasi, detail logic diskon/pajak per item vs global), aku perlu baca isi file itu langsung. Bisa upload `app.js` dan `style.css` ke chat ini?

Setelah 3 hal di atas jelas, aku lanjut scaffolding project + kirim sebagai file yang bisa didownload/di-push ke repo baru.
