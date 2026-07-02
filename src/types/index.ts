import {
  Product,
  Supplier,
  PriceHistory,
  AIAnalysis,
  PurchaseProject,
  PurchaseItem,
  Favorite,
  SearchHistory,
  ComparisonHistory,
  Notification,
  Marketplace,
  ProductStatus,
  PurchaseStatus,
  NotificationType,
  ExportFormat,
} from "@prisma/client";

export type {
  Product,
  Supplier,
  PriceHistory,
  AIAnalysis,
  PurchaseProject,
  PurchaseItem,
  Favorite,
  SearchHistory,
  ComparisonHistory,
  Notification,
  Marketplace,
  ProductStatus,
  PurchaseStatus,
  NotificationType,
  ExportFormat,
};

export interface ProductWithSupplier extends Product {
  supplier?: Supplier | null;
}

export interface ProductWithDetails extends ProductWithSupplier {
  priceHistory?: PriceHistory[];
  analyses?: AIAnalysis[];
  _count?: {
    favoriteOf: number;
    purchaseItems: number;
  };
}

export interface SearchFilters {
  query?: string;
  marketplace?: Marketplace;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  officialStore?: boolean;
  mall?: boolean;
  starSeller?: boolean;
  freeShipping?: boolean;
  hasVoucher?: boolean;
  inStock?: boolean;
  sortBy?: "price_asc" | "price_desc" | "rating" | "sold" | "newest";
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: ProductWithSupplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: SearchFilters;
}

export interface ComparisonData {
  products: ProductWithDetails[];
  metrics: ComparisonMetrics;
}

export interface ComparisonMetrics {
  priceRange: { min: number; max: number; avg: number };
  ratingRange: { min: number; max: number; avg: number };
  bestValue: string;
  recommendations: string[];
}

export interface AIAnalysisResult {
  recommendation: string;
  confidence: number;
  riskScore: number;
  savingsEstimate: number;
  pros: string[];
  cons: string[];
  summary: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalSuppliers: number;
  activeProjects: number;
  totalFavorites: number;
  recentSearches: number;
  pendingApprovals: number;
  priceAlerts: number;
  avgSavings: number;
}

export interface TrendData {
  date: string;
  price: number;
  marketplace: Marketplace;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ExportOptions {
  format: ExportFormat;
  includeImages?: boolean;
  includeAnalysis?: boolean;
  includePriceHistory?: boolean;
  dateRange?: { from: Date; to: Date };
}
