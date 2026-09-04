"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Bot,
  Users,
  HardDrive,
  Sparkles,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Upload,
  Plus,
  UserPlus,
  Terminal,
  CheckCircle2,
  Download,
  ArrowRight,
  PieChart as PieChartIcon,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { orgAnalyticsApi } from "@/services/analyticsApi";
import { workflowApi } from "@/services/workflowApi";
import { orgTeamApi } from "@/services/teamsApi";

export default function OrgAdminDashboardPage() {
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [trendPeriod, setTrendPeriod] = useState<"7d" | "30d" | "6m">("30d");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [graphsReady, setGraphsReady] = useState(false);
  const [liveOverview, setLiveOverview] = useState<any>(null);
  const [liveWorkflowsCount, setLiveWorkflowsCount] = useState<number | null>(null);
  const [liveUsersCount, setLiveUsersCount] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setGraphsReady(true), 120);
    
    // Fetch live dashboard metrics from backend
    orgAnalyticsApi.getOverview().then((res) => {
      if (res?.data) setLiveOverview(res.data);
    }).catch(() => {});

    workflowApi.getOrgWorkflows().then((res) => {
      if (res?.data?.workflows) setLiveWorkflowsCount(res.data.workflows.length);
    }).catch(() => {});

    orgTeamApi.getUsers().then((res) => {
      if (res?.data && Array.isArray(res.data)) setLiveUsersCount(res.data.length);
    }).catch(() => {});

    return () => clearTimeout(t);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#274690] text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-[#c96f4a]/30 animate-in fade-in">
          <CheckCircle2 size={18} className="text-[#c96f4a]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER - Clean Unified Enterprise Design */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Good Morning, Admin</h1>
            <Badge className="bg-[#c96f4a]/12 text-[#274690] border border-[#c96f4a]/25 font-extrabold text-[11px] px-2.5 py-0.5">
              ABC Technologies
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Organisation Overview</span>
            <span>•</span>
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#c96f4a]" /> Last updated: Just now
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-xl px-3.5 py-2 text-xs font-bold border border-[#c96f4a]/20 bg-white text-slate-700 focus:outline-none"
          >
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="Year to Date">Year to Date</option>
          </select>

          <Button
            onClick={() => showToast("Exporting Dashboard Executive Report PDF...")}
            className="bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl text-xs font-bold h-9 px-4 flex items-center gap-1.5 shadow-xs"
          >
            <Download size={14} className="text-[#c96f4a]" /> Export Report
          </Button>
        </div>
      </div>

      {/* 9. QUICK ACTIONS BAR - Unified Clean White Card */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#274690] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#c96f4a]" /> Quick Admin Actions
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Execute daily tasks directly</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          <Link href="/org-admin/documents" className="block">
            <Button variant="outline" className="w-full border-slate-200 hover:border-[#c96f4a] hover:text-[#274690] text-slate-700 font-bold rounded-xl text-xs h-10 flex items-center justify-center gap-1.5">
              <Upload size={14} className="text-[#c96f4a]" /> Upload Document
            </Button>
          </Link>
          <Link href="/org-admin/ai-builder" className="block">
            <Button variant="outline" className="w-full border-slate-200 hover:border-[#c96f4a] hover:text-[#274690] text-slate-700 font-bold rounded-xl text-xs h-10 flex items-center justify-center gap-1.5">
              <Plus size={14} className="text-[#c96f4a]" /> Create Document
            </Button>
          </Link>
          <Link href="/org-admin/workflows" className="block">
            <Button variant="outline" className="w-full border-slate-200 hover:border-[#c96f4a] hover:text-[#274690] text-slate-700 font-bold rounded-xl text-xs h-10 flex items-center justify-center gap-1.5">
              <Clock size={14} className="text-[#c96f4a]" /> Create Request
            </Button>
          </Link>
          <Link href="/org-admin/team" className="block">
            <Button variant="outline" className="w-full border-slate-200 hover:border-[#c96f4a] hover:text-[#274690] text-slate-700 font-bold rounded-xl text-xs h-10 flex items-center justify-center gap-1.5">
              <UserPlus size={14} className="text-[#c96f4a]" /> Create User
            </Button>
          </Link>
          <Link href="/org-admin/ai-tools" className="block">
            <Button variant="outline" className="w-full border-slate-200 hover:border-[#c96f4a] hover:text-[#274690] text-slate-700 font-bold rounded-xl text-xs h-10 flex items-center justify-center gap-1.5">
              <Terminal size={14} className="text-[#c96f4a]" /> Create Prompt
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. MAIN KPI CARDS (2 ROWS UNIFIED CLEAN WHITE CARDS) */}
      <div className="space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Documents</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {liveOverview?.totalDocuments?.toLocaleString() || "1,248"}
              </p>
              <p className="text-[11px] font-bold text-slate-600 flex items-center gap-0.5 mt-1">
                <TrendingUp size={13} className="text-[#c96f4a]" /> ↑ 12.5% vs last month
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-slate-100 text-[#274690] border border-slate-200 flex items-center justify-center font-bold">
              <FileText size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {liveOverview?.pendingApprovals ?? 86}
              </p>
              <p className="text-[11px] font-bold text-slate-600 flex items-center gap-0.5 mt-1">
                <TrendingDown size={13} className="text-[#c96f4a]" /> ↓ 8.2% vs last month
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-slate-100 text-[#274690] border border-slate-200 flex items-center justify-center font-bold">
              <Clock size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Workflows</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {liveWorkflowsCount ?? liveOverview?.activeWorkflows ?? 18}
              </p>
              <p className="text-[11px] font-bold text-slate-600 flex items-center gap-0.5 mt-1">
                <TrendingUp size={13} className="text-[#c96f4a]" /> In production queue
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-slate-100 text-[#274690] border border-slate-200 flex items-center justify-center font-bold">
              <Bot size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Users</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {liveUsersCount ?? liveOverview?.activeUsers ?? 124}
              </p>
              <p className="text-[11px] font-bold text-slate-600 flex items-center gap-0.5 mt-1">
                <TrendingUp size={13} className="text-[#c96f4a]" /> Organisation members
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-slate-100 text-[#274690] border border-slate-200 flex items-center justify-center font-bold">
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Storage Used</p>
            <p className="text-lg font-black text-slate-900">68.4 GB / 100 GB</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
              <div className="bg-[linear-gradient(90deg,#274690_0%,#c96f4a_100%)] h-full rounded-full w-[68.4%]" />
            </div>
            <p className="text-[10px] text-slate-500 text-right font-medium pt-0.5">68.4% Allocated</p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Documents Generated</p>
            <p className="text-lg font-black text-slate-900">642</p>
            <p className="text-[11px] text-slate-500">Auto-generated via AI Builder</p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Documents Shared</p>
            <p className="text-lg font-black text-slate-900">318</p>
            <p className="text-[11px] text-slate-500">Shared externally & internally</p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Requests</p>
            <p className="text-lg font-black text-[#274690]">42</p>
            <p className="text-[11px] text-slate-500">Action required by dept leads</p>
          </div>
        </div>
      </div>

      {/* 3. DOCUMENT OVERVIEW & TREND CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Documents by Status (Clean White Uniform Cards) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon size={16} className="text-[#274690]" /> Documents by Status
            </h3>
            <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">1,248 Total</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-700">Uploaded</span>
              <span className="font-black text-slate-900 text-sm">320</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-700">Processing</span>
              <span className="font-black text-slate-900 text-sm">105</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-700">Pending</span>
              <span className="font-black text-[#c96f4a] text-sm">186</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-700">Approved</span>
              <span className="font-black text-emerald-700 text-sm">510</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-700">Rejected</span>
              <span className="font-black text-rose-700 text-sm">42</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-700">Archived</span>
              <span className="font-black text-slate-800 text-sm">85</span>
            </div>
          </div>
        </div>

        {/* Documents Trend (Visual Chart) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity size={16} className="text-[#c96f4a]" /> Documents Trend
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
              <button onClick={() => setTrendPeriod("7d")} className={`px-2.5 py-0.5 rounded-lg ${trendPeriod === "7d" ? "bg-white text-[#c96f4a] shadow-xs" : "text-slate-500"}`}>7 Days</button>
              <button onClick={() => setTrendPeriod("30d")} className={`px-2.5 py-0.5 rounded-lg ${trendPeriod === "30d" ? "bg-white text-[#c96f4a] shadow-xs" : "text-slate-500"}`}>30 Days</button>
              <button onClick={() => setTrendPeriod("6m")} className={`px-2.5 py-0.5 rounded-lg ${trendPeriod === "6m" ? "bg-white text-[#c96f4a] shadow-xs" : "text-slate-500"}`}>6 Months</button>
            </div>
          </div>

          {/* Bar Chart Simulation */}
          <div className="h-36 flex items-end gap-2.5 pt-4 px-2 border-b border-slate-100 pb-2">
            {[
              { day: "Mon", uploaded: 45, generated: 28 },
              { day: "Tue", uploaded: 62, generated: 40 },
              { day: "Wed", uploaded: 80, generated: 55 },
              { day: "Thu", uploaded: 72, generated: 48 },
              { day: "Fri", uploaded: 95, generated: 70 },
              { day: "Sat", uploaded: 30, generated: 18 },
              { day: "Sun", uploaded: 20, generated: 12 },
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  <div
                    style={{
                      height: graphsReady ? `${item.uploaded}%` : "0%",
                      transitionDelay: `${idx * 70}ms`,
                    }}
                    className="w-1/2 bg-[#274690] rounded-t-md transition-[height] duration-700 ease-out hover:bg-[#1f3561]"
                    title={`Uploaded: ${item.uploaded}`}
                  />
                  <div
                    style={{
                      height: graphsReady ? `${item.generated}%` : "0%",
                      transitionDelay: `${idx * 70 + 80}ms`,
                    }}
                    className="w-1/2 bg-[#c96f4a]/70 rounded-t-md transition-[height] duration-700 ease-out"
                    title={`Generated: ${item.generated}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{item.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-[#274690]" />
              <span>Documents Uploaded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-[#c96f4a]/70" />
              <span>Documents Generated</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. APPROVAL OVERVIEW & 5. AI USAGE OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Approval Overview</h3>
            <span className="text-xs font-bold text-[#c96f4a]">552 Total Workflow Logs</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Pending</span>
              <span className="text-lg font-black text-[#c96f4a]">86</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Approved</span>
              <span className="text-lg font-black text-emerald-700">420</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Rejected</span>
              <span className="text-lg font-black text-rose-700">32</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Overdue</span>
              <span className="text-lg font-black text-slate-800">14</span>
            </div>
          </div>

          {/* Recent Approval Requests List */}
          <div className="space-y-2 pt-1">
            <p className="text-xs font-bold text-slate-700">Recent Approval Requests:</p>
            {[
              { title: "Contract Renewal", status: "Pending", color: "bg-slate-100 text-slate-800" },
              { title: "Invoice #INV-1024", status: "Approved", color: "bg-emerald-50 text-emerald-800 border border-emerald-200" },
              { title: "HR Offer Letter", status: "Pending", color: "bg-slate-100 text-slate-800" },
              { title: "Vendor Agreement", status: "Rejected", color: "bg-rose-50 text-rose-800 border border-rose-200" },
            ].map((req, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-800">{req.title}</span>
                <Badge className={`${req.color} text-[10px] font-extrabold`}>{req.status}</Badge>
              </div>
            ))}
          </div>

          <Link href="/org-admin/workflows" className="block pt-1">
            <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-slate-200 text-[#274690] hover:border-[#c96f4a] h-9">
              View All Approvals <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>

        {/* 5. AI USAGE OVERVIEW */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bot size={16} className="text-[#c96f4a]" /> AI Usage Overview
            </h3>
            <span className="text-xs font-bold text-slate-600">4,280 / 10,000 Requests</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { tool: "AI Assistant", count: 1240, pct: 29 },
              { tool: "Document Q&A", count: 820, pct: 19 },
              { tool: "Summarization", count: 640, pct: 15 },
              { tool: "OCR Extraction", count: 530, pct: 12 },
              { tool: "Translation", count: 420, pct: 10 },
              { tool: "Other AI Tools", count: 630, pct: 15 },
            ].map((row, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>{row.tool}</span>
                  <span>{row.count} ({row.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: graphsReady ? `${row.pct * 3}%` : "0%" }}
                    className="bg-[linear-gradient(90deg,#274690_0%,#c96f4a_100%)] h-full rounded-full transition-[width] duration-1000 ease-out"
                  />
                </div>
              </div>
            ))}
          </div>

          <Link href="/org-admin/ai-tools" className="block pt-2">
            <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-slate-200 text-[#274690] hover:border-[#c96f4a] h-9">
              Open AI Tools Workbench <ChevronRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 6. TEAM OVERVIEW & 7. STORAGE OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 6. Team Overview */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-[#c96f4a]" /> Team Overview
            </h3>
            <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">156 Total Members</Badge>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-bold">Total</span>
              <span className="font-black text-slate-900 text-sm">156</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-bold">Active</span>
              <span className="font-black text-[#c96f4a] text-sm">124</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-bold">Inactive</span>
              <span className="font-black text-slate-800 text-sm">18</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-bold">Pending</span>
              <span className="font-black text-slate-800 text-sm">14</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">Department Breakdown:</p>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">HR</span>
                <span className="font-bold text-slate-900">24</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">Finance</span>
                <span className="font-bold text-slate-900">31</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">Sales</span>
                <span className="font-bold text-slate-900">42</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">Ops</span>
                <span className="font-bold text-slate-900">35</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">Legal</span>
                <span className="font-bold text-slate-900">24</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Storage Overview */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HardDrive size={16} className="text-[#c96f4a]" /> Storage Breakdown
            </h3>
            <span className="text-xs font-bold text-[#c96f4a]">68.4 GB / 100 GB Used</span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              style={{ width: graphsReady ? "68.4%" : "0%" }}
              className="bg-[linear-gradient(90deg,#274690_0%,#c96f4a_100%)] h-full rounded-full transition-[width] duration-1000 ease-out"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
              <span className="font-bold text-slate-700">Documents</span>
              <span className="font-black text-slate-900">52 GB</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
              <span className="font-bold text-slate-700">Images</span>
              <span className="font-black text-slate-900">8 GB</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
              <span className="font-bold text-slate-700">Generated Files</span>
              <span className="font-black text-slate-900">6 GB</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
              <span className="font-bold text-slate-700">Other Data</span>
              <span className="font-black text-slate-900">2.4 GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8. RECENT ACTIVITY, 10. PENDING TASKS, & 11. AI BUILDER WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 8. Recent Activity Feed */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <Link href="/org-admin/team" className="text-xs font-bold text-[#274690] hover:underline">
              View Activity
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { user: "Rajesh", action: "uploaded Vendor Contract", time: "5 min ago" },
              { user: "Priya", action: "approved Invoice #INV-1024", time: "18 min ago" },
              { user: "Amit", action: "generated Offer Letter", time: "32 min ago" },
              { user: "Neha", action: "created a new prompt template", time: "1 hour ago" },
              { user: "Rahul", action: "joined Finance Team", time: "2 hours ago" },
            ].map((act, idx) => (
              <div key={idx} className="flex items-start justify-between p-2 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900">{act.user}</span>{" "}
                  <span className="text-slate-600">{act.action}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 10. Pending Tasks Widget */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle size={16} className="text-[#274690]" /> Pending Tasks
            </h3>
            <span className="text-xs font-bold text-[#274690]">Action Needed</span>
          </div>

          <ul className="space-y-2.5 text-xs">
            <li className="flex items-center gap-2 text-slate-800 font-medium">
              <span className="h-2 w-2 rounded-full bg-[#274690] shrink-0" />
              <span>14 documents waiting for approval</span>
            </li>
            <li className="flex items-center gap-2 text-slate-800 font-medium">
              <span className="h-2 w-2 rounded-full bg-[#274690] shrink-0" />
              <span>8 user invitations pending</span>
            </li>
            <li className="flex items-center gap-2 text-slate-800 font-medium">
              <span className="h-2 w-2 rounded-full bg-[#274690] shrink-0" />
              <span>5 document requests pending</span>
            </li>
            <li className="flex items-center gap-2 text-slate-800 font-medium">
              <span className="h-2 w-2 rounded-full bg-[#274690] shrink-0" />
              <span>3 failed AI requests</span>
            </li>
            <li className="flex items-center gap-2 text-slate-800 font-medium">
              <span className="h-2 w-2 rounded-full bg-[#274690] shrink-0" />
              <span>Storage is 68% used</span>
            </li>
          </ul>

          <Link href="/org-admin/workflows" className="block pt-2">
            <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-slate-200 text-slate-700 h-8">
              View All Pending Tasks
            </Button>
          </Link>
        </div>

        {/* 11. AI Document Builder Widget */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold flex items-center gap-2 text-[#274690]">
                <Sparkles size={16} /> Document Builder
              </h3>
              <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">v2.0 AI</Badge>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Generated this month:</span>
                <span className="font-bold text-slate-900">642</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Templates:</span>
                <span className="font-bold text-slate-900">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Drafts:</span>
                <span className="font-bold text-slate-900">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pending Approval:</span>
                <span className="font-bold text-[#274690]">9</span>
              </div>
            </div>
          </div>

          <Link href="/org-admin/ai-builder" className="block">
            <Button className="w-full bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs h-9">
              Open Builder
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
