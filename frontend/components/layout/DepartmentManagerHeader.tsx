"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import ThemeToggle from "./ThemeToggle";

const titleMap: Array<{ match: string; title: string; subtitle: string }> = [
  { match: "/dashboard", title: "Department Command Center", subtitle: "Your department performance, approvals, and team activity." },
  { match: "/documents", title: "Department Documents", subtitle: "Only department-scoped records, actions, and review queues." },
  { match: "/document-templates", title: "Document Templates", subtitle: "Use available templates and manage department-owned drafts." },
  { match: "/team", title: "Team / Employees", subtitle: "Manage assigned work, tasks, and employee document activity." },
  { match: "/ai-tools", title: "AI Tools Workspace", subtitle: "Use AI features without touching platform configuration." },
  { match: "/approvals", title: "Department Approvals", subtitle: "Handle pending approvals and track the approval chain." },
  { match: "/reports", title: "Department Reports", subtitle: "Department-only insights, exports, and workload analysis." },
  { match: "/notifications", title: "Notifications Center", subtitle: "Actionable alerts relevant to your department work." },
  { match: "/profile", title: "Manager Profile", subtitle: "Personal settings, password, sessions, and preferences." },
];

interface DepartmentManagerHeaderProps {
  onMenuClick?: () => void;
}

export default function DepartmentManagerHeader({ onMenuClick }: DepartmentManagerHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const current = titleMap.find((item) => pathname.includes(item.match)) || titleMap[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2.5 border-b border-slate-200/80 bg-white/85 dark:bg-slate-900/85 dark:border-slate-800 px-3 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
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
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm sm:text-base font-black leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            {current.title}
          </h1>
          <p className="hidden sm:block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{current.subtitle}</p>
        </div>
      </div>

      <div className="mx-2 hidden max-w-md flex-1 items-center xl:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search documents, approvals, employees..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9 rounded-xl border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 pl-9 text-xs focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push("/department-manager/notifications")}
          className="relative h-9 w-9 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-0 text-slate-600 dark:text-slate-300 transition-all hover:text-[#274690] dark:hover:text-blue-400"
        >
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#c96f4a] ring-2 ring-white dark:ring-slate-900" />
        </Button>

        <ThemeToggle />

        <button
          onClick={() => router.push("/department-manager/profile")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-1.5 pr-2 text-left text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/60 sm:gap-2.5 sm:pr-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#274690] text-xs font-black text-white shadow-xs">
            DM
          </div>
          <div className="hidden leading-tight lg:block">
            <p className="text-xs font-black text-slate-800 dark:text-slate-100">Department Manager</p>
            <p className="text-[10px] font-bold text-[#c96f4a]">Department Scope</p>
          </div>
          <ChevronDown size={14} className="hidden text-slate-400 lg:block" />
        </button>
      </div>
    </header>
  );
}