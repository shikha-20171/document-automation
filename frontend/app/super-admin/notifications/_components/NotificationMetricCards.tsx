"use client";

import { Bell, AlertTriangle, Zap, Server } from "lucide-react";
import { SuperAdminNotificationCounts } from "../types";

interface NotificationMetricCardsProps {
  counts: SuperAdminNotificationCounts;
}

export function NotificationMetricCards({ counts }: NotificationMetricCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Alerts</p>
          <h3 className="text-xl font-black text-slate-900 mt-0.5">{counts.all}</h3>
        </div>
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
          <Bell className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unread</p>
          <h3 className="text-xl font-black text-rose-600 mt-0.5">{counts.unread}</h3>
        </div>
        <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
          <AlertTriangle className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Critical</p>
          <h3 className="text-xl font-black text-amber-600 mt-0.5">{counts.critical}</h3>
        </div>
        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
          <Zap className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">System / Infra</p>
          <h3 className="text-xl font-black text-[#274690] mt-0.5">{counts.system}</h3>
        </div>
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-[#274690]">
          <Server className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
