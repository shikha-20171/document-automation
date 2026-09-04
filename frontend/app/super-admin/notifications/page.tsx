"use client";

import { CheckCircle2 } from "lucide-react";
import { useSuperAdminNotifications } from "./hooks/useSuperAdminNotifications";
import { SuperAdminNotificationHeader } from "./_components/SuperAdminNotificationHeader";
import { NotificationMetricCards } from "./_components/NotificationMetricCards";
import { NotificationTabsNav } from "./_components/NotificationTabsNav";
import { SuperAdminNotificationList } from "./_components/SuperAdminNotificationList";
import { ChannelSettingsCard } from "./_components/ChannelSettingsCard";
import { BroadcastNoticeModal } from "./_components/BroadcastNoticeModal";

export default function SuperAdminNotificationsPage() {
  const {
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
  } = useSuperAdminNotifications();

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 space-y-5 font-sans text-slate-800">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-[#274690] flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Header */}
      <SuperAdminNotificationHeader
        unreadCount={counts.unread}
        activeTab={activeTab}
        refreshing={refreshing}
        onRefresh={() => fetchNotifications(true)}
        onMarkAllRead={markAllRead}
        onOpenBroadcastModal={() => setShowBroadcastModal(true)}
      />

      {/* 2. KPI Summary Cards */}
      <NotificationMetricCards counts={counts} />

      {/* 3. Navigation Filter Tabs */}
      <NotificationTabsNav
        activeTab={activeTab}
        counts={counts}
        onSelectTab={setActiveTab}
      />

      {/* 4. Main Body: Notifications List OR Channel Settings */}
      {activeTab !== "settings" ? (
        <SuperAdminNotificationList
          activeTab={activeTab}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          onResetFilters={() => {
            setSearchQuery("");
            setPriorityFilter("ALL");
          }}
          notifications={filteredNotifications}
          onMarkAsRead={markAsRead}
          onDelete={deleteNotification}
        />
      ) : (
        <ChannelSettingsCard
          settings={channelSettings}
          onChange={setChannelSettings}
          onSave={saveSettings}
          saving={savingSettings}
        />
      )}

      {/* 5. Broadcast Platform Notice Modal */}
      <BroadcastNoticeModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        form={broadcastForm}
        onChange={setBroadcastForm}
        onSubmit={sendBroadcast}
        submitting={submittingBroadcast}
      />
    </div>
  );
}
