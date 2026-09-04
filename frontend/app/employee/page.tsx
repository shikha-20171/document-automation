"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/employee/dashboard");
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur-md">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#274690] border-t-transparent" />
        <span className="text-sm font-bold text-slate-700">Loading Employee Workspace...</span>
      </div>
    </div>
  );
}
