"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  FileText,
  Bot,
  HardDrive,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Server,
  Zap,
  Database,
  Cloud,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  X,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/axios";

interface HealthServiceItem {
  id: string;
  name: string;
  status: "Healthy" | "Warning" | "Critical" | "Not Configured";
  latencyMs?: number;
  provider?: string;
  lastChecked?: string;
}

interface PlatformHealthData {
  overall: string;
  overallSeverity: "HEALTHY" | "WARNING" | "CRITICAL";
  timestamp: string;
  uptimeSeconds: number;
  services: HealthServiceItem[];
}

export default function SuperAdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshingHealth, setRefreshingHealth] = useState(false);
  const [selectedService, setSelectedService] = useState<HealthServiceItem | null>(null);

  // Platform Overview Metrics
  const [metrics, setMetrics] = useState({
    totalOrgs: 0,
    activeOrgs: 0,
    totalUsers: 0,
    totalDocs: 0,
    aiRequests: 0,
    ocrUsage: 0,
    storageUsedGB: 0,
  });

  // Real-time Platform Health State
  const [healthData, setHealthData] = useState<PlatformHealthData>({
    overall: "All Systems Operational",
    overallSeverity: "HEALTHY",
    timestamp: new Date().toISOString(),
    uptimeSeconds: 0,
    services: [
      { id: "api", name: "API Runtime", status: "Healthy", latencyMs: 14, provider: "Express 4 Engine", lastChecked: new Date().toISOString() },
      { id: "db", name: "PostgreSQL Database", status: "Healthy", latencyMs: 12, provider: "PostgreSQL Connection Pool", lastChecked: new Date().toISOString() },
      { id: "redis", name: "Redis Cache", status: "Healthy", latencyMs: 4, provider: "In-Memory Store", lastChecked: new Date().toISOString() },
      { id: "s3", name: "AWS S3 Storage", status: "Healthy", latencyMs: 32, provider: "AWS S3 Multi-Tenant Vault", lastChecked: new Date().toISOString() },
      { id: "ai", name: "AI Gateway", status: "Healthy", latencyMs: 45, provider: "Google Gemini (gemini-2.5-flash)", lastChecked: new Date().toISOString() },
      { id: "ocr", name: "OCR Service", status: "Healthy", latencyMs: 28, provider: "Tesseract Engine", lastChecked: new Date().toISOString() },
    ],
  });

  const [growthData, setGrowthData] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  const loadPlatformHealth = async () => {
    try {
      setRefreshingHealth(true);
      const res = await apiClient.get("/super-admin/dashboard/platform-health");
      if (res.data?.data) {
        setHealthData(res.data.data);
      }
    } catch {
      // Handled silently
    } finally {
      setRefreshingHealth(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, healthRes, growthRes, auditRes] = await Promise.allSettled([
        apiClient.get("/super-admin/dashboard/stats"),
        apiClient.get("/super-admin/dashboard/platform-health"),
        apiClient.get("/super-admin/dashboard/growth"),
        apiClient.get("/super-admin/audit-logs?limit=5"),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.data?.data) {
        const d = statsRes.value.data.data;
        setMetrics({
          totalOrgs: d.totalOrganisations || 0,
          activeOrgs: d.activeOrganisations || 0,
          totalUsers: d.totalUsers || 0,
          totalDocs: d.totalDocuments || 0,
          aiRequests: d.aiLogsCount || 0,
          ocrUsage: d.ocrCount || 0,
          storageUsedGB: d.totalUsedStorageGB || 0,
        });
      }

      if (healthRes.status === "fulfilled" && healthRes.value.data?.data) {
        setHealthData(healthRes.value.data.data);
      }

      if (growthRes.status === "fulfilled" && growthRes.value.data?.data) {
        const gd = growthRes.value.data.data;
        if (Array.isArray(gd.organisationGrowth)) {
          setGrowthData(
            gd.organisationGrowth.map((og: any, idx: number) => ({
              month: og.month,
              orgs: og.count,
              docs: gd.documentProcessingTrend?.[idx]?.count || 0,
            }))
          );
        }
      }

      if (auditRes.status === "fulfilled" && auditRes.value.data?.data) {
        setRecentEvents(auditRes.value.data.data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getStatusDot = (status: string) => {
    switch (status) {
      case "Healthy":
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shrink-0 animate-pulse" />;
      case "Warning":
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 shrink-0" />;
      case "Critical":
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 mr-2 shrink-0 animate-bounce" />;
      case "Not Configured":
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400 mr-2 shrink-0" />;
      default:
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shrink-0" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Healthy":
        return (
          <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-[11px] font-bold">
            ● Healthy
          </Badge>
        );
      case "Warning":
        return (
          <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 text-[11px] font-bold">
            ⚠ Warning
          </Badge>
        );
      case "Critical":
        return (
          <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 text-[11px] font-bold">
            🔴 Critical
          </Badge>
        );
      case "Not Configured":
        return (
          <Badge variant="outline" className="text-slate-500 border-slate-300 text-[11px] font-bold">
            ○ Not Configured
          </Badge>
        );
      default:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold">
            ● Healthy
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 dark:text-slate-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-[#1f3561] via-[#274690] to-[#c96f4a] p-6 text-white shadow-xl dark:border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-orange-200 backdrop-blur-md">
              <Sparkles size={13} className="text-[#c96f4a]" />
              <span>DocuCore AI Platform Control Suite</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Super Admin Executive Overview
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-200 max-w-2xl font-medium">
              Multi-tenant governance, real-time platform health, AI/OCR pipelines, and enterprise storage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Top Platform Status Summary Banner */}
            <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-2.5">
              <div className="text-right">
                <span className="text-[10px] font-bold text-white/70 block uppercase tracking-wider">Platform Status</span>
                <span className="text-xs font-black text-white flex items-center justify-end gap-1.5">
                  {healthData.overallSeverity === "HEALTHY" && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  {healthData.overallSeverity === "WARNING" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                  {healthData.overallSeverity === "CRITICAL" && <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />}
                  {healthData.overall}
                </span>
              </div>
            </div>

            <Link href="/super-admin/organisations">
              <Button className="rounded-xl bg-white text-[#274690] hover:bg-slate-100 font-bold shadow-md text-xs h-10">
                <Building2 size={15} className="mr-1.5" />
                Manage Organisations
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 6 Primary KPI Cards (Platform Overview) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 tracking-wider">ORGANISATIONS</span>
            <Building2 size={16} className="text-[#274690]" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5">
            {metrics.totalOrgs}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{metrics.activeOrgs} Active Tenants</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 tracking-wider">ACTIVE USERS</span>
            <Users size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5">
            {metrics.totalUsers}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Platform Members</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 tracking-wider">DOCUMENTS</span>
            <FileText size={16} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5">
            {metrics.totalDocs}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Stored & Indexed</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 tracking-wider">AI USAGE</span>
            <Bot size={16} className="text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5">
            {metrics.aiRequests.toLocaleString()}
          </p>
          <p className="text-[10px] text-purple-600 font-bold mt-0.5">Inference Requests</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 tracking-wider">OCR USAGE</span>
            <Sparkles size={16} className="text-[#c96f4a]" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5">
            {metrics.ocrUsage.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#c96f4a] font-bold mt-0.5">Pages Processed</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 tracking-wider">STORAGE USAGE</span>
            <HardDrive size={16} className="text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5">
            {metrics.storageUsedGB} <span className="text-xs font-semibold text-slate-400">GB</span>
          </p>
          <p className="text-[10px] text-blue-600 font-bold mt-0.5">AWS S3 Multi-Tenant</p>
        </Card>
      </div>

      {/* COMPACT REAL-TIME PLATFORM HEALTH SECTION */}
      <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#274690] dark:text-blue-400" />
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Platform Health</h2>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 text-[10px] font-bold">
                {healthData.overall}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Real-time operational status of backend services, PostgreSQL pool, Redis cache, AWS S3 storage vault, AI gateway, and OCR vision engines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={refreshingHealth}
              onClick={loadPlatformHealth}
              className="h-8 px-3 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700"
            >
              <RefreshCw size={13} className={`mr-1.5 ${refreshingHealth ? "animate-spin text-[#274690]" : ""}`} />
              Refresh Health
            </Button>
          </div>
        </div>

        {/* Compact 6-Service Health Grid */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {healthData.services.map((svc) => (
            <div
              key={svc.id}
              onClick={() => setSelectedService(svc)}
              className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-[#274690]/40 dark:hover:border-blue-500/40 cursor-pointer transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate pr-1">
                  {svc.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{svc.latencyMs}ms</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                {getStatusBadge(svc.status)}
                <span className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  <Eye size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Growth Trend & Recent Important Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trends Chart */}
        <Card className="lg:col-span-2 rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Platform Growth & Activity</h3>
              <p className="text-[11px] text-slate-500">Monthly active organizations and document throughput</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold">Live Telemetry</Badge>
          </div>

          <div className="h-64 w-full">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#274690" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#274690" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c96f4a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#c96f4a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="orgs" name="Organisations" stroke="#274690" fill="url(#orgGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="docs" name="Documents" stroke="#c96f4a" fill="url(#docGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading live activity timeline...
              </div>
            )}
          </div>
        </Card>

        {/* Recent Important Activity / Audit Feed */}
        <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Recent Platform Activity</h3>
                <p className="text-[11px] text-slate-500">Live security & administrative events</p>
              </div>
              <Link href="/super-admin/audit-logs">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-[#274690] dark:text-blue-400">
                  View All →
                </Button>
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-[#274690] dark:text-blue-400">
                      {evt.action}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
                    {evt.actorName} • {evt.organisationName || "Platform System"}
                  </p>
                </div>
              ))}

              {recentEvents.length === 0 && (
                <p className="text-xs text-slate-400 py-8 text-center">No recent activity events recorded.</p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-right">
            <span className="text-[10px] text-slate-400 font-semibold">Immutable Append-Only Audit Stream</span>
          </div>
        </Card>
      </div>

      {/* QUICK STATUS DETAILS POPUP MODAL */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{selectedService.name}</h3>
                {getStatusBadge(selectedService.status)}
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <span className="font-semibold text-slate-500">Service Status</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedService.status}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <span className="font-semibold text-slate-500">Response Latency</span>
                <span className="font-mono font-bold text-emerald-600">{selectedService.latencyMs} ms</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <span className="font-semibold text-slate-500">Configured Provider</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedService.provider || "Platform Default"}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <span className="font-semibold text-slate-500">Last Checked</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  {new Date(selectedService.lastChecked || new Date()).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedService(null)}
                className="rounded-xl text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
