import type { ScrapedProduct, ScrapeOptions, ScrapeResult } from "./types";
import { readFileSync } from "fs";
import path from "path";
import { createHmac } from "crypto";

const PARTNER_URL = "https://partner.shopeemobile.com/api/v2";
const SHOPEE_API = "https://shopee.co.id/api/v4/search/search_items";

function imageUrl(imgId: string): string {
  return imgId ? `https://cf.shopee.co.id/file/${imgId}` : "";
}

function parseCookies(filePath: string): string {
  try {
    const text = readFileSync(path.join(process.cwd(), filePath), "utf-8");
    const cookies = text
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => {
        const p = l.split("\t");
        return { name: p[5], value: p[6] };
      })
      .filter((c) => c.name && c.value);
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  } catch {
    return "";
  }
}

function getHeaders(cookieStr: string) {
  return {
    "Accept": "application/json",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "Referer": "https://shopee.co.id/",
    "Cookie": cookieStr,
  };
}

async function fetchShopeeApi(
  keyword: string,
  limit: number,
  offset: number,
  cookieStr: string
): Promise<any> {
  const url = `${SHOPEE_API}?keyword=${encodeURIComponent(keyword)}&limit=${limit}&page=${offset}&by=relevancy&order=desc`;

  const res = await fetch(url, {
    headers: getHeaders(cookieStr),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) return null;
  return await res.json();
}

function parseItems(data: any): ScrapedProduct[] {
  if (!data?.items) return [];

  return data.items.map((item: any) => {
    const b = item.item_basic;
    const price = Math.round(b.price / 100000);
    const priceMin = Math.round(b.price_min / 100000);
    const priceMax = Math.round(b.price_max / 100000);
    const priceBefore = b.price_before_discount
      ? Math.round(b.price_before_discount / 100000)
      : 0;

    let discount = 0;
    if (b.show_discount > 0) {
      discount = b.show_discount;
    } else if (priceBefore > price) {
      discount = Math.round(((priceBefore - price) / priceBefore) * 100);
    }

    const soldCount = b.historical_sold || b.global_sold_count || 0;
    const images = (b.images || []).map((i: string) => imageUrl(i));

    return {
      externalId: String(b.itemid || ""),
      name: b.name || "",
      slug: (b.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      url: `https://shopee.co.id/product/${b.shopid || ""}/${b.itemid || ""}`,
      imageUrl: images[0] || imageUrl(b.image || ""),
      images,
      marketplace: "SHOPEE" as const,
      category: String(b.catid || ""),
      brand: b.brand || "",
      price: priceMin || price,
      originalPrice: priceBefore > 0 ? priceBefore : undefined,
      discountPercent: discount > 0 ? discount : undefined,
      currency: "IDR",
      rating: b.item_rating?.rating_star || 0,
      reviewCount: b.cmt_count || 0,
      soldCount,
      stockQuantity: b.stock || 0,
      minOrder: 1,
      isOfficialStore: b.shopee_verified || false,
      isMall: b.is_official_shop || false,
      isStarSeller: false,
      freeShipping: b.show_free_shipping || false,
      hasVoucher: !!b.voucher_info,
      shopName: b.shop_name || "",
      shopUrl: `https://shopee.co.id/shop/${b.shopid || ""}`,
      location: b.shop_location || "",
    };
  });
}

export async function scrapeShopee(
  opts: ScrapeOptions
): Promise<ScrapeResult> {
  const limit = Math.min(opts.limit || 20, 50);
  const pageNum = (opts.page || 1) - 1;
  const keyword = opts.query;

  // Try Partner API first
  const partnerId = process.env.SHOPEE_PARTNER_ID;
  const apiKey = process.env.SHOPEE_API_KEY;
  if (partnerId && apiKey) {
    try {
      const ts = Math.floor(Date.now() / 1000);
      const sign = createHmac("sha256", apiKey)
        .update(`${partnerId}${ts}`)
        .digest("hex");
      const res = await fetch(
        `${PARTNER_URL}/product/search_item?partner_id=${partnerId}&timestamp=${ts}&sign=${sign}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword,
            page_size: limit,
            page_number: pageNum + 1,
          }),
          signal: AbortSignal.timeout(15000),
        }
      );
      if (res.ok) {
        const json = (await res.json()) as any;
        const items: any[] = json?.response?.items || [];
        if (items.length > 0) {
          return {
            products: items.map((item: any) => ({
              externalId: String(item.item_id || ""),
              name: item.item_name || "",
              slug: (item.item_name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              url: `https://shopee.co.id/product/${item.shop_id || ""}/${item.item_id || ""}`,
              imageUrl: item.image ? imageUrl(item.image) : "",
              images: (item.images || []).map((i: string) => imageUrl(i)),
              marketplace: "SHOPEE" as const,
              price: item.price_min || 0,
              originalPrice: item.price_max || undefined,
              discountPercent: item.discount || undefined,
              currency: "IDR",
              rating: item.item_rating?.rating_star || 0,
              reviewCount: item.item_rating?.rating_count || 0,
              soldCount: item.historical_sold || 0,
              stockQuantity: item.stock || 0,
              minOrder: 1,
              isOfficialStore: item.shopee_verified || false,
              isMall: item.is_mall || false,
              isStarSeller: false,
              freeShipping: false,
              hasVoucher: false,
              shopName: item.shop_name || "",
              shopUrl: `https://shopee.co.id/shop/${item.shop_id || ""}`,
              location: item.shop_location || "",
              category: item.category || "",
              brand: item.brand || "",
            })),
            total: json?.response?.total || items.length,
            page: opts.page || 1,
            totalPages: Math.ceil(
              (json?.response?.total || items.length) / limit
            ),
            source: "shopee",
            scrapedAt: new Date().toISOString(),
          };
        }
      }
    } catch {}
  }

  // Direct HTTP approach (fast, no Chrome needed)
  const cookieStr = parseCookies("shopee.co.id.txt");
  if (cookieStr) {
    try {
      const data = await fetchShopeeApi(keyword, limit, pageNum, cookieStr);
      if (data && data.items && data.items.length > 0) {
        const products = parseItems(data);
        return {
          products,
          total: data.total_count || products.length,
          page: opts.page || 1,
          totalPages: Math.ceil((data.total_count || products.length) / limit),
          source: "shopee",
          scrapedAt: new Date().toISOString(),
        };
      }
    } catch {}
  }

  // Fallback: try without cookies (some endpoints work without auth)
  try {
    const data = await fetchShopeeApi(keyword, limit, pageNum, "");
    if (data && data.items && data.items.length > 0) {
      const products = parseItems(data);
      return {
        products,
        total: data.total_count || products.length,
        page: opts.page || 1,
        totalPages: Math.ceil((data.total_count || products.length) / limit),
        source: "shopee",
        scrapedAt: new Date().toISOString(),
      };
    }
  } catch {}

  return {
    products: [],
    total: 0,
    page: opts.page || 1,
    totalPages: 0,
    source: "shopee",
    scrapedAt: new Date().toISOString(),
    error:
      "Gagal mengambil data dari Shopee. Coba lagi atau gunakan marketplace lain.",
  };
}
