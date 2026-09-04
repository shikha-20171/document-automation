"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  CheckCheck,
  Trash2,
  ExternalLink,
  FileText,
  CheckSquare,
  GitFork,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/axios";

type NotifCategory = "ALL" | "UNREAD" | "TASKS" | "DOCUMENTS" | "APPROVALS" | "WORKFLOW";

export default function TeamLeaderNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<NotifCategory>("ALL");
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchNotifs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/team-leader/notifications", { params: { category: activeCategory } });
      if (res?.data?.data) {
        setNotifications(Array.isArray(res.data.data) ? res.data.data : res.data.data.notifications || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifs();
  }, [activeCategory]);

  const handleMarkAsRead = async (id: string) => {
    try {
      if (id === "ALL") {
        await apiClient.patch("/team-leader/notifications/read-all");
      } else {
        await apiClient.patch(`/team-leader/notifications/${id}/read`);
      }
      showToast("Notification marked as read.");
      void fetchNotifs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update notification.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/team-leader/notifications/${id}`);
      showToast("Notification deleted.");
      void fetchNotifs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete notification.");
    }
  };

  const categories: { key: NotifCategory; label: string }[] = [
    { key: "ALL", label: "All Notifications" },
    { key: "UNREAD", label: "Unread" },
    { key: "TASKS", label: "Tasks" },
    { key: "DOCUMENTS", label: "Documents" },
    { key: "APPROVALS", label: "Approvals" },
    { key: "WORKFLOW", label: "Workflow" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-20 font-sans text-slate-800">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#274690] sm:text-3xl">Notifications</h1>
            <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-xs font-black px-2.5 py-0.5">
              Live Team Feed
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-semibold">
            Real-time alerts on document submissions, task deadlines, and team actions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleMarkAsRead("ALL")}
            className="h-10 rounded-xl border-[#274690]/30 text-xs font-bold text-[#274690] hover:bg-[#274690]/5 gap-1.5"
          >
            <CheckCheck size={14} className="text-[#c96f4a]" /> Mark All as Read
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. CATEGORY TABS */}
      <div className="flex overflow-x-auto space-x-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActiveCategory(c.key)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black transition ${
              activeCategory === c.key
                ? "bg-[#274690] text-white shadow-xs"
                : "text-slate-500 hover:bg-[#274690]/5 hover:text-[#274690]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 3. NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400 font-bold">
            No notifications in this category.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between rounded-3xl border p-5 transition ${
                n.unread ? "border-[#c96f4a]/40 bg-[#c96f4a]/5 shadow-xs" : "border-slate-200/80 bg-white"
              }`}
            >
              <div className="flex items-start gap-3.5 max-w-[80%]">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold shrink-0 ${
                    n.unread ? "bg-gradient-to-tr from-[#274690] to-[#c96f4a] text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Bell size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">{n.title}</h4>
                    {n.unread && <span className="h-2 w-2 rounded-full bg-[#c96f4a] animate-pulse" />}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 font-medium leading-relaxed">{n.message}</p>
                  <span className="mt-2 inline-block text-[10px] font-bold text-slate-400">{n.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {n.link && (
                  <Link href={n.link}>
                    <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs font-bold text-[#274690] border-[#274690]/30 hover:bg-[#274690]/5">
                      Open <ExternalLink size={12} className="ml-1" />
                    </Button>
                  </Link>
                )}
                {n.unread && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkAsRead(n.id)}
                    className="h-8 rounded-xl text-xs font-bold text-slate-500 hover:text-[#274690]"
                    title="Mark read"
                  >
                    <Check size={14} />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(n.id)}
                  className="h-8 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-700"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
