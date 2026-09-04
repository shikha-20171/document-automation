"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardDrive } from "lucide-react";

const tabs = [
  { label: "Overview", href: "/super-admin/storage" },
  { label: "Organizations", href: "/super-admin/storage/organizations" },
  { label: "Settings", href: "/super-admin/storage/settings" },
];

export default function StorageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(39,70,144,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(47,122,154,0.12),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#274690]/15 bg-white px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690]">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Storage Management</p>
            <p className="text-xs text-slate-500">Monitor, control, protect, optimize</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active =
              tab.href === "/super-admin/storage"
                ? pathname === tab.href
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                prefetch={true}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-[#274690] bg-[#274690] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#274690]/40"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
