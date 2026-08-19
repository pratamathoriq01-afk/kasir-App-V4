export interface MenuItem {
  id: string;
  name: string;
  category: "Makanan" | "Minuman" | "Cemilan" | string;
  price: number;
  hpp: number;
  taxPercent: number;
  icon?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CartItem {
  menuItem: MenuItem;
  qty: number;
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
