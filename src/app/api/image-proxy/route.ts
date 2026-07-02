import { NextRequest, NextResponse } from "next/server";

function getReferer(url: string): string {
  if (url.includes("shopee") || url.includes("shopeeusercontent")) {
    return "https://shopee.co.id/";
  }
  if (url.includes("tokopedia") || url.includes("tokopediaimg")) {
    return "https://www.tokopedia.com/";
  }
  return "";
}

function normalizeUrl(url: string): string {
  return url.replace(
    "https://down-id.img.shopeeusercontent.com/file/",
    "https://cf.shopee.co.id/file/"
  );
}

function placeholderResponse(): NextResponse {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect fill='%23e5e5e5' width='400' height='400'/><text fill='%23999' font-size='20' x='50%25' y='50%25' text-anchor='middle' dy='.3em'>No Image</text></svg>`;
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl || !rawUrl.startsWith("https://")) {
    return placeholderResponse();
  }

  const imageUrl = normalizeUrl(rawUrl);
  const referer = getReferer(imageUrl);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
    };
    if (referer) {
      headers["Referer"] = referer;
    }

    const response = await fetch(imageUrl, {
      headers,
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return placeholderResponse();
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return placeholderResponse();
    }

    const buf = await response.arrayBuffer();
    if (buf.byteLength < 100) {
      return placeholderResponse();
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return placeholderResponse();
  }
}