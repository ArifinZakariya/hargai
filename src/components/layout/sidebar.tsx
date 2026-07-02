"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, GitCompareArrows, TrendingUp, Package, X } from "lucide-react";

const navItems = [
  { href: "/search", label: "Smart Search", icon: Search },
  { href: "/comparison", label: "Comparison", icon: GitCompareArrows },
  { href: "/trends", label: "Market Trends", icon: TrendingUp },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen w-[240px] border-r bg-card/80 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">HARGAI</span>
                <span className="text-[10px] text-muted-foreground">Belanja Lebih Bijak</span>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-accent">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={onClose} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all", isActive ? "bg-gradient-to-r from-blue-500/10 to-purple-600/10 text-blue-600 dark:text-blue-400 shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
