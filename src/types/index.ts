export interface MenuItem {
  id: string;
  name: string;
  category: "Makanan" | "Minuman" | "Cemilan" | string;
  price: number;
  hpp: number;
  taxPercent: number;
  description?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  allowedAddOnCategories?: string[] | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  hpp: number;
  category?: string | null; // "Semua" | "Menu Ayam Nyamleng" | "Menu Ikan Nyamleng" | "Menu Minuman" | "Menu Alacarte"
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CartItem {
  id?: string;
  menuItem: MenuItem;
  qty: number;
  selectedAddOns?: AddOn[];
  notes?: string;
}

export interface TransactionItem {
  id?: string;
  transactionId?: string;
  menuItemId?: string | null;
  nameSnapshot: string;
  priceSnapshot: number;
  hppSnapshot: number;
  qty: number;
  addOnsSnapshot?: string | null;
}

export interface Transaction {
  id: string;
  orderNumber: string;
  customerName?: string | null;
  orderType: "dine-in" | "takeaway" | string;
  tableNumber?: string | null;
  subtotal: number;
  discountType?: "percent" | "fixed" | null;
  discountValue: number;
  discountAmount: number;
  tax: number;
  total: number;
  hppTotal: number;
  netProfit: number;
  cashReceived: number;
  change: number;
  createdAt: string | Date;
  orderStatus?: string | null;
  orderNotes?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items: TransactionItem[];
}

export interface MonthlyArchive {
  id: string;
  month: number;
  year: number;
  totalRevenue: number;
  totalHpp: number;
  netProfit: number;
  totalTax: number;
  createdAt: string | Date;
}

export interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: "percent" | "fixed" | string;
  discountValue: number;
  maxDiscount?: number | null;
  minSubtotal: number;
  validUntil: string;
  isActive?: boolean | null;
  createdAt?: string | Date | null;
}

export interface StoreInfo {
  name: string;
  address: string;
  city: string;
  phone: string;
}

export interface DaySchedule {
  dayName: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu";
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export type WeeklySchedule = DaySchedule[];

export interface StoreSettings {
  id: string;
  storeName: string;
  address: string;
  whatsapp: string;
  city: string;
  province: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  isAutoSchedule: boolean;
  closedReason: string;
  weeklySchedule?: WeeklySchedule | string | null;
  googleClientId?: string | null;
  googleRedirectUri?: string | null;
  updatedAt?: string | Date;
}

