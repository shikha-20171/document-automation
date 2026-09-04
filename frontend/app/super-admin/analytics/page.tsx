"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { BarChart3, TrendingUp, Cpu, ScanText, FileSpreadsheet, Download, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import superAdminAnalyticsApi, { type PlatformAnalyticsData, type OrgUsageAnalytics } from "@/services/superAdminAnalyticsApi";

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "platform";
  const [activeTab, setActiveTab] = useState(tabParam);
  const [loading, setLoading] = useState(true);

  const [platformData, setPlatformData] = useState<PlatformAnalyticsData | null>(null);
  const [orgUsage, setOrgUsage] = useState<OrgUsageAnalytics[]>([]);
  const [aiData, setAiData] = useState<any>(null);
  const [ocrData, setOcrData] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "platform") {
        const res = await superAdminAnalyticsApi.getPlatformAnalytics();
        if (res.data) setPlatformData(res.data);
      } else if (activeTab === "orgs") {
        const res = await superAdminAnalyticsApi.getOrganisationAnalytics();
        if (res.data) setOrgUsage(res.data);
      } else if (activeTab === "ai") {
        const res = await superAdminAnalyticsApi.getAiAnalytics();
        if (res.data) setAiData(res.data);
      } else if (activeTab === "ocr") {
        const res = await superAdminAnalyticsApi.getOcrAnalytics();
        if (res.data) setOcrData(res.data);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const tabs = [
    { id: "platform", label: "Platform Analytics", icon: BarChart3 },
    { id: "orgs", label: "Organisation Analytics", icon: TrendingUp },
    { id: "ai", label: "AI Analytics", icon: Cpu },
    { id: "ocr", label: "OCR Analytics", icon: ScanText },
  ];

  return (
    <div className="p-6 space-y-6 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#11192e] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#274690] text-white text-[11px] font-extrabold px-2.5 py-0.5">
              Super Admin Intelligence
            </Badge>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              ● Live DB Aggregations
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Analytics & Telemetry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-tenant document volume, AI model token metrics, OCR throughput, and tenant usage metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="text-xs font-bold gap-1.5 h-9 rounded-xl"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-bold">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-bold ${
                isActive
                  ? "bg-[#274690] text-white shadow-md"
                  : "bg-white dark:bg-[#11192e] text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "platform" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Organisations</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {platformData?.summary.totalOrganisations || 0}
              </p>
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                {platformData?.summary.activeOrganisations || 0} Active
              </p>
            </Card>

            <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Platform Users</span>
              <p className="text-2xl font-black text-[#274690] dark:text-blue-400 mt-1">
                {platformData?.summary.totalUsers || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Across all 5 roles</p>
            </Card>

            <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Documents Processed</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {(platformData?.summary.totalDocuments || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Enterprise pipeline</p>
            </Card>

            <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">AI Operations</span>
              <p className="text-2xl font-black text-[#c96f4a] mt-1">
                {(platformData?.summary.totalAiOperations || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Inference executions</p>
            </Card>
          </div>

          {/* Recent Organisations Table */}
          <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Top Active Tenant Workspaces</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                  <tr>
                    <th className="py-2">ORGANISATION</th>
                    <th className="py-2">PLAN</th>
                    <th className="py-2">USERS</th>
                    <th className="py-2">DOCUMENTS</th>
                    <th className="py-2">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {platformData?.recentOrganisations?.map((org) => (
                    <tr key={org.id} className="py-2">
                      <td className="py-2.5 font-bold">{org.name}</td>
                      <td className="py-2.5"><Badge variant="outline" className="text-[10px] font-bold">{org.plan}</Badge></td>
                      <td className="py-2.5 font-semibold">{org.usersCount} users</td>
                      <td className="py-2.5 font-semibold text-[#274690] dark:text-blue-400">{org.documentsCount} docs</td>
                      <td className="py-2.5"><Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold">{org.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "orgs" && (
        <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Tenant Usage & Quotas Consumption</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3">TENANT</th>
                  <th className="py-3">PLAN</th>
                  <th className="py-3">STORAGE USED</th>
                  <th className="py-3">AI TOKENS</th>
                  <th className="py-3">OCR PAGES</th>
                  <th className="py-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orgUsage.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 font-bold">{o.name}</td>
                    <td className="py-3"><Badge variant="outline" className="text-[10px] font-bold">{o.plan}</Badge></td>
                    <td className="py-3 font-mono">{o.storageUsedMb} MB</td>
                    <td className="py-3 font-mono text-[#274690] dark:text-blue-400">{o.aiTokensUsed.toLocaleString()}</td>
                    <td className="py-3 font-mono text-emerald-600">{o.ocrPagesProcessed.toLocaleString()}</td>
                    <td className="py-3"><Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold">{o.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "ai" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiData?.providerMetrics?.map((pm: any) => (
            <Card key={pm.providerName} className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{pm.providerCode.toUpperCase()}</span>
                <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold">{pm.status}</Badge>
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100">{pm.providerName}</h4>
              <div className="pt-2 text-xs space-y-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between"><span>Tokens Processed:</span><span className="font-bold">{pm.totalTokens.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Avg Latency:</span><span className="font-bold text-emerald-600">{pm.avgLatencyMs}ms</span></div>
                <div className="flex justify-between"><span>Estimated Cost:</span><span className="font-bold text-[#c96f4a]">${pm.estimatedCostUsd}</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "ocr" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ocrData?.engines?.map((eng: any) => (
            <Card key={eng.name} className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{eng.code}</span>
                <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold">OPERATIONAL</Badge>
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100">{eng.name}</h4>
              <div className="pt-2 text-xs space-y-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between"><span>Pages Processed:</span><span className="font-bold">{eng.pages.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Accuracy:</span><span className="font-bold text-emerald-600">{eng.successRate}%</span></div>
                <div className="flex justify-between"><span>OCR Latency:</span><span className="font-bold">{eng.avgLatencyMs}ms</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading Analytics...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
