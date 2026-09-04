"use client";

import { CheckCircle2 } from "lucide-react";
import { useOrgNotifications } from "./hooks/useOrgNotifications";
import { NotificationHeader } from "./_components/NotificationHeader";
import { NotificationTabs } from "./_components/NotificationTabs";
import { NotificationList } from "./_components/NotificationList";

export default function OrgAdminNotificationsPage() {
  const {
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
  } = useOrgNotifications();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-16 font-sans text-slate-800">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-3.5 text-xs font-bold text-white shadow-2xl animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header with Actions */}
      <NotificationHeader
        loading={loading}
        onRefresh={fetchNotifications}
        onMarkAllRead={markAllRead}
      />

      {/* 2. Filter Tabs */}
      <NotificationTabs
        activeTab={activeTab}
        counts={counts}
        onSelectTab={setActiveTab}
      />

      {/* 3. Notifications Feed List */}
      <NotificationList
        loading={loading}
        notifications={filteredNotifications}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
      />
    </div>
  );
}
