"use client";

import { Bell, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SuperAdminNotificationItem } from "../types";
import { SuperAdminNotificationItemCard } from "./SuperAdminNotificationItemCard";

interface SuperAdminNotificationListProps {
  activeTab: string;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  priorityFilter: string;
  onPriorityChange: (val: string) => void;
  onResetFilters: () => void;
  notifications: SuperAdminNotificationItem[];
  onMarkAsRead: (id: string, e?: React.MouseEvent) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
}

export function SuperAdminNotificationList({
  activeTab,
  loading,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  onResetFilters,
  notifications,
  onMarkAsRead,
  onDelete,
}: SuperAdminNotificationListProps) {
  const getTabTitle = () => {
    switch (activeTab) {
      case "unread":
        return "Unread Notifications";
      case "critical":
        return "Critical Incidents & Warnings";
      case "system":
        return "System & AI Outage Logs";
      case "billing":
        return "Billing & Subscription Events";
      case "security":
        return "Security & Authentication Feed";
      default:
        return "All Platform Notifications";
    }
  };

  return (
    <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-sm font-extrabold text-slate-900">
            {getTabTitle()}
          </CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing {notifications.length} notification{notifications.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* Search & Priority Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-lg border border-slate-200 text-xs w-44 sm:w-56 focus:outline-hidden focus:ring-1 focus:ring-[#274690]"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-slate-100">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#274690]" />
            <p className="font-semibold">Loading notifications feed...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Bell className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 text-sm">No notifications found</p>
            <p className="text-slate-400 text-xs max-w-xs">
              {searchQuery
                ? "No alerts match your current search query."
                : "No alerts or events reported for this filter."}
            </p>
            {(searchQuery || priorityFilter !== "ALL") && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResetFilters}
                className="mt-2 text-xs font-bold h-7"
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          notifications.map((notif) => (
            <SuperAdminNotificationItemCard
              key={notif.id}
              notification={notif}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
