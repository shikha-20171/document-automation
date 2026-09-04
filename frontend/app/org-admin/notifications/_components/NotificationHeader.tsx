"use client";

import { MailOpen, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onMarkAllRead: () => void;
}

export function NotificationHeader({
  loading,
  onRefresh,
  onMarkAllRead,
}: NotificationHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Notifications & Alerts
          </h1>
          <Badge className="bg-[#274690]/15 text-[#274690] text-xs font-bold">
            Live Activity Feed
          </Badge>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Real-time alerts for incoming approval requests, forwarded documents, workflow events, and organization updates.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onMarkAllRead}
          className="text-xs font-bold rounded-xl shadow-xs"
        >
          <MailOpen size={13} className="mr-1.5" /> Mark All Read
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="text-xs font-bold rounded-xl shadow-xs"
        >
          <RefreshCw size={13} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
    </div>
  );
}
