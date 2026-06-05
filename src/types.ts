export interface SaleTransaction {
  id: string | number;
  date: string; // YYYY-MM-DD
  productName: string;
  category: string;
  region: string;
  salesChannel: string; // e.g. "Online", "Retail", "Wholesale"
  quantity: number;
  price: number; // Selling unit price
  cost: number;  // Cost unit price
  revenue: number; // quantity * price
  profit: number;  // revenue - (quantity * cost)
  customerSegment: string; // e.g. "SME", "Enterprise", "Consumer"
}

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  category: string;
  region: string;
  salesChannel: string;
  customerSegment: string;
  searchTerm: string;
}

export interface KPIStats {
  totalRevenue: number;
  totalProfit: number;
  grossMarginPercent: number;
  totalUnitsSold: number;
  averageOrderValue: number;
  transactionCount: number;
}
