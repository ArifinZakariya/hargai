export interface ScrapedProduct {
  externalId: string;
  name: string;
  slug: string;
  url: string;
  imageUrl: string;
  images: string[];
  marketplace: "SHOPEE" | "TOKOPEDIA";
  category: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  soldCount: number;
  stockQuantity: number;
  minOrder: number;
  isOfficialStore: boolean;
  isMall: boolean;
  isStarSeller: boolean;
  freeShipping: boolean;
  hasVoucher: boolean;
  shopName: string;
  shopUrl: string;
  location: string;
}

export interface ScrapeOptions {
  query: string;
  marketplace?: "SHOPEE" | "TOKOPEDIA";
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  officialStore?: boolean;
  mall?: boolean;
  starSeller?: boolean;
  freeShipping?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface ScrapeResult {
  products: ScrapedProduct[];
  total: number;
  page: number;
  totalPages: number;
  source: string;
  scrapedAt: string;
  error?: string;
  priceRange?: { min?: number; max?: number };
}
