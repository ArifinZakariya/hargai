"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityLogPanel, addActivityLog } from "@/components/activity/activity-log";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import {
  Search, Globe, RefreshCw, AlertCircle, GitCompareArrows,
  SlidersHorizontal, Star, Truck, ShieldCheck, Store, X, BarChart3, Clock,
} from "lucide-react";
import type { ScrapedProduct } from "@/services/scraper/types";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ScrapedProduct[]>([]);
  const [compareList, setCompareList] = useState<ScrapedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"all" | "shopee" | "tokopedia">("all");
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [errors, setErrors] = useState<{ shopee?: string; tokopedia?: string }>({});
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number } | null>(null);

  // Filters
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [officialStore, setOfficialStore] = useState(false);
  const [mall, setMall] = useState(false);
  const [starSeller, setStarSeller] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);

  const doSearch = useCallback(async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await fetch("/api/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          marketplace: source === "all" ? undefined : source.toUpperCase(),
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          minRating: minRating ? Number(minRating) : undefined,
          officialStore, mall, starSeller, freeShipping,
          sortBy, page: 1, limit: 20,
          searchAll: source === "all",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setProducts(data.data?.products || []);
      setTotalResults(data.data?.total || 0);
      setErrors({ shopee: data.details?.shopee?.error, tokopedia: data.details?.tokopedia?.error });
      setPriceRange(data.data?.priceRange || null);
      addActivityLog({ action: `Pencarian: "${searchQuery}"`, detail: `${data.data?.products?.length || 0} hasil dari ${source === "all" ? "Shopee & Tokopedia" : source}`, page: "search" });
    } catch (e: any) {
      setError(e.message || "Gagal mengambil data");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, source, minPrice, maxPrice, minRating, officialStore, mall, starSeller, freeShipping, sortBy]);

  const isInCompare = (p: ScrapedProduct) => compareList.some(c => c.externalId === p.externalId);
  const toggleCompare = (p: ScrapedProduct) => {
    setCompareList(prev => {
      const exists = prev.some(c => c.externalId === p.externalId);
      const next = exists ? prev.filter(c => c.externalId !== p.externalId) : [...prev, p].slice(0, 5);
      addActivityLog({
        action: exists ? "Hapus dari Comparison" : "Tambah ke Comparison",
        detail: p.name.slice(0, 50),
        page: "search",
      });
      return next;
    });
  };
  const goToCompare = () => {
    if (compareList.length < 2) return;
    sessionStorage.setItem("compareProducts", JSON.stringify(compareList));
    addActivityLog({ action: "Buka Comparison", detail: `${compareList.length} produk`, page: "comparison" });
    router.push("/comparison");
  };

  const activeFilterCount = [officialStore, mall, starSeller, freeShipping, minPrice, maxPrice, minRating].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Smart Search</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Cari produk dari Shopee & Tokopedia, bandingkan harga, temukan yang termurah.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowLog(!showLog)} className="gap-1.5 self-start">
          <Clock className="h-4 w-4" /> Log
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari produk (contoh: laptop gaming, printer canon...)" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} className="pl-10 h-11" />
            </div>
            <Button onClick={() => doSearch()} disabled={isLoading || !query.trim()} className="h-11 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Cari"}
            </Button>
          </div>

          {/* Marketplace tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Tabs value={source} onValueChange={v => setSource(v as any)}>
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs gap-1"><Globe className="h-3 w-3" /> Semua</TabsTrigger>
                <TabsTrigger value="shopee" className="text-xs gap-1"><span style={{ color: "#EE4D2D" }}>●</span> Shopee</TabsTrigger>
                <TabsTrigger value="tokopedia" className="text-xs gap-1"><span style={{ color: "#42B549" }}>●</span> Tokopedia</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 text-xs self-start">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
              {activeFilterCount > 0 && <Badge className="ml-1 h-4 min-w-[16px] rounded-full p-0 flex items-center justify-center text-[10px]">{activeFilterCount}</Badge>}
            </Button>
          </div>

          {/* Per-marketplace errors */}
          {hasSearched && (errors.shopee || errors.tokopedia) && (
            <div className="space-y-1.5">
              {errors.shopee && <div className="text-xs bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 rounded-lg px-3 py-2"><span className="font-medium">Shopee:</span> {errors.shopee}</div>}
              {errors.tokopedia && <div className="text-xs bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 rounded-lg px-3 py-2"><span className="font-medium">Tokopedia:</span> {errors.tokopedia}</div>}
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Harga Min</label>
                    <Input type="number" placeholder="Rp 0" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Harga Max</label>
                    <Input type="number" placeholder="Rp 999.999.999" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Rating Min</label>
                    <select value={minRating} onChange={e => setMinRating(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-2 text-sm">
                      <option value="">Semua</option>
                      <option value="3">3.0+</option>
                      <option value="3.5">3.5+</option>
                      <option value="4">4.0+</option>
                      <option value="4.5">4.5+</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Urutkan</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-2 text-sm">
                      <option value="relevance">Relevansi</option>
                      <option value="price_asc">Harga Terendah</option>
                      <option value="price_desc">Harga Tertinggi</option>
                      <option value="rating">Rating Tertinggi</option>
                      <option value="sold">Terlaris</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[{ label: "Official Store", icon: <ShieldCheck className="h-3 w-3" />, val: officialStore, set: setOfficialStore },
                    { label: "Mall", icon: <Store className="h-3 w-3" />, val: mall, set: setMall },
                    { label: "Star Seller", icon: <Star className="h-3 w-3" />, val: starSeller, set: setStarSeller },
                    { label: "Gratis Ongkir", icon: <Truck className="h-3 w-3" />, val: freeShipping, set: setFreeShipping },
                  ].map(f => (
                    <button key={f.label} onClick={() => f.set(!f.val)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${f.val ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" : "bg-muted text-muted-foreground border-transparent hover:bg-accent"}`}>
                      {f.icon}{f.label}
                    </button>
                  ))}
                </div>
                {activeFilterCount > 0 && (
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => { setMinPrice(""); setMaxPrice(""); setMinRating(""); setOfficialStore(false); setMall(false); setStarSeller(false); setFreeShipping(false); }}>
                      <X className="h-3 w-3" /> Reset Filter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compare bar */}
          {compareList.length > 0 && (
            <div className="sticky top-16 z-20 bg-card/95 backdrop-blur-xl border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium">{compareList.length} produk dipilih</span>
                <div className="flex gap-1 ml-1">
                  {compareList.map(p => (
                    <Badge key={p.externalId} variant="secondary" className="text-[9px] max-w-[80px] truncate">{p.name.slice(0, 15)}...</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCompareList([])}>Hapus</Button>
                <Button size="sm" className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white gap-1" onClick={goToCompare} disabled={compareList.length < 2}>
                  <GitCompareArrows className="h-3.5 w-3.5" /> Bandingkan
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <AlertCircle className="h-10 w-10 mx-auto text-red-400 mb-3" />
              <p className="font-medium">{error}</p>
              <Button onClick={() => doSearch()} className="mt-3" size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Coba Lagi</Button>
            </div>
          ) : products.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">{totalResults.toLocaleString()} produk ditemukan</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map(p => (
                  <ProductCard key={p.externalId} product={p} isComparing={isInCompare(p)} onCompare={() => toggleCompare(p)} />
                ))}
              </div>
            </>
          ) : hasSearched ? (
            <div className="text-center py-10">
              <p className="font-medium">Tidak ada hasil</p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeFilterCount > 0
                  ? "Coba lebarakan rentang harga atau kurangi filter."
                  : "Coba kata kunci lain."}
              </p>
              {priceRange?.min && (
                <p className="text-xs text-muted-foreground mt-1">
                  Harga produk ditemukan: Rp{priceRange.min.toLocaleString("id-ID")} — Rp{priceRange.max?.toLocaleString("id-ID")}
                </p>
              )}
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => { setMinPrice(""); setMaxPrice(""); setMinRating(""); setOfficialStore(false); setMall(false); setStarSeller(false); setFreeShipping(false); }}>
                  Reset Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium">Ketik kata kunci untuk mulai mencari</p>
              <p className="text-sm text-muted-foreground mt-1">Hasil diambil real-time dari Shopee & Tokopedia</p>
            </div>
          )}
        </div>

        {/* Activity Log sidebar */}
        {showLog && (
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <CardContent className="p-4 max-h-[70vh] overflow-y-auto">
                <ActivityLogPanel page="search" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
