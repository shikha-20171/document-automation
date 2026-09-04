"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, ChevronRight, LogOut, X } from "lucide-react";
import { teamLeaderNavItems } from "@/lib/teamLeaderNav";

interface TeamLeaderSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

function getStoredTeamLeaderContext() {
  let teamName = "Financial Operations";
  let departmentName = "Operations & Logistics";
  let leadName = "Team Leader";

  if (typeof window === "undefined") {
    return { teamName, departmentName, leadName };
  }

  try {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.name || user.full_name) leadName = user.name || user.full_name;
      if (user.team) teamName = user.team;
      if (user.department_name || user.department) departmentName = user.department_name || user.department;
    }
  } catch {}

  return { teamName, departmentName, leadName };
}

export default function TeamLeaderSidebar({ mobileOpen = false, onClose }: TeamLeaderSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [teamName, setTeamName] = useState("Financial Operations");
  const [departmentName, setDepartmentName] = useState("Operations & Logistics");
  const [leadName, setLeadName] = useState("Team Leader");

  useEffect(() => {
    const sync = () => {
      const data = getStoredTeamLeaderContext();
      setTeamName(data.teamName);
      setDepartmentName(data.departmentName);
      setLeadName(data.leadName);
    };

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const sidebarContent = (
    <aside className="relative isolate flex h-full w-72 sm:w-80 shrink-0 flex-col overflow-hidden border-r border-[#274690]/30 bg-[linear-gradient(165deg,#131c36_0%,#182747_50%,#274690_100%)] text-slate-100 shadow-2xl">
      {/* Background glow accents in #c96f4a and #274690 */}
      <div className="pointer-events-none absolute left-[-20%] top-[-10%] h-64 w-64 rounded-full bg-[#c96f4a]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-20%] h-64 w-64 rounded-full bg-[#274690]/40 blur-3xl" />

      {/* Header / Brand Banner */}
      <div className="relative border-b border-white/10 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#274690] to-[#c96f4a] text-white font-black shadow-lg shadow-[#274690]/40 ring-1 ring-white/30 shrink-0">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[16px] sm:text-[18px] font-black tracking-normal text-white" title={teamName}>
                {teamName}
              </h2>
              <p className="mt-0.5 truncate text-[12px] sm:text-[13px] font-bold uppercase tracking-wide text-[#f3b092] flex items-center gap-1.5">
                <span>{departmentName}</span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c96f4a]" />
                <span className="font-bold text-slate-200">Lead</span>
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
              title="Close Menu"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 sm:px-4 py-4 scrollbar-none">
        <div className="px-3 pb-2 pt-1 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#f3b092]">
          Team Workspace
        </div>

        {teamLeaderNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/team-leader" && pathname?.startsWith(`${item.href}`));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose && onClose()}
              className="block group"
            >
              <div
                className={`relative flex items-center justify-between rounded-xl px-3.5 py-2.5 sm:py-3 text-[14px] sm:text-[15px] transition-all duration-150 ${
                  isActive
                    ? "bg-white/20 text-white font-bold shadow-md"
                    : "text-white/90 hover:bg-white/10 hover:text-white font-semibold"
                }`}
              >
                {isActive ? (
                  <div className="absolute bottom-2 left-0 top-2 w-1.5 rounded-r-full bg-[#c96f4a]" />
                ) : null}
                <div className="flex min-w-0 items-center gap-3 pr-2">
                  <Icon
                    size={18}
                    className={`shrink-0 transition ${
                      isActive ? "text-[#f3b092]" : "text-slate-300 group-hover:text-white"
                    }`}
                  />
                  <span className="truncate whitespace-nowrap leading-normal">{item.title}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="rounded-full bg-[#c96f4a]/30 px-2 py-0.5 text-[11px] font-extrabold text-[#ffd6c4] border border-[#c96f4a]/40">
                      {item.badge}
                    </span>
                  )}
                  {isActive ? <ChevronRight size={15} className="shrink-0 text-[#f3b092]" /> : null}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="relative space-y-2 border-t border-white/10 px-3.5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/10 p-2 border border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#c96f4a] to-[#274690] text-xs font-black text-white shadow-sm shrink-0">
            {leadName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-white">{leadName}</p>
            <p className="truncate text-[10px] font-semibold text-slate-300">Team Leader</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-[13px] font-bold text-[#f3b092] transition hover:bg-[#c96f4a]/20 hover:text-[#ffd6c4]"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex h-screen shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile / Tablet Slide-over Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-200">
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          <div className="relative z-50 flex h-full max-w-[85vw] animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
