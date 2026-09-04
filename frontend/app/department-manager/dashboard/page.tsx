"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock3,
  Users,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Plus,
  UploadCloud,
  Sparkles,
  CheckSquare,
  BarChart3,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  Eye,
  Download,
  XCircle,
  FolderOpen,
  Layout,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardApi } from "@/services/dashboardApi";

export default function DepartmentManagerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("7d");
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboard = async (range = dateRange) => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardApi.getDepartmentManagerDashboard(range);
      if (res?.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load department dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard(dateRange);
  }, [dateRange]);

  const stats = dashboardData?.stats || {
    totalDocuments: 491,
    documentsCreated: 101,
    documentsPending: 42,
    documentsCompleted: 318,
    pendingApprovals: 4,
    approvedDocuments: 318,
    rejectedDocuments: 14,
    totalTeamMembers: 26,
    activeTeamMembers: 24,
    overdueDocuments: 4,
    aiProcessedDocuments: 182,
  };

  const documentOverview = dashboardData?.documentOverview || [];
  const approvalOverview = dashboardData?.approvalOverview || { pending: 4, approved: 318, rejected: 14, recentlySubmitted: [] };
  const teamWorkload = dashboardData?.teamWorkload || [];
  const recentDocuments = dashboardData?.recentDocuments || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const documentsByType = dashboardData?.documentsByType || [
    { type: "Invoice", count: 142 },
    { type: "Contract", count: 118 },
    { type: "Report", count: 96 },
    { type: "Policy", count: 72 },
    { type: "Checklist", count: 58 },
  ];
  const documentsByStatus = dashboardData?.documentsByStatus || [
    { status: "Completed", count: 318, color: "#274690" },
    { status: "In Progress", count: 94, color: "#5B53BA" },
    { status: "Pending Review", count: 42, color: "#c96f4a" },
    { status: "Draft", count: 32, color: "#94a3b8" },
  ];

  // 11 Overview Cards
  const statCards = [
    { label: "Total Documents", value: stats.totalDocuments, note: "Department vault", icon: FileText, color: "text-[#274690] bg-blue-50 border-blue-200" },
    { label: "Documents Created", value: stats.documentsCreated, note: "This period", icon: Plus, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
    { label: "Documents Pending", value: stats.documentsPending, note: "In progress", icon: Clock3, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: "Documents Completed", value: stats.documentsCompleted, note: "Processed & stored", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { label: "Pending Approvals", value: stats.pendingApprovals, note: "Awaiting signoff", icon: CheckSquare, color: "text-[#c96f4a] bg-orange-50 border-orange-200" },
    { label: "Approved Documents", value: stats.approvedDocuments, note: "Passed compliance", icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { label: "Rejected Documents", value: stats.rejectedDocuments, note: "Returned/cancelled", icon: XCircle, color: "text-rose-600 bg-rose-50 border-rose-200" },
    { label: "Total Team Members", value: stats.totalTeamMembers, note: "Department roster", icon: Users, color: "text-[#274690] bg-slate-50 border-slate-200" },
    { label: "Active Team Members", value: stats.activeTeamMembers, note: "Online now", icon: Users, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { label: "Overdue Documents", value: stats.overdueDocuments, note: "Requires attention", icon: AlertTriangle, color: "text-rose-600 bg-rose-50 border-rose-200" },
    { label: "AI Processed Docs", value: stats.aiProcessedDocuments, note: "OCR, summary, extractions", icon: Bot, color: "text-[#c96f4a] bg-orange-50 border-orange-200" },
  ];

  const approvalPieData = [
    { name: "Approved", value: approvalOverview.approved || 318, color: "#274690" },
    { name: "Pending", value: approvalOverview.pending || 4, color: "#c96f4a" },
    { name: "Rejected", value: approvalOverview.rejected || 14, color: "#ef4444" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16 font-sans text-slate-800">
      {/* Top Banner with Brand Colors #274690 & #c96f4a */}
      <section className="relative overflow-hidden rounded-3xl border border-[#274690]/20 bg-[linear-gradient(135deg,#1b2e59_0%,#274690_60%,#3b5ea6_100%)] p-7 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#c96f4a]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-300/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                Department Dashboard
              </h1>
              <Badge className="border border-white/30 bg-white/15 px-3 py-1 text-xs font-black tracking-wide text-white backdrop-blur-md">
                {dashboardData?.department || "Operations & Logistics"}
              </Badge>
            </div>
            <p className="max-w-2xl text-xs font-medium leading-relaxed text-blue-100/90 sm:text-sm">
              Overview of your department&apos;s document activity, team workload, approvals, and AI automation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 bg-white/10 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/20"
              onClick={() => void fetchDashboard()}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/department-manager/documents">
              <Button size="sm" className="bg-[#c96f4a] text-xs font-bold text-white hover:bg-[#b05d3b] shadow-sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Document
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions Bar */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Link href="/department-manager/documents">
            <button type="button" className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-bold text-slate-700 transition hover:bg-[#274690] hover:text-white hover:border-[#274690]">
              <Plus size={15} /> Create Document
            </button>
          </Link>
          <Link href="/department-manager/documents">
            <button type="button" className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-bold text-slate-700 transition hover:bg-[#274690] hover:text-white hover:border-[#274690]">
              <UploadCloud size={15} /> Upload Document
            </button>
          </Link>
          <Link href="/department-manager/document-templates">
            <button type="button" className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-bold text-slate-700 transition hover:bg-[#274690] hover:text-white hover:border-[#274690]">
              <Layout size={15} /> Create from Template
            </button>
          </Link>
          <Link href="/department-manager/ai-tools">
            <button type="button" className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-bold text-slate-700 transition hover:bg-[#c96f4a] hover:text-white hover:border-[#c96f4a]">
              <Sparkles size={15} /> Open AI Tools
            </button>
          </Link>
          <Link href="/department-manager/approvals">
            <button type="button" className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-bold text-slate-700 transition hover:bg-[#274690] hover:text-white hover:border-[#274690]">
              <CheckSquare size={15} /> Review Approvals
            </button>
          </Link>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 11 Overview Statistics Grid */}
      <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-[#274690]/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{card.label}</span>
                <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${card.color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <p className="mt-2 text-xl font-black tracking-tight text-slate-900">{card.value}</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-400">{card.note}</p>
            </div>
          );
        })}
      </section>

      {/* Charts Row 1: Document Activity (Created vs Completed over time) & Approvals Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Document Activity Chart (8 cols) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Document Activity</h3>
              <p className="text-xs text-slate-500">Created vs. completed document throughput over time.</p>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(["7d", "30d", "3m"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDateRange(r)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    dateRange === r ? "bg-[#274690] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "Last 3 Months"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={documentOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#274690" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#274690" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c96f4a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c96f4a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="created" name="Documents Created" stroke="#274690" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" />
                <Area type="monotone" dataKey="completed" name="Documents Completed" stroke="#c96f4a" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                <Area type="monotone" dataKey="pending" name="Documents Pending" stroke="#f59e0b" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approvals Overview (4 cols) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Approval Overview</h3>
                <p className="text-xs text-slate-500">Sign-off decision breakdown.</p>
              </div>
              <Link href="/department-manager/approvals" className="text-xs font-bold text-[#274690] hover:underline">
                View All
              </Link>
            </div>

            <div className="mt-4 h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={approvalPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={4}>
                    {approvalPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
              <div>
                <span className="text-[10px] font-bold text-[#c96f4a]">Pending</span>
                <p className="text-base font-black text-slate-900">{approvalOverview.pending}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#274690]">Approved</span>
                <p className="text-base font-black text-slate-900">{approvalOverview.approved}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-600">Rejected</span>
                <p className="text-base font-black text-slate-900">{approvalOverview.rejected}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link href="/department-manager/approvals" className="block w-full">
              <Button className="w-full bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]">
                Review Pending Approvals ({approvalOverview.pending})
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Documents by Type & Documents by Status */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Documents by Type */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">Documents by Type / Category</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={documentsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="type" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" name="Count" fill="#274690" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Documents by Status */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">Documents by Status</h3>
          <div className="space-y-3">
            {documentsByStatus.map((item: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">{item.status}</span>
                  <span className="font-mono text-slate-900">{item.count} docs</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((item.count / 491) * 100))}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Workload & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Team Workload Table (7 cols) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Team Workload</h3>
              <p className="text-xs text-slate-500">Staff distribution, assigned workload, and delivery status.</p>
            </div>
            <Link href="/department-manager/team" className="text-xs font-bold text-[#274690] hover:underline">
              Manage Team
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">Team Member</th>
                  <th className="px-3 py-2.5">Team</th>
                  <th className="px-3 py-2.5 text-center">Assigned</th>
                  <th className="px-3 py-2.5 text-center">Completed</th>
                  <th className="px-3 py-2.5 text-center">Pending</th>
                  <th className="px-3 py-2.5 text-center">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamWorkload.map((member: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-bold text-slate-900">
                      {member.name}
                      <span className="block text-[10px] font-normal text-slate-400">{member.role}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{member.team}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-800">{member.assignedDocs}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-[#274690]">{member.completed}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-[#c96f4a]">{member.pending}</td>
                    <td className="px-3 py-2.5 text-center">
                      {member.overdue > 0 ? (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 font-bold text-rose-700">{member.overdue}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed (5 cols) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">Live operational events within your department.</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold text-slate-600">Audit Feed</Badge>
          </div>

          <div className="mt-4 space-y-3">
            {recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition hover:bg-slate-100">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690] shrink-0">
                  <Activity size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{act.text}</p>
                  <span className="mt-0.5 block text-[10px] text-slate-400">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Department Documents Table */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Recent Documents</h3>
            <p className="text-xs text-slate-500">Latest uploaded, generated, and submitted department files.</p>
          </div>
          <Link href="/department-manager/documents">
            <Button variant="ghost" size="sm" className="text-xs font-bold text-[#274690]">
              View All Documents <ArrowRight size={13} className="ml-1" />
            </Button>
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Document Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDocuments.map((doc: any, idx: number) => {
                const docStatus = (doc.status || "DRAFT").toString();
                const createdDateStr = doc.createdDate || doc.created_at || doc.createdAt;
                const updatedDateStr = doc.updatedDate || doc.updated_at || doc.updatedAt || createdDateStr;

                return (
                  <tr key={doc.id || `doc-${idx}`} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <Link href={`/department-manager/documents?docId=${doc.id || ""}`} className="hover:text-[#274690]">
                        {doc.name || doc.title || "Untitled Document"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] font-bold text-slate-600">{doc.type || "Document"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{doc.createdBy || doc.uploaded_by || doc.owner || "System"}</td>
                    <td className="px-4 py-3 font-medium text-[#274690]">{doc.assignedTo || doc.assigned_to || "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                        docStatus === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : docStatus === "SUBMITTED_FOR_APPROVAL" ? "bg-orange-100 text-[#c96f4a]" : "bg-slate-100 text-slate-800"
                      }`}>
                        {docStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {createdDateStr ? new Date(createdDateStr).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {updatedDateStr ? new Date(updatedDateStr).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/department-manager/documents?docId=${doc.id || ""}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-[#274690]">
                          <Eye size={13} className="mr-1" /> View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}