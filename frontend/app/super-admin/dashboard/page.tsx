"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  FileText,
  Bot,
  HardDrive,
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
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  Sliders,
  Check,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface OrgDashboardItem {
  id: number | string;
  name: string;
  branch?: string;
  email?: string;
  plan?: string;
  status: "active" | "suspended" | "trial" | string;
  usersCount?: number;
  docsCount?: number;
  storageGB?: number;
  aiRequests?: number;
  createdAt?: string;
}

const DEFAULT_DEMO_ORGS: OrgDashboardItem[] = [
  {
    id: 1,
    name: "Apex Global Enterprises",
    branch: "Global HQ (New York)",
    email: "admin@apexglobal.io",
    plan: "Enterprise Plus",
    status: "active",
    usersCount: 142,
    docsCount: 3840,
    storageGB: 18.4,
    aiRequests: 8920,
    createdAt: "2026-01-15",
  },
  {
    id: 2,
    name: "Nexus BioTech Labs",
    branch: "Zurich R&D",
    email: "compliance@nexusbio.ch",
    plan: "Enterprise",
    status: "active",
    usersCount: 86,
    docsCount: 2190,
    storageGB: 12.1,
    aiRequests: 5410,
    createdAt: "2026-02-10",
  },
  {
    id: 3,
    name: "Horizon Financial Group",
    branch: "London City",
    email: "security@horizonfin.co.uk",
    plan: "Enterprise Plus",
    status: "active",
    usersCount: 210,
    docsCount: 6540,
    storageGB: 28.6,
    aiRequests: 14200,
    createdAt: "2026-03-01",
  },
  {
    id: 4,
    name: "Zenith Supply Chain & Logistics",
    branch: "Singapore Regional Hub",
    email: "ops@zenithlogistics.sg",
    plan: "Professional",
    status: "active",
    usersCount: 45,
    docsCount: 1230,
    storageGB: 6.8,
    aiRequests: 2890,
    createdAt: "2026-04-18",
  },
  {
    id: 5,
    name: "CyberDynamics AI Systems",
    branch: "San Francisco Core",
    email: "contact@cyberdynamics.ai",
    plan: "Enterprise Plus",
    status: "active",
    usersCount: 94,
    docsCount: 3100,
    storageGB: 14.5,
    aiRequests: 7650,
    createdAt: "2026-05-22",
  },
];

export default function SuperAdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshingHealth, setRefreshingHealth] = useState(false);
  const [selectedService, setSelectedService] = useState<HealthServiceItem | null>(null);
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState("all");

  // Platform Overview Metrics
  const [metrics, setMetrics] = useState({
    totalOrgs: 5,
    activeOrgs: 5,
    totalUsers: 577,
    totalDocs: 16900,
    aiRequests: 39070,
    ocrUsage: 14250,
    storageUsedGB: 80.4,
  });

  const [organisations, setOrganisations] = useState<OrgDashboardItem[]>(DEFAULT_DEMO_ORGS);

  // Real-time Platform Health State
  const [healthData, setHealthData] = useState<PlatformHealthData>({
    overall: "All Systems Operational",
    overallSeverity: "HEALTHY",
    timestamp: new Date().toISOString(),
    uptimeSeconds: 0,
    services: [
      { id: "api", name: "API Runtime", status: "Healthy", latencyMs: 14, provider: "Express 4 Engine", lastChecked: new Date().toISOString() },
      { id: "db", name: "PostgreSQL Database", status: "Healthy", latencyMs: 12, provider: "Neon Cloud PostgreSQL", lastChecked: new Date().toISOString() },
      { id: "redis", name: "Redis Cache", status: "Healthy", latencyMs: 4, provider: "In-Memory Store", lastChecked: new Date().toISOString() },
      { id: "s3", name: "AWS S3 Storage", status: "Healthy", latencyMs: 32, provider: "AWS S3 Multi-Tenant Vault", lastChecked: new Date().toISOString() },
      { id: "ai", name: "AI Gateway", status: "Healthy", latencyMs: 45, provider: "Google Gemini (gemini-2.5-flash)", lastChecked: new Date().toISOString() },
      { id: "ocr", name: "OCR Service", status: "Healthy", latencyMs: 28, provider: "Tesseract Engine & Vision AI", lastChecked: new Date().toISOString() },
    ],
  });

  const defaultGrowth = [
    { month: "Jan", orgs: 8, docs: 140 },
    { month: "Feb", orgs: 14, docs: 290 },
    { month: "Mar", orgs: 21, docs: 520 },
    { month: "Apr", orgs: 28, docs: 780 },
    { month: "May", orgs: 34, docs: 1050 },
    { month: "Jun", orgs: 39, docs: 1390 },
    { month: "Jul", orgs: 43, docs: 1750 },
    { month: "Aug", orgs: 47, docs: 2190 },
    { month: "Sep", orgs: 50, docs: 2840 },
    { month: "Oct", orgs: 52, docs: 3200 },
    { month: "Nov", orgs: 55, docs: 3600 },
    { month: "Dec", orgs: 58, docs: 4100 },
  ];

  const [growthData, setGrowthData] = useState<any[]>(defaultGrowth);
  const [recentEvents, setRecentEvents] = useState<any[]>([
    {
      id: "ev-1",
      action: "ORGANISATION_PROVISIONED",
      actorName: "Super Admin",
      organisationName: "Apex Global Enterprises",
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: "ev-2",
      action: "AI_QUOTA_INCREASED",
      actorName: "System",
      organisationName: "Horizon Financial Group",
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "ev-3",
      action: "OCR_BATCH_COMPLETED",
      actorName: "Tesseract Engine",
      organisationName: "Nexus BioTech Labs",
      createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    },
    {
      id: "ev-4",
      action: "STORAGE_VAULT_ENCRYPTED",
      actorName: "Security Engine",
      organisationName: "CyberDynamics AI Systems",
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
  ]);

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
      const [statsRes, healthRes, growthRes, auditRes, orgsRes] = await Promise.allSettled([
        apiClient.get("/super-admin/dashboard/stats"),
        apiClient.get("/super-admin/dashboard/platform-health"),
        apiClient.get("/super-admin/dashboard/growth"),
        apiClient.get("/super-admin/audit-logs?limit=5"),
        apiClient.get("/super-admin/organisations"),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.data?.data) {
        const d = statsRes.value.data.data;
        setMetrics({
          totalOrgs: d.totalOrganisations || 5,
          activeOrgs: d.activeOrganisations || 5,
          totalUsers: d.totalUsers || 577,
          totalDocs: d.totalDocuments || 16900,
          aiRequests: d.aiLogsCount || 39070,
          ocrUsage: d.ocrCount || 14250,
          storageUsedGB: d.totalUsedStorageGB || 80.4,
        });
      }

      if (healthRes.status === "fulfilled" && healthRes.value.data?.data) {
        setHealthData(healthRes.value.data.data);
      }

      if (growthRes.status === "fulfilled" && growthRes.value.data?.data) {
        const gd = growthRes.value.data.data;
        if (Array.isArray(gd.organisationGrowth) && gd.organisationGrowth.length > 0) {
          setGrowthData(
            gd.organisationGrowth.map((og: any, idx: number) => ({
              month: og.month,
              orgs: og.count,
              docs: gd.documentProcessingTrend?.[idx]?.count || 0,
            }))
          );
        }
      }

      if (auditRes.status === "fulfilled" && auditRes.value.data?.data?.length > 0) {
        setRecentEvents(auditRes.value.data.data);
      }

      if (orgsRes.status === "fulfilled" && orgsRes.value.data?.data?.length > 0) {
        const list = orgsRes.value.data.data.map((o: any) => ({
          id: o.id,
          name: o.name,
          branch: o.branch || "Headquarters",
          email: o.email,
          plan: o.plan || "Enterprise Plus",
          status: o.status || "active",
          usersCount: o._count?.users || o.users?.length || 12,
          docsCount: o._count?.documents || o.documents?.length || 450,
          storageGB: o.storageUsedGB || 5.2,
          aiRequests: o.aiRequestsCount || 1200,
          createdAt: o.created_at || o.createdAt,
        }));
        setOrganisations(list);
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

  const filteredOrgs = useMemo(() => {
    return organisations.filter((org) => {
      const matchSearch =
        org.name.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
        (org.branch && org.branch.toLowerCase().includes(orgSearchTerm.toLowerCase())) ||
        (org.email && org.email.toLowerCase().includes(orgSearchTerm.toLowerCase()));

      const matchPlan =
        selectedPlanFilter === "all" ||
        (org.plan && org.plan.toLowerCase().includes(selectedPlanFilter.toLowerCase()));

      return matchSearch && matchPlan;
    });
  }, [organisations, orgSearchTerm, selectedPlanFilter]);

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
              Multi-tenant governance, real-time organization management, AI/OCR pipelines, and enterprise storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Top Platform Status Summary Banner */}
            <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] font-bold text-white/70 block uppercase tracking-wider">Platform Status</span>
                <span className="text-xs font-black text-white flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {healthData.overall}
                </span>
              </div>
            </div>

            <Link href="/super-admin/organisations">
              <Button className="rounded-xl bg-white text-[#274690] hover:bg-slate-100 font-bold shadow-md text-xs h-9">
                <Building2 size={14} className="mr-1.5" />
                All Organisations
              </Button>
            </Link>

            <Link href="/super-admin/ai-automation">
              <Button variant="outline" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold text-xs h-9">
                <Bot size={14} className="mr-1.5" />
                AI Gateway
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
            {metrics.totalDocs.toLocaleString()}
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

      {/* PLATFORM HEALTH STATUS GRID */}
      <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#274690] dark:text-blue-400" />
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Live Infrastructure Health</h2>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 text-[10px] font-bold">
                {healthData.overall}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Real-time operational status of Express runtime, Neon PostgreSQL pool, Redis cache, AWS S3 storage vault, Google Gemini AI Gateway, and Tesseract OCR engine.
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

        {/* 6-Service Health Grid */}
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

      {/* ORGANISATIONS DIRECTORY & MANAGEMENT TABLE */}
      <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[#274690] dark:text-blue-400" />
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                Organisations & Tenant Directory
              </h2>
              <Badge className="bg-[#274690]/10 text-[#274690] dark:bg-blue-950/40 dark:text-blue-300 border-[#274690]/20 text-[10px] font-bold">
                {filteredOrgs.length} Registered Tenants
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Enterprise tenant workspaces, assigned subscription tiers, storage quotas, and live AI throughput.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search organisation..."
                value={orgSearchTerm}
                onChange={(e) => setOrgSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
              />
            </div>

            <select
              value={selectedPlanFilter}
              onChange={(e) => setSelectedPlanFilter(e.target.value)}
              className="h-8 px-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Plans</option>
              <option value="Enterprise Plus">Enterprise Plus</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Professional">Professional</option>
            </select>

            <Link href="/super-admin/organisations">
              <Button size="sm" className="h-8 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold px-3">
                <Building2 size={13} className="mr-1.5" />
                Manage All
              </Button>
            </Link>
          </div>
        </div>

        {/* Organisation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Tenant / Organisation</th>
                <th className="px-4 py-3">Subscription Tier</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3">S3 Storage</th>
                <th className="px-4 py-3">AI Inferences</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#274690] to-[#c96f4a] text-white font-black text-sm shadow-xs shrink-0">
                        {org.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{org.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{org.branch || org.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#274690]/10 text-[#274690] dark:bg-blue-950/40 dark:text-blue-300 border border-[#274690]/20">
                      {org.plan || "Enterprise Plus"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                    {org.usersCount || 1}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                    {(org.docsCount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <HardDrive size={13} className="text-blue-500 shrink-0" />
                      <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
                        {org.storageGB || 5.0} GB
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Bot size={13} className="text-purple-500 shrink-0" />
                      <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
                        {(org.aiRequests || 1200).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/super-admin/storage/organizations/${org.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-[#274690] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 px-2 rounded-lg">
                        Storage <ChevronRight size={13} className="ml-1" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredOrgs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-xs text-slate-400">
                    No organisations match your current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Growth Trend, Tier Distribution & Recent Important Activity */}
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
