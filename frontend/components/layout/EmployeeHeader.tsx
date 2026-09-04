"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Plus,
  Sparkles,
  FileText,
  CheckSquare,
  LayoutTemplate,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Menu,
} from "lucide-react";
import apiClient from "@/lib/axios";
import ThemeToggle from "./ThemeToggle";

interface EmployeeHeaderProps {
  onMenuClick?: () => void;
}

export default function EmployeeHeader({ onMenuClick }: EmployeeHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get("/employee/notifications").then((res) => {
      if (res?.data?.data) {
        setNotifications(res.data.data.notifications?.slice(0, 4) || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    }).catch(() => {});
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch("/employee/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch {}
  };

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-3 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 gap-2">
      {/* Left: Hamburger button on mobile & Search Input */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-md">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shrink-0 shadow-xs"
            title="Open Menu"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search documents, tasks, templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 sm:py-2 pl-8 sm:pl-9 pr-3 sm:pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#274690] focus:bg-white focus:ring-2 focus:ring-[#274690]/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Right Action Icons & User Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setQuickActionsOpen(!quickActionsOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#274690] to-[#1e3a8a] px-3 py-2 text-xs font-bold text-white shadow-sm shadow-[#274690]/20 transition hover:brightness-110 active:scale-95"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New Action</span>
          </button>

          {quickActionsOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Actions
              </div>
              <Link
                href="/employee/documents/create"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <FileText size={15} />
                </div>
                <div>
                  <div>Create Document</div>
                  <div className="text-[10px] text-slate-400">Blank rich-text editor</div>
                </div>
              </Link>
              <Link
                href="/employee/document-templates"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <LayoutTemplate size={15} />
                </div>
                <div>
                  <div>Use Template</div>
                  <div className="text-[10px] text-slate-400">Pre-built org templates</div>
                </div>
              </Link>
              <Link
                href="/employee/ai-tools"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Sparkles size={15} />
                </div>
                <div>
                  <div>AI Assistant</div>
                  <div className="text-[10px] text-slate-400">OCR & Document tools</div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Notifications Dropdown Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setQuickActionsOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#274690] hover:underline dark:text-blue-400"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link || "/employee/notifications"}
                    onClick={() => setNotificationsOpen(false)}
                    className={`block p-2.5 rounded-xl transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      item.unread ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {item.type === "WARNING" ? (
                          <AlertCircle size={14} className="text-amber-500" />
                        ) : item.type === "SUCCESS" ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <Bell size={14} className="text-[#274690]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.title}</div>
                        <div className="line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">{item.message}</div>
                        <div className="mt-1 text-[9px] font-medium text-slate-400">{item.time || "Recently"}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-2 border-t border-slate-100 pt-2 text-center dark:border-slate-800">
                <Link
                  href="/employee/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#274690] hover:underline dark:text-blue-400"
                >
                  <span>View all notifications</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />

        {/* Live Status Pill */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800/80 md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Active Session</span>
        </div>
      </div>
    </header>
  );
}
