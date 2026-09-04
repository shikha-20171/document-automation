"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrgAdminSidebar, ThemeToggle } from "@/components/layout";
import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/axios";

export default function OrgAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await apiClient.get("/org-admin/notifications", { params: { filter: "unread" } });
        if (res?.data?.data?.counts?.unread !== undefined) {
          setUnreadCount(res.data.data.counts.unread);
        } else if (res?.data?.data?.unreadCount !== undefined) {
          setUnreadCount(res.data.data.unreadCount);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(39,70,144,0.06),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)]"
      style={{ ["--org-brand" as string]: "#274690" }}
    >
      <OrgAdminSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shrink-0 shadow-xs"
              title="Open Menu"
            >
              <Menu size={18} />
            </button>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search documents, workflows, templates..."
                className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/org-admin/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-(--org-brand) hover:border-[#274690]/40 transition shadow-xs"
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Content Container */}
        <main className="p-3.5 sm:p-6 flex-1 overflow-y-auto scrollbar-none">{children}</main>
      </div>
    </div>
  );
}
