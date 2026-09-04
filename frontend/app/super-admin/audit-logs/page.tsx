"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  FileText,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Download,
  ChevronRight,
  ChevronLeft,
  Calendar,
  X,
  Eye,
  Activity,
  Sliders,
  TrendingUp,
  BarChart3,
  Lock,
  Zap,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/axios";

export interface AuditLogItem {
  id: string;
  eventId: string;
  timestamp: string;
  createdAt: string;
  actorUserId?: string;
  actorName: string;
  actorRole: string;
  actorType?: string;
  organisationId?: string;
  organisationName?: string;
  module?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "WARNING" | "CRITICAL";
  status: "SUCCESS" | "FAILED" | "DENIED";
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  operatingSystem?: string;
  location?: string;
  requestId?: string;
  description?: string;
  metadata?: Record<string, any>;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
}

export interface AuditOverviewData {
  totalEvents: number;
  eventsToday: number;
  successfulEvents: number;
  failedEvents: number;
  securityEvents: number;
  criticalEvents: number;
  adminActions: number;
  activeOrganisations: number;
  charts: {
    eventsOverTime: Array<{
      date: string;
      total: number;
      success: number;
      failed: number;
      security: number;
    }>;
    eventsByAction: Array<{ action: string; count: number }>;
    eventsByOrganisation: Array<{ organisation: string; count: number }>;
    eventsByRole: Array<{ role: string; count: number }>;
  };
}

export default function SuperAdminAuditLogsPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "activity_logs" | "security_events" | "admin_actions" | "export"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Overview Data & Timeline Window
  const [overview, setOverview] = useState<AuditOverviewData | null>(null);
  const [timelineDays, setTimelineDays] = useState<number>(7);

  // Dynamic Orgs List for dropdown filter
  const [organisationsList, setOrganisationsList] = useState<Array<{ id: string; name: string }>>([]);

  // Activity Logs & Tab Data
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });

  // Filter state
  const [search, setSearch] = useState("");
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected Log Drawer / Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Export State
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadOverview = async (days = timelineDays) => {
    try {
      const res = await apiClient.get(`/super-admin/audit-logs/overview?days=${days}`);
      if (res.data?.data) {
        setOverview(res.data.data);
      }
    } catch {
      // Handled silently
    }
  };

  const loadOrganisations = async () => {
    try {
      const res = await apiClient.get("/super-admin/organisations");
      if (res.data?.data && Array.isArray(res.data.data)) {
        setOrganisationsList(res.data.data.map((o: any) => ({ id: String(o.id), name: o.name })));
      }
    } catch {
      // Fallback
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (filterOrg !== "ALL") params.organisationId = filterOrg;
      if (filterRole !== "ALL") params.role = filterRole;
      if (filterCategory !== "ALL") params.category = filterCategory;
      if (filterAction !== "ALL") params.action = filterAction;
      if (filterSeverity !== "ALL") params.severity = filterSeverity;
      if (filterStatus !== "ALL") params.status = filterStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let res;
      if (activeTab === "security_events") {
        res = await apiClient.get("/super-admin/audit-logs/security-events", { params });
      } else if (activeTab === "admin_actions") {
        res = await apiClient.get("/super-admin/audit-logs/admin-actions", { params });
      } else {
        res = await apiClient.get("/super-admin/audit-logs", { params });
      }

      if (res.data?.data) {
        setLogs(res.data.data);
        if (res.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: res.data.pagination.total || 0,
            totalPages: res.data.pagination.totalPages || 1,
          }));
        }
      }
    } catch {
      showToast("Unable to load audit logs from server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview(timelineDays);
    loadOrganisations();
  }, [timelineDays]);

  useEffect(() => {
    if (activeTab !== "overview" && activeTab !== "export") {
      loadLogs();
    }
  }, [
    activeTab,
    pagination.page,
    pagination.limit,
    search,
    filterOrg,
    filterRole,
    filterCategory,
    filterAction,
    filterSeverity,
    filterStatus,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  const handleResetFilters = () => {
    setSearch("");
    setFilterOrg("ALL");
    setFilterRole("ALL");
    setFilterCategory("ALL");
    setFilterAction("ALL");
    setFilterSeverity("ALL");
    setFilterStatus("ALL");
    setStartDate("");
    setEndDate("");
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    showToast(`Generating ${exportFormat.toUpperCase()} audit export...`);
    try {
      const params: Record<string, any> = {
        format: exportFormat,
        search: search.trim() || undefined,
        organisationId: filterOrg !== "ALL" ? filterOrg : undefined,
        role: filterRole !== "ALL" ? filterRole : undefined,
        category: filterCategory !== "ALL" ? filterCategory : undefined,
        action: filterAction !== "ALL" ? filterAction : undefined,
        severity: filterSeverity !== "ALL" ? filterSeverity : undefined,
        status: filterStatus !== "ALL" ? filterStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const response = await apiClient.get("/super-admin/audit-logs/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: exportFormat === "csv" ? "text/csv;charset=utf-8;" : "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-logs-${Date.now()}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Successfully exported audit logs in ${exportFormat.toUpperCase()} format!`);
      loadOverview();
    } catch (err: any) {
      showToast(`Export error: ${err.message || "Failed to download"}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    const s = (sev || "INFO").toUpperCase();
    if (s === "CRITICAL") {
      return (
        <Badge className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 text-[10.5px] font-extrabold flex items-center gap-1">
          <ShieldAlert size={12} className="text-rose-600" /> CRITICAL
        </Badge>
      );
    }
    if (s === "HIGH" || s === "WARNING") {
      return (
        <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 text-[10.5px] font-extrabold flex items-center gap-1">
          <AlertTriangle size={12} className="text-amber-600" /> HIGH
        </Badge>
      );
    }
    if (s === "MEDIUM") {
      return (
        <Badge className="bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-200 text-[10.5px] font-bold">
          MEDIUM
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 text-[10.5px] font-bold">
        INFO
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "SUCCESS").toUpperCase();
    if (s === "SUCCESS") {
      return (
        <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-[10.5px] font-extrabold flex items-center gap-1">
          <CheckCircle2 size={11} className="text-emerald-500" /> SUCCESS
        </Badge>
      );
    }
    if (s === "DENIED") {
      return (
        <Badge className="bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 text-[10.5px] font-extrabold flex items-center gap-1">
          <Lock size={11} className="text-orange-500" /> DENIED
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 text-[10.5px] font-extrabold flex items-center gap-1">
        <X size={11} className="text-rose-500" /> FAILED
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/90 dark:bg-[#090d16] p-4 sm:p-6 space-y-6 font-sans text-slate-800 dark:text-slate-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 rounded-2xl px-4 py-3 shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 ${
            toastType === "success"
              ? "bg-[#1f3561] text-white border-white/20 shadow-blue-900/30"
              : "bg-rose-950 text-rose-100 border-rose-800"
          }`}
        >
          <Sparkles className="text-[#c96f4a]" size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#11192e] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#274690] text-white text-[11px] font-extrabold px-2.5 py-0.5">
              Platform Governance
            </Badge>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              ● Immutable Append-Only Audit Trail
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Audit Logs & Security Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Centralized visibility into platform, security, configuration, subscription, AI, OCR, storage, organisation and administrative events across all tenants.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={() => {
              loadOverview(timelineDays);
              if (activeTab !== "overview" && activeTab !== "export") loadLogs();
            }}
            variant="outline"
            size="sm"
            disabled={loading}
            className="text-xs font-bold gap-1.5 h-9 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            onClick={() => setActiveTab("export")}
            size="sm"
            className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
          >
            <Download size={15} />
            Export Logs
          </Button>
        </div>
      </div>

      {/* 5 Primary Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-bold scrollbar-none">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "activity_logs", label: "Activity Logs", icon: FileText, count: overview?.totalEvents },
          { id: "security_events", label: "Security Events", icon: ShieldAlert, count: overview?.securityEvents },
          { id: "admin_actions", label: "Admin Actions", icon: UserCheck, count: overview?.adminActions },
          { id: "export", label: "Exports", icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? "bg-[#274690] text-white shadow-md shadow-[#274690]/20 font-extrabold"
                  : "bg-white dark:bg-[#11192e] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800/80"
              }`}
            >
              <Icon size={14} className={isActive ? "text-[#c96f4a]" : ""} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 8 Key KPI Metric Cards (Database Aggregation) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10px] font-black text-slate-400 tracking-wider">TOTAL EVENTS</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {(overview?.totalEvents || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">PostgreSQL records</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10px] font-black text-slate-400 tracking-wider">EVENTS TODAY</span>
              <p className="text-xl font-black text-[#274690] dark:text-blue-400 mt-1">
                {(overview?.eventsToday || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Recorded today</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10px] font-black text-slate-400 tracking-wider">SUCCESSFUL EVENTS</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {(overview?.successfulEvents || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                {overview?.totalEvents ? Math.round(((overview.successfulEvents || 0) / overview.totalEvents) * 100) : 100}% rate
              </p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10px] font-black text-slate-400 tracking-wider">FAILED EVENTS</span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {(overview?.failedEvents || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-rose-500 mt-0.5">Action failures</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10px] font-black text-slate-400 tracking-wider">SECURITY EVENTS</span>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {(overview?.securityEvents || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">Auth & alerts</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10px] font-black text-slate-400 tracking-wider">CRITICAL EVENTS</span>
              <p className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1">
                {(overview?.criticalEvents || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">High severity</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10px] font-black text-slate-400 tracking-wider">ADMIN ACTIONS</span>
              <p className="text-xl font-black text-[#c96f4a] mt-1">
                {(overview?.adminActions || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Governance</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10px] font-black text-slate-400 tracking-wider">ACTIVE ORGANISATIONS</span>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {(overview?.activeOrganisations || organisationsList.length || 3).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Live tenants</p>
            </Card>
          </div>

          {/* Audit Event Volume Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4 gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Audit Event Volume Timeline</h3>
                  <p className="text-[11px] text-slate-500">Aggregated database events over the selected period</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  {[7, 30, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setTimelineDays(d)}
                      className={`px-3 py-1 rounded-lg transition ${
                        timelineDays === d
                          ? "bg-[#274690] text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              {overview?.charts?.eventsOverTime && overview.charts.eventsOverTime.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {overview.charts.eventsOverTime.map((item, idx) => (
                    <div key={`${item.date}-${idx}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">{item.date}</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold">
                          {item.total} events ({item.success} success, {item.failed} failed, {item.security} security)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                        <div
                          className="bg-[#274690] h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(6, (item.total / Math.max(1, overview.totalEvents || 10)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No audit events recorded yet.</p>
              )}
            </Card>

            {/* Top Platform Actions */}
            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Top Platform Actions</h3>
                <p className="text-[11px] text-slate-500">Counts aggregated from PostgreSQL</p>
              </div>

              {overview?.charts?.eventsByAction && overview.charts.eventsByAction.length > 0 ? (
                <div className="space-y-2.5">
                  {overview.charts.eventsByAction.map((a, idx) => (
                    <div key={`${a.action}-${idx}`} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                        {a.action}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-black shrink-0">
                        {a.count} events
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No actions recorded yet.</p>
              )}
            </Card>
          </div>

          {/* Events by Organisation & Role */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Events by Organisation</h3>
                <span className="text-[10px] text-slate-400 font-semibold">Click to filter activity logs</span>
              </div>
              <div className="space-y-2">
                {overview?.charts?.eventsByOrganisation && overview.charts.eventsByOrganisation.length > 0 ? (
                  overview.charts.eventsByOrganisation.map((o, idx) => (
                    <div
                      key={`${o.organisation}-${idx}`}
                      onClick={() => {
                        setSearch(o.organisation);
                        setActiveTab("activity_logs");
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold hover:bg-blue-50/60 dark:hover:bg-blue-950/30 cursor-pointer transition"
                    >
                      <span className="font-bold">{o.organisation}</span>
                      <span className="font-bold text-[#274690] dark:text-blue-400">{o.count} events</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No organisation events recorded.</p>
                )}
              </div>
            </Card>

            <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Events by User Role</h3>
                <span className="text-[10px] text-slate-400 font-semibold">Role distribution</span>
              </div>
              <div className="space-y-2">
                {overview?.charts?.eventsByRole && overview.charts.eventsByRole.length > 0 ? (
                  overview.charts.eventsByRole.map((r, idx) => (
                    <div
                      key={`${r.role}-${idx}`}
                      onClick={() => {
                        setFilterRole(r.role);
                        setActiveTab("activity_logs");
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 cursor-pointer transition"
                    >
                      <span className="font-bold">{r.role}</span>
                      <span className="font-bold text-emerald-600">{r.count} actions</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No role events recorded.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TABS 2, 3, 4: ACTIVITY LOGS / SECURITY EVENTS / ADMIN ACTIONS */}
      {/* ---------------------------------------------------------------- */}
      {["activity_logs", "security_events", "admin_actions"].includes(activeTab) && (
        <div className="space-y-4">
          {/* Search & Multi-Filter Toolbar */}
          <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Actor, Email, Org, Action, IP..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                />
              </div>

              {/* Organisation Dropdown */}
              <div>
                <select
                  value={filterOrg}
                  onChange={(e) => {
                    setFilterOrg(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                >
                  <option value="ALL">All Organisations</option>
                  {organisationsList.map((org, idx) => (
                    <option key={`${org.id}-${idx}`} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* User Role Filter */}
              <div>
                <select
                  value={filterRole}
                  onChange={(e) => {
                    setFilterRole(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                >
                  <option value="ALL">All Roles</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ORGANISATION_ADMIN">ORGANISATION_ADMIN</option>
                  <option value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER</option>
                  <option value="TEAM_LEADER">TEAM_LEADER</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="VIEWER">VIEWER</option>
                  <option value="GUEST">GUEST</option>
                  <option value="SYSTEM">SYSTEM</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                >
                  <option value="ALL">All Categories</option>
                  <option value="AUTHENTICATION">AUTHENTICATION</option>
                  <option value="SECURITY">SECURITY</option>
                  <option value="ORGANISATION">ORGANISATION</option>
                  <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                  <option value="STORAGE">STORAGE</option>
                  <option value="AI">AI</option>
                  <option value="OCR">OCR</option>
                  <option value="USER">USER</option>
                  <option value="RBAC">RBAC</option>
                  <option value="SYSTEM">SYSTEM</option>
                  <option value="EXPORT">EXPORT</option>
                </select>
              </div>
            </div>

            {/* Severity, Status, Date Range Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <select
                  value={filterSeverity}
                  onChange={(e) => {
                    setFilterSeverity(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                >
                  <option value="ALL">All Severities</option>
                  <option value="INFO">INFO</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                  <option value="DENIED">DENIED</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold text-[10px]">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold text-[10px]">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  size="sm"
                  className="h-9 w-full text-xs font-bold rounded-xl"
                >
                  Reset
                </Button>
                <select
                  value={pagination.limit}
                  onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
                  className="h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-bold text-xs"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Activity Logs Table */}
          <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">TIMESTAMP</th>
                    <th className="p-3.5">ACTOR</th>
                    <th className="p-3.5">ROLE</th>
                    <th className="p-3.5">ORGANISATION</th>
                    <th className="p-3.5">ACTION</th>
                    <th className="p-3.5">RESOURCE</th>
                    <th className="p-3.5">STATUS</th>
                    <th className="p-3.5">SEVERITY</th>
                    <th className="p-3.5">IP ADDRESS</th>
                    <th className="p-3.5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {logs.map((log, idx) => (
                    <tr
                      key={`${log.id || "log"}-${idx}`}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {log.actorName}
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {log.actorRole || "SUPER_ADMIN"}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-semibold">
                        {log.organisationName || "Platform System"}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#274690] dark:text-blue-400">
                        {log.action}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {log.resourceType || "PLATFORM"}
                      </td>
                      <td className="p-3.5">{getStatusBadge(log.status)}</td>
                      <td className="p-3.5">{getSeverityBadge(log.severity)}</td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">{log.ipAddress || "127.0.0.1"}</td>
                      <td className="p-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="h-7 px-2.5 rounded-lg text-xs font-bold text-[#274690] hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        >
                          <Eye size={13} className="mr-1" /> Inspect
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {logs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-500 text-xs">
                        <ShieldAlert size={28} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="font-bold">No matching audit logs found.</p>
                        <p className="text-[11px] font-normal text-slate-400 mt-1">
                          Try adjusting your search query, dates, or filter parameters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">
                Showing {logs.length} of {pagination.total} events (Page {pagination.page} of {pagination.totalPages})
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="h-8 px-2.5 rounded-xl text-xs"
                >
                  <ChevronLeft size={14} className="mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="h-8 px-2.5 rounded-xl text-xs"
                >
                  Next <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 5: EXPORTS */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "export" && (
        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] p-6 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Export Platform Audit Logs</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Export filtered immutable audit trail records for compliance, governance, and enterprise forensics.
            </p>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-2">Select Export Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat("csv")}
                  className={`p-4 rounded-2xl border text-left transition ${
                    exportFormat === "csv"
                      ? "border-[#274690] bg-[#274690]/5 dark:bg-[#274690]/15"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">CSV Spreadsheet (.csv)</div>
                  <p className="text-[11px] text-slate-500 mt-1">Tabular spreadsheet compatible with Excel, Sheets, and SIEM parsers.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat("json")}
                  className={`p-4 rounded-2xl border text-left transition ${
                    exportFormat === "json"
                      ? "border-[#274690] bg-[#274690]/5 dark:bg-[#274690]/15"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Structured JSON (.json)</div>
                  <p className="text-[11px] text-slate-500 mt-1">Full detailed payload with complete before/after metadata.</p>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 border border-slate-200/80 dark:border-slate-700">
              <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Active Filters Included in Export:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Search Keyword: <span className="font-bold">{search || "None (All records)"}</span></div>
                <div>Organisation: <span className="font-bold">{filterOrg === "ALL" ? "All" : filterOrg}</span></div>
                <div>Severity: <span className="font-bold">{filterSeverity}</span></div>
                <div>Status: <span className="font-bold">{filterStatus}</span></div>
                <div>Date Range: <span className="font-bold">{startDate && endDate ? `${startDate} to ${endDate}` : "Full History"}</span></div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-[#274690] hover:bg-[#1f3561] text-white font-bold h-10 rounded-xl gap-2 text-xs"
              >
                <Download size={16} className={isExporting ? "animate-bounce" : ""} />
                {isExporting ? "Streaming Export..." : `Download ${exportFormat.toUpperCase()} File`}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* DRAWER / MODAL: AUDIT EVENT DETAILS & PREVIOUS/NEW VALUE DIFF */}
      {/* ---------------------------------------------------------------- */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Audit Event Telemetry</h3>
                  {getStatusBadge(selectedLog.status)}
                  {getSeverityBadge(selectedLog.severity)}
                </div>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">{selectedLog.eventId}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Event Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 font-bold block">TIMESTAMP</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 font-bold block">ACTOR</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedLog.actorName} ({selectedLog.actorRole})
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 font-bold block">ORGANISATION</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.organisationName || "Platform"}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 font-bold block">ACTION</span>
                <span className="font-mono font-bold text-[#274690] dark:text-blue-400">{selectedLog.action}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 font-bold block">RESOURCE</span>
                <span className="font-mono font-semibold">{selectedLog.resourceType || "PLATFORM"}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 font-bold block">IP ADDRESS</span>
                <span className="font-mono font-semibold">{selectedLog.ipAddress || "127.0.0.1"}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 font-bold block">REQUEST ID</span>
                <span className="font-mono text-[11px]">{selectedLog.requestId || "req_internal"}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 col-span-2">
                <span className="text-[10px] text-slate-400 font-bold block">USER AGENT / PLATFORM</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate block">
                  {selectedLog.userAgent || "Internal Service Client"}
                </span>
              </div>
            </div>

            {/* Side-by-side Previous Value vs New Value Change Diff */}
            {(selectedLog.beforeData || selectedLog.afterData) && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Previous Value vs New Value Diff</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                    <span className="text-[10.5px] font-black text-rose-700 dark:text-rose-400 block mb-1">PREVIOUS VALUE</span>
                    <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {selectedLog.beforeData ? JSON.stringify(selectedLog.beforeData, null, 2) : "None (Initial State)"}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                    <span className="text-[10.5px] font-black text-emerald-700 dark:text-emerald-400 block mb-1">NEW VALUE</span>
                    <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {selectedLog.afterData ? JSON.stringify(selectedLog.afterData, null, 2) : "None (Deleted State)"}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata JSON */}
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Safe Request Metadata</h4>
                <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
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