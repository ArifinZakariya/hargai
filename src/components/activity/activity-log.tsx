"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock, Search, GitCompareArrows, TrendingUp, Trash2 } from "lucide-react";

export interface ActivityLog {
  id: string;
  action: string;
  detail: string;
  page: string;
  timestamp: Date;
}

const STORAGE_KEY = "procureai_activity_log";

export function getActivityLogs(): ActivityLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((l: any) => ({
      ...l,
      timestamp: new Date(l.timestamp),
    }));
  } catch {
    return [];
  }
}

export function addActivityLog(log: Omit<ActivityLog, "id" | "timestamp">) {
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    ...log,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date(),
  };
  logs.unshift(newLog);
  if (logs.length > 50) logs.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function clearActivityLogs() {
  localStorage.removeItem(STORAGE_KEY);
}

const pageIcons: Record<string, React.ReactNode> = {
  search: <Search className="h-3.5 w-3.5 text-blue-500" />,
  comparison: <GitCompareArrows className="h-3.5 w-3.5 text-purple-500" />,
  trends: <TrendingUp className="h-3.5 w-3.5 text-green-500" />,
};

const pageColors: Record<string, string> = {
  search: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  comparison: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
  trends: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
};

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  if (hours < 24) return `${hours}j lalu`;
  return `${days}h lalu`;
}

interface ActivityLogProps {
  page?: string;
  maxItems?: number;
}

export function ActivityLogPanel({ page, maxItems = 10 }: ActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    const load = () => {
      let all = getActivityLogs();
      if (page) all = all.filter((l) => l.page === page);
      setLogs(all.slice(0, maxItems));
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [page, maxItems]);

  if (logs.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-xs">Belum ada aktivitas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-muted-foreground">Aktivitas Terbaru</p>
        {logs.length > 0 && (
          <button
            onClick={() => { clearActivityLogs(); setLogs([]); }}
            className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors"
          >
            Hapus Semua
          </button>
        )}
      </div>
      {logs.map((log) => (
        <div
          key={log.id}
          className={cn("flex items-start gap-2.5 p-2.5 rounded-lg border text-xs", pageColors[log.page] || "bg-muted/50 border-border")}
        >
          <div className="mt-0.5 shrink-0">
            {pageIcons[log.page] || <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{log.action}</p>
            <p className="text-muted-foreground truncate mt-0.5">{log.detail}</p>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
            {formatTime(log.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}
