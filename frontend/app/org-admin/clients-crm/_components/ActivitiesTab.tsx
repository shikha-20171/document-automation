"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Building2, UserPlus, FileText, PenTool, MessageSquare, StickyNote, Activity,
  Filter, Calendar,
} from "lucide-react";
import { clientStore, type Activity as ActivityType, formatDate } from "./clientStore";

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  "Client created": { icon: Building2, color: "bg-[#274690]" },
  "Client updated": { icon: Building2, color: "bg-slate-500" },
  "Contact added": { icon: UserPlus, color: "bg-violet-600" },
  "Document created": { icon: FileText, color: "bg-emerald-600" },
  "Document shared": { icon: FileText, color: "bg-blue-500" },
  "Document approved": { icon: FileText, color: "bg-emerald-600" },
  "Signature requested": { icon: PenTool, color: "bg-amber-500" },
  "Signature completed": { icon: PenTool, color: "bg-emerald-500" },
  "Request created": { icon: MessageSquare, color: "bg-[#274690]" },
  "Request completed": { icon: MessageSquare, color: "bg-emerald-600" },
  "Note added": { icon: StickyNote, color: "bg-amber-500" },
  "User assigned": { icon: UserPlus, color: "bg-violet-600" },
};

const ACTIVITY_TYPES = [
  "All", "Client created", "Client updated", "Contact added",
  "Document created", "Document shared", "Document approved",
  "Signature requested", "Signature completed",
  "Request created", "Request completed",
  "Note added", "User assigned",
];

function groupByDate(activities: ActivityType[]) {
  const groups: Record<string, ActivityType[]> = {};
  activities.forEach(a => {
    const date = new Date(a.createdAt);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let label: string;
    if (date.toDateString() === today.toDateString()) label = "Today";
    else if (date.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else label = formatDate(a.createdAt, { day: "2-digit", month: "long", year: "numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(a);
  });
  return groups;
}

export default function ActivitiesTab() {
  const params = useParams();
  const clientId = params?.clientId as string;

  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");

  useEffect(() => {
    setActivities(clientStore.getActivities(clientId));
  }, [clientId]);

  const users = useMemo(() => Array.from(new Set(activities.map(a => a.user))), [activities]);

  const filtered = useMemo(() => {
    return activities.filter(a => {
      const matchType = typeFilter === "All" || a.type === typeFilter;
      const matchUser = userFilter === "All" || a.user === userFilter;
      return matchType && matchUser;
    });
  }, [activities, typeFilter, userFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const groupKeys = Object.keys(grouped);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">Activity Timeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} events</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-8 appearance-none rounded-xl border border-slate-200 bg-white pl-7 pr-5 text-xs font-semibold outline-none">
              {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="relative">
            <Calendar size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="h-8 appearance-none rounded-xl border border-slate-200 bg-white pl-7 pr-5 text-xs font-semibold outline-none">
              <option>All</option>
              {users.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="px-5 py-5">
        {groupKeys.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-300">
            <Activity size={32} className="mb-3" />
            <p className="text-sm font-semibold text-slate-500">No activities yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupKeys.map(dateLabel => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">{dateLabel}</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <div className="space-y-3">
                  {grouped[dateLabel].map((act, idx) => {
                    const cfg = ACTIVITY_ICONS[act.type] ?? { icon: Activity, color: "bg-slate-500" };
                    const Icon = cfg.icon;
                    const isLast = idx === grouped[dateLabel].length - 1;
                    return (
                      <div key={act.id} className="flex items-start gap-3 relative">
                        {/* Timeline line */}
                        {!isLast && (
                          <div className="absolute left-[14px] top-7 bottom-0 w-px bg-slate-100" />
                        )}
                        {/* Icon */}
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm z-10 ${cfg.color}`}>
                          <Icon size={12} />
                        </div>
                        <div className="flex-1 min-w-0 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{act.type}</p>
                              <p className="text-xs font-semibold text-slate-700 mt-0.5">{act.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(act.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{act.user}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
