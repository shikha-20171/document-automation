"use client";

import { Bell } from "lucide-react";
import { NotificationItem } from "../types";
import { NotificationItemCard } from "./NotificationItemCard";

interface NotificationListProps {
  loading: boolean;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string, e?: React.MouseEvent) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
}

export function NotificationList({
  loading,
  notifications,
  onMarkAsRead,
  onDelete,
}: NotificationListProps) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center text-xs font-bold text-slate-400 shadow-xs">
        Loading real-time notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-2 shadow-xs">
        <Bell size={28} className="mx-auto text-slate-300" />
        <p className="text-sm font-black text-slate-700">No notifications in this view</p>
        <p className="text-xs text-slate-400">
          You are all caught up! New document approval requests and events will appear here.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {notifications.map((notif) => (
        <NotificationItemCard
          key={notif.id}
          notification={notif}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}
