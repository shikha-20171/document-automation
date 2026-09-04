"use client";

import { useState, useEffect } from "react";
import {
  ScanText,
  Sliders,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Activity,
  Layers,
  FileText,
  Edit2,
  Trash2,
  Zap,
  Power,
  RotateCcw,
  Ban,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Check,
  Eye,
  EyeOff,
  X,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import superAdminOcrApi, {
  type OCRProviderItem,
  type OCRJobItem,
  type OCRLogItem,
  type OCROverviewData,
  type OCRHealthItem,
} from "@/services/superAdminOcrApi";

export default function OCRManagementPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "providers" | "jobs" | "usage" | "logs" | "health"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Data states
  const [overview, setOverview] = useState<OCROverviewData | null>(null);
  const [providers, setProviders] = useState<OCRProviderItem[]>([]);
  const [jobs, setJobs] = useState<OCRJobItem[]>([]);
  const [jobFilterStatus, setJobFilterStatus] = useState<string>("ALL");
  const [usageData, setUsageData] = useState<any>(null);
  const [costData, setCostData] = useState<any>(null);
  const [logs, setLogs] = useState<OCRLogItem[]>([]);
  const [healthData, setHealthData] = useState<{
    ocrQueueStatus: string;
    activeQueueJobs: number;
    providers: OCRHealthItem[];
  } | null>(null);

  // Modals
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<OCRProviderItem | null>(null);
  const [providerForm, setProviderForm] = useState({
    providerName: "",
    providerCode: "",
    apiEndpoint: "",
    authType: "API_KEY",
    region: "global",
    credentials: "",
    priority: 1,
    isEnabled: true,
    isDefault: false,
    status: "ACTIVE",
    supportedFormats: ["PDF", "PNG", "JPG", "TIFF"],
  });

  const [selectedJob, setSelectedJob] = useState<OCRJobItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreds, setShowCreds] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ovRes, provRes, jobRes, useRes, costRes, logRes, healthRes] = await Promise.all([
        superAdminOcrApi.getOverview().catch(() => ({ data: null })),
        superAdminOcrApi.getProviders().catch(() => ({ data: [] })),
        superAdminOcrApi.getJobs().catch(() => ({ data: [] })),
        superAdminOcrApi.getUsage().catch(() => ({ data: null })),
        superAdminOcrApi.getCosts().catch(() => ({ data: null })),
        superAdminOcrApi.getLogs().catch(() => ({ data: [] })),
        superAdminOcrApi.getHealth().catch(() => ({ data: null })),
      ]);

      if (ovRes.data) setOverview(ovRes.data);
      if (provRes.data) setProviders(provRes.data);
      if (jobRes.data) setJobs(jobRes.data);
      if (useRes.data) setUsageData(useRes.data);
      if (costRes.data) setCostData(costRes.data);
      if (logRes.data) setLogs(logRes.data);
      if (healthRes.data) setHealthData(healthRes.data);
    } catch {
      showToast("Error synchronizing OCR management data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Provider CRUD
  const handleOpenAddProvider = () => {
    setEditingProvider(null);
    setProviderForm({
      providerName: "",
      providerCode: "",
      apiEndpoint: "https://documentai.googleapis.com/v1",
      authType: "SERVICE_ACCOUNT",
      region: "us-central1",
      credentials: "",
      priority: providers.length + 1,
      isEnabled: true,
      isDefault: false,
      status: "ACTIVE",
      supportedFormats: ["PDF", "PNG", "JPG", "TIFF"],
    });
    setShowCreds(false);
    setShowProviderModal(true);
  };

  const handleOpenEditProvider = (p: OCRProviderItem) => {
    setEditingProvider(p);
    setProviderForm({
      providerName: p.providerName,
      providerCode: p.providerCode,
      apiEndpoint: p.apiEndpoint || "",
      authType: p.authType,
      region: p.region || "global",
      credentials: "",
      priority: p.priority,
      isEnabled: p.isEnabled,
      isDefault: p.isDefault,
      status: p.status,
      supportedFormats: p.supportedFormats || ["PDF", "PNG", "JPG", "TIFF"],
    });
    setShowCreds(false);
    setShowProviderModal(true);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerForm.providerName || !providerForm.providerCode) {
      showToast("Please provide provider name and code", "error");
      return;
    }
    setActionLoading(true);
    try {
      if (editingProvider) {
        await superAdminOcrApi.updateProvider(editingProvider.id, providerForm);
        showToast(`✅ OCR Provider "${providerForm.providerName}" updated`);
      } else {
        await superAdminOcrApi.createProvider(providerForm);
        showToast(`✅ OCR Provider "${providerForm.providerName}" created`);
      }
      setShowProviderModal(false);
      const res = await superAdminOcrApi.getProviders();
      if (res.data) setProviders(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error saving OCR provider", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleProvider = async (id: string, isEnabled: boolean) => {
    const next = !isEnabled;
    try {
      await superAdminOcrApi.toggleProvider(id, next);
      showToast(`OCR Provider ${next ? "Enabled" : "Disabled"}`);
      const res = await superAdminOcrApi.getProviders();
      if (res.data) setProviders(res.data);
    } catch {
      showToast("Error updating provider status", "error");
    }
  };

  const handleTestProvider = async (id: string, name: string) => {
    setActionLoading(true);
    showToast(`Testing connection to ${name}...`);
    try {
      const res = await superAdminOcrApi.testProvider(id);
      if (res.data?.success) {
        showToast(`✅ ${res.data.message || `Connected to ${name}`}`);
      } else {
        showToast(`❌ Connection notice: ${res.data?.message || "Check credentials"}`, "error");
      }
      const pRes = await superAdminOcrApi.getProviders();
      if (pRes.data) setProviders(pRes.data);
    } catch (err: any) {
      showToast(`❌ Test error: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!confirm(`Delete OCR provider "${name}"?`)) return;
    try {
      await superAdminOcrApi.deleteProvider(id);
      showToast(`OCR Provider "${name}" removed`);
      const res = await superAdminOcrApi.getProviders();
      if (res.data) setProviders(res.data);
    } catch {
      showToast("Error deleting OCR provider", "error");
    }
  };

  // Profile CRUD
  // Job Actions
  const handleRetryJob = async (id: string, code: string) => {
    try {
      await superAdminOcrApi.retryJob(id);
      showToast(`OCR Job ${code} queued for retry`);
      const res = await superAdminOcrApi.getJobs();
      if (res.data) setJobs(res.data);
    } catch {
      showToast("Error retrying OCR job", "error");
    }
  };

  const handleReprocessJob = async (id: string, code: string) => {
    try {
      await superAdminOcrApi.reprocessJob(id);
      showToast(`OCR Job ${code} re-processing initiated`);
      const res = await superAdminOcrApi.getJobs();
      if (res.data) setJobs(res.data);
    } catch {
      showToast("Error re-processing OCR job", "error");
    }
  };

  const handleCancelJob = async (id: string, code: string) => {
    try {
      await superAdminOcrApi.cancelJob(id);
      showToast(`OCR Job ${code} cancelled`);
      const res = await superAdminOcrApi.getJobs();
      if (res.data) setJobs(res.data);
    } catch {
      showToast("Error cancelling OCR job", "error");
    }
  };

  const handleTestAllHealth = async () => {
    setActionLoading(true);
    showToast("Running diagnostics across OCR providers...");
    try {
      await superAdminOcrApi.testAllHealth();
      showToast("✅ OCR Health diagnostics complete!");
      const res = await superAdminOcrApi.getHealth();
      if (res.data) setHealthData(res.data);
    } catch {
      showToast("Error testing OCR health", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (jobFilterStatus === "ALL") return true;
    return j.status === jobFilterStatus;
  });

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
          <ScanText className="text-[#c96f4a]" size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#11192e] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#274690] text-white text-[11px] font-extrabold px-2.5 py-0.5">
              OCR Pipeline Suite
            </Badge>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              ● Optical Vision Processing Ready
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            OCR & Document Parsing Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Configure optical character recognition providers, specialized document profiles, extraction queues, page-based quotas, and engine health.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={loadAllData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="text-xs font-bold gap-1.5 h-9 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </Button>
          <Button
            onClick={handleOpenAddProvider}
            size="sm"
            className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
          >
            <Plus size={15} />
            Add OCR Provider
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-bold scrollbar-none">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "providers", label: "OCR Providers", icon: ScanText, count: providers.length },
          { id: "jobs", label: "Jobs", icon: Clock, count: jobs.length },
          { id: "usage", label: "Usage & Costs", icon: DollarSign },
          { id: "logs", label: "Logs", icon: FileText, count: logs.length },
          { id: "health", label: "Health", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10.5px] font-black text-slate-400 tracking-wider">TOTAL OCR REQUESTS</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {(overview?.totalOcrRequests || 0).toLocaleString()}
              </p>
              <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                <TrendingUp size={12} /> {overview?.successRate || 99.2}% success
              </p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10.5px] font-black text-slate-400 tracking-wider">DOCUMENTS PROCESSED</span>
              <p className="text-2xl font-black text-[#274690] dark:text-blue-400 mt-1">
                {(overview?.documentsProcessed || 0).toLocaleString()}
              </p>
              <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">Multi-format documents</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10.5px] font-black text-slate-400 tracking-wider">PAGES PROCESSED</span>
              <p className="text-2xl font-black text-[#c96f4a] mt-1">
                {(overview?.pagesProcessed || 0).toLocaleString()}
              </p>
              <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">Page-level optical OCR</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10.5px] font-black text-slate-400 tracking-wider">CONFIDENCE SCORE</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {overview?.averageConfidenceScore || 97.4}%
              </p>
              <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">High optical accuracy</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10.5px] font-black text-slate-400 tracking-wider">ESTIMATED OCR COST</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                ${overview?.totalOcrCostUsd?.toFixed(4) || "0.0000"}
              </p>
              <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">$0.015 standard per page</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">OCR Daily Volume & Page Output</h3>
                  <p className="text-[11px] text-slate-500">Document extraction throughput across the platform</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">OCR Pipeline</Badge>
              </div>

              <div className="space-y-3 pt-2">
                {overview?.charts?.requestsOverTime?.map((item) => (
                  <div key={item.date} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-400">{item.date}</span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">{item.requests} docs ({item.pages} pages)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div
                        className="bg-[#274690] h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(8, (item.pages / Math.max(1, (overview.pagesProcessed || 10))) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Traffic by OCR Provider</h3>
                <p className="text-[11px] text-slate-500">Dedicated OCR engine workload</p>
              </div>

              <div className="space-y-3.5">
                {overview?.charts?.requestsByProvider?.map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          idx === 0 ? "bg-[#274690]" : idx === 1 ? "bg-[#c96f4a]" : "bg-emerald-500"
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">{p.value} docs</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 2: OCR PROVIDERS */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "providers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Dedicated OCR Providers (3)</h2>
              <p className="text-[11px] text-slate-500">Specialized optical extraction engines (Google Document AI, AWS Textract, Azure Document Intelligence)</p>
            </div>
            <Button
              onClick={handleOpenAddProvider}
              size="sm"
              className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold h-8 rounded-xl gap-1"
            >
              <Plus size={14} /> Add OCR Provider
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {providers.map((p) => (
              <Card
                key={p.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#274690]/10 text-[#274690] dark:text-blue-400">
                        <ScanText size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{p.providerName}</h3>
                          {p.isDefault && (
                            <Badge className="bg-[#274690] text-white text-[9px] font-extrabold py-0">Default</Badge>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{p.providerCode}</span>
                      </div>
                    </div>

                    <Badge
                      className={`text-[9px] font-bold ${
                        p.isEnabled
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.isEnabled ? "ENABLED" : "DISABLED"}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2">{p.description}</p>

                  <div className="space-y-2 text-xs pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Auth Type:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{p.authType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Region:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{p.region || "global"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Formats:</span>
                      <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">
                        {p.supportedFormats?.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleTestProvider(p.id, p.providerName)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#274690] dark:text-blue-400 hover:underline"
                  >
                    <Zap size={13} /> Test Connection
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditProvider(p)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleToggleProvider(p.id, p.isEnabled)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title={p.isEnabled ? "Disable" : "Enable"}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProvider(p.id, p.providerName)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 3: JOBS */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#11192e] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
              {["ALL", "QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setJobFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    jobFilterStatus === st
                      ? "bg-[#274690] text-white font-extrabold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <Badge variant="outline" className="text-xs font-bold self-start sm:self-auto">
              {filteredJobs.length} OCR Jobs
            </Badge>
          </div>

          <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">OCR JOB ID</th>
                    <th className="p-3.5">DOCUMENT</th>
                    <th className="p-3.5">PROVIDER</th>
                    <th className="p-3.5">PROFILE</th>
                    <th className="p-3.5">PAGES</th>
                    <th className="p-3.5">CONFIDENCE</th>
                    <th className="p-3.5">STATUS</th>
                    <th className="p-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">{j.jobCode}</td>
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{j.documentName || "document.pdf"}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{j.provider?.providerName || "Google Document AI"}</td>
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{j.profile?.profileName || "General"}</td>
                      <td className="p-3.5 font-bold">{j.pages}</td>
                      <td className="p-3.5 font-bold text-emerald-600">{j.confidenceScore || 98.2}%</td>
                      <td className="p-3.5">
                        <Badge
                          className={`text-[10px] font-bold ${
                            j.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : j.status === "FAILED"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                              : j.status === "PROCESSING"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 animate-pulse"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {j.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedJob(j)}
                          className="px-2 py-1 text-xs font-bold text-[#274690] dark:text-blue-400 hover:underline"
                        >
                          View
                        </button>
                        {j.status === "FAILED" && (
                          <button
                            onClick={() => handleRetryJob(j.id, j.jobCode)}
                            className="px-2 py-1 text-xs font-bold text-emerald-600 hover:underline"
                          >
                            Retry
                          </button>
                        )}
                        <button
                          onClick={() => handleReprocessJob(j.id, j.jobCode)}
                          className="px-2 py-1 text-xs font-bold text-slate-600 hover:underline"
                        >
                          Reprocess
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-500 font-bold text-xs">
                        No OCR jobs matching filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 5: USAGE & COSTS */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400">TOTAL OCR SPEND</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                ${costData?.totalOcrCost?.toFixed(4) || "0.0000"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Calculated by page & document volume</p>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400">PAGES PROCESSED</span>
              <p className="text-2xl font-black text-[#274690] dark:text-blue-400 mt-1">
                {(usageData?.pagesProcessed || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Across all organizations</p>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400">COST PER PAGE</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ${costData?.costPerPage?.toFixed(4) || "0.0150"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Flat OCR rate across cloud vision</p>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400">DOCUMENTS PARSED</span>
              <p className="text-2xl font-black text-[#c96f4a] mt-1">
                {(usageData?.documentsProcessed || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Avg ${(costData?.costPerDocument || 0.03).toFixed(4)} / document</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Cost by OCR Provider</h3>
              <div className="space-y-2">
                {costData?.costByProvider?.map((p: any) => (
                  <div key={p.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold">
                    <span>{p.name}</span>
                    <span className="font-bold text-[#274690] dark:text-blue-400">${p.costUsd?.toFixed(4) || "0.0000"}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Language Distribution</h3>
              <div className="space-y-2">
                {Object.keys(usageData?.languageUsage || { eng: 1 }).map((lang) => (
                  <div key={lang} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold">
                    <span className="uppercase font-mono">{lang}</span>
                    <span className="font-bold text-emerald-600">{usageData?.languageUsage?.[lang] || 0} files</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 6: LOGS */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "logs" && (
        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">OCR Processing Logs</h3>
              <p className="text-[11px] text-slate-500">Granular optical extraction status and pipeline error codes</p>
            </div>
            <Badge variant="outline" className="text-xs font-bold">{logs.length} Records</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">TIMESTAMP</th>
                  <th className="p-3.5">OCR JOB ID</th>
                  <th className="p-3.5">DOCUMENT</th>
                  <th className="p-3.5">PROVIDER</th>
                  <th className="p-3.5">PROFILE</th>
                  <th className="p-3.5">PAGES</th>
                  <th className="p-3.5">CONFIDENCE</th>
                  <th className="p-3.5">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">{l.ocrJobId}</td>
                    <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{l.document}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{l.provider}</td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{l.profile}</td>
                    <td className="p-3.5 font-bold">{l.pages}</td>
                    <td className="p-3.5 font-bold text-emerald-600">{l.confidence}</td>
                    <td className="p-3.5">
                      <Badge
                        className={`text-[10px] font-bold ${
                          l.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}
                      >
                        {l.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500 font-bold text-xs">
                      No OCR processing logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 7: HEALTH */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "health" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-[#11192e] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">OCR Infrastructure Health</h3>
              <p className="text-[11px] text-slate-500">Real-time status checks for optical extraction engines</p>
            </div>
            <Button
              onClick={handleTestAllHealth}
              disabled={actionLoading}
              size="sm"
              className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold gap-1.5 rounded-xl h-8"
            >
              <Zap size={14} /> Run Live OCR Diagnostics
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {healthData?.providers?.map((hp) => (
              <Card
                key={hp.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{hp.providerName}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">{hp.providerCode}</span>
                  </div>
                  <Badge
                    className={`text-[10px] font-extrabold ${
                      hp.overallHealth === "Healthy"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    ● {hp.overallHealth}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">API Availability:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{hp.apiAvailability}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Response Latency:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{hp.responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Error Rate:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{hp.errorRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Queue Status:</span>
                    <span className="font-bold text-emerald-600">{hp.rateLimitStatus}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT OCR PROVIDER */}
      {/* ---------------------------------------------------------------- */}
      {showProviderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {editingProvider ? `Edit ${editingProvider.providerName}` : "Add OCR Provider"}
                </h3>
                <p className="text-[11px] text-slate-500">Configure OCR optical extraction endpoint & credentials</p>
              </div>
              <button
                onClick={() => setShowProviderModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">OCR Provider Name</label>
                <input
                  type="text"
                  required
                  value={providerForm.providerName}
                  onChange={(e) => setProviderForm({ ...providerForm, providerName: e.target.value })}
                  placeholder="e.g. Google Cloud Vision / Document AI"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Provider Code</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingProvider)}
                    value={providerForm.providerCode}
                    onChange={(e) => setProviderForm({ ...providerForm, providerCode: e.target.value })}
                    placeholder="e.g. google_document_ai"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Auth Type</label>
                  <select
                    value={providerForm.authType}
                    onChange={(e) => setProviderForm({ ...providerForm, authType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <option value="API_KEY">API Key</option>
                    <option value="SERVICE_ACCOUNT">Service Account (GCP)</option>
                    <option value="AWS_IAM">AWS IAM</option>
                    <option value="AZURE_SECRET">Azure Secret</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">API Endpoint</label>
                <input
                  type="text"
                  value={providerForm.apiEndpoint}
                  onChange={(e) => setProviderForm({ ...providerForm, apiEndpoint: e.target.value })}
                  placeholder="https://documentai.googleapis.com/v1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Credentials (API Key / Secret / JSON)</label>
                <div className="relative">
                  <input
                    type={showCreds ? "text" : "password"}
                    value={providerForm.credentials}
                    onChange={(e) => setProviderForm({ ...providerForm, credentials: e.target.value })}
                    placeholder={editingProvider?.hasCredentials ? "••••••••••••Encrypted (Enter new to replace)" : "Paste secret / credential"}
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreds(!showCreds)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCreds ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Credentials are stored in AES-256 encrypted storage.</p>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providerForm.isEnabled}
                    onChange={(e) => setProviderForm({ ...providerForm, isEnabled: e.target.checked })}
                    className="rounded text-[#274690]"
                  />
                  <span>Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providerForm.isDefault}
                    onChange={(e) => setProviderForm({ ...providerForm, isDefault: e.target.checked })}
                    className="rounded text-[#274690]"
                  />
                  <span>Default OCR Engine</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProviderModal(false)}
                  className="rounded-xl h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl h-9 text-xs"
                >
                  Save Provider
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: VIEW JOB DETAILS */}
      {/* ---------------------------------------------------------------- */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">OCR Job Details</h3>
                <p className="text-[11px] font-mono text-slate-500">{selectedJob.jobCode}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Document:</span>
                <span className="font-bold">{selectedJob.documentName || "document.pdf"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">OCR Provider:</span>
                <span className="font-bold">{selectedJob.provider?.providerName || "Google Document AI"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Profile:</span>
                <span className="font-bold">{selectedJob.profile?.profileName || "General Document"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pages Processed:</span>
                <span className="font-bold">{selectedJob.pages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence Score:</span>
                <span className="font-bold text-emerald-600">{selectedJob.confidenceScore || 98.2}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <Badge className="text-[10px]">{selectedJob.status}</Badge>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedJob(null)}
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
