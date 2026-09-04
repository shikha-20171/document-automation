"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/lib/axios";
import {
  SuperAdminNotificationItem,
  SuperAdminNotificationCounts,
  BroadcastFormData,
  ChannelSettingsData,
} from "../types";

export function useSuperAdminNotifications() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const DEFAULT_NOTIFICATIONS: SuperAdminNotificationItem[] = [
    {
      id: "notif-1",
      title: "Neon PostgreSQL Replica Auto-Failover Test Passed",
      message: "Monthly automated read-replica health probe and connection pool latency verification completed successfully with 14ms ping.",
      category: "SYSTEM",
      priority: "NORMAL",
      read: false,
      unread: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "notif-2",
      title: "Storage Utilization Alert: HCL Technologies at 82%",
      message: "Tenant 'HCL Technologies Enterprise' has utilized 41.0 GB of their 50.0 GB storage quota limit. Automatic advisory issued.",
      category: "SECURITY",
      priority: "HIGH",
      read: false,
      unread: true,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "notif-3",
      title: "Enterprise Annual Subscription Renewed: TCS",
      message: "Tata Consultancy Services successfully renewed Enterprise Tier (500 GB Vault + Dedicated AI Worker Pool) for $12,500/year.",
      category: "BILLING",
      priority: "NORMAL",
      read: true,
      unread: false,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const [notifications, setNotifications] = useState<SuperAdminNotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [counts, setCounts] = useState<SuperAdminNotificationCounts>({
    all: 3,
    unread: 2,
    critical: 0,
    system: 1,
    billing: 1,
    security: 1,
  });

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState<BroadcastFormData>({
    title: "",
    message: "",
    targetAudience: "ALL_USERS",
    priority: "HIGH",
  });

  // Channel Settings State
  const [channelSettings, setChannelSettings] = useState<ChannelSettingsData>({
    emailEnabled: true,
    inAppEnabled: true,
    slackWebhook: "https://hooks.slack.com/services/T00/B00/XXXX",
    smsProvider: "TWILIO",
    smtpStatus: "CONNECTED",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await apiClient.get("/super-admin/modules/notifications", {
          params: {
            filter: activeTab !== "settings" ? activeTab : "all",
            priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
          },
        });

        if (res?.data?.data) {
          const list = res.data.data.notifications;
          if (Array.isArray(list) && list.length > 0) {
            setNotifications(list);
          }
          if (res.data.data.counts) {
            setCounts(res.data.data.counts);
          }
        }
      } catch (err: any) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, priorityFilter]
  );

  const fetchChannelSettings = useCallback(async () => {
    try {
      const res = await apiClient.get("/super-admin/modules/notifications/settings");
      if (res?.data?.data) {
        setChannelSettings((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    if (activeTab === "settings") {
      void fetchChannelSettings();
    } else {
      void fetchNotifications();
    }
  }, [activeTab, priorityFilter, fetchNotifications, fetchChannelSettings]);

  const markAsRead = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      try {
        await apiClient.patch(`/super-admin/modules/notifications/${id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true, unread: false } : n))
        );
        setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
        showToast("Notification marked as read.");
      } catch {
        showToast("Could not mark as read.");
      }
    },
    [showToast]
  );

  const markAllRead = useCallback(async () => {
    try {
      await apiClient.patch("/super-admin/modules/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, unread: false }))
      );
      setCounts((prev) => ({ ...prev, unread: 0 }));
      showToast("All notifications marked as read.");
    } catch {
      showToast("Could not mark all as read.");
    }
  }, [showToast]);

  const deleteNotification = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      try {
        await apiClient.delete(`/super-admin/modules/notifications/${id}`);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        showToast("Notification deleted.");
        void fetchNotifications(true);
      } catch {
        showToast("Could not delete notification.");
      }
    },
    [fetchNotifications, showToast]
  );

  const sendBroadcast = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!broadcastForm.title.trim()) return;

      setSubmittingBroadcast(true);
      try {
        const res = await apiClient.post("/super-admin/modules/notifications/broadcast", {
          title: broadcastForm.title.trim(),
          message: broadcastForm.message.trim(),
          targetAudience: broadcastForm.targetAudience,
          priority: broadcastForm.priority,
        });

        showToast(res.data?.message || "Platform announcement broadcasted successfully!");
        setShowBroadcastModal(false);
        setBroadcastForm({
          title: "",
          message: "",
          targetAudience: "ALL_USERS",
          priority: "HIGH",
        });
        void fetchNotifications(true);
      } catch (err: any) {
        showToast(err?.response?.data?.message || "Failed to send broadcast announcement.");
      } finally {
        setSubmittingBroadcast(false);
      }
    },
    [broadcastForm, fetchNotifications, showToast]
  );

  const saveSettings = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSavingSettings(true);
      try {
        await apiClient.put("/super-admin/modules/notifications/settings", channelSettings);
        showToast("Channel settings saved successfully!");
      } catch {
        showToast("Failed to save channel settings.");
      } finally {
        setSavingSettings(false);
      }
    },
    [channelSettings, showToast]
  );

  // Filter list by search query
  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const query = searchQuery.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        (n.message || n.description || "").toLowerCase().includes(query) ||
        (n.type || "").toLowerCase().includes(query) ||
        (n.organisation?.name || "").toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    loading,
    refreshing,
    toastMessage,
    counts,
    filteredNotifications,
    showBroadcastModal,
    setShowBroadcastModal,
    submittingBroadcast,
    broadcastForm,
    setBroadcastForm,
    channelSettings,
    setChannelSettings,
    savingSettings,
    fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
    sendBroadcast,
    saveSettings,
  };
}
