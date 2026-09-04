"use client";

import { Bell, RefreshCw, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuperAdminNotificationHeaderProps {
  unreadCount: number;
  activeTab: string;
  refreshing: boolean;
  onRefresh: () => void;
  onMarkAllRead: () => void;
  onOpenBroadcastModal: () => void;
}

export function SuperAdminNotificationHeader({
  unreadCount,
  activeTab,
  refreshing,
  onRefresh,
  onMarkAllRead,
  onOpenBroadcastModal,
}: SuperAdminNotificationHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#274690]/10 text-[#274690]">
            <Bell className="w-3 h-3" /> System Feed & Alerts
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
              {unreadCount} Unread
            </span>
          )}
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
          Notifications & System Alerts
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time feed of system incidents, tenant quotas, security alerts, and platform announcements.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="text-xs font-bold h-9 gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#274690]" : ""}`} />
          <span>Refresh</span>
        </Button>

        {unreadCount > 0 && activeTab !== "settings" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAllRead}
            className="text-xs font-bold h-9 gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark All Read</span>
          </Button>
        )}

        <Button
          onClick={onOpenBroadcastModal}
          className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs px-4 h-9 rounded-xl shadow-xs gap-2"
        >
          <Send className="w-3.5 h-3.5" /> Broadcast Notice
        </Button>
      </div>
    </div>
  );
}
