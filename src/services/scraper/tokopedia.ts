import type { ScrapedProduct, ScrapeOptions, ScrapeResult } from "./types";

const GQL_URL = "https://gql.tokopedia.com/graphql/SearchProductV5Query";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

const GRAPHQL_QUERY = `query SearchProductV5Query($params: String!) {
  searchProductV5(params: $params) {
    data {
      products {
        id
        name
        url
        price { text number original discountPercentage }
        shop { id name city }
        rating
      }
    }
    header { totalData }
  }
}`;

function buildParams(opts: ScrapeOptions): string {
  const page = opts.page || 1;
  const limit = Math.min(opts.limit || 40, 60);
  const start = (page - 1) * limit;
  let ob = "23";
  if (opts.sortBy === "price_asc") ob = "3";
  else if (opts.sortBy === "price_desc") ob = "4";
  else if (opts.sortBy === "rating") ob = "5";
  else if (opts.sortBy === "sold") ob = "2";
  else if (opts.sortBy === "newest") ob = "9";
  return `device=desktop&ob=${ob}&page=${page}&q=${encodeURIComponent(opts.query)}&rows=${limit}&start=${start}&st=product&safe_search=false&source=search`;
}

function parseSearchItem(item: any): Partial<ScrapedProduct> | null {
  try {
    if (!item || !item.name) return null;
    const priceNum = item.price?.number || 0;
    const origText = item.price?.original || "";
    const origNum = origText ? parseInt(origText.replace(/[^0-9]/g, ""), 10) || 0 : 0;
    const hasDiscount = item.price?.discountPercentage && item.price.discountPercentage > 0;
    const shop = item.shop || {};
    const slug = item.url?.split("/").pop()?.split("?")[0] || `tok-${item.id}`;
    const fullUrl = item.url?.startsWith("http") ? item.url : `https://www.tokopedia.com/${item.url || ""}`;
    return {
      externalId: String(item.id || ""),
      name: item.name,
      slug,
      url: fullUrl,
      marketplace: "TOKOPEDIA" as const,
      category: "",
      brand: "",
      price: priceNum,
      originalPrice: hasDiscount ? origNum : undefined,
      discountPercent: item.price?.discountPercentage || undefined,
      currency: "IDR",
      rating: typeof item.rating === "string" ? parseFloat(item.rating) : (item.rating || 0),
      shopName: shop.name || "",
      shopUrl: shop.id ? `https://www.tokopedia.com/${shop.id}` : "",
      location: shop.city || "",
    };
  } catch {
    return null;
  }
}

async function enrichProduct(product: Partial<ScrapedProduct>): Promise<ScrapedProduct> {
  // Defaults
  const base: ScrapedProduct = {
    ...product,
    imageUrl: "",
    images: [],
    reviewCount: 0,
    soldCount: 0,
    stockQuantity: 0,
    minOrder: 1,
    isOfficialStore: false,
    isMall: false,
    isStarSeller: false,
    freeShipping: false,
    hasVoucher: false,
  } as ScrapedProduct;

  if (!product.url) return base;

  try {
    const res = await fetch(product.url, {
      headers: { "User-Agent": UA, "Accept": "text/html" },
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) return base;
    const html = await res.text();

    // Extract from Apollo cache in script tags
    const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
    for (const s of scripts) {
      const content = s.replace(/<\/?script[^>]*>/g, "");
      if (content.length < 200) continue;

      // countSold
      const soldMatch = content.match(/"countSold"\s*:\s*"(\d+)"/);
      if (soldMatch) base.soldCount = parseInt(soldMatch[1]) || 0;

      // countReview
      const reviewMatch = content.match(/"countReview"\s*:\s*"(\d+)"/);
      if (reviewMatch) base.reviewCount = parseInt(reviewMatch[1]) || 0;

      // rating
      const ratingMatch = content.match(/"rating"\s*:\s*([\d.]+)/);
      if (ratingMatch && !base.rating) base.rating = parseFloat(ratingMatch[1]) || 0;

      // countView
      const viewMatch = content.match(/"countView"\s*:\s*"(\d+)"/);

      // Break if we found enough
      if (base.soldCount && base.reviewCount) break;
    }

    const imgUrls: string[] = [];

    const ogMatch = html.match(/<meta[^>]*(?:property|name)="og:image"[^>]*content="([^"]+)"/i);
    if (ogMatch) {
      const ogUrl = ogMatch[1].replace(/&amp;/g, "&");
      imgUrls.push(ogUrl);
    }

    if (imgUrls.length === 0) {
      const prefixRegex = /"prefix"\s*:\s*"(https:\/\/images[^"]+)"/g;
      let pm: RegExpExecArray | null;
      while ((pm = prefixRegex.exec(html)) !== null) {
        const suffixIdx = html.indexOf('"suffix"', pm.index);
        if (suffixIdx !== -1 && suffixIdx - pm.index < 400) {
          const suffixMatch = html.substring(suffixIdx, suffixIdx + 100).match(/"suffix"\s*:\s*"([^"]+)"/);
          if (suffixMatch) imgUrls.push(pm[1].replace(/\/$/, "") + suffixMatch[1]);
        }
      }
    }

    if (imgUrls.length === 0) {
      const ldRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
      let ldMatch;
      while ((ldMatch = ldRegex.exec(html)) !== null) {
        try {
          const ldJson = JSON.parse(ldMatch[1]);
          if (ldJson.image) {
            const images = Array.isArray(ldJson.image) ? ldJson.image : [ldJson.image];
            imgUrls.push(...images.filter((img: any) => typeof img === "string" && img.startsWith("http")));
          }
        } catch {}
      }
    }

    if (imgUrls.length === 0) {
      const imgTagRegex = /<img[^>]+(?:src|data-src|data-original)=["'](https:\/\/images\.tokopedia\.net\/[^"']+)["']/g;
      let imgMatch;
      while ((imgMatch = imgTagRegex.exec(html)) !== null) {
        const imgUrl = imgMatch[1];
        if (!imgUrls.includes(imgUrl)) imgUrls.push(imgUrl);
        if (imgUrls.length >= 3) break;
      }
    }

    if (imgUrls.length === 0) {
      const genericImgRegex = /"(https:\/\/images\.tokopedia\.net\/img\/[^"]+)"/g;
      let genMatch;
      while ((genMatch = genericImgRegex.exec(html)) !== null) {
        const imgUrl = genMatch[1];
        if (!imgUrls.includes(imgUrl)) imgUrls.push(imgUrl);
        if (imgUrls.length >= 3) break;
      }
    }

    if (imgUrls.length > 0) {
      base.images = [...new Set(imgUrls)].slice(0, 5);
      if (!base.imageUrl) {
        base.imageUrl = imgUrls[0] || "";
      }
    }

    console.log(`[Scrape] ${product.name?.slice(0, 30)} | Images: ${imgUrls.length} | URL: ${base.imageUrl?.slice(0, 80)}`);

    // Extract stock from HTML
    const stockMatch = html.match(/"stock"\s*:\s*(\d+)/);
    if (stockMatch) base.stockQuantity = parseInt(stockMatch[1]) || 0;

    // Check for official store / badges
    const htmlLower = html.toLowerCase();
    base.isOfficialStore = htmlLower.includes("official store") || htmlLower.includes("tokopedia official");
    base.freeShipping = htmlLower.includes("gratis ongkir") || htmlLower.includes("free ongkir");
    base.isStarSeller = htmlLower.includes("star seller");
    base.isMall = htmlLower.includes("power merchant") || htmlLower.includes("mall");

  } catch (e) {
    console.error(`[Scrape] Error enrich ${product.name}:`, e instanceof Error ? e.message : e);
  }

  return base;
}

// Concurrency-limited enrichment
async function enrichAll(products: Partial<ScrapedProduct>[], concurrency = 3): Promise<ScrapedProduct[]> {
  const results: ScrapedProduct[] = [];
  let idx = 0;

  async function worker() {
    while (idx < products.length) {
      const i = idx++;
      results[i] = await enrichProduct(products[i]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, products.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function scrapeTokopedia(opts: ScrapeOptions): Promise<ScrapeResult> {
  const hasPriceFilter = opts.minPrice || opts.maxPrice;
  const deviceId = Math.floor(Math.random() * 9e17 + 1e17).toString();
  const limit = opts.limit || 20;

  try {
    // Step 1: Search
    const fetchLimit = 60;
    const params = buildParams({ ...opts, limit: fetchLimit });
    const res = await fetch(GQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        "Origin": "https://www.tokopedia.com",
        "Referer": "https://www.tokopedia.com/",
        "User-Agent": UA,
        "X-Source": "tokopedia-lite",
        "X-Device": "desktop-0.0",
        "X-Device-Id": deviceId,
        "bd-Device-Id": deviceId,
      },
      body: JSON.stringify([{ operationName: "SearchProductV5Query", variables: { params }, query: GRAPHQL_QUERY }]),
      cache: "no-store",
    });

    if (!res.ok) return empty(opts, `HTTP ${res.status}`);
    const json = await res.json();
    const gqlData = json?.[0]?.data?.searchProductV5;
    if (!gqlData) return empty(opts, "Invalid response");

    const rawProducts = (gqlData.data?.products || []) as any[];
    let products = rawProducts.map(parseSearchItem).filter((p): p is Partial<ScrapedProduct> => p !== null);

    // Step 2: Apply price/rating filters
    let filtered = products;
    if (opts.minPrice) filtered = filtered.filter(p => (p.price || 0) >= opts.minPrice!);
    if (opts.maxPrice) filtered = filtered.filter(p => (p.price || 0) <= opts.maxPrice!);
    if (opts.minRating) filtered = filtered.filter(p => (p.rating || 0) >= opts.minRating!);

    // Step 3: Retry with price_desc if 0 results
    let priceInfo: { min?: number; max?: number } = {};
    if (hasPriceFilter && filtered.length === 0 && products.length > 0) {
      const retryParams = buildParams({ ...opts, limit: 60, sortBy: "price_desc" });
      const retryRes = await fetch(GQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json", "Origin": "https://www.tokopedia.com", "Referer": "https://www.tokopedia.com/", "User-Agent": UA, "X-Source": "tokopedia-lite", "X-Device": "desktop-0.0" },
        body: JSON.stringify([{ operationName: "SearchProductV5Query", variables: { params: retryParams }, query: GRAPHQL_QUERY }]),
        cache: "no-store",
      });
      if (retryRes.ok) {
        const retryJson = await retryRes.json();
        const retryProducts = (retryJson?.[0]?.data?.searchProductV5?.data?.products || []) as any[];
        const parsed = retryProducts.map(parseSearchItem).filter((p): p is Partial<ScrapedProduct> => p !== null);
        const phonePrices = [...products, ...parsed].map(p => p.price || 0).filter(p => p > 100000);
        if (phonePrices.length > 0) priceInfo = { min: Math.min(...phonePrices), max: Math.max(...phonePrices) };
        filtered = parsed;
        if (opts.minPrice) filtered = filtered.filter(p => (p.price || 0) >= opts.minPrice!);
        if (opts.maxPrice) filtered = filtered.filter(p => (p.price || 0) <= opts.maxPrice!);
        if (opts.minRating) filtered = filtered.filter(p => (p.rating || 0) >= opts.minRating!);
      }
    }

    // Step 4: Enrich with product detail (sold count, images, etc.)
    const enriched = await enrichAll(filtered.slice(0, limit), 3);

    return {
      products: enriched,
      total: enriched.length,
      page: opts.page || 1,
      totalPages: Math.ceil(enriched.length / limit),
      source: "tokopedia",
      scrapedAt: new Date().toISOString(),
      priceRange: hasPriceFilter && enriched.length === 0 && priceInfo.min ? priceInfo : undefined,
    };
  } catch (e) {
    console.error("Tokopedia error:", e);
    return empty(opts, e instanceof Error ? e.message : "Unknown error");
  }
}

function empty(opts: ScrapeOptions, error?: string): ScrapeResult {
  return { products: [], total: 0, page: opts.page || 1, totalPages: 0, source: "tokopedia", scrapedAt: new Date().toISOString(), error };
}
