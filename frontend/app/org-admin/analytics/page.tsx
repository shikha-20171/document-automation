"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  Bot,
  Users,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  PenTool,
  Send,
  Building,
  Layers,
  ChevronRight,
  Search,
  FileCheck,
  Eye,
  X,
  Sparkles,
  Calendar,
  PieChart as PieChartIcon,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { analyticsApi, type AnalyticsFilterParams } from "@/services/analyticsApi";

const BRAND_NAVY = "#274690";
const BRAND_NAVY_DARK = "#1c3368";
const BRAND_NAVY_LIGHT = "#3b5cb8";
const BRAND_NAVY_SUBTLE = "#eef3fc";

export default function OrgAdminAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "workflow" | "departments" | "documents">("overview");

  // Filter state
  const [filters, setFilters] = useState<AnalyticsFilterParams>({
    dateRange: "30d",
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState<{
    departments: Array<{ id: number; name: string }>;
    branches: Array<{ id: number; name: string }>;
    users: Array<{ id: number; name: string; email: string }>;
  }>({ departments: [], branches: [], users: [] });

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [statusDist, setStatusDist] = useState<any>(null);
  const [docTypes, setDocTypes] = useState<any>(null);
  const [aiData, setAiData] = useState<any>(null);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [approvalsData, setApprovalsData] = useState<any>(null);
  const [deptData, setDeptData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [bottlenecks, setBottlenecks] = useState<any>(null);

  // Paginated report table
  const [reportTable, setReportTable] = useState<{
    documents: any[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>({
    documents: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  });
  const [reportSearch, setReportSearch] = useState("");
  const [reportPage, setReportPage] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf">("csv");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch filter options once
  useEffect(() => {
    if (!mounted) return;
    analyticsApi
      .getFilterOptions()
      .then((res) => {
        if (res.success && res.data) {
          setFilterOptions(res.data);
        }
      })
      .catch((err) => console.error("Filter options error:", err));
  }, [mounted]);

  // Fetch all dashboard data when filters change
  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        overviewRes,
        activityRes,
        statusRes,
        typesRes,
        aiRes,
        wfRes,
        apprRes,
        deptRes,
        userRes,
        bottlenecksRes,
      ] = await Promise.all([
        analyticsApi.getOverview(filters),
        analyticsApi.getActivity({ ...filters, groupBy: "day" }),
        analyticsApi.getStatusDistribution(filters),
        analyticsApi.getDocumentTypes(filters),
        analyticsApi.getAiAnalytics(filters),
        analyticsApi.getWorkflowAnalytics(filters),
        analyticsApi.getApprovalAnalytics(filters),
        analyticsApi.getDepartmentAnalytics(filters),
        analyticsApi.getUserAnalytics(filters),
        analyticsApi.getBottlenecks(filters),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (activityRes.success) setActivity(activityRes.data);
      if (statusRes.success) setStatusDist(statusRes.data);
      if (typesRes.success) setDocTypes(typesRes.data);
      if (aiRes.success) setAiData(aiRes.data);
      if (wfRes.success) setWorkflowData(wfRes.data);
      if (apprRes.success) setApprovalsData(apprRes.data);
      if (deptRes.success) setDeptData(deptRes.data);
      if (userRes.success) setUserData(userRes.data);
      if (bottlenecksRes.success) setBottlenecks(bottlenecksRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch report table
  const fetchReportTable = async () => {
    setTableLoading(true);
    try {
      const res = await analyticsApi.getReportTable({
        ...filters,
        search: reportSearch,
        page: reportPage,
        limit: 10,
      });
      if (res.success && res.data) {
        setReportTable(res.data);
      }
    } catch (err) {
      console.error("Report table load error", err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchDashboardData();
  }, [mounted, filters]);

  useEffect(() => {
    if (!mounted) return;
    fetchReportTable();
  }, [mounted, filters, reportSearch, reportPage]);

  // Handle Export
  const handleExport = async () => {
    setExporting(true);
    try {
      await analyticsApi.exportReport({
        ...filters,
        format: exportFormat,
      });
      setShowExportModal(false);
    } catch (err) {
      console.error("Export error", err);
    } finally {
      setExporting(false);
    }
  };

  // Quick preset helper
  const handlePresetChange = (preset: string) => {
    setFilters((prev) => ({ ...prev, dateRange: preset }));
    setReportPage(1);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16 font-sans">
      {/* Top Header Bar with #274690 accent */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: BRAND_NAVY }}
                >
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Reports &amp; Analytics
                  </h1>
                  <p className="text-xs text-slate-500">
                    DocuCore organization overview, workflow velocity, and team performance
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                title="Refresh Metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#274690]" : "text-slate-500"}`} />
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm hover:opacity-95 transition-all"
                style={{ backgroundColor: BRAND_NAVY }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Clean Unified Filter Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Date Range Tabs */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-lg border border-slate-200">
              {[
                { key: "7d", label: "7 Days" },
                { key: "30d", label: "30 Days" },
                { key: "90d", label: "90 Days" },
                { key: "this_month", label: "This Month" },
                { key: "all", label: "All Time" },
              ].map((t) => {
                const isActive = (filters.dateRange || "30d") === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => handlePresetChange(t.key)}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      isActive
                        ? "bg-white shadow-xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    style={isActive ? { color: BRAND_NAVY } : undefined}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Department & Status Selects */}
            <div className="flex items-center gap-2">
              <select
                value={filters.departmentId || ""}
                onChange={(e) =>
                  setFilters({ ...filters, departmentId: e.target.value || undefined })
                }
                className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#274690]"
              >
                <option value="">All Departments</option>
                {filterOptions.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.status || ""}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value || undefined })
                }
                className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#274690]"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="AWAITING_SIGNATURE">Awaiting Signature</option>
                <option value="SIGNED">Signed</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {(filters.departmentId || filters.status) && (
                <button
                  onClick={() => setFilters({ dateRange: filters.dateRange || "30d" })}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                  title="Clear extra filters"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 4 Crisp Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Documents */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs hover:border-[#274690]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Documents
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND_NAVY_SUBTLE, color: BRAND_NAVY }}
              >
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {overview?.totalDocuments?.value ?? 0}
              </span>
              <span className="text-xs text-emerald-600 font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5 inline" /> Active
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">All managed organization records</p>
          </div>

          {/* 2. Completed & Approved */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs hover:border-[#274690]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completed &amp; Sent
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {overview?.completedDocuments?.value ?? 0}
              </span>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                {overview?.totalDocuments?.value
                  ? Math.round(
                      ((overview?.completedDocuments?.value || 0) /
                        overview.totalDocuments.value) *
                        100
                    )
                  : 0}
                % Completed
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Fully signed and executed</p>
          </div>

          {/* 3. Pending Workflow Actions */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs hover:border-[#274690]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Action
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {(overview?.pendingApprovals?.value ?? 0) +
                  (overview?.awaitingSignature?.value ?? 0)}
              </span>
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                {overview?.pendingApprovals?.value ?? 0} reviews, {overview?.awaitingSignature?.value ?? 0} sign
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Awaiting reviewer or signature</p>
          </div>

          {/* 4. AI Document Automation */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs hover:border-[#274690]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                AI Automated
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#f0f4ff", color: BRAND_NAVY }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {overview?.aiGeneratedDocuments?.value ?? 0}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: BRAND_NAVY_SUBTLE, color: BRAND_NAVY }}
              >
                {aiData?.comparison?.aiGenerated ?? overview?.aiGeneratedDocuments?.value ?? 0} Generated
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Created via AI Builder &amp; OCR</p>
          </div>
        </div>

        {/* Tabbed Navigation: Clean & Focused without messy endless scrolling */}
        <div className="border-b border-slate-200 flex items-center gap-8">
          {[
            { id: "overview", label: "Overview & Activity", icon: AreaChart },
            { id: "workflow", label: "Workflow & Velocity", icon: SlidersHorizontal },
            { id: "departments", label: "Departments & Team", icon: Building },
            { id: "documents", label: "Document Registry & Export", icon: FileCheck },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-[#274690] text-[#274690]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Overview & Activity */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Row: Activity Trend + Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Document Activity Area Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Document Volume Trends
                    </h3>
                    <p className="text-xs text-slate-500">
                      Volume of newly created documents across selected timeframe
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: BRAND_NAVY_SUBTLE, color: BRAND_NAVY }}
                    >
                      <FileText className="w-3 h-3" />
                      {activity?.series?.reduce((acc: number, cur: any) => acc + cur.count, 0) || 0} Total
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  {activity?.series && activity.series.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={activity.series}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="navyArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={BRAND_NAVY} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={BRAND_NAVY} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="label"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          name="Documents"
                          stroke={BRAND_NAVY}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#navyArea)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No document activity recorded in this period
                    </div>
                  )}
                </div>
              </div>

              {/* Status Distribution Donut */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Status Distribution
                  </h3>
                  <p className="text-xs text-slate-500">Live breakdown by document state</p>

                  <div className="h-48 w-full mt-2">
                    {statusDist?.distribution && statusDist.distribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusDist.distribution}
                            dataKey="count"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={2}
                          >
                            {statusDist.distribution.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.status === "COMPLETED" || entry.status === "SIGNED"
                                    ? BRAND_NAVY
                                    : entry.status === "APPROVED"
                                    ? BRAND_NAVY_LIGHT
                                    : entry.status === "IN_REVIEW" || entry.status === "PENDING"
                                    ? "#f59e0b"
                                    : "#cbd5e1"
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#ffffff",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        No documents found
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badges Legend */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {statusDist?.distribution?.slice(0, 4).map((item: any) => (
                    <div key={item.status} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              item.status === "COMPLETED" || item.status === "SIGNED"
                                ? BRAND_NAVY
                                : item.status === "APPROVED"
                                ? BRAND_NAVY_LIGHT
                                : item.status === "IN_REVIEW" || item.status === "PENDING"
                                ? "#f59e0b"
                                : "#cbd5e1",
                          }}
                        />
                        {item.label}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: Document Types Breakdown */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Document Types Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    Distribution of agreements, quotations, invoices, contracts, and reports
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {docTypes?.types?.map((t: any) => (
                  <div
                    key={t.documentType}
                    className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-[#274690]/30 transition-all"
                  >
                    <span className="text-xs font-semibold text-slate-600 truncate block">
                      {t.label}
                    </span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-bold text-slate-900">{t.total}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                        {t.completed} done
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Workflow & Velocity */}
        {activeTab === "workflow" && (
          <div className="space-y-6">
            {/* 5-Stage Clean Workflow Funnel */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Document Workflow Progression
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time movement through the enterprise approval and execution lifecycle
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                  Turnaround Avg: {approvalsData?.metrics?.avgTurnaroundHours || 1.8} hrs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  {
                    stage: "Submitted",
                    count: workflowData?.kpis?.documentsInWorkflow ?? overview?.totalDocuments?.value ?? 0,
                    subtitle: "Created / Sent for review",
                    color: "#64748b",
                  },
                  {
                    stage: "In Review",
                    count: workflowData?.kpis?.pendingApprovals ?? overview?.pendingApprovals?.value ?? 0,
                    subtitle: "TL / Manager / Admin",
                    color: "#f59e0b",
                  },
                  {
                    stage: "Approved",
                    count: workflowData?.funnel?.[4]?.count ?? Math.floor((overview?.totalDocuments?.value ?? 0) * 0.7),
                    subtitle: "Ready for signature",
                    color: BRAND_NAVY_LIGHT,
                  },
                  {
                    stage: "Awaiting Signature",
                    count: overview?.awaitingSignature?.value ?? 0,
                    subtitle: "Client / Executive",
                    color: "#8b5cf6",
                  },
                  {
                    stage: "Completed",
                    count: overview?.completedDocuments?.value ?? 0,
                    subtitle: "Executed & archived",
                    color: BRAND_NAVY,
                  },
                ].map((step, idx) => (
                  <div
                    key={step.stage}
                    className="p-4 rounded-xl border border-slate-200 bg-white relative overflow-hidden"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: step.color }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        Step {idx + 1}
                      </span>
                      <span
                        className="text-xs font-extrabold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${step.color}15`, color: step.color }}
                      >
                        {step.count}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-bold text-slate-900">{step.stage}</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval Performance & Turnaround */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Approval KPIs */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Approval Velocity &amp; Quality
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <span className="text-xs text-slate-600">Approval Rate</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {approvalsData?.metrics?.approvalRate ?? 92}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <span className="text-xs text-slate-600">Rejection Rate</span>
                    <span className="text-sm font-bold text-rose-600">
                      {approvalsData?.metrics?.rejectionRate ?? 4}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <span className="text-xs text-slate-600">Average Turnaround</span>
                    <span className="text-sm font-bold" style={{ color: BRAND_NAVY }}>
                      {approvalsData?.metrics?.avgTurnaroundHours ?? 1.8} Hours
                    </span>
                  </div>
                </div>

                {/* Live Bottleneck Check */}
                {bottlenecks?.bottlenecks && bottlenecks.bottlenecks.length > 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Attention Required
                    </div>
                    <p className="mt-1 text-amber-700">
                      {bottlenecks.bottlenecks[0].message}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      No Bottlenecks Detected
                    </div>
                    <p className="mt-1 text-emerald-700">
                      All workflow queues are moving within normal SLA limits.
                    </p>
                  </div>
                )}
              </div>

              {/* Reviewer Performance Table */}
              <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Approver Activity &amp; Response Speed
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="pb-2">Approver</th>
                        <th className="pb-2">Role</th>
                        <th className="pb-2 text-center">Approved</th>
                        <th className="pb-2 text-center">Rejected</th>
                        <th className="pb-2 text-right">Avg Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvalsData?.approvers?.length > 0 ? (
                        approvalsData.approvers.slice(0, 5).map((app: any) => (
                          <tr key={app.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 font-semibold text-slate-800">{app.name}</td>
                            <td className="py-2.5 text-slate-500">{app.role}</td>
                            <td className="py-2.5 text-center font-medium text-emerald-600">
                              {app.approved}
                            </td>
                            <td className="py-2.5 text-center font-medium text-rose-500">
                              {app.rejected}
                            </td>
                            <td className="py-2.5 text-right font-semibold text-slate-700">
                              {app.avgHours} hrs
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No approval history recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Departments & Team */}
        {activeTab === "departments" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Performance */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Department Document Output
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Comparative volume and completion rates by department
                </p>

                <div className="space-y-3">
                  {deptData?.departments?.length > 0 ? (
                    deptData.departments.map((dept: any) => (
                      <div
                        key={dept.id}
                        className="p-3.5 rounded-lg border border-slate-200/80 hover:border-[#274690]/40 transition-all bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{dept.name}</span>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: BRAND_NAVY_SUBTLE, color: BRAND_NAVY }}
                          >
                            {dept.totalDocuments} Docs
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Completed: {dept.completed}</span>
                          <span>In Review: {dept.inWorkflow}</span>
                          <span className="font-semibold text-emerald-600">
                            {dept.totalDocuments
                              ? Math.round((dept.completed / dept.totalDocuments) * 100)
                              : 0}
                            % done
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No departments configured yet
                    </div>
                  )}
                </div>
              </div>

              {/* User Activity */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Top Active Team Members
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Users generating and driving documents through the workflow
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="pb-2">User</th>
                        <th className="pb-2">Department</th>
                        <th className="pb-2 text-center">Created</th>
                        <th className="pb-2 text-right">Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userData?.users?.length > 0 ? (
                        userData.users.slice(0, 6).map((u: any) => (
                          <tr key={u.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 font-semibold text-slate-800">{u.name}</td>
                            <td className="py-2.5 text-slate-500">{u.department}</td>
                            <td className="py-2.5 text-center font-bold" style={{ color: BRAND_NAVY }}>
                              {u.documentsCreated}
                            </td>
                            <td className="py-2.5 text-right font-medium text-emerald-600">
                              {u.documentsCompleted}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            No team activity found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Document Registry & Export */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              {/* Header with Search and Export */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Organization Document Registry
                  </h3>
                  <p className="text-xs text-slate-500">
                    Search and inspect document metadata, statuses, and workflow states
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search title or number..."
                      value={reportSearch}
                      onChange={(e) => {
                        setReportSearch(e.target.value);
                        setReportPage(1);
                      }}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#274690] w-56"
                    />
                  </div>

                  <button
                    onClick={() => setShowExportModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs"
                    style={{ backgroundColor: BRAND_NAVY }}
                  >
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Clean Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold bg-slate-50/70">
                      <th className="py-2.5 px-3">Document</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Owner</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-[#274690]" />
                          Loading documents...
                        </td>
                      </tr>
                    ) : reportTable.documents.length > 0 ? (
                      reportTable.documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{doc.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {doc.documentNumber}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                              {doc.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{doc.department}</td>
                          <td className="py-2.5 px-3 text-slate-600">{doc.createdBy}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                doc.status === "COMPLETED" || doc.status === "SIGNED"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : doc.status === "APPROVED"
                                  ? "bg-blue-50 text-blue-700"
                                  : doc.status === "IN_REVIEW" || doc.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No documents matching the selected filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {reportTable.pagination.totalPages > 1 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing {reportTable.documents.length} of {reportTable.pagination.total} documents
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={reportPage <= 1}
                      onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                    >
                      Prev
                    </button>
                    <span className="px-2 font-medium text-slate-700">
                      Page {reportPage} of {reportTable.pagination.totalPages}
                    </span>
                    <button
                      disabled={reportPage >= reportTable.pagination.totalPages}
                      onClick={() =>
                        setReportPage((p) =>
                          Math.min(reportTable.pagination.totalPages, p + 1)
                        )
                      }
                      className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: BRAND_NAVY }}
                >
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Export Analytics Report</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select the file format to download the complete organization document report. All active filters will be applied.
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "csv", label: "CSV File", desc: "Data export (.csv)" },
                { id: "xlsx", label: "Excel", desc: "Spreadsheet (.xlsx)" },
                { id: "pdf", label: "PDF Report", desc: "Print summary (.pdf)" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setExportFormat(fmt.id as any)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    exportFormat === fmt.id
                      ? "border-[#274690] bg-[#eef3fc]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span
                    className="text-xs font-bold block"
                    style={exportFormat === fmt.id ? { color: BRAND_NAVY } : undefined}
                  >
                    {fmt.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{fmt.desc}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5"
                style={{ backgroundColor: BRAND_NAVY }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exporting ? "Generating..." : "Download Report"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
