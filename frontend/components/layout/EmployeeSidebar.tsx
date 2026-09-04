"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserCheck, ChevronRight, LogOut, Building2, X } from "lucide-react";
import { employeeNavItems } from "@/lib/employeeNav";

interface EmployeeSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

function getStoredEmployeeContext() {
  let teamName = "Financial Operations";
  let departmentName = "Operations & Logistics";
  let employeeName = "Priya Sharma";
  let role = "Staff Associate";

  if (typeof window === "undefined") {
    return { teamName, departmentName, employeeName, role };
  }

  try {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.name || user.full_name) employeeName = user.name || user.full_name;
      if (user.team) teamName = user.team;
      if (user.department_name || user.department) departmentName = user.department_name || user.department;
      if (user.role) role = user.role;
    }
  } catch {}

  return { teamName, departmentName, employeeName, role };
}

export default function EmployeeSidebar({ mobileOpen = false, onClose }: EmployeeSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [teamName, setTeamName] = useState("Financial Operations");
  const [departmentName, setDepartmentName] = useState("Operations & Logistics");
  const [employeeName, setEmployeeName] = useState("Priya Sharma");

  useEffect(() => {
    const sync = () => {
      const data = getStoredEmployeeContext();
      setTeamName(data.teamName);
      setDepartmentName(data.departmentName);
      setEmployeeName(data.employeeName);
    };

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("accessToken");
    } catch {}
    router.push("/auth/login");
  };

  const sidebarContent = (
    <aside className="relative isolate flex h-full w-72 sm:w-80 shrink-0 flex-col overflow-hidden border-r border-[#274690]/30 bg-[linear-gradient(165deg,#0f172a_0%,#182747_50%,#1e3a8a_100%)] text-slate-100 shadow-2xl">
      {/* Subtle Background Glows */}
      <div className="pointer-events-none absolute left-[-20%] top-[-10%] h-64 w-64 rounded-full bg-[#c96f4a]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-20%] h-64 w-64 rounded-full bg-[#274690]/40 blur-3xl" />

      {/* Header / Staff Identity */}
      <div className="relative border-b border-white/10 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#274690] to-[#c96f4a] text-white font-black shadow-lg shadow-[#274690]/40 ring-1 ring-white/30 shrink-0">
              <UserCheck size={22} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-[16px] sm:text-[18px] font-black tracking-normal text-white">
                  {employeeName}
                </h2>
                <span className="rounded-full bg-[#274690]/40 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-blue-200 border border-[#274690]/50">
                  Staff
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12px] sm:text-[13px] font-bold uppercase tracking-wide text-[#f3b092]">
                {teamName}
              </p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
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

        {/* Read-only Department Tag */}
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 border border-white/10">
          <Building2 size={14} className="text-[#f3b092] shrink-0" />
          <span className="truncate">{departmentName}</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 sm:px-4 py-4 scrollbar-none">
        <div className="px-3 pb-2 pt-1 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#f3b092]">
          Workspace Navigation
        </div>
        {employeeNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/employee" && pathname?.startsWith(`${item.href}`));

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
                      isActive ? "text-[#f3b092]" : "text-white/80 group-hover:text-white"
                    }`}
                  />
                  <span className="truncate whitespace-nowrap leading-normal">{item.name}</span>
                </div>

                <ChevronRight
                  size={15}
                  className={`text-[#f3b092] opacity-0 transition group-hover:opacity-100 ${isActive ? "opacity-100" : ""}`}
                />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-white/10 p-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 p-2.5 border border-white/10">
          <Link
            href="/employee/profile"
            onClick={() => onClose && onClose()}
            className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#c96f4a] to-[#274690] text-xs font-black text-white shadow-sm shrink-0">
              {employeeName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-bold text-white">{employeeName}</div>
              <div className="truncate text-[11px] text-slate-300 font-medium">View Profile</div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#f3b092] hover:bg-[#c96f4a]/20 hover:text-[#ffd6c4] transition"
          >
            <LogOut size={16} />
          </button>
        </div>
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
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          {/* Slide-over Drawer */}
          <div className="relative z-50 flex h-full max-w-[85vw] animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
