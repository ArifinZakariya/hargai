interface AIResponse { content: string; model: string; }

class AIService {
  private key = process.env.AI_API_KEY || "";
  private base = process.env.AI_BASE_URL || "https://api.iamhc.cn/v1";
  private model = process.env.AI_MODEL || "Qwen3.5-397B-A17B";

  private async call(messages: { role: string; content: string }[], temp = 0.7, retries = 2): Promise<AIResponse> {
    if (!this.key) return { content: "AI API key belum dikonfigurasi.", model: this.model };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${this.base}/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: this.model, messages, temperature: temp, max_tokens: 2048 }),
        });
        if (!res.ok) {
          if (attempt < retries && (res.status === 504 || res.status === 429)) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          const errBody = await res.text();
          throw new Error(`API ${res.status}: ${errBody}`);
        }
        const data = await res.json();
        return { content: data.choices[0].message.content, model: this.model };
      } catch (e: any) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        console.error("AI error:", e);
        return { content: `Error: ${e.message}. Silakan coba lagi.`, model: this.model };
      }
    }
    return { content: "Gagal menghubungi AI.", model: this.model };
  }

  async analyzeProducts(products: any[]): Promise<string> {
    const list = products.map((p, i) =>
      `${i + 1}. ${p.name} | Rp ${(p.price || 0).toLocaleString("id-ID")} | ${p.marketplace} | Rating: ${p.rating || 0} | Review: ${p.reviewCount || 0} | Terjual: ${p.soldCount || 0} | Toko: ${p.shopName || "N/A"} (${p.location || "N/A"}) | Official: ${p.isOfficialStore ? "Ya" : "Tidak"} | Gratis Ongkir: ${p.freeShipping ? "Ya" : "Tidak"}`
    ).join("\n");

    const { content } = await this.call([
      { role: "system", content: "Kamu adalah HARGAI, ahli procurement Indonesia. Analisis produk berikut dan berikan rekomendasi BELI. Jawab dalam Bahasa Indonesia, singkat dan jelas." },
      { role: "user", content: `Bandingkan produk ini:\n${list}\n\nBerikan: 1) Rekomendasi mana yang beli, 2) Analisis harga & value, 3) Pro & Con masing-masing, 4) Kesimpulan.` },
    ], 0.5);
    return content;
  }

  async chat(message: string, history?: { role: string; content: string }[]): Promise<string> {
    const { content } = await this.call([
      { role: "system", content: "Kamu adalah HARGAI, asisten procurement. Bantu user mencari produk termurah dari Tokopedia, bandingkan harga, dan berikan rekomendasi. Jawab dalam Bahasa Indonesia. Singkat." },
      ...(history || []),
      { role: "user", content: message },
    ]);
    return content;
  }
}

export const aiService = new AIService();
