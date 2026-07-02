import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/services/ai";

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();
    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });
    const content = await aiService.chat(message, history);
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
