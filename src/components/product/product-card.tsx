"use client";

import React from "react";
import { cn, formatCurrency, getMarketplaceColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Truck, ExternalLink, Check, BarChart3 } from "lucide-react";

interface Props {
  product: any;
  onCompare?: () => void;
  isComparing?: boolean;
}

export function ProductCard({ product, onCompare, isComparing = false }: Props) {
  const p = product;
  return (
    <Card className="group overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="relative aspect-[4/3] sm:aspect-square bg-muted overflow-hidden">
          {p.imageUrl ? (
            <img src={`/api/image-proxy?url=${encodeURIComponent(p.imageUrl)}`} alt={p.name} referrerPolicy="no-referrer" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image"; }} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-xs">No Image</div>
          )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <Badge className="text-white border-0 text-[9px] px-1.5" style={{ backgroundColor: getMarketplaceColor(p.marketplace) }}>{p.marketplace}</Badge>
          {p.isOfficialStore && <Badge className="bg-blue-500 text-white border-0 text-[9px] px-1.5">Official</Badge>}
          {p.isMall && <Badge className="bg-purple-500 text-white border-0 text-[9px] px-1.5">Mall</Badge>}
          {p.freeShipping && <Badge className="bg-green-500 text-white border-0 text-[9px] px-1.5"><Truck className="h-2.5 w-2.5 mr-0.5" />Free</Badge>}
        </div>
        {p.discountPercent > 0 && <div className="absolute top-2 right-2"><Badge variant="destructive" className="text-[9px]">-{p.discountPercent}%</Badge></div>}
        {onCompare && (
          <button onClick={e => { e.preventDefault(); onCompare(); }}
            className={cn("absolute bottom-2 right-2 h-8 min-h-[44px] sm:h-7 sm:min-h-0 px-2 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all",
              isComparing ? "bg-blue-500 text-white" : "bg-white/90 dark:bg-black/80 text-foreground hover:bg-blue-500 hover:text-white")}>
            {isComparing ? <><Check className="h-3 w-3" /> Tersimpan</> : <><BarChart3 className="h-3 w-3" /> Bandingkan</>}
          </button>
        )}
      </div>
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          {p.category && <span className="text-[9px] text-muted-foreground truncate max-w-[60%]">{p.category}</span>}
          {p.shopName && <span className="text-[9px] text-muted-foreground truncate max-w-[40%]">{p.shopName}</span>}
        </div>
        <h3 className="text-xs font-medium line-clamp-2 leading-snug">{p.name}</h3>
        {p.location && <p className="text-[9px] text-muted-foreground">{p.location}</p>}
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          {p.rating > 0 && <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />{Number(p.rating).toFixed(1)}</span>}
          {p.reviewCount > 0 && <span>({p.reviewCount.toLocaleString()})</span>}
          {p.soldCount > 0 && <span className="ml-auto">{p.soldCount.toLocaleString()} terjual</span>}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 truncate">{formatCurrency(p.price)}</p>
            {p.originalPrice > p.price && <p className="text-[9px] text-muted-foreground line-through">{formatCurrency(p.originalPrice)}</p>}
          </div>
          {p.url && <Button size="sm" variant="outline" className="h-7 rounded-lg px-2" asChild><a href={p.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a></Button>}
        </div>
      </CardContent>
    </Card>
  );
}
