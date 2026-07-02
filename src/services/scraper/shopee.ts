import type { ScrapedProduct, ScrapeOptions, ScrapeResult } from "./types";
import { readFileSync } from "fs";
import path from "path";
import { createHmac } from "crypto";

const PARTNER_URL = "https://partner.shopeemobile.com/api/v2";

function imageUrl(imgId: string): string {
  return imgId ? `https://cf.shopee.co.id/file/${imgId}` : "";
}

function parseCookies(filePath: string) {
  try {
    const text = readFileSync(path.join(process.cwd(), filePath), "utf-8");
    return text
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => {
        const p = l.split("\t");
        return {
          name: p[5],
          value: p[6],
          domain: p[0] || "",
          path: p[2] || "/",
          secure: p[3] === "TRUE",
          httpOnly: false,
        };
      })
      .filter((c) => c.name && c.value);
  } catch {
    return [];
  }
}

let browserPool: {
  chrome: any;
  client: any;
  ready: boolean;
} | null = null;

async function getBrowser() {
  if (browserPool?.ready) return browserPool;

  if (browserPool && !browserPool.ready) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const chromeLauncher = require("chrome-launcher");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CDP = require("chrome-remote-interface");

    const chrome = await chromeLauncher.launch({
      chromeFlags: ["--no-first-run", "--disable-extensions", "--no-sandbox"],
    });

    const client = await CDP({ port: chrome.port });
    const { Network, Page } = client;

    await Network.enable();
    await Page.enable();

    const cookies = parseCookies("shopee.co.id.txt");
    for (const c of cookies) {
      await Network.setCookie(c);
    }

    await Page.navigate({ url: "https://shopee.co.id/" });
    await new Promise((r) => setTimeout(r, 8000));

    browserPool = { chrome, client, ready: true };
    return browserPool;
  } catch (e) {
    console.error("Failed to launch Chrome:", e);
    return null;
  }
}

async function closeBrowser() {
  if (browserPool) {
    try {
      await browserPool.client.close();
      await browserPool.chrome.kill();
    } catch {}
    browserPool = null;
  }
}

async function searchItems(
  keyword: string,
  limit: number,
  offset: number
): Promise<any> {
  const browser = await getBrowser();
  if (!browser) return null;

  const { client } = browser;
  const { Runtime } = client;

  try {
    const result = await Runtime.evaluate({
      expression: `
        (async () => {
          try {
            const res = await fetch('https://shopee.co.id/api/v4/search/search_items?keyword=${encodeURIComponent(keyword)}&limit=${limit}&page=${offset}&by=relevancy&order=desc', {
              headers: { 'Accept': 'application/json' },
              credentials: 'include',
            });
            return await res.text();
          } catch(e) {
            return JSON.stringify({ error: e.message });
          }
        })()
      `,
      awaitPromise: true,
    });

    if (result.result.value) {
      const parsed = JSON.parse(result.result.value);

      if (parsed.error) {
        await closeBrowser();
        browserPool = null;
        return null;
      }

      return parsed;
    }
  } catch (e) {
    await closeBrowser();
    browserPool = null;
  }

  return null;
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

    const soldText = b.item_card_display_sold_count?.display_sold_count_text || "";
    const soldCount = b.historical_sold || b.global_sold_count || 0;
    const monthlySold = b.sold || 0;

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
      soldCount: soldCount,
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

  const data = await searchItems(keyword, limit, pageNum);
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

  try {
    const { Runtime } = (browserPool?.client || (await getBrowser()))!.client;
    const sugResult = await Runtime.evaluate({
      expression: `
        (async () => {
          try {
            const res = await fetch('https://shopee.co.id/api/v4/search/search_suggestion?keyword=${encodeURIComponent(keyword)}&limit=${limit}', {
              headers: { 'Accept': 'application/json' },
              credentials: 'include',
            });
            return await res.text();
          } catch(e) {
            return JSON.stringify({ error: e.message });
          }
        })()
      `,
      awaitPromise: true,
    });

    if (sugResult.result.value) {
      const json = JSON.parse(sugResult.result.value);
      const queries: any[] = json?.data?.queries || [];
      const products: ScrapedProduct[] = [];
      const seen = new Set<string>();

      for (const q of queries) {
        const text = q.text;
        if (!text || seen.has(text.toLowerCase())) continue;
        seen.add(text.toLowerCase());

        const itemId = q.item_id || q.id;
        const imageIds: string[] = Array.isArray(q.pic) ? q.pic : [];

        products.push({
          externalId: String(itemId || Math.random()),
          name: text,
          slug: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          url: `https://shopee.co.id/search?keyword=${encodeURIComponent(text)}`,
          imageUrl: imageIds[0] ? imageUrl(imageIds[0]) : "",
          images: imageIds.map(imageUrl),
          marketplace: "SHOPEE",
          price: 0,
          currency: "IDR",
          rating: 0,
          reviewCount: 0,
          soldCount: 0,
          stockQuantity: 0,
          minOrder: 1,
          category: "",
          brand: "",
          isOfficialStore: false,
          isMall: false,
          isStarSeller: false,
          freeShipping: false,
          hasVoucher: false,
          shopName: "",
          shopUrl: "",
          location: "",
        });
      }

      if (products.length > 0) {
        return {
          products,
          total: products.length,
          page: opts.page || 1,
          totalPages: 1,
          source: "shopee",
          scrapedAt: new Date().toISOString(),
        };
      }
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

export { closeBrowser as closeShopeeBrowser };
