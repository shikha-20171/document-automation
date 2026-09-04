"use client";

import {
  Bell,
  AlertTriangle,
  Zap,
  Server,
  CheckCircle2,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { SuperAdminNotificationCounts } from "../types";

interface NotificationTabsNavProps {
  activeTab: string;
  counts: SuperAdminNotificationCounts;
  onSelectTab: (tabId: string) => void;
}

export function NotificationTabsNav({
  activeTab,
  counts,
  onSelectTab,
}: NotificationTabsNavProps) {
  const tabs = [
    { id: "all", label: "All Alerts", icon: Bell, count: counts.all },
    { id: "unread", label: "Unread", icon: AlertTriangle, count: counts.unread },
    { id: "critical", label: "Critical", icon: Zap, count: counts.critical },
    { id: "system", label: "System & AI", icon: Server, count: counts.system },
    { id: "billing", label: "Billing & Plans", icon: CheckCircle2, count: counts.billing },
    { id: "security", label: "Security", icon: ShieldAlert, count: counts.security },
    { id: "settings", label: "Delivery Channels", icon: SlidersHorizontal },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 pb-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? "bg-[#274690] text-white shadow-sm shadow-[#274690]/25"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70"
            }`}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? "bg-white/20 text-white font-extrabold" : "bg-slate-100 text-slate-700 font-bold"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
