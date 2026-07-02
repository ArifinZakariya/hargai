import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "text" | "circular" | "rectangular";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const variants = {
    default: "animate-pulse rounded-lg bg-muted",
    text: "animate-pulse rounded-md bg-muted h-4",
    circular: "animate-pulse rounded-full bg-muted",
    rectangular: "animate-pulse rounded-md bg-muted",
  };

  return (
    <div
      className={cn(variants[variant], className)}
      {...props}
    />
  );
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

function DashboardCardSkeleton() {
  return (
    <div className="rounded-2xl border p-6 space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4">
      <Skeleton variant="circular" className="h-12 w-12" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  );
}

export { Skeleton, ProductCardSkeleton, DashboardCardSkeleton, TableRowSkeleton };
