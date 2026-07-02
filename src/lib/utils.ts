import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

export function formatPercent(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "percent",
    minimumFractionDigits: 1,
  }).format(num / 100);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function generateSKU(prefix: string, id: string): string {
  return `${prefix}-${id.slice(0, 8).toUpperCase()}`;
}

export function calculateDiscount(original: number, current: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - current) / original) * 100);
}

export function getMarketplaceColor(marketplace: string): string {
  switch (marketplace) {
    case "SHOPEE":
      return "#EE4D2D";
    case "TOKOPEDIA":
      return "#42B549";
    default:
      return "#6B7280";
  }
}

export function getMarketplaceIcon(marketplace: string): string {
  switch (marketplace) {
    case "SHOPEE":
      return "🛒";
    case "TOKOPEDIA":
      return "🟢";
    default:
      return "🏪";
  }
}

export function getConfidenceColor(score: number): string {
  if (score >= 0.8) return "text-green-500";
  if (score >= 0.6) return "text-yellow-500";
  return "text-red-500";
}

export function getConfidenceLabel(score: number): string {
  if (score >= 0.8) return "Sangat Tinggi";
  if (score >= 0.6) return "Tinggi";
  if (score >= 0.4) return "Sedang";
  return "Rendah";
}

export function getProxiedImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (url.startsWith("https://")) return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  return url;
}
