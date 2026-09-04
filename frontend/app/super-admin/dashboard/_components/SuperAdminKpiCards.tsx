"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Users,
  Bot,
  FileText,
  HardDrive,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
type Organisation = { status: string };

interface SuperAdminKpiCardsProps {
  organisations?: Organisation[];
}

interface KpiMetric {
  id: string;
  label: string;
  value: string;
  tag: string;
  isPositive: boolean;
  subText: string;
  route: string;
  icon: any;
}

export function SuperAdminKpiCards({ organisations = [] }: SuperAdminKpiCardsProps) {
  const router = useRouter();

  const totalOrgsCount = organisations.length > 0 ? organisations.length : 9;
  const activeOrgsCount = organisations.length > 0 ? organisations.filter((o) => o.status === "active").length : 9;

  const kpiMetrics: KpiMetric[] = useMemo(
    () => [
      {
        id: "orgs",
        label: "Total Organizations",
        value: `${totalOrgsCount}`,
        tag: "+2 this mo",
        isPositive: true,
        subText: "Unique customer tenants",
        route: "/super-admin/organisations",
        icon: Building2,
      },
      {
        id: "active-orgs",
        label: "Active Tenants",
        value: `${activeOrgsCount}/${totalOrgsCount}`,
        tag: "100% Active",
        isPositive: true,
        subText: "All tenants active & healthy",
        route: "/super-admin/organisations",
        icon: CheckCircle2,
      },
      {
        id: "active-subs",
        label: "Active Subscriptions",
        value: "9 Plans",
        tag: "100% Paid",
        isPositive: true,
        subText: "Enterprise & Business tiers",
        route: "/super-admin/subscriptions",
        icon: ShieldCheck,
      },
      {
        id: "users",
        label: "Platform Users",
        value: "18,450",
        tag: "+18.2% mo",
        isPositive: true,
        subText: "Across all organizations",
        route: "/super-admin/organisations",
        icon: Users,
      },
      {
        id: "ai-requests",
        label: "AI Requests Today",
        value: "28,450",
        tag: "99.4% Success",
        isPositive: true,
        subText: "Platform AI inference jobs",
        route: "/super-admin/ai-automation",
        icon: Bot,
      },
      {
        id: "docs-processed",
        label: "Documents Processed",
        value: "142,500",
        tag: "+18.4% mo",
        isPositive: true,
        subText: "Extracted & archived docs",
        route: "/super-admin/documents",
        icon: FileText,
      },
      {
        id: "storage",
        label: "Storage Used",
        value: "18.4 TB",
        tag: "36.8% Pool",
        isPositive: true,
        subText: "Free: 31.6 TB S3 storage",
        route: "/super-admin/storage",
        icon: HardDrive,
      },
      {
        id: "revenue",
        label: "Monthly Revenue",
        value: "₹12,45,000",
        tag: "+15.2% vs last mo",
        isPositive: true,
        subText: "MRR from 9 subscriptions",
        route: "/super-admin/billing",
        icon: DollarSign,
      },
    ],
    [totalOrgsCount, activeOrgsCount]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-sans">
      {kpiMetrics.map((kpi) => {
        const Icon = kpi.icon;

        return (
          <Card
            key={kpi.id}
            onClick={() => router.push(kpi.route)}
            className="group bg-white dark:bg-[#131c36] border border-slate-200/90 dark:border-slate-700/60 hover:border-[#274690]/60 hover:shadow-md transition-all duration-200 rounded-2xl cursor-pointer min-w-0"
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate min-w-0">
                  {kpi.label}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#274690] dark:group-hover:text-[#8fb1ec] transition-colors" />
                  <div className="p-1.5 rounded-xl bg-[#274690]/10 text-[#274690] dark:bg-[#274690]/25 dark:text-[#8fb1ec] group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2 min-w-0 pt-0.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate">
                  {kpi.value}
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#274690]/10 text-[#274690] dark:bg-[#274690]/25 dark:text-[#8fb1ec] px-2 py-0.5 rounded-full shrink-0">
                  {kpi.isPositive ? (
                    <TrendingUp className="w-3 h-3 shrink-0 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 shrink-0 text-rose-600" />
                  )}
                  {kpi.tag}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate pt-0.5">
                {kpi.subText}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
