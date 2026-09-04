"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Bell, Sparkles, Calendar, Layers, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";

interface TeamLeaderHeaderProps {
  onMenuClick?: () => void;
}

export default function TeamLeaderHeader({ onMenuClick }: TeamLeaderHeaderProps) {
  const [teamName, setTeamName] = useState("Financial Operations");
  const [leadName, setLeadName] = useState("Team Leader");
  const [departmentName, setDepartmentName] = useState("Operations & Logistics");
  const [unreadCount, setUnreadCount] = useState(3);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );

    try {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name || u.full_name) setLeadName(u.name || u.full_name);
        if (u.team) setTeamName(u.team);
        if (u.department_name || u.department) setDepartmentName(u.department_name || u.department);
      }
    } catch {}
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#274690]/15 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3 sm:px-6 backdrop-blur-md gap-2">
      {/* Left: Mobile hamburger & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
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
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690] dark:bg-blue-900/30 dark:text-blue-400 font-bold shrink-0">
            <Layers size={16} />
          </span>
          <span className="hidden md:inline text-xs font-black uppercase tracking-wider text-slate-400">Team:</span>
          <span className="text-xs sm:text-sm font-extrabold text-[#274690] dark:text-blue-400 truncate">{teamName}</span>
          <span className="hidden sm:inline-block rounded-full bg-[#c96f4a]/10 px-2 py-0.5 text-[10px] font-bold text-[#c96f4a] border border-[#c96f4a]/25 truncate">
            {departmentName}
          </span>
        </div>
      </div>

      {/* Right: Date, Search, Quick AI & Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Date indicator */}
        <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 sm:flex">
          <Calendar size={13} className="text-[#274690] dark:text-blue-400" />
          <span>{currentDate}</span>
        </div>

        {/* AI Tools shortcut */}
        <Link href="/team-leader/ai-tools">
          <Button
            size="sm"
            className="h-8.5 rounded-xl bg-gradient-to-r from-[#274690] to-[#c96f4a] text-xs font-black text-white hover:opacity-95 shadow-sm shadow-[#274690]/25 gap-1.5 px-3"
          >
            <Sparkles size={13} className="text-amber-200 animate-pulse" />
            <span className="hidden sm:inline">AI Operations</span>
          </Button>
        </Link>

        {/* Notifications Icon */}
        <Link href="/team-leader/notifications">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-xs hover:border-[#274690]/40 hover:text-[#274690] dark:hover:text-blue-400 transition"
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c96f4a] text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-in zoom-in">
                {unreadCount}
              </span>
            )}
          </button>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Link */}
        <Link href="/team-leader/profile">
          <div className="flex items-center gap-2 rounded-xl border border-[#274690]/20 bg-[#274690]/5 dark:border-slate-700 dark:bg-slate-800 p-1.5 pr-2.5 shadow-xs hover:border-[#274690]/40 transition">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-[#274690] to-[#c96f4a] text-[11px] font-black text-white">
              {leadName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-xs font-extrabold text-[#274690] dark:text-blue-400 md:inline">{leadName}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
