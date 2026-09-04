"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/lib/axios";
import { NotificationItem, NotificationCounts } from "../types";

export function useOrgNotifications() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    all: 0,
    unread: 0,
    approvals: 0,
    documents: 0,
    system: 0,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/org-admin/notifications", {
        params: { filter: activeTab },
      });
      if (res?.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setCounts(res.data.data.counts || { all: 0, unread: 0, approvals: 0, documents: 0, system: 0 });
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      try {
        await apiClient.patch(`/org-admin/notifications/${id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
        showToast("Notification marked as read.");
      } catch {}
    },
    [showToast]
  );

  const markAllRead = useCallback(async () => {
    try {
      await apiClient.patch("/org-admin/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setCounts((prev) => ({ ...prev, unread: 0 }));
      showToast("All notifications marked as read.");
    } catch {}
  }, [showToast]);

  const deleteNotification = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      try {
        await apiClient.delete(`/org-admin/notifications/${id}`);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        showToast("Notification deleted.");
      } catch {}
    },
    [showToast]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "all") return true;
      if (activeTab === "unread") return !n.read;
      if (activeTab === "approvals") return (n.type || "").toLowerCase().includes("approv");
      if (activeTab === "documents") return (n.type || "").toLowerCase().includes("doc");
      if (activeTab === "system")
        return (n.type || "").toLowerCase().includes("sys") || (n.type || "").toLowerCase().includes("info");
      return true;
    });
  }, [notifications, activeTab]);

  return {
    loading,
    activeTab,
    setActiveTab,
    counts,
    filteredNotifications,
    toastMessage,
    fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
  };
}
