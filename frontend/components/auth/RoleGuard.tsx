"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, isRoleAllowed, getRoleDashboard } from "@/lib/roleGuard";
import { RefreshCw, ShieldAlert } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    const user = getCurrentUser();

    if (!token || !user) {
      setAuthorized(false);
      router.replace("/auth/login");
      return;
    }

    if (isRoleAllowed(user.role, allowedRoles)) {
      setAuthorized(true);
    } else {
      // User is logged in but doesn't have permission for this module
      setAuthorized(false);
      const redirectUrl = getRoleDashboard(user.role);
      router.replace(redirectUrl);
    }
  }, [allowedRoles, router]);

  if (authorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#274690]" />
          <p className="text-xs font-semibold text-slate-400">Verifying role permissions...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white p-4">
        <div className="max-w-md rounded-2xl bg-slate-800 border border-rose-500/30 p-6 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Access Restricted</h2>
          <p className="text-xs text-slate-300">
            You do not have permission to view this section. Redirecting to your assigned workspace...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
