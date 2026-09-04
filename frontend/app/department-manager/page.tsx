"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DepartmentManagerIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/department-manager/dashboard");
  }, [router]);

  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#274690] border-t-transparent" />
        <p className="text-xs font-bold text-slate-500">Loading Department Manager Workspace...</p>
      </div>
    </div>
  );
}
