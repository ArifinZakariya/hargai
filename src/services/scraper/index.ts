import { scrapeShopee } from "./shopee";
import { scrapeTokopedia } from "./tokopedia";
import type { ScrapeOptions, ScrapeResult } from "./types";

// Rate limiter
const lastReq = new Map<string, number>();
async function rateLimit(marketplace: string) {
  const last = lastReq.get(marketplace) || 0;
  const wait = 1500 - (Date.now() - last);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastReq.set(marketplace, Date.now());
}

export async function scrape(opts: ScrapeOptions): Promise<ScrapeResult> {
  const marketplace = opts.marketplace || "SHOPEE";
  await rateLimit(marketplace);
  if (marketplace === "SHOPEE") return scrapeShopee(opts);
  return scrapeTokopedia(opts);
}

export async function scrapeBoth(opts: Omit<ScrapeOptions, "marketplace">): Promise<{
  shopee: ScrapeResult;
  tokopedia: ScrapeResult;
  combined: ScrapeResult;
}> {
  // Sequential to respect rate limits
  const shopee = await scrape({ ...opts, marketplace: "SHOPEE" });
  const tokopedia = await scrape({ ...opts, marketplace: "TOKOPEDIA" });

  let all = [...shopee.products, ...tokopedia.products];

  // Sort combined
  switch (opts.sortBy) {
    case "price_asc": all.sort((a, b) => a.price - b.price); break;
    case "price_desc": all.sort((a, b) => b.price - a.price); break;
    case "rating": all.sort((a, b) => b.rating - a.rating); break;
    case "sold": all.sort((a, b) => b.soldCount - a.soldCount); break;
  }

  const limit = opts.limit || 20;
  const page = opts.page || 1;
  const start = (page - 1) * limit;
  const combined: ScrapeResult = {
    products: all.slice(start, start + limit),
    total: all.length,
    page,
    totalPages: Math.ceil(all.length / limit),
    source: "all",
    scrapedAt: new Date().toISOString(),
  };

  return { shopee, tokopedia, combined };
}

export type { ScrapedProduct, ScrapeOptions, ScrapeResult } from "./types";
