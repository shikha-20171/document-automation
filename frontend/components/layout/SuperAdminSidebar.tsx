"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Bot,
  ScanText,
  HardDrive,
  Plug,
  LifeBuoy,
  Bell,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  Settings,
  UserCircle,
  Sparkles,
  LogOut,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

export interface MenuItem {
  title: string;
  href: string;
  icon: any;
  hasSubmodules?: boolean;
}

export interface MenuSection {
  sectionTitle?: string;
  items: MenuItem[];
}

export const superAdminNavSections: MenuSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: "/super-admin/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Organisations",
        href: "/super-admin/organisations",
        icon: Building2,
      },
      {
        title: "Subscriptions",
        href: "/super-admin/subscriptions",
        icon: CreditCard,
      },
    ],
  },
  {
    sectionTitle: "ENGINES & ECOSYSTEM",
    items: [
      {
        title: "AI Automation",
        href: "/super-admin/ai-automation",
        icon: Bot,
        hasSubmodules: true,
      },
      {
        title: "OCR Management",
        href: "/super-admin/ocr-management",
        icon: ScanText,
        hasSubmodules: true,
      },
      {
        title: "Storage Management",
        href: "/super-admin/storage",
        icon: HardDrive,
        hasSubmodules: true,
      },
      {
        title: "Integrations",
        href: "/super-admin/platform-integrations",
        icon: Plug,
        hasSubmodules: true,
      },
    ],
  },
  {
    sectionTitle: "OPERATIONS & GOVERNANCE",
    items: [
      {
        title: "Support",
        href: "/super-admin/support",
        icon: LifeBuoy,
      },
      {
        title: "Notifications",
        href: "/super-admin/notifications",
        icon: Bell,
      },
      {
        title: "Analytics & Reports",
        href: "/super-admin/analytics",
        icon: BarChart3,
      },
      {
        title: "Security & Compliance",
        href: "/super-admin/security",
        icon: ShieldAlert,
      },
      {
        title: "Audit & Security",
        href: "/super-admin/audit-logs",
        icon: ShieldCheck,
      },
      {
        title: "Platform Settings",
        href: "/super-admin/settings",
        icon: Settings,
      },
      {
        title: "Profile",
        href: "/super-admin/profile",
        icon: UserCircle,
      },
    ],
  },
];

interface SuperAdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function SuperAdminSidebar({ mobileOpen = false, onClose }: SuperAdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState("DocuCore AI");
  const [searchQuery, setSearchQuery] = useState("");

  const loadProfileBranding = () => {
    try {
      const stored = localStorage.getItem("superAdminProfile");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.companyName) setCompanyName(parsed.companyName);
      }
    } catch {}
  };

  useEffect(() => {
    loadProfileBranding();
    window.addEventListener("superAdminProfileUpdated", loadProfileBranding);
    return () => window.removeEventListener("superAdminProfileUpdated", loadProfileBranding);
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return superAdminNavSections;
    const q = searchQuery.toLowerCase();
    return superAdminNavSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((i) => i.title.toLowerCase().includes(q)),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [searchQuery]);

  const sidebarContent = (
    <aside className="relative isolate flex h-full w-72 sm:w-80 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(160deg,#0d1527_0%,#182747_45%,#274690_100%)] text-white shadow-2xl font-sans">
      <div className="pointer-events-none absolute left-[-20%] top-[-10%] h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute right-[-20%] bottom-[-10%] h-64 w-64 rounded-full bg-[#c96f4a]/25 blur-2xl" />

      {/* Header / Command Identity */}
      <div className="relative border-b border-white/10 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-lg font-black text-white shadow-inner ring-1 ring-white/40 shrink-0">
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[16px] sm:text-[18px] font-black text-white tracking-normal" title={companyName}>
                {companyName}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-bold text-[#f3b092] uppercase tracking-wide mt-0.5">
                <Sparkles size={13} className="text-[#f3b092] shrink-0" />
                <span className="truncate">Super Admin</span>
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
      </div>

      {/* Quick Filter Search */}
      <div className="px-3.5 pt-2.5 pb-1 shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-2.5 text-white/50" />
          <input
            type="text"
            placeholder="Search navigation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-white/10 pl-8 pr-3 py-1.5 text-xs font-medium text-white placeholder-white/50 border border-white/10 focus:outline-hidden focus:ring-1 focus:ring-[#f3b092]"
          />
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-2.5 overflow-y-auto px-3 sm:px-4 py-2.5 scrollbar-none">
        {filteredSections.map((section, idx) => (
          <div key={section.sectionTitle || idx} className="space-y-0.5">
            {section.sectionTitle && (
              <div className="px-3 pb-1 pt-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#f3b092]">
                {section.sectionTitle}
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (pathname?.startsWith(`${item.href}/`) && item.href !== "/super-admin");

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  prefetch={true}
                  onClick={() => onClose && onClose()}
                  className="block"
                >
                  <div
                    className={`relative flex items-center justify-between rounded-xl px-3.5 py-2 text-[14px] sm:text-[15px] transition-all duration-150 ${
                      isActive
                        ? "bg-white/20 text-white font-bold shadow-md"
                        : "text-white/90 hover:bg-white/10 hover:text-white font-semibold"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1.5 rounded-r-full bg-[#c96f4a]" />
                    )}

                    <div className="flex min-w-0 items-center gap-3 pr-2">
                      <Icon
                        size={18}
                        className={isActive ? "text-[#f3b092] shrink-0" : "text-white/80 shrink-0"}
                      />
                      <span className="truncate whitespace-nowrap leading-normal" title={item.title}>
                        {item.title}
                      </span>
                    </div>

                    {isActive ? (
                      <ChevronRight size={15} className="text-[#f3b092] shrink-0" />
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Sign Out */}
      <div className="relative space-y-2 border-t border-white/10 px-4 py-3 backdrop-blur-md shrink-0">
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("currentUser");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/auth/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-[13px] font-bold text-rose-200 transition hover:bg-rose-500/20 hover:text-white"
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