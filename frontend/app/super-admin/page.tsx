"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/super-admin/dashboard");
  }, [router]);

  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#274690] border-t-transparent" />
        <p className="text-xs font-bold text-slate-500">Loading Super Admin Workspace...</p>
      </div>
    </div>
  );
}
