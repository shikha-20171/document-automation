"use client";

import {
  AlertTriangle,
  ShieldAlert,
  Server,
  Zap,
  Megaphone,
  Activity,
  Building2,
  Check,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SuperAdminNotificationItem } from "../types";

interface SuperAdminNotificationItemCardProps {
  notification: SuperAdminNotificationItem;
  onMarkAsRead: (id: string, e?: React.MouseEvent) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
}

export function SuperAdminNotificationItemCard({
  notification,
  onMarkAsRead,
  onDelete,
}: SuperAdminNotificationItemCardProps) {
  const isUnread = notification.unread || !notification.read;

  const getTypeIcon = (type?: string, priority?: string) => {
    const t = (type || "").toLowerCase();
    const p = (priority || "").toUpperCase();

    if (p === "CRITICAL") return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    if (t.includes("sec")) return <ShieldAlert className="w-4 h-4 text-indigo-600" />;
    if (t.includes("storage")) return <Server className="w-4 h-4 text-amber-600" />;
    if (t.includes("bill") || t.includes("sub")) return <Zap className="w-4 h-4 text-emerald-600" />;
    if (t.includes("broadcast") || t.includes("announc")) return <Megaphone className="w-4 h-4 text-blue-600" />;
    return <Activity className="w-4 h-4 text-cyan-600" />;
  };

  const getPriorityBadge = (priority?: string) => {
    const p = (priority || "NORMAL").toUpperCase();
    if (p === "CRITICAL") {
      return <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] font-bold">Critical</Badge>;
    }
    if (p === "HIGH") {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-bold">High</Badge>;
    }
    if (p === "MEDIUM") {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-bold">Medium</Badge>;
    }
    return <Badge variant="outline" className="text-slate-600 text-[10px] font-medium">Normal</Badge>;
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={`p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 ${
        isUnread ? "bg-blue-50/20" : "bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/60">
          {getTypeIcon(notification.type, notification.priority)}
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" title="Unread" />
            )}
            <span className="font-bold text-slate-900 text-xs sm:text-sm">
              {notification.title}
            </span>
            {getPriorityBadge(notification.priority)}
            {notification.type && (
              <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-slate-50">
                {notification.type}
              </Badge>
            )}
            {notification.organisation?.name && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <Building2 className="w-3 h-3" />
                {notification.organisation.name}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 line-clamp-2">
            {notification.message || notification.description || "No additional details provided."}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <span className="text-[11px] text-slate-400 font-medium">
          {formatTimeAgo(notification.created_at || notification.timestamp)}
        </span>

        <div className="flex items-center gap-1">
          {isUnread ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => onMarkAsRead(notification.id, e)}
              className="h-7 px-2.5 text-xs font-bold text-[#274690] hover:bg-[#274690]/10"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Mark Read
            </Button>
          ) : (
            <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 bg-slate-100 rounded-md">
              Read
            </span>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => onDelete(notification.id, e)}
            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Delete notification"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
