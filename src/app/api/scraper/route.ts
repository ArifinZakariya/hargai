import { NextRequest, NextResponse } from "next/server";
import { scrape, scrapeBoth } from "@/services/scraper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, marketplace, minPrice, maxPrice, minRating, officialStore, mall, starSeller, freeShipping, sortBy, page = 1, limit = 20, searchAll = false } = body;

    if (!query) return NextResponse.json({ success: false, error: "Query wajib diisi" }, { status: 400 });

    if (searchAll || !marketplace) {
      const result = await scrapeBoth({ query, minPrice, maxPrice, minRating, officialStore, mall, starSeller, freeShipping, sortBy, page, limit });
      return NextResponse.json({
        success: true,
        data: result.combined,
        details: {
          shopee: { total: result.shopee.total, products: result.shopee.products, error: result.shopee.error },
          tokopedia: { total: result.tokopedia.total, products: result.tokopedia.products, error: result.tokopedia.error },
        },
      });
    }

    const result = await scrape({ query, marketplace, minPrice, maxPrice, minRating, officialStore, mall, starSeller, freeShipping, sortBy, page, limit });
    return NextResponse.json({ success: true, data: result, error: result.error });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const query = sp.get("q");
  if (!query) return NextResponse.json({ error: "q required" }, { status: 400 });

  const result = await scrape({
    query,
    marketplace: (sp.get("marketplace") as any) || "SHOPEE",
    minPrice: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
    maxPrice: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
    minRating: sp.get("minRating") ? Number(sp.get("minRating")) : undefined,
    sortBy: sp.get("sortBy") || undefined,
    page: Number(sp.get("page")) || 1,
    limit: Number(sp.get("limit")) || 20,
  });
  return NextResponse.json({ success: true, data: result });
}
