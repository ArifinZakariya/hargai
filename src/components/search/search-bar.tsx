"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SlidersHorizontal,
  Search,
  X,
  MapPin,
  Star,
  Truck,
  Tag,
  Store,
  ShieldCheck,
  Package,
} from "lucide-react";
import type { SearchFilters, Marketplace } from "@/types";

interface SearchBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
}

export function SearchBar({ filters, onFiltersChange, onSearch }: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    onFiltersChange({ query: filters.query, page: 1, limit: 20 });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      value !== undefined &&
      value !== "" &&
      value !== null &&
      key !== "query" &&
      key !== "page" &&
      key !== "limit"
  ).length;

  return (
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk (contoh: laptop gaming, printer Canon, kabel LAN...)"
            value={filters.query || ""}
            onChange={(e) => updateFilter("query", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="pl-10 h-10 sm:h-12 text-sm sm:text-base rounded-xl"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 rounded-xl flex-1 sm:flex-none"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Button onClick={onSearch} className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white flex-1 sm:flex-none">
            <Search className="h-4 w-4" />
            Cari
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Marketplace */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Marketplace
                </label>
                <Select
                  value={filters.marketplace || "all"}
                  onValueChange={(v) =>
                    updateFilter("marketplace", v === "all" ? undefined : v as Marketplace)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="SHOPEE">Shopee</SelectItem>
                    <SelectItem value="TOKOPEDIA">Tokopedia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Harga Minimum</label>
                <Input
                  type="number"
                  placeholder="Rp 0"
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    updateFilter("minPrice", e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Harga Maksimum</label>
                <Input
                  type="number"
                  placeholder="Rp 999.999.999"
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    updateFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Rating Minimum
                </label>
                <Select
                  value={filters.minRating?.toString() || "all"}
                  onValueChange={(v) =>
                    updateFilter("minRating", v === "all" ? undefined : Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="4.5">4.5+</SelectItem>
                    <SelectItem value="4">4.0+</SelectItem>
                    <SelectItem value="3.5">3.5+</SelectItem>
                    <SelectItem value="3">3.0+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <Input
                  placeholder="Contoh: Elektronik"
                  value={filters.category || ""}
                  onChange={(e) => updateFilter("category", e.target.value || undefined)}
                />
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Urutkan</label>
                <Select
                  value={filters.sortBy || "relevance"}
                  onValueChange={(v) =>
                    updateFilter("sortBy", v === "relevance" ? undefined : v as SearchFilters["sortBy"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Relevansi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevansi</SelectItem>
                    <SelectItem value="price_asc">Harga Terendah</SelectItem>
                    <SelectItem value="price_desc">Harga Tertinggi</SelectItem>
                    <SelectItem value="rating">Rating Tertinggi</SelectItem>
                    <SelectItem value="sold">Terlaris</SelectItem>
                    <SelectItem value="newest">Terbaru</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkboxes */}
              <div className="col-span-2 space-y-3">
                <label className="text-sm font-medium">Opsi Tambahan</label>
                <div className="flex flex-wrap gap-3">
                  <ToggleFilter
                    label="Official Store"
                    icon={<ShieldCheck className="h-3 w-3" />}
                    active={filters.officialStore || false}
                    onClick={() => updateFilter("officialStore", !filters.officialStore || undefined)}
                  />
                  <ToggleFilter
                    label="Mall"
                    icon={<Store className="h-3 w-3" />}
                    active={filters.mall || false}
                    onClick={() => updateFilter("mall", !filters.mall || undefined)}
                  />
                  <ToggleFilter
                    label="Star Seller"
                    icon={<Star className="h-3 w-3" />}
                    active={filters.starSeller || false}
                    onClick={() => updateFilter("starSeller", !filters.starSeller || undefined)}
                  />
                  <ToggleFilter
                    label="Gratis Ongkir"
                    icon={<Truck className="h-3 w-3" />}
                    active={filters.freeShipping || false}
                    onClick={() => updateFilter("freeShipping", !filters.freeShipping || undefined)}
                  />
                  <ToggleFilter
                    label="Ada Voucher"
                    icon={<Tag className="h-3 w-3" />}
                    active={filters.hasVoucher || false}
                    onClick={() => updateFilter("hasVoucher", !filters.hasVoucher || undefined)}
                  />
                  <ToggleFilter
                    label="Stok Tersedia"
                    icon={<Package className="h-3 w-3" />}
                    active={filters.inStock || false}
                    onClick={() => updateFilter("inStock", !filters.inStock || undefined)}
                  />
                </div>
              </div>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button variant="ghost" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Hapus Semua Filter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ToggleFilter({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
          : "bg-muted text-muted-foreground hover:bg-accent border border-transparent"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
