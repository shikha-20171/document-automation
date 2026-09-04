"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Building2,
  ChevronDown,
  User,
  Shield,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Bot,
  LifeBuoy,
  X,
  ExternalLink,
  Laptop,
  Menu,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "./ThemeToggle";
import axios from "@/lib/axios";

interface SuperAdminHeaderProps {
  onMenuClick?: () => void;
}

export default function SuperAdminHeader({ onMenuClick }: SuperAdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live search handler
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const query = searchTerm.toLowerCase();
        // Combined search across organizations, audit, tickets
        const [orgsRes, auditRes] = await Promise.all([
          axios.get("/super-admin/organisations").catch(() => ({ data: { data: [] } })),
          axios.get("/super-admin/audit-logs").catch(() => ({ data: { data: [] } })),
        ]);

        const orgs = (orgsRes.data.data || []).filter((o: any) =>
          o.name?.toLowerCase().includes(query) || o.email?.toLowerCase().includes(query)
        ).map((o: any) => ({
          type: "Organization",
          title: o.name,
          subtitle: `Plan: ${o.plan || "Enterprise"} • ${o.email}`,
          link: "/super-admin/organisations",
          icon: Building2,
        }));

        const audits = (auditRes.data.data || []).filter((a: any) =>
          a.action?.toLowerCase().includes(query) || a.actorName?.toLowerCase().includes(query) || a.resourceName?.toLowerCase().includes(query)
        ).slice(0, 5).map((a: any) => ({
          type: "Audit Log",
          title: a.action,
          subtitle: `${a.actorName || "System"} • ${a.resourceName || "Resource"}`,
          link: "/super-admin/audit-logs",
          icon: Shield,
        }));

        setSearchResults([...orgs, ...audits]);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getPageTitle = () => {
    if (pathname.includes("/dashboard")) return "Executive Platform Overview";
    if (pathname.includes("/organisations")) return "Tenant Organizations Management";
    if (pathname.includes("/ai-automation") || pathname.includes("/ai-management")) return "AI Automation Engine";
    if (pathname.includes("/ocr-management") || pathname.includes("/ocr-processing")) return "OCR Management & Processing Pipeline";
    if (pathname.includes("/storage")) return "Storage Infrastructure & Quotas";
    if (pathname.includes("/support")) return "Customer Support & Service Desk";
    if (pathname.includes("/audit-logs") || pathname.includes("/security")) return "Audit & Security Governance";
    if (pathname.includes("/settings") || pathname.includes("/billing") || pathname.includes("/subscriptions") || pathname.includes("/platform-integrations")) return "Platform Global Settings";
    if (pathname.includes("/profile")) return "Super Admin Profile";
    return "Super Admin Command Suite";
  };

  const notifications = [
    { id: 1, title: "Storage Quota Warning", desc: "Organization Reliance Tech reached 84% quota", time: "10m ago", unread: true, type: "warning" },
    { id: 2, title: "AI Model Latency Spike", desc: "Anthropic Claude 3.5 latency avg 1,420ms", time: "35m ago", unread: true, type: "alert" },
    { id: 3, title: "Database Backup Completed", desc: "Automated snapshot verified in ap-south-1", time: "2h ago", unread: false, type: "success" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2.5 border-b border-slate-200/80 bg-white/90 dark:bg-slate-900/90 dark:border-slate-800 px-3 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 lg:flex-none">
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
            <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
              {getPageTitle()}
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Platform oversight and cross-tenant enterprise governance</p>
          </div>
        </div>

        {/* Global Search trigger bar */}
        <div className="mx-2 hidden max-w-md flex-1 items-center xl:flex">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="group relative flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400 transition hover:border-[#274690]/40 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-800/80"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400 group-hover:text-[#274690]" />
              <span>Search organizations, users, audit events, tickets...</span>
            </div>
            <kbd className="inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-bold text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative h-9 w-9 p-0 rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:text-[#274690] dark:hover:text-blue-400"
              title="Platform Alerts & Notifications"
            >
              <Bell size={16} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#c96f4a] ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            </Button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-[#274690]" />
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">Platform Notifications</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-[#c96f4a]/30 text-[#c96f4a] bg-[#c96f4a]/10">
                    2 New
                  </Badge>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 my-1 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-2.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{n.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      router.push("/super-admin/audit-logs");
                    }}
                    className="text-xs font-bold text-[#274690] hover:text-[#c96f4a] transition"
                  >
                    View All Security & Audit Events →
                  </button>
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />

          <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

          {/* Profile User Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 text-left text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/60 sm:gap-2.5 sm:pr-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#274690] to-[#1f3561] font-black text-white text-xs shadow-xs">
                SA
              </div>
              <div className="hidden lg:block leading-tight">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">Super Admin</p>
                <p className="text-[10px] font-bold text-[#c96f4a]">Platform Owner</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden lg:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95">
                <div className="border-b border-slate-100 dark:border-slate-800 p-2">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100">Platform Super Administrator</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">superadmin@docucore.ai</p>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push("/super-admin/profile");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <User size={14} className="text-[#274690]" />
                    <span>My Profile & MFA</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push("/super-admin/settings");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Shield size={14} className="text-[#c96f4a]" />
                    <span>Platform Settings</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                  <button
                    onClick={() => {
                      localStorage.clear();
                      router.push("/auth/login");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-20 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
            <div className="relative flex items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search organizations, audit logs, AI models, tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 max-h-80 overflow-y-auto">
              {isSearching ? (
                <p className="p-4 text-center text-xs text-slate-400">Searching platform database...</p>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setIsSearchOpen(false);
                          router.push(item.link);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#274690]/10 text-[#274690] dark:bg-blue-500/20 dark:text-blue-400">
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {item.type}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : searchTerm ? (
                <p className="p-6 text-center text-xs text-slate-400">No matching records found.</p>
              ) : (
                <div className="p-4 text-xs text-slate-400 space-y-2">
                  <p className="font-bold text-slate-600 dark:text-slate-300">Quick Navigation:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setIsSearchOpen(false); router.push("/super-admin/organisations"); }}
                      className="text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-[#274690]"
                    >
                      🏢 Organizations List
                    </button>
                    <button
                      onClick={() => { setIsSearchOpen(false); router.push("/super-admin/ai-automation"); }}
                      className="text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-[#274690]"
                    >
                      🤖 AI Providers & Models
                    </button>
                    <button
                      onClick={() => { setIsSearchOpen(false); router.push("/super-admin/storage"); }}
                      className="text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-[#274690]"
                    >
                      💾 Storage Quotas
                    </button>
                    <button
                      onClick={() => { setIsSearchOpen(false); router.push("/super-admin/audit-logs"); }}
                      className="text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:text-[#274690]"
                    >
                      🛡️ Audit & Security
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

