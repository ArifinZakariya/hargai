"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityLogPanel, addActivityLog } from "@/components/activity/activity-log";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Search, RefreshCw, AlertCircle, Clock, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ScrapedProduct } from "@/services/scraper/types";

export default function TrendsPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ScrapedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [stats, setStats] = useState<{ avgPrice: number; minPrice: number; maxPrice: number; total: number } | null>(null);

  const doSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    addActivityLog({ action: `Cari Trending: "${query}"`, detail: "Mengambil data pasar", page: "trends" });
    try {
      const res = await fetch("/api/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, searchAll: true, limit: 20 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const prods = data.data?.products || [];
      setProducts(prods);

      // Calculate stats
      if (prods.length > 0) {
        const prices = prods.map((p: any) => p.price).filter((p: number) => p > 0);
        setStats({
          avgPrice: Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length),
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          total: prods.length,
        });
      } else {
        setStats(null);
      }
      addActivityLog({ action: `Trending Ditemukan`, detail: `${prods.length} produk dari Shopee & Tokopedia`, page: "trends" });
    } catch (e: any) {
      setError(e.message || "Gagal mengambil data");
      setProducts([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Market Trends</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Cari produk untuk melihat tren harga dari Shopee & Tokopedia.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowLog(!showLog)} className="gap-1.5 self-start"><Clock className="h-4 w-4" /> Log</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-4">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Masukkan nama produk untuk lihat tren pasar..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} className="pl-10 h-11" />
            </div>
            <Button onClick={doSearch} disabled={isLoading || !query.trim()} className="h-11 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Cari Tren"}
            </Button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3">
                <p className="text-[10px] text-muted-foreground">Harga Rata-rata</p>
                <p className="text-sm sm:text-lg font-bold text-blue-600 truncate">{formatCurrency(stats.avgPrice)}</p>
              </Card>
              <Card className="p-3">
                <p className="text-[10px] text-muted-foreground">Harga Terendah</p>
                <p className="text-sm sm:text-lg font-bold text-green-500 truncate">{formatCurrency(stats.minPrice)}</p>
              </Card>
              <Card className="p-3">
                <p className="text-[10px] text-muted-foreground">Harga Tertinggi</p>
                <p className="text-sm sm:text-lg font-bold text-red-500 truncate">{formatCurrency(stats.maxPrice)}</p>
              </Card>
              <Card className="p-3">
                <p className="text-[10px] text-muted-foreground">Total Produk</p>
                <p className="text-sm sm:text-lg font-bold">{stats.total}</p>
              </Card>
            </div>
          )}

          {/* Price distribution */}
          {stats && products.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-500" /> Distribusi Harga</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: "Termurah", value: stats.minPrice, color: "bg-green-500", products: products.filter(p => p.price <= stats.minPrice * 1.1) },
                    { label: "Menengah", value: stats.avgPrice, color: "bg-blue-500", products: products.filter(p => p.price > stats.minPrice * 1.1 && p.price < stats.maxPrice * 0.9) },
                    { label: "Termahal", value: stats.maxPrice, color: "bg-red-500", products: products.filter(p => p.price >= stats.maxPrice * 0.9) },
                  ].map(tier => (
                    <div key={tier.label} className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs text-muted-foreground w-14 sm:w-20 shrink-0">{tier.label}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${tier.color} rounded-full transition-all`} style={{ width: `${(tier.products.length / products.length) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium w-12 sm:w-16 text-right shrink-0">{tier.products.length} produk</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <AlertCircle className="h-10 w-10 mx-auto text-red-400 mb-3" />
              <p className="font-medium">{error}</p>
              <Button onClick={doSearch} size="sm" className="mt-3"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Coba Lagi</Button>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {products.map(p => <ProductCard key={p.externalId} product={p} />)}
            </div>
          ) : hasSearched ? (
            <div className="text-center py-10"><p className="font-medium">Tidak ada data tren</p></div>
          ) : (
            <div className="text-center py-16">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium">Masukkan nama produk</p>
              <p className="text-sm text-muted-foreground mt-1">Lihat tren harga dari Shopee & Tokopedia</p>
            </div>
          )}
        </div>

        {/* Log sidebar */}
        {showLog && (
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <CardContent className="p-4 max-h-[70vh] overflow-y-auto">
                <ActivityLogPanel page="trends" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
