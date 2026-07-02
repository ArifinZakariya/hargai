"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityLogPanel, addActivityLog } from "@/components/activity/activity-log";
import {
  GitCompareArrows, Star, Check, X, ArrowLeft, Clock,
  Loader2, Bot, ShoppingCart,
} from "lucide-react";
import { cn, formatCurrency, getMarketplaceColor } from "@/lib/utils";

export default function ComparisonPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("compareProducts");
    if (stored) {
      try { setProducts(JSON.parse(stored)); } catch {}
    }
  }, []);

  const removeProduct = (id: string) => {
    const updated = products.filter(p => p.externalId !== id);
    setProducts(updated);
    sessionStorage.setItem("compareProducts", JSON.stringify(updated));
    addActivity({ action: "Hapus dari Comparison", detail: `Sisa ${updated.length} produk` });
  };

  const doAnalyze = async () => {
    if (!products.length) return;
    setIsAnalyzing(true);
    setAnalysis("");
    addActivity({ action: "Mulai Analisis AI", detail: `${products.length} produk dianalisis` });
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      const data = await res.json();
      setAnalysis(data.content || "Tidak ada hasil analisis.");
      addActivity({ action: "Analisis AI Selesai", detail: "Rekomendasi sudah tersedia" });
    } catch {
      setAnalysis("Gagal menghubungi AI. Silakan coba lagi.");
      addActivity({ action: "Analisis AI Gagal", detail: "Error connection" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addActivity = (o: { action: string; detail: string }) => addActivityLog({ ...o, page: "comparison" });

  const features = [
    { label: "Harga", key: "price", type: "price" as const },
    { label: "Harga Asli", key: "originalPrice", type: "price" as const },
    { label: "Diskon", key: "discountPercent", type: "pct" as const },
    { label: "Rating", key: "rating", type: "rating" as const },
    { label: "Review", key: "reviewCount", type: "num" as const },
    { label: "Terjual", key: "soldCount", type: "num" as const },
    { label: "Stok", key: "stockQuantity", type: "num" as const },
    { label: "Toko", key: "shopName", type: "text" as const },
    { label: "Lokasi", key: "location", type: "text" as const },
    { label: "Official Store", key: "isOfficialStore", type: "bool" as const },
    { label: "Mall", key: "isMall", type: "bool" as const },
    { label: "Star Seller", key: "isStarSeller", type: "bool" as const },
    { label: "Gratis Ongkir", key: "freeShipping", type: "bool" as const },
    { label: "Voucher", key: "hasVoucher", type: "bool" as const },
  ];

  if (!products.length) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Comparison</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Bandingkan produk dari hasil pencarian.</p>
          </div>
        </div>
        <div className="text-center py-16">
          <GitCompareArrows className="h-14 w-14 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">Belum ada produk</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Buka Smart Search, pilih produk, lalu klik "Tambah ke Comparison".</p>
          <Button onClick={() => router.push("/search")} className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white"><GitCompareArrows className="h-4 w-4" /> Buka Search</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Comparison</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{products.length} produk dipilih</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="ghost" size="sm" onClick={() => setShowLog(!showLog)} className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" /> Log</Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/search")} className="gap-1 text-xs">+ Tambah</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-5">
          {/* Table */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><GitCompareArrows className="h-4 w-4" /> Tabel Perbandingan</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="py-2.5 px-3 text-left text-xs font-medium text-muted-foreground w-20 sm:w-28">Fitur</th>
                    {products.map(p => (
                      <th key={p.externalId} className="py-2.5 px-2 sm:px-3 text-center min-w-[120px] sm:min-w-[160px]">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="relative">
                            <img src={p.imageUrl || "https://placehold.co/80x80?text=No"} alt={p.name} referrerPolicy="no-referrer" className="h-12 w-12 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80?text=No"; }} />
                            <button onClick={() => removeProduct(p.externalId)} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="h-2.5 w-2.5" /></button>
                          </div>
                          <p className="text-[10px] font-medium line-clamp-2 leading-tight">{p.name}</p>
                          <Badge className="text-white text-[9px] border-0 px-1" style={{ backgroundColor: getMarketplaceColor(p.marketplace) }}>{p.marketplace}</Badge>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map(f => (
                    <tr key={f.key} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="py-2 px-4 text-xs font-medium text-muted-foreground">{f.label}</td>
                      {products.map(p => {
                        const v = p[f.key];
                        return (
                          <td key={p.externalId} className="py-2 px-3 text-center text-xs">
                            {f.type === "price" ? <span className="font-bold text-blue-600 dark:text-blue-400">{v ? formatCurrency(v) : "-"}</span>
                            : f.type === "pct" ? <span className={cn("font-medium", v > 0 ? "text-green-500" : "text-muted-foreground")}>{v ? `${v}%` : "-"}</span>
                            : f.type === "rating" ? <span className="flex items-center justify-center gap-0.5">{v > 0 && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}{v > 0 ? Number(v).toFixed(1) : "-"}</span>
                            : f.type === "bool" ? (v ? <Check className="h-3.5 w-3.5 text-green-500 mx-auto" /> : <X className="h-3.5 w-3.5 text-red-400 mx-auto" />)
                            : f.type === "num" ? <span>{v ? Number(v).toLocaleString() : "-"}</span>
                            : <span className="truncate max-w-[100px] inline-block">{String(v || "-")}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-purple-500" /> Analisis AI</CardTitle>
              <Button size="sm" onClick={doAnalyze} disabled={isAnalyzing} className="gap-1.5 text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                {isAnalyzing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Menganalisis...</> : <><Bot className="h-3.5 w-3.5" /> Analisis Sekarang</>}
              </Button>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="space-y-3 py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-blue-500" /> AI sedang menganalisis produk...</div>
                  {[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded-lg" style={{ animationDelay: `${i * 200}ms` }} />)}
                </div>
              ) : analysis ? (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{analysis}</div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Klik "Analisis Sekarang" untuk mendapatkan rekomendasi AI.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Log sidebar */}
        {showLog && (
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <CardContent className="p-4 max-h-[70vh] overflow-y-auto">
                <ActivityLogPanel page="comparison" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
