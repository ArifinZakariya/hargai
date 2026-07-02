import { NextRequest, NextResponse } from "next/server";

const PLACEHOLDER_400 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23e5e5e5' width='400' height='400'/%3E%3Ctext fill='%23999' font-size='20' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url");

  if (!imageUrl || !imageUrl.startsWith("https://")) {
    return NextResponse.redirect(PLACEHOLDER_400, 302);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.tokopedia.com/",
      },
      signal: controller.signal,
      next: { revalidate: 86400 },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.redirect(PLACEHOLDER_400, 302);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.redirect(PLACEHOLDER_400, 302);
    }

    const buf = await response.arrayBuffer();
    if (buf.byteLength < 100) {
      return NextResponse.redirect(PLACEHOLDER_400, 302);
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.redirect(PLACEHOLDER_400, 302);
  }
}