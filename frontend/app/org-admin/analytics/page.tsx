"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  FileText,
  Bot,
  Users,
  HardDrive,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  Filter,
  PieChart as PieChartIcon,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { orgAnalyticsApi } from "@/services/analyticsApi";

export default function OrgAdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("This Month");
  const [overview, setOverview] = useState<any>(null);
  const [docAnalytics, setDocAnalytics] = useState<any>(null);
  const [aiAnalytics, setAiAnalytics] = useState<any>(null);

  useEffect(() => {
    orgAnalyticsApi.getOverview().then((res) => setOverview(res.data)).catch(() => {});
    orgAnalyticsApi.getDocumentAnalytics().then((res) => setDocAnalytics(res.data)).catch(() => {});
    orgAnalyticsApi.getAiAnalytics().then((res) => setAiAnalytics(res.data)).catch(() => {});
  }, []);

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "documents", label: "Document Analytics", icon: FileText },
    { id: "ai", label: "AI Analytics", icon: Bot },
    { id: "team", label: "User & Team Analytics", icon: Users },
    { id: "storage", label: "Storage Analytics", icon: HardDrive },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#274690] text-xs font-extrabold">
            <BarChart3 size={14} className="text-[#274690]" /> Organisation Analytics
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Analytics & Reports Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete insights into document processing, workflow approvals, AI tool utilization, team performance, and storage metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs font-bold border border-slate-200 bg-white text-slate-700"
          >
            <option value="This Month">This Month</option>
            <option value="Last Quarter">Last Quarter</option>
            <option value="Year to Date">Year to Date</option>
          </select>
          <Button className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl shadow-xs">
            <Download size={14} className="mr-1.5 text-[#ffd9a0]" /> Export Report PDF
          </Button>
        </div>
      </div>

      {/* Sub-Nav Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#274690] text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Icon size={15} className={isActive ? "text-[#ffd9a0]" : "text-slate-500"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Documents</p>
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#274690] flex items-center justify-center font-bold">
                  <FileText size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{overview?.totalDocuments || "1,248"}</p>
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-2">
                <TrendingUp size={12} /> +12.5% vs last month
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documents Processed</p>
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">1,020</p>
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-2">
                81.7% Completion Rate
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Requests</p>
                <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Bot size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{overview?.aiRequestsTotal || "4,280"}</p>
              <p className="text-[11px] font-bold text-purple-700 flex items-center gap-1 mt-2">
                98.4% AI Success Rate
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage Allocated</p>
                <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <HardDrive size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">68.4 GB</p>
              <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-2">
                Out of 100 GB Plan Quota
              </p>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Trend Bar Chart */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity size={16} className="text-[#274690]" /> Document Volume & Processing Trend
                </h3>
                <Badge className="bg-blue-50 text-[#274690] text-[10px]">Monthly Comparison</Badge>
              </div>

              <div className="h-52 flex items-end gap-3 pt-6 px-2 border-b border-slate-100 pb-2">
                {[
                  { month: "Jan", docs: 720, processed: 650 },
                  { month: "Feb", docs: 850, processed: 780 },
                  { month: "Mar", docs: 940, processed: 890 },
                  { month: "Apr", docs: 1020, processed: 970 },
                  { month: "May", docs: 1150, processed: 1080 },
                  { month: "Jun", docs: 1248, processed: 1180 },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div style={{ height: `${item.docs / 14}%` }} className="w-1/2 bg-[#274690] rounded-t-md hover:bg-[#1f3561] transition-all" title={`Total: ${item.docs}`} />
                      <div style={{ height: `${item.processed / 14}%` }} className="w-1/2 bg-emerald-500 rounded-t-md transition-all" title={`Processed: ${item.processed}`} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{item.month}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-md bg-[#274690]" /> Total Documents
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-md bg-emerald-500" /> Processed & Approved
                </div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon size={16} className="text-[#274690]" /> Documents by Department
              </h3>

              <div className="space-y-3">
                {[
                  { dept: "Legal & Compliance", count: 480, pct: 38 },
                  { dept: "Finance & Accounts", count: 350, pct: 28 },
                  { dept: "HR & People Ops", count: 240, pct: 19 },
                  { dept: "Sales & Marketing", count: 178, pct: 15 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{item.dept}</span>
                      <span>{item.count} docs ({item.pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-[#274690] rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT ANALYTICS TAB */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">Avg Processing Time</p>
              <p className="text-2xl font-black text-slate-900 mt-1">14.2 Seconds</p>
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">-3.4s faster with AI OCR</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">Approval Turnaround</p>
              <p className="text-2xl font-black text-slate-900 mt-1">8.5 Hours</p>
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Reduced by 72% this quarter</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">Pending Approvals Queue</p>
              <p className="text-2xl font-black text-amber-600 mt-1">86 Documents</p>
              <p className="text-[11px] text-amber-700 font-bold mt-0.5">Active Workflow Queues</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Documents Processed by Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-2xl font-black text-emerald-900">510</p>
                <p className="text-xs font-bold text-emerald-700">Approved</p>
              </div>
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-2xl font-black text-amber-900">186</p>
                <p className="text-xs font-bold text-amber-700">Pending Review</p>
              </div>
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-2xl font-black text-blue-900">320</p>
                <p className="text-xs font-bold text-blue-700">Uploaded</p>
              </div>
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-100">
                <p className="text-2xl font-black text-rose-900">42</p>
                <p className="text-xs font-bold text-rose-700">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI ANALYTICS TAB */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">AI Success Rate</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">98.4%</p>
              <p className="text-[11px] text-slate-500 mt-0.5">68 Failed out of 4,280</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Tokens Consumed</p>
              <p className="text-2xl font-black text-slate-900 mt-1">1,845,000</p>
              <p className="text-[11px] text-purple-700 font-bold mt-0.5">Prompt & Completion Tokens</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">Platform AI Model</p>
              <p className="text-sm font-bold text-[#274690] mt-1">GPT-4o & Claude 3.5</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Super Admin Configured</p>
            </div>
          </div>
        </div>
      )}

      {/* TEAM & STORAGE TABS */}
      {(activeTab === "team" || activeTab === "storage") && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
          <Badge className="bg-[#274690] text-white font-bold">Analytics Data Synced</Badge>
          <h3 className="text-base font-bold text-slate-900">
            {activeTab === "team" ? "Team Productivity Metrics" : "Organisation Storage Breakdown"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === "team"
              ? "Tracks 156 total users, 124 active members, and department productivity metrics."
              : "68.4 GB used out of 100 GB total allocated S3 cloud storage quota."}
          </p>
        </div>
      )}
    </div>
  );
}
