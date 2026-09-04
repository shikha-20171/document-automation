"use client";

import { useState } from "react";
import { EmployeeHeader, EmployeeSidebar } from "@/components/layout";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(39,70,144,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(201,111,74,0.06),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(39,70,144,0.18),transparent_35%),linear-gradient(180deg,#0b1020_0%,#0e1526_100%)]">
      <EmployeeSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <EmployeeHeader onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-7 scrollbar-none">
          {children}
        </main>
      </div>
    </div>
  );
}
