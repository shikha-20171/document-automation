"use client";

import { NotificationCounts } from "../types";

interface NotificationTabsProps {
  activeTab: string;
  counts: NotificationCounts;
  onSelectTab: (tabId: string) => void;
}

export function NotificationTabs({
  activeTab,
  counts,
  onSelectTab,
}: NotificationTabsProps) {
  const tabs = [
    { id: "all", label: "All Activity", count: counts.all },
    { id: "unread", label: "Unread", count: counts.unread },
    { id: "approvals", label: "Approvals & Forwarded", count: counts.approvals },
    { id: "documents", label: "Documents", count: counts.documents },
    { id: "system", label: "System & Governance", count: counts.system },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs ${
              active
                ? "bg-[#274690] text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  active ? "bg-white/20 text-white" : "bg-[#274690]/10 text-[#274690] font-black"
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
