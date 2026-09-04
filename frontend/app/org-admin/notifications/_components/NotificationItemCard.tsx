"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, FileCheck, Trash2, ArrowRight, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationItem } from "../types";

interface NotificationItemCardProps {
  notification: NotificationItem;
  onMarkAsRead: (id: string, e?: React.MouseEvent) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
}

export function NotificationItemCard({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemCardProps) {
  const router = useRouter();
  const isRead = notification.read;
  const desc = notification.message || notification.description || "";
  const isApproval = (notification.type || "").toLowerCase().includes("approv");

  const handleClick = () => {
    if (!isRead) onMarkAsRead(notification.id);
    if (notification.link) router.push(notification.link);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-2xl border p-4 transition-all cursor-pointer shadow-xs ${
        !isRead
          ? "border-[#274690]/40 bg-linear-to-r from-blue-50/40 via-white to-white ring-1 ring-[#274690]/20"
          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs ${
              isApproval
                ? "bg-indigo-100 text-indigo-700"
                : "bg-[#274690]/10 text-[#274690]"
            }`}
          >
            {isApproval ? <FileCheck size={18} /> : <Bell size={18} />}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-xs text-slate-900 leading-tight truncate">
                {notification.title}
              </h4>
              {!isRead && (
                <span className="h-2 w-2 rounded-full bg-[#274690] shrink-0" title="Unread" />
              )}
              {notification.priority === "HIGH" && (
                <Badge className="bg-rose-100 text-rose-800 text-[9px] font-black">
                  HIGH PRIORITY
                </Badge>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2">
              {desc}
            </p>

            <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <Clock size={11} /> {new Date(notification.created_at).toLocaleString()}
              </span>
              {notification.related_document && (
                <span className="flex items-center gap-1 text-[#274690] font-bold">
                  <FileText size={11} /> {notification.related_document}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {notification.link && (
            <Link
              href={notification.link}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-xl bg-[#274690] px-3 py-1.5 text-[11px] font-black text-white hover:bg-[#1f3770] shadow-xs"
            >
              <span>View</span>
              <ArrowRight size={12} />
            </Link>
          )}
          <button
            type="button"
            onClick={(e) => onDelete(notification.id, e)}
            className="rounded-xl p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition"
            title="Delete notification"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
