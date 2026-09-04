"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, ChevronRight, LogOut, X } from "lucide-react";
import { departmentManagerNavItems } from "@/lib/departmentManagerNav";

interface DepartmentManagerSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

function getStoredDepartmentContext() {
  let departmentName = "Operations";
  let managerName = "Department Manager";

  if (typeof window === "undefined") {
    return { departmentName, managerName };
  }

  try {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.name) managerName = user.name;
      if (user.department_name) departmentName = user.department_name;
    }
  } catch {}

  return { departmentName, managerName };
}

export default function DepartmentManagerSidebar({ mobileOpen = false, onClose }: DepartmentManagerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [departmentName, setDepartmentName] = useState("Operations");
  const [managerName, setManagerName] = useState("Department Manager");

  useEffect(() => {
    const sync = () => {
      const data = getStoredDepartmentContext();
      setDepartmentName(data.departmentName);
      setManagerName(data.managerName);
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
    <aside className="relative isolate flex h-full w-72 sm:w-80 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(165deg,#1f3561_0%,#274690_48%,#213b67_100%)] text-white shadow-2xl">
      <div className="pointer-events-none absolute left-[-18%] top-[-10%] h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-12%] right-[-18%] h-64 w-64 rounded-full bg-[#c96f4a]/25 blur-2xl" />

      <div className="relative border-b border-white/10 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/18 shadow-inner ring-1 ring-white/35 shrink-0">
              <BriefcaseBusiness size={22} className="text-[#f3b092]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[16px] sm:text-[18px] font-black tracking-normal text-white" title={departmentName}>
                {departmentName}
              </h2>
              <p className="mt-0.5 truncate text-[12px] sm:text-[13px] font-bold uppercase tracking-wide text-[#f3b092]">Department Manager</p>
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

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 sm:px-4 py-4 scrollbar-thin scrollbar-thumb-white/20">
        <div className="px-3 pb-2 pt-1 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#f3b092]">
          Department Workspace
        </div>

        {departmentManagerNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose && onClose()}
              className="block"
            >
              <div
                className={`relative flex items-center justify-between rounded-xl px-3.5 py-2.5 sm:py-3 text-[14px] sm:text-[15px] transition-all duration-150 ${
                  isActive
                    ? "bg-white/20 text-white font-bold shadow-md"
                    : "text-white/90 hover:bg-white/10 hover:text-white font-semibold"
                }`}
              >
                {isActive ? <div className="absolute bottom-2 left-0 top-2 w-1.5 rounded-r-full bg-[#c96f4a]" /> : null}
                <div className="flex min-w-0 items-center gap-3 pr-2">
                  <Icon size={18} className={isActive ? "shrink-0 text-[#f3b092]" : "shrink-0 text-white/80"} />
                  <span className="truncate whitespace-nowrap leading-normal">{item.title}</span>
                </div>
                {isActive ? <ChevronRight size={15} className="shrink-0 text-[#f3b092]" /> : null}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="relative space-y-2 border-t border-white/10 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-2 border border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-xs font-black text-white shadow-inner ring-1 ring-white/30 shrink-0">
            {managerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-white">{managerName}</p>
            <p className="truncate text-[10px] font-medium text-white/70">Department scope</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-[13px] font-bold text-[#f3b092] transition hover:bg-[#c96f4a]/20 hover:text-[#ffd6c4]"
        >
          <LogOut size={15} />
          <span>Logout</span>
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