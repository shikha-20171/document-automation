"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Check,
  Settings,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import apiClient from "@/lib/axios";

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [toast, setToast] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/employee/notifications", { params: { filter: activeTab } });
      if (res?.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
        setPreferences(res.data.data.preferences || {});
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, [activeTab]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkRead = async (id: string) => {
    try {
      if (id === "ALL") {
        await apiClient.patch("/employee/notifications/read-all");
      } else {
        await apiClient.patch(`/employee/notifications/${id}/read`);
      }
      showToast(id === "ALL" ? "All notifications marked as read." : "Notification marked as read.");
      void fetchNotifications();
    } catch {}
  };

  const handleTogglePreference = async (key: string) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await apiClient.put("/employee/notifications/preferences", updated);
      showToast("Notification preferences updated.");
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#274690]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#274690] border border-[#274690]/20">
              Alerts & Feeds
            </span>
            <span className="text-xs text-slate-400">{unreadCount} unread notifications</span>
          </div>
          <h1 className="mt-1 text-xl font-black text-slate-800 sm:text-2xl">Notifications Center</h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time updates on assigned tasks, approval statuses, manager comments, and deadlines.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => handleMarkRead("ALL")}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#274690] shadow-sm hover:bg-slate-50"
          >
            <Check size={15} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Layout: Notifications on Left, Preferences on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT 2 COLS: Notifications List & Tabs */}
        <div className="space-y-4 lg:col-span-2">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200/80 bg-white/80 p-2 shadow-sm backdrop-blur-md">
            {[
              { id: "ALL", label: "All" },
              { id: "UNREAD", label: "Unread" },
              { id: "Tasks", label: "Tasks" },
              { id: "Approvals", label: "Approvals" },
              { id: "System", label: "System" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? "bg-[#274690] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#274690] border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white/80 p-12 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Bell size={24} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-800">No Notifications</h3>
              <p className="mt-1 text-xs text-slate-400">You're all caught up with alerts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-4 rounded-3xl border p-4 shadow-sm backdrop-blur-md transition hover:bg-slate-50/90 ${
                    n.unread
                      ? "border-blue-200 bg-blue-50/40 shadow-blue-500/5"
                      : "border-slate-200/80 bg-white/80"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        n.type === "WARNING"
                          ? "bg-amber-50 text-amber-600"
                          : n.type === "APPROVAL"
                          ? "bg-emerald-50 text-emerald-600"
                          : n.type === "TASK"
                          ? "bg-blue-50 text-[#274690]"
                          : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {n.type === "WARNING" ? (
                        <AlertCircle size={18} />
                      ) : n.type === "APPROVAL" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Bell size={18} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-800">{n.title}</h4>
                        {n.unread && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                        <span>{n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">{n.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {n.link && (
                      <Link
                        href={n.link}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        title="View Related Item"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    )}
                    {n.unread && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="rounded-xl bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                        title="Mark Read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT 1 COL: Notification Preferences */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings size={16} className="text-[#274690]" />
            <h3 className="text-sm font-bold text-slate-800">Notification Preferences</h3>
          </div>

          <p className="text-xs text-slate-500">
            Control which automated events trigger in-app alerts and notifications.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { key: "taskAssigned", label: "New Task Assigned", desc: "When team leader assigns a task" },
              { key: "documentApproved", label: "Document Approved", desc: "Formal sign-off by manager" },
              { key: "documentRejected", label: "Approval Rejected / Revised", desc: "Correction notes requested" },
              { key: "commentAdded", label: "New Comments on Tasks", desc: "Collaborative feedback" },
              { key: "deadlineReminders", label: "Task Deadline Reminders", desc: "Upcoming due date alerts" },
              { key: "emailDigest", label: "Daily Email Summary", desc: "Consolidated morning digest" },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between gap-3 py-1">
                <div>
                  <div className="text-xs font-bold text-slate-700">{pref.label}</div>
                  <div className="text-[10px] text-slate-400">{pref.desc}</div>
                </div>
                <button
                  onClick={() => handleTogglePreference(pref.key)}
                  className={`text-2xl transition ${
                    preferences[pref.key] ? "text-[#274690]" : "text-slate-300"
                  }`}
                >
                  {preferences[pref.key] ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
