"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  FileText,
  CheckSquare,
  Users,
  Bot,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Clock,
  PieChart as PieChartIcon,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowRight,
  FileSpreadsheet,
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
import { reportsApi } from "@/services/reportsApi";

export default function DepartmentManagerReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [activeTab, setActiveTab] = useState<"documents" | "approvals" | "team" | "ai">("documents");
  const [dateRange, setDateRange] = useState("30d");
  const [reportsData, setReportsData] = useState<any>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await reportsApi.getDepartmentReports({ type: activeTab, range: dateRange });
      if (res?.data) {
        setReportsData(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, [activeTab, dateRange]);

  const kpis = reportsData?.kpis || {
    totalDocuments: 486,
    completionRate: 94.2,
    approvalRate: 91.8,
    averageProcessingTimeHours: 3.8,
    pendingDocuments: 42,
    overdueDocuments: 4,
    aiProcessedDocuments: 182,
  };

  const docReport = reportsData?.documentReport || {
    totalDocuments: 486,
    created: 101,
    completed: 318,
    pending: 42,
    archived: 25,
    typeBreakdown: [
      { type: "Invoice", count: 142, percentage: 29 },
      { type: "Contract", count: 118, percentage: 24 },
      { type: "Report", count: 96, percentage: 20 },
      { type: "Policy", count: 72, percentage: 15 },
      { type: "Checklist", count: 58, percentage: 12 },
    ],
    documentsByStatus: [
      { name: "Completed", value: 318, color: "#274690" },
      { name: "In Progress", value: 94, color: "#5B53BA" },
      { name: "Pending Approval", value: 42, color: "#c96f4a" },
      { name: "Draft", value: 32, color: "#94a3b8" },
    ],
    documentsByCategory: [
      { category: "Finance", count: 184 },
      { category: "Legal", count: 126 },
      { category: "Operations", count: 108 },
      { category: "Compliance", count: 68 },
    ],
    documentsByTeam: [
      { team: "Financial Operations", count: 178 },
      { team: "Procurement & Logistics", count: 198 },
      { team: "Compliance & Audit", count: 110 },
    ],
    documentsOverTime: [
      { date: "Aug 01", created: 14, completed: 11, pending: 3 },
      { date: "Aug 04", created: 18, completed: 15, pending: 3 },
      { date: "Aug 07", created: 22, completed: 19, pending: 3 },
      { date: "Aug 10", created: 26, completed: 22, pending: 4 },
      { date: "Aug 13", created: 21, completed: 18, pending: 3 },
    ],
  };

  const approvalReport = reportsData?.approvalReport || {
    approvalRate: 91.8,
    rejectionRate: 4.8,
    pendingApprovals: 8,
    averageApprovalTimeHours: 3.8,
    approvalsByTeam: [
      { team: "Financial Operations", approved: 34, rejected: 2, pending: 3 },
      { team: "Procurement & Logistics", approved: 42, rejected: 3, pending: 4 },
      { team: "Compliance & Audit", approved: 28, rejected: 1, pending: 1 },
    ],
    approvalsByType: [
      { type: "Contract", count: 46 },
      { type: "Invoice", count: 38 },
      { type: "Report", count: 24 },
      { type: "Policy", count: 16 },
    ],
  };

  const teamPerf = reportsData?.teamPerformance || {
    teams: [],
    membersMetrics: [],
  };

  const aiReport = reportsData?.aiUsageReport || {
    totalAiRequests: 214,
    documentsProcessed: 182,
    ocrUsage: 67,
    extractionUsage: 48,
    summarizationUsage: 42,
    generationUsage: 33,
    classificationUsage: 24,
  };

  const COLORS = ["#274690", "#c96f4a", "#10b981", "#5B53BA", "#f59e0b"];

  const handleExportCSV = () => {
    let rows: string[][] = [];
    if (activeTab === "documents") {
      rows = [
        ["Document Type", "Count", "Percentage"],
        ...docReport.typeBreakdown.map((t: any) => [t.type, String(t.count), `${t.percentage}%`]),
      ];
    } else if (activeTab === "approvals") {
      rows = [
        ["Team", "Approved", "Rejected", "Pending"],
        ...approvalReport.approvalsByTeam.map((a: any) => [a.team, String(a.approved), String(a.rejected), String(a.pending)]),
      ];
    } else if (activeTab === "team") {
      rows = [
        ["Team", "Total Docs", "Completed", "Pending", "Completion Rate"],
        ...teamPerf.teams.map((t: any) => [t.name, String(t.totalDocs), String(t.completed), String(t.pending), `${t.completionRate}%`]),
      ];
    } else {
      rows = [
        ["AI Feature", "Usage Count"],
        ["OCR Vision Scans", String(aiReport.ocrUsage)],
        ["Structured Data Extractions", String(aiReport.extractionUsage)],
        ["Document Summarizer", String(aiReport.summarizationUsage)],
        ["Document Generator", String(aiReport.generationUsage)],
        ["Document Classification", String(aiReport.classificationUsage)],
      ];
    }

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `department_${activeTab}_report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${activeTab} report CSV.`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-16 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Department Analytics & Reports</h1>
            <Badge className="bg-[#274690]/10 text-[#274690] text-xs font-bold">Scoped Analytics</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Measure document throughput, sign-off speeds, employee workload, and AI tool usage.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
          </select>

          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs font-bold text-slate-700">
            <FileSpreadsheet size={14} className="mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm">
          <span>{successToast}</span>
        </div>
      )}

      {/* 7 Report KPI Dashboard Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Docs</span>
          <p className="mt-2 text-xl font-black text-slate-900">{kpis.totalDocuments}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400">Completion</span>
          <p className="mt-2 text-xl font-black text-emerald-600">{kpis.completionRate}%</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400">Approval Rate</span>
          <p className="mt-2 text-xl font-black text-[#274690]">{kpis.approvalRate}%</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400">Avg Turnaround</span>
          <p className="mt-2 text-xl font-black text-[#c96f4a]">{kpis.averageProcessingTimeHours}h</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400">Pending Docs</span>
          <p className="mt-2 text-xl font-black text-amber-600">{kpis.pendingDocuments}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400">Overdue</span>
          <p className="mt-2 text-xl font-black text-rose-600">{kpis.overdueDocuments}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400">AI Processed</span>
          <p className="mt-2 text-xl font-black text-[#5B53BA]">{kpis.aiProcessedDocuments}</p>
        </div>
      </section>

      {/* 4 Report Navigation Tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-1.5">
        {[
          { id: "documents", label: "1. Document Reports", icon: FileText },
          { id: "approvals", label: "2. Approval Reports", icon: CheckSquare },
          { id: "team", label: "3. Team Performance", icon: Users },
          { id: "ai", label: "4. AI Usage Analytics", icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition ${
                active ? "bg-[#274690] text-white shadow-md" : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. DOCUMENT REPORTS */}
      {/* ========================================================================= */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Timeline */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-8">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">Documents Created & Completed Over Time</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={docReport.documentsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="created" name="Created" fill="#274690" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#c96f4a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Type Breakdown */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">Documents by Type</h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={docReport.typeBreakdown} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={65}>
                      {docReport.typeBreakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs">
                {docReport.typeBreakdown.map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">{t.type}</span>
                    <span className="font-mono font-bold text-slate-900">{t.count} ({t.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Category & Team Breakdown */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">Documents by Category</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={docReport.documentsByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" name="Count" fill="#274690" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">Documents by Team</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={docReport.documentsByTeam}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="team" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" name="Count" fill="#c96f4a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. APPROVAL REPORTS */}
      {/* ========================================================================= */}
      {activeTab === "approvals" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-[11px] font-black uppercase text-slate-400">Approval Rate</span>
              <p className="mt-2 text-2xl font-black text-emerald-600">{approvalReport.approvalRate}%</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-[11px] font-black uppercase text-slate-400">Rejection Rate</span>
              <p className="mt-2 text-2xl font-black text-rose-600">{approvalReport.rejectionRate}%</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-[11px] font-black uppercase text-slate-400">Pending Approvals</span>
              <p className="mt-2 text-2xl font-black text-[#c96f4a]">{approvalReport.pendingApprovals}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-[11px] font-black uppercase text-slate-400">Avg Turnaround Time</span>
              <p className="mt-2 text-2xl font-black text-[#274690]">{approvalReport.averageApprovalTimeHours} Hours</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">Approvals by Team</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={approvalReport.approvalsByTeam}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="team" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" name="Approved" fill="#274690" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#c96f4a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TEAM PERFORMANCE */}
      {/* ========================================================================= */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">Internal Team Delivery Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3 text-center">Total Docs</th>
                    <th className="px-4 py-3 text-center">Completed</th>
                    <th className="px-4 py-3 text-center">Pending</th>
                    <th className="px-4 py-3 text-center">Avg Hours</th>
                    <th className="px-4 py-3 text-center">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamPerf.teams.map((t: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{t.name}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">{t.totalDocs}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">{t.completed}</td>
                      <td className="px-4 py-3 text-center font-bold text-[#c96f4a]">{t.pending}</td>
                      <td className="px-4 py-3 text-center font-mono text-slate-700">{t.avgHours}h</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-[#274690]" style={{ width: `${t.completionRate}%` }} />
                          </div>
                          <span className="font-bold text-slate-800">{t.completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. AI USAGE ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">Total AI Requests</span>
              <p className="mt-2 text-2xl font-black text-slate-900">{aiReport.totalAiRequests}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">OCR Scans</span>
              <p className="mt-2 text-2xl font-black text-[#c96f4a]">{aiReport.ocrUsage}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">Data Extractions</span>
              <p className="mt-2 text-2xl font-black text-emerald-600">{aiReport.extractionUsage}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">Summaries</span>
              <p className="mt-2 text-2xl font-black text-[#274690]">{aiReport.summarizationUsage}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">Draft Generators</span>
              <p className="mt-2 text-2xl font-black text-indigo-600">{aiReport.generationUsage}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">Classifications</span>
              <p className="mt-2 text-2xl font-black text-purple-600">{aiReport.classificationUsage}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">Department AI Engine Breakdown</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { name: "OCR Vision Engine", count: aiReport.ocrUsage, desc: "Scanned PDF & Image character extraction" },
                { name: "Structured Data Extraction", count: aiReport.extractionUsage, desc: "Invoice, PO & Contract schema parsing" },
                { name: "Document Summarizer", count: aiReport.summarizationUsage, desc: "Takeaways, key points & action items" },
                { name: "Document Generator", count: aiReport.generationUsage, desc: "Prompt & template-driven drafting" },
                { name: "Auto Classification", count: aiReport.classificationUsage, desc: "Document categorization & folder routing" },
              ].map((engine, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
                  <span className="text-xs font-black text-slate-900">{engine.name}</span>
                  <p className="text-xl font-black text-[#274690]">{engine.count} runs</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{engine.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}