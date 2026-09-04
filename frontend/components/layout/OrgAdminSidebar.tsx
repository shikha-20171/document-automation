"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, LogOut, HardDrive, X } from "lucide-react";
import { orgAdminNavSections } from "@/lib/orgAdminNav";
import { useEntitlements } from "@/hooks/useEntitlements";

interface OrgAdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

function getBrandAndUserFromStorage() {
  let nextOrgName = "Dezo";
  let nextUserName = "Organisation Admin";

  if (typeof window === "undefined") {
    return { nextOrgName, nextUserName };
  }

  try {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.name || user.full_name) nextUserName = user.name || user.full_name;
      if (user.organisation_name) nextOrgName = user.organisation_name;
    }

    if (nextOrgName === "Dezo") {
      const storedOrg = localStorage.getItem("organization");
      if (storedOrg) {
        const org = JSON.parse(storedOrg);
        if (org.companyName || org.name) {
          nextOrgName = org.companyName || org.name;
        }
      }
    }
  } catch {}

  return { nextOrgName, nextUserName };
}

export default function OrgAdminSidebar({ mobileOpen = false, onClose }: OrgAdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { plan, usage, limits } = useEntitlements();

  const [orgName, setOrgName] = useState("Dezo");
  const [userName, setUserName] = useState("Organisation Admin");

  useEffect(() => {
    const loadBrandAndUser = () => {
      const data = getBrandAndUserFromStorage();
      setUserName(data.nextUserName);
      setOrgName(data.nextOrgName);
    };

    loadBrandAndUser();
    window.addEventListener("storage", loadBrandAndUser);
    return () => window.removeEventListener("storage", loadBrandAndUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
    router.push("/auth/login");
  };

  const planName = plan?.name || "Starter Plan";
  const usedStorage = usage ? `${usage.usedStorageGB.toFixed(1)} GB` : "0.0 GB";
  const maxStorage = limits?.["storage.gb"] ? `${limits["storage.gb"]} GB` : "10 GB";

  const sidebarContent = (
    <aside className="relative isolate flex h-full w-72 sm:w-80 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(160deg,#1f3561_0%,#274690_45%,#1e3a5f_100%)] text-white shadow-2xl font-sans">
      {/* Static Ambient Glows */}
      <div className="pointer-events-none absolute left-[-20%] top-[-10%] h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute right-[-20%] bottom-[-10%] h-64 w-64 rounded-full bg-[#c96f4a]/28 blur-2xl" />

      {/* Header: Organization Avatar, Name & Assigned Plan */}
      <div className="relative border-b border-white/10 px-5 py-4 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-xl font-black text-white shadow-inner ring-1 ring-white/40 shrink-0">
              {orgName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-black text-white text-[16px] sm:text-[18px] tracking-normal capitalize" title={orgName}>
                {orgName}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] text-[#f3b092] font-bold uppercase tracking-wide mt-0.5">
                <Building2 size={13} className="text-[#f3b092] shrink-0" />
                <span className="truncate">Org Admin</span>
              </div>
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

        {/* Dynamic Assigned Subscription Plan Badge */}
        <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-1.5 text-xs">
          <span className="text-[11px] font-bold text-white/80">Plan Tier:</span>
          <span className="font-black text-[#ffd6c4] uppercase tracking-wider text-[11px] bg-[#c96f4a]/30 px-2 py-0.5 rounded-md">
            {planName}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 scrollbar-none">
        {orgAdminNavSections.map((section) => (
          <div key={section.title || "main"} className="mb-2">
            {section.title ? (
              <p className="mb-2 px-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#f3b092]">
                {section.title}
              </p>
            ) : null}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
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
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-[#c96f4a]" />
                      )}

                      <div className="flex items-center gap-3 min-w-0">
                        <Icon size={18} className={isActive ? "text-[#f3b092]" : "text-white/80"} />
                        <span className="truncate whitespace-nowrap leading-normal">{item.title}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Live Quota Bar & Footer */}
      <div className="relative border-t border-white/10 px-4 py-3.5 backdrop-blur-md space-y-2.5">
        {/* Storage Meter */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-white/80">
            <span className="flex items-center gap-1"><HardDrive size={11} /> Storage</span>
            <span>{usedStorage} / {maxStorage}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#c96f4a] h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(5, ((usage?.usedStorageGB || 0) / (limits?.["storage.gb"] || 10)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-xs font-black text-white shadow-inner ring-1 ring-white/30 shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">{userName}</p>
              <p className="truncate text-[10px] text-white/70">Verified Admin</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg bg-white/10 text-[#f3b092] hover:bg-[#c96f4a]/20 hover:text-[#ffd6c4] transition"
          >
            <LogOut size={15} />
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
