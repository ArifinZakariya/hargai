import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/services/ai";

export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json();
    if (!products?.length) return NextResponse.json({ error: "Products required" }, { status: 400 });
    const content = await aiService.analyzeProducts(products);
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
