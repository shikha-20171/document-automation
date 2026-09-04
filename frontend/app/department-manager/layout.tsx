"use client";

import { useState } from "react";
import { DepartmentManagerHeader, DepartmentManagerSidebar } from "@/components/layout";

export default function DepartmentManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(39,70,144,0.06),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(39,70,144,0.18),transparent_35%),linear-gradient(180deg,#0b1020_0%,#0e1526_100%)]"
      style={{ ["--dept-brand" as string]: "#274690" }}
    >
      <DepartmentManagerSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <DepartmentManagerHeader onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-7 scrollbar-none">{children}</main>
      </div>
    </div>
  );
}