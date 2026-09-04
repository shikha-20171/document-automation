"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  FileCheck,
  Sparkles,
  Users,
  Clock,
  Trash2,
  Check,
  ArrowRight,
  Filter,
  RefreshCw,
  MailOpen,
  FileText,
  Sliders,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/axios";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: "approvals" | "documents" | "team" | "ai" | string;
  relatedDocument?: string;
  priority?: "HIGH" | "MEDIUM" | "NORMAL" | string;
  timestamp: string;
  read: boolean;
  link?: string;
};

export default function DepartmentManagerNotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState({ all: 0, unread: 0, approvals: 0, documents: 0, team: 0, ai: 0 });
  const [successToast, setSuccessToast] = useState("");
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    approvalNotifications: true,
    documentNotifications: true,
    teamNotifications: true,
    aiNotifications: true,
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/department-manager/notifications", { params: { tab: activeTab } });
      if (res?.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setCounts(res.data.data.counts || { all: 0, unread: 0, approvals: 0, documents: 0, team: 0, ai: 0 });
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, [activeTab]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.patch(`/department-manager/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      showToast("Notification marked as read.");
    } catch {}
  };

  const handleMarkAsUnread = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.patch(`/department-manager/notifications/${id}/unread`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
      showToast("Notification marked as unread.");
    } catch {}
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.delete(`/department-manager/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast("Notification deleted.");
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch("/department-manager/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast("All notifications marked as read.");
    } catch {}
  };

  const handleSavePreferences = async () => {
    try {
      await apiClient.put("/department-manager/profile", { preferences });
      showToast("Notification preferences saved.");
      setIsPreferencesOpen(false);
    } catch {
      showToast("Failed to save preferences.");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "approvals":
        return <FileCheck className="text-[#c96f4a]" size={16} />;
      case "ai":
        return <Sparkles className="text-[#5B53BA]" size={16} />;
      case "team":
        return <Users className="text-[#274690]" size={16} />;
      case "documents":
        return <CheckCircle2 className="text-emerald-600" size={16} />;
      default:
        return <Bell className="text-slate-500" size={16} />;
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-16 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Department Notifications</h1>
            {counts.unread > 0 && (
              <Badge className="bg-[#c96f4a] text-white text-xs font-bold">{counts.unread} New</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">Live operational alerts, document submissions, team tasks, and AI processing statuses.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreferencesOpen(true)}
            className="text-xs font-bold text-slate-700"
          >
            <Sliders size={14} className="mr-1.5" /> Preferences
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs font-bold text-slate-700">
            <MailOpen size={14} className="mr-1.5" /> Mark All as Read
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchNotifications} className="h-9 w-9 p-0">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm">
          <span>{successToast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs">
        {[
          { id: "all", label: "All", count: counts.all },
          { id: "unread", label: "Unread", count: counts.unread },
          { id: "documents", label: "Documents", count: counts.documents },
          { id: "approvals", label: "Approvals", count: counts.approvals },
          { id: "team", label: "Team", count: counts.team },
          { id: "ai", label: "AI Engines", count: counts.ai },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                active ? "bg-[#274690] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#274690]" />
            <p className="mt-2 text-xs font-bold">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Bell size={36} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">No notifications in this category.</p>
            <p className="text-xs text-slate-400">You are all caught up on department tasks and sign-offs.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.read) handleMarkAsRead(notif.id);
                if (notif.link) router.push(notif.link);
              }}
              className={`flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 transition ${
                notif.read
                  ? "border-slate-100 bg-slate-50/40 hover:bg-slate-50"
                  : "border-[#274690]/30 bg-blue-50/30 hover:bg-blue-50/60 shadow-2xs"
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0`}>
                  {getIcon(notif.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs font-black ${notif.read ? "text-slate-800" : "text-slate-900"}`}>
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-[#274690] shrink-0" />
                    )}
                    {notif.priority === "HIGH" && (
                      <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[9px] font-black text-rose-700">HIGH</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{notif.description}</p>
                  
                  {notif.relatedDocument && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#274690]">
                      <FileText size={11} /> {notif.relatedDocument}
                    </span>
                  )}

                  <span className="mt-1.5 block font-mono text-[10px] text-slate-400">
                    {new Date(notif.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!notif.read ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                    className="h-8 px-2 text-[11px] font-bold text-[#274690] hover:bg-blue-100/50"
                  >
                    <Check size={13} className="mr-1" /> Mark Read
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleMarkAsUnread(notif.id, e)}
                    className="h-8 px-2 text-[11px] font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Mark Unread
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDelete(notif.id, e)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 size={13} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* NOTIFICATION PREFERENCES MODAL */}
      {isPreferencesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Notification Preferences</h3>
              <button type="button" onClick={() => setIsPreferencesOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700">
              <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span>Email Notifications</span>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                  className="h-4 w-4 rounded text-[#274690]"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span>Approval Alerts</span>
                <input
                  type="checkbox"
                  checked={preferences.approvalNotifications}
                  onChange={(e) => setPreferences({ ...preferences, approvalNotifications: e.target.checked })}
                  className="h-4 w-4 rounded text-[#274690]"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span>Document Alerts</span>
                <input
                  type="checkbox"
                  checked={preferences.documentNotifications}
                  onChange={(e) => setPreferences({ ...preferences, documentNotifications: e.target.checked })}
                  className="h-4 w-4 rounded text-[#274690]"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span>Team Workload Alerts</span>
                <input
                  type="checkbox"
                  checked={preferences.teamNotifications}
                  onChange={(e) => setPreferences({ ...preferences, teamNotifications: e.target.checked })}
                  className="h-4 w-4 rounded text-[#274690]"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span>AI Processing Alerts</span>
                <input
                  type="checkbox"
                  checked={preferences.aiNotifications}
                  onChange={(e) => setPreferences({ ...preferences, aiNotifications: e.target.checked })}
                  className="h-4 w-4 rounded text-[#274690]"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsPreferencesOpen(false)} className="text-xs font-bold">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSavePreferences} className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]">
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}