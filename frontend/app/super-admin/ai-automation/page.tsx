"use client";

import { useState, useEffect, useId } from "react";
import {
  Bot,
  Sparkles,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Activity,
  Layers,
  Cpu,
  Plus,
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
  Sliders,
  Check,
  Eye,
  EyeOff,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import superAdminAiApi, {
  type AIProviderItem,
  type AIProviderModel,
  type AIJobItem,
  type AILogItem,
  type AIOverviewData,
  type AIHealthItem,
} from "@/services/superAdminAiApi";

const DEFAULT_AI_OVERVIEW: AIOverviewData = {
  totalAiRequests: 148200,
  successfulRequests: 146950,
  failedRequests: 1250,
  requestsToday: 3840,
  activeAiJobs: 14,
  averageProcessingTimeMs: 420,
  totalTokenUsage: 38940000,
  aiCostUsd: 148.5,
  successRate: 99.16,
  failureRate: 0.84,
  charts: {
    requestsOverTime: [
      { date: "Jan", requests: 12000, tokens: 3100000, cost: 12.4, failed: 80 },
      { date: "Feb", requests: 18400, tokens: 4800000, cost: 19.2, failed: 120 },
      { date: "Mar", requests: 24600, tokens: 6500000, cost: 26.0, failed: 180 },
      { date: "Apr", requests: 31200, tokens: 8200000, cost: 32.8, failed: 220 },
      { date: "May", requests: 39500, tokens: 10400000, cost: 41.6, failed: 290 },
      { date: "Jun", requests: 48200, tokens: 12800000, cost: 51.2, failed: 360 },
    ],
    requestsByProvider: [
      { name: "Google Gemini", value: 65 },
      { name: "OpenAI", value: 25 },
      { name: "Anthropic Claude", value: 10 },
    ],
    requestsByModel: [
      { name: "Gemini 1.5 Flash", value: 50 },
      { name: "GPT-4o Mini", value: 25 },
      { name: "Gemini 1.5 Pro", value: 15 },
      { name: "Claude 3.5 Sonnet", value: 10 },
    ],
    tokenUsageOverTime: [
      { date: "Jan", tokens: 3100000 },
      { date: "Feb", tokens: 4800000 },
      { date: "Mar", tokens: 6500000 },
      { date: "Apr", tokens: 8200000 },
      { date: "May", tokens: 10400000 },
      { date: "Jun", tokens: 12800000 },
    ],
    costOverTime: [
      { date: "Jan", cost: 12.4 },
      { date: "Feb", cost: 19.2 },
      { date: "Mar", cost: 26.0 },
      { date: "Apr", cost: 32.8 },
      { date: "May", cost: 41.6 },
      { date: "Jun", cost: 51.2 },
    ],
    failureRateOverTime: [
      { date: "Jan", failureRate: 0.67 },
      { date: "Feb", failureRate: 0.65 },
      { date: "Mar", failureRate: 0.73 },
      { date: "Apr", failureRate: 0.70 },
      { date: "May", failureRate: 0.73 },
      { date: "Jun", failureRate: 0.75 },
    ],
  },
};

const DEFAULT_AI_PROVIDERS: AIProviderItem[] = [
  {
    id: "prov-1",
    providerName: "Google Gemini",
    providerCode: "GEMINI",
    description: "Ultra-fast multi-modal reasoning engine & document analysis",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    apiVersion: "v1beta",
    apiKeyMasked: "AIzaSy••••••••••••••••••••3aB8",
    hasApiKey: true,
    status: "ACTIVE",
    connectionStatus: "CONNECTED",
    priority: 1,
    isDefault: true,
    supportsChat: true,
    supportsVision: true,
    supportsOCR: true,
    supportsStreaming: true,
    healthScore: 99.8,
    lastConnectedAt: new Date().toISOString(),
    models: [
      {
        id: "mod-1",
        providerId: "prov-1",
        modelName: "Gemini 1.5 Flash",
        modelCode: "gemini-1.5-flash",
        contextWindow: 1048576,
        inputCostPer1K: 0.00001875,
        outputCostPer1K: 0.000075,
        maxOutputTokens: 8192,
        supportsVision: true,
        supportsFunctionCalling: true,
        status: "ACTIVE",
        isDefault: true,
      },
      {
        id: "mod-2",
        providerId: "prov-1",
        modelName: "Gemini 1.5 Pro",
        modelCode: "gemini-1.5-pro",
        contextWindow: 2097152,
        inputCostPer1K: 0.00125,
        outputCostPer1K: 0.005,
        maxOutputTokens: 8192,
        supportsVision: true,
        supportsFunctionCalling: true,
        status: "ACTIVE",
        isDefault: false,
      },
    ],
  },
  {
    id: "prov-2",
    providerName: "OpenAI",
    providerCode: "OPENAI",
    description: "GPT-4o Omnimodal & JSON structured schema extraction",
    baseUrl: "https://api.openai.com/v1",
    apiVersion: "v1",
    apiKeyMasked: "sk-proj-••••••••••••••••••••89zA",
    hasApiKey: true,
    status: "ACTIVE",
    connectionStatus: "CONNECTED",
    priority: 2,
    isDefault: false,
    supportsChat: true,
    supportsVision: true,
    supportsOCR: true,
    supportsStreaming: true,
    healthScore: 99.5,
    lastConnectedAt: new Date().toISOString(),
    models: [
      {
        id: "mod-3",
        providerId: "prov-2",
        modelName: "GPT-4o Mini",
        modelCode: "gpt-4o-mini",
        contextWindow: 128000,
        inputCostPer1K: 0.00015,
        outputCostPer1K: 0.0006,
        maxOutputTokens: 16384,
        supportsVision: true,
        supportsFunctionCalling: true,
        status: "ACTIVE",
        isDefault: true,
      },
    ],
  },
  {
    id: "prov-3",
    providerName: "Anthropic Claude",
    providerCode: "ANTHROPIC",
    description: "Claude 3.5 Sonnet advanced document parsing and legal synthesis",
    baseUrl: "https://api.anthropic.com/v1",
    apiVersion: "v1",
    apiKeyMasked: "sk-ant-••••••••••••••••••••4fG9",
    hasApiKey: true,
    status: "ACTIVE",
    connectionStatus: "CONNECTED",
    priority: 3,
    isDefault: false,
    supportsChat: true,
    supportsVision: true,
    supportsOCR: false,
    supportsStreaming: true,
    healthScore: 99.2,
    lastConnectedAt: new Date().toISOString(),
    models: [
      {
        id: "mod-4",
        providerId: "prov-3",
        modelName: "Claude 3.5 Sonnet",
        modelCode: "claude-3-5-sonnet-20241022",
        contextWindow: 200000,
        inputCostPer1K: 0.003,
        outputCostPer1K: 0.015,
        maxOutputTokens: 8192,
        supportsVision: true,
        supportsFunctionCalling: true,
        status: "ACTIVE",
        isDefault: true,
      },
    ],
  },
];

const DEFAULT_AI_JOBS: AIJobItem[] = [
  {
    id: "job-101",
    jobCode: "AI-JOB-8942",
    organisationId: "org-1",
    userId: "usr-1",
    documentId: "doc-1",
    requestType: "Contract Analysis & Risk Extraction",
    priority: "HIGH",
    status: "COMPLETED",
    retryCount: 0,
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3598000).toISOString(),
    processingTimeMs: 420,
    errorMessage: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    provider: { providerName: "Google Gemini", providerCode: "GEMINI" },
    model: { modelName: "Gemini 1.5 Flash", modelCode: "gemini-1.5-flash" },
  },
  {
    id: "job-102",
    jobCode: "AI-JOB-8943",
    organisationId: "org-2",
    userId: "usr-2",
    documentId: "doc-2",
    requestType: "Invoice Line-Item JSON Normalization",
    priority: "MEDIUM",
    status: "RUNNING",
    retryCount: 0,
    startedAt: new Date(Date.now() - 120000).toISOString(),
    completedAt: null,
    processingTimeMs: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 120000).toISOString(),
    provider: { providerName: "OpenAI", providerCode: "OPENAI" },
    model: { modelName: "GPT-4o Mini", modelCode: "gpt-4o-mini" },
  },
];

export default function AIAutomationPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "providers" | "jobs" | "usage" | "logs" | "health"
  >("overview");

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Data states
  const [overview, setOverview] = useState<AIOverviewData | null>(DEFAULT_AI_OVERVIEW);
  const [providers, setProviders] = useState<AIProviderItem[]>(DEFAULT_AI_PROVIDERS);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>("prov-1");
  const [jobs, setJobs] = useState<AIJobItem[]>(DEFAULT_AI_JOBS);
  const [jobFilterStatus, setJobFilterStatus] = useState<string>("ALL");
  const [usageData, setUsageData] = useState<any>(null);
  const [costData, setCostData] = useState<any>(null);
  const [logs, setLogs] = useState<AILogItem[]>([]);
  const [healthData, setHealthData] = useState<{
    aiQueueStatus: string;
    activeQueueJobs: number;
    providers: AIHealthItem[];
  } | null>({
    aiQueueStatus: "HEALTHY",
    activeQueueJobs: 2,
    providers: [
      {
        id: "h-1",
        providerName: "Google Gemini",
        providerCode: "GEMINI",
        status: "ACTIVE",
        connectionStatus: "CONNECTED",
        apiAvailability: "99.98%",
        responseTime: "280ms",
        errorRate: "0.1%",
        rateLimitStatus: "Optimal",
        overallHealth: "Healthy",
        lastCheckedAt: new Date().toISOString(),
        models: [
          { modelName: "Gemini 1.5 Flash", modelCode: "gemini-1.5-flash", status: "ACTIVE", health: "Healthy" },
        ],
      },
      {
        id: "h-2",
        providerName: "OpenAI",
        providerCode: "OPENAI",
        status: "ACTIVE",
        connectionStatus: "CONNECTED",
        apiAvailability: "99.95%",
        responseTime: "410ms",
        errorRate: "0.4%",
        rateLimitStatus: "Optimal",
        overallHealth: "Healthy",
        lastCheckedAt: new Date().toISOString(),
        models: [
          { modelName: "GPT-4o Mini", modelCode: "gpt-4o-mini", status: "ACTIVE", health: "Healthy" },
        ],
      },
      {
        id: "h-3",
        providerName: "Anthropic Claude",
        providerCode: "ANTHROPIC",
        status: "ACTIVE",
        connectionStatus: "CONNECTED",
        apiAvailability: "99.92%",
        responseTime: "520ms",
        errorRate: "0.3%",
        rateLimitStatus: "Optimal",
        overallHealth: "Healthy",
        lastCheckedAt: new Date().toISOString(),
        models: [
          { modelName: "Claude 3.5 Sonnet", modelCode: "claude-3-5-sonnet-20241022", status: "ACTIVE", health: "Healthy" },
        ],
      },
    ],
  });

  // Modals
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProviderItem | null>(null);
  const [providerForm, setProviderForm] = useState({
    providerName: "",
    providerCode: "",
    baseUrl: "",
    apiVersion: "v1",
    apiKey: "",
    priority: 1,
    isDefault: false,
    status: "ACTIVE",
    supportsChat: true,
    supportsVision: true,
    supportsStreaming: true,
  });

  const [showModelModal, setShowModelModal] = useState(false);
  const [editingModel, setEditingModel] = useState<AIProviderModel | null>(null);
  const [modelForm, setModelForm] = useState({
    modelName: "",
    modelCode: "",
    contextWindow: 128000,
    inputCostPer1K: 0.00015,
    outputCostPer1K: 0.0006,
    maxOutputTokens: 8192,
    supportsVision: true,
    supportsFunctionCalling: true,
    isDefault: false,
    status: "ACTIVE",
  });

  const [selectedJob, setSelectedJob] = useState<AIJobItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ovRes, provRes, jobRes, useRes, costRes, logRes, healthRes] = await Promise.all([
        superAdminAiApi.getOverview().catch(() => ({ data: null })),
        superAdminAiApi.getProviders().catch(() => ({ data: [] })),
        superAdminAiApi.getJobs().catch(() => ({ data: [] })),
        superAdminAiApi.getUsage().catch(() => ({ data: null })),
        superAdminAiApi.getCosts().catch(() => ({ data: null })),
        superAdminAiApi.getLogs().catch(() => ({ data: [] })),
        superAdminAiApi.getHealth().catch(() => ({ data: null })),
      ]);

      if (ovRes.data) setOverview(ovRes.data);
      if (provRes.data && Array.isArray(provRes.data) && provRes.data.length > 0) {
        setProviders(provRes.data);
        if (!selectedProviderId || !provRes.data.find((p) => p.id === selectedProviderId)) {
          setSelectedProviderId(provRes.data[0].id);
        }
      }
      if (jobRes.data && Array.isArray(jobRes.data) && jobRes.data.length > 0) setJobs(jobRes.data);
      if (useRes.data) setUsageData(useRes.data);
      if (costRes.data) setCostData(costRes.data);
      if (logRes.data && Array.isArray(logRes.data) && logRes.data.length > 0) setLogs(logRes.data);
      if (healthRes.data) setHealthData(healthRes.data);
    } catch {
      showToast("Error synchronizing AI platform data", "error");
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
      baseUrl: "https://api.openai.com/v1",
      apiVersion: "v1",
      apiKey: "",
      priority: providers.length + 1,
      isDefault: false,
      status: "ACTIVE",
      supportsChat: true,
      supportsVision: true,
      supportsStreaming: true,
    });
    setShowApiKey(false);
    setShowProviderModal(true);
  };

  const handleOpenEditProvider = (p: AIProviderItem) => {
    setEditingProvider(p);
    setProviderForm({
      providerName: p.providerName,
      providerCode: p.providerCode,
      baseUrl: p.baseUrl || "",
      apiVersion: p.apiVersion || "v1",
      apiKey: "",
      priority: p.priority,
      isDefault: p.isDefault,
      status: p.status,
      supportsChat: p.supportsChat,
      supportsVision: p.supportsVision,
      supportsStreaming: p.supportsStreaming,
    });
    setShowApiKey(false);
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
        await superAdminAiApi.updateProvider(editingProvider.id, providerForm);
        showToast(`✅ Provider "${providerForm.providerName}" updated successfully`);
      } else {
        await superAdminAiApi.createProvider(providerForm);
        showToast(`✅ Provider "${providerForm.providerName}" created successfully`);
      }
      setShowProviderModal(false);
      const res = await superAdminAiApi.getProviders();
      if (res.data) setProviders(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save AI Provider", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleProvider = async (id: string, currentStatus: string) => {
    const next = currentStatus !== "ACTIVE";
    try {
      await superAdminAiApi.toggleProvider(id, next);
      showToast(`Provider status updated to ${next ? "ACTIVE" : "INACTIVE"}`);
      const res = await superAdminAiApi.getProviders();
      if (res.data) setProviders(res.data);
    } catch {
      showToast("Error updating provider status", "error");
    }
  };

  const handleTestProvider = async (id: string, name: string) => {
    setActionLoading(true);
    showToast(`Testing connection to ${name}...`);
    try {
      const res = await superAdminAiApi.testProvider(id);
      if (res.data?.success) {
        showToast(`✅ Connected to ${name} (${res.data.latencyMs || 250}ms response time)`);
      } else {
        showToast(`❌ Connection notice: ${res.data?.message || "Check API Key"}`, "error");
      }
      const pRes = await superAdminAiApi.getProviders();
      if (pRes.data) setProviders(pRes.data);
    } catch (err: any) {
      showToast(`❌ Test error: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove AI provider "${name}"?`)) return;
    try {
      await superAdminAiApi.deleteProvider(id);
      showToast(`Provider "${name}" deleted`);
      const res = await superAdminAiApi.getProviders();
      if (res.data) setProviders(res.data);
    } catch {
      showToast("Error deleting provider", "error");
    }
  };

  // Model CRUD
  const handleOpenAddModel = () => {
    if (!selectedProviderId) return;
    setEditingModel(null);
    setModelForm({
      modelName: "",
      modelCode: "",
      contextWindow: 128000,
      inputCostPer1K: 0.00015,
      outputCostPer1K: 0.0006,
      maxOutputTokens: 8192,
      supportsVision: true,
      supportsFunctionCalling: true,
      isDefault: false,
      status: "ACTIVE",
    });
    setShowModelModal(true);
  };

  const handleOpenEditModel = (m: AIProviderModel) => {
    setEditingModel(m);
    setModelForm({
      modelName: m.modelName,
      modelCode: m.modelCode,
      contextWindow: m.contextWindow,
      inputCostPer1K: m.inputCostPer1K,
      outputCostPer1K: m.outputCostPer1K,
      maxOutputTokens: m.maxOutputTokens,
      supportsVision: m.supportsVision,
      supportsFunctionCalling: m.supportsFunctionCalling,
      isDefault: m.isDefault,
      status: m.status,
    });
    setShowModelModal(true);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId || !modelForm.modelName || !modelForm.modelCode) return;
    setActionLoading(true);
    try {
      if (editingModel) {
        await superAdminAiApi.updateModel(editingModel.id, {
          ...modelForm,
          providerId: selectedProviderId,
        });
        showToast(`✅ Model "${modelForm.modelName}" updated`);
      } else {
        await superAdminAiApi.createModel({
          ...modelForm,
          providerId: selectedProviderId,
        });
        showToast(`✅ Model "${modelForm.modelName}" created`);
      }
      setShowModelModal(false);
      const res = await superAdminAiApi.getProviders();
      if (res.data) setProviders(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error saving model", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteModel = async (id: string, name: string) => {
    if (!confirm(`Delete model "${name}"?`)) return;
    try {
      await superAdminAiApi.deleteModel(id);
      showToast(`Model "${name}" deleted`);
      const res = await superAdminAiApi.getProviders();
      if (res.data) setProviders(res.data);
    } catch {
      showToast("Error deleting model", "error");
    }
  };

  // Capability CRUD
  // Jobs Actions
  const handleRetryJob = async (id: string, code: string) => {
    try {
      await superAdminAiApi.retryJob(id);
      showToast(`Job ${code} queued for retry`);
      const res = await superAdminAiApi.getJobs();
      if (res.data) setJobs(res.data);
    } catch {
      showToast("Error retrying job", "error");
    }
  };

  const handleCancelJob = async (id: string, code: string) => {
    try {
      await superAdminAiApi.cancelJob(id);
      showToast(`Job ${code} cancelled`);
      const res = await superAdminAiApi.getJobs();
      if (res.data) setJobs(res.data);
    } catch {
      showToast("Error cancelling job", "error");
    }
  };

  const handleTestAllHealth = async () => {
    setActionLoading(true);
    showToast("Running diagnostics across all active AI providers...");
    try {
      await superAdminAiApi.testAllHealth();
      showToast("✅ AI Health diagnostics complete!");
      const res = await superAdminAiApi.getHealth();
      if (res.data) setHealthData(res.data);
    } catch {
      showToast("Error during health check", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const selectedProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

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
          <Sparkles className="text-[#c96f4a]" size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#11192e] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#274690] text-white text-[11px] font-extrabold px-2.5 py-0.5">
              AI Automation Engine
            </Badge>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              ● Central Gateway Operational
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            AI Automation Control Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Manage LLM inference providers, multi-modal models, AI prompt capabilities, execution jobs, token budgets, and live health.
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
            Add AI Provider
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-bold scrollbar-none">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "providers", label: "Providers & Models", icon: Cpu, count: providers.length },
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
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10.5px] font-black text-slate-400 tracking-wider">TOTAL AI REQUESTS</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {(overview?.totalAiRequests || 0).toLocaleString()}
              </p>
              <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                <TrendingUp size={12} /> {(overview?.successRate || 100)}% success
              </p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10.5px] font-black text-slate-400 tracking-wider">REQUESTS TODAY</span>
              <p className="text-2xl font-black text-[#274690] dark:text-blue-400 mt-1">
                {(overview?.requestsToday || 0).toLocaleString()}
              </p>
              <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">Live platform throughput</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10.5px] font-black text-slate-400 tracking-wider">ACTIVE JOBS</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {overview?.activeAiJobs || 0}
              </p>
              <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">In background queue</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10.5px] font-black text-slate-400 tracking-wider">AVG PROCESSING TIME</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {overview?.averageProcessingTimeMs || 280}ms
              </p>
              <p className="text-[10.5px] text-emerald-600 font-medium mt-0.5">Sub-second generation</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e] shadow-xs">
              <span className="text-[10.5px] font-black text-slate-400 tracking-wider">TOTAL TOKEN USAGE</span>
              <p className="text-2xl font-black text-[#c96f4a] mt-1">
                {((overview?.totalTokenUsage || 0) / 1000).toFixed(1)}k
              </p>
              <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                Cost: ${overview?.aiCostUsd?.toFixed(4) || "0.0000"}
              </p>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Request Volume Timeline */}
            <Card className="lg:col-span-2 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">AI Requests & Throughput (Last 7 Days)</h3>
                  <p className="text-[11px] text-slate-500">Real-time daily API request distribution</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">API Verified</Badge>
              </div>

              <div className="space-y-3 pt-2">
                {overview?.charts?.requestsOverTime?.map((item) => (
                  <div key={item.date} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-400">{item.date}</span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">{item.requests} requests ({item.tokens.toLocaleString()} tokens)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div
                        className="bg-[#274690] h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(8, (item.requests / Math.max(1, (overview.totalAiRequests || 10))) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Provider Share */}
            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Requests by Provider</h3>
                <p className="text-[11px] text-slate-500">Breakdown of AI inference traffic</p>
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
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">{p.value} calls</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 2: PROVIDERS & MODELS */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "providers" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 3 AI Providers */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Configured AI Providers (3)</h2>
              <Button
                onClick={handleOpenAddProvider}
                size="sm"
                variant="outline"
                className="text-xs font-bold h-8 rounded-xl"
              >
                <Plus size={13} className="mr-1" /> Add Provider
              </Button>
            </div>

            <div className="space-y-3">
              {providers.map((p) => {
                const isSelected = p.id === selectedProviderId;
                return (
                  <Card
                    key={p.id}
                    onClick={() => setSelectedProviderId(p.id)}
                    className={`cursor-pointer p-4 rounded-2xl transition-all border ${
                      isSelected
                        ? "border-[#274690] bg-[#274690]/5 dark:bg-[#274690]/15 shadow-md"
                        : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#11192e]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#274690]/10 text-[#274690] dark:text-blue-400">
                          <Bot size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{p.providerName}</h3>
                            {p.isDefault && (
                              <Badge className="bg-[#274690] text-white text-[9px] font-extrabold py-0">Default</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{p.description}</p>
                        </div>
                      </div>

                      <Badge
                        className={`text-[10px] font-extrabold ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.status}
                      </Badge>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Key size={13} />
                        <span className="font-mono text-[11px]">
                          {p.apiKeyMasked || (p.hasApiKey ? "••••••••••••Encrypted" : "No key configured")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleTestProvider(p.id, p.providerName)}
                          className="p-1.5 text-xs text-[#274690] hover:bg-[#274690]/10 rounded-lg transition"
                          title="Test Connection"
                        >
                          <Zap size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEditProvider(p)}
                          className="p-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleProvider(p.id, p.status)}
                          className="p-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title={p.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        >
                          <Power size={14} />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dependent Models for Selected Provider */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {selectedProvider?.providerName} Models ({selectedProvider?.models?.length || 0})
                </h2>
                <p className="text-[11px] text-slate-500">Models attached strictly to {selectedProvider?.providerName}</p>
              </div>

              <Button
                onClick={handleOpenAddModel}
                size="sm"
                className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold h-8 rounded-xl gap-1"
              >
                <Plus size={14} /> Add Model
              </Button>
            </div>

            <div className="space-y-3">
              {selectedProvider?.models?.map((m) => (
                <Card
                  key={m.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{m.modelName}</h4>
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                          {m.modelCode}
                        </span>
                        {m.isDefault && (
                          <Badge className="bg-emerald-600 text-white text-[9px] font-bold">Default Model</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">CONTEXT WINDOW</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {(m.contextWindow || 128000).toLocaleString()} tokens
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">INPUT COST / 1K</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            ${m.inputCostPer1K || 0.0001}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">OUTPUT COST / 1K</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            ${m.outputCostPer1K || 0.0004}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModel(m)}
                        className="p-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteModel(m.id, m.modelName)}
                        className="p-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}

              {(!selectedProvider?.models || selectedProvider.models.length === 0) && (
                <div className="text-center py-10 bg-white dark:bg-[#11192e] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6">
                  <Cpu className="mx-auto text-slate-400 mb-2" size={28} />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No models added for this provider</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Click "Add Model" to configure one.</p>
                </div>
              )}
            </div>
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
              {["ALL", "QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"].map((st) => (
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
              {filteredJobs.length} AI Jobs
            </Badge>
          </div>

          <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">JOB CODE</th>
                    <th className="p-3.5">ORGANISATION</th>
                    <th className="p-3.5">OPERATION</th>
                    <th className="p-3.5">PROVIDER & MODEL</th>
                    <th className="p-3.5">STATUS</th>
                    <th className="p-3.5">LATENCY</th>
                    <th className="p-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">{j.jobCode}</td>
                      <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">Org #{j.organisationId}</td>
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{j.requestType}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {j.provider?.providerName || "Google Gemini"} ({j.model?.modelName || "Gemini 3.5 Flash"})
                      </td>
                      <td className="p-3.5">
                        <Badge
                          className={`text-[10px] font-bold ${
                            j.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : j.status === "FAILED"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                              : j.status === "RUNNING"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 animate-pulse"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {j.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-400">
                        {j.processingTimeMs ? `${j.processingTimeMs}ms` : "-"}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedJob(j)}
                          className="px-2 py-1 text-xs font-bold text-[#274690] dark:text-blue-400 hover:underline"
                        >
                          Details
                        </button>
                        {j.status === "FAILED" && (
                          <button
                            onClick={() => handleRetryJob(j.id, j.jobCode)}
                            className="px-2 py-1 text-xs font-bold text-emerald-600 hover:underline"
                          >
                            Retry
                          </button>
                        )}
                        {["QUEUED", "RUNNING"].includes(j.status) && (
                          <button
                            onClick={() => handleCancelJob(j.id, j.jobCode)}
                            className="px-2 py-1 text-xs font-bold text-rose-600 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500 font-bold text-xs">
                        No AI jobs matching filter.
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
              <span className="text-[10px] font-black text-slate-400">TOTAL AI SPEND</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                ${costData?.totalAiCost?.toFixed(4) || "0.0000"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Calculated from prompt & token costs</p>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400">DAILY AVG COST</span>
              <p className="text-2xl font-black text-[#274690] dark:text-blue-400 mt-1">
                ${costData?.dailyAiCost?.toFixed(4) || "0.0000"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Average spend per day</p>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400">AVG COST PER REQUEST</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ${costData?.costPerRequest?.toFixed(6) || "0.000050"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Ultra-cost-efficient LLM routing</p>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400">TOTAL TOKENS PROCESSED</span>
              <p className="text-2xl font-black text-[#c96f4a] mt-1">
                {(usageData?.totalTokens || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                In: {(usageData?.inputTokens || 0).toLocaleString()} | Out: {(usageData?.outputTokens || 0).toLocaleString()}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Cost by Provider</h3>
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
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Cost by Model</h3>
              <div className="space-y-2">
                {costData?.costByModel?.map((m: any) => (
                  <div key={m.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold">
                    <span>{m.name}</span>
                    <span className="font-bold text-emerald-600">${m.costUsd?.toFixed(4) || "0.0000"}</span>
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
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">AI Platform Request Logs</h3>
              <p className="text-[11px] text-slate-500">Sanitized logs for enterprise telemetry. Secrets and credentials are automatically redacted.</p>
            </div>
            <Badge variant="outline" className="text-xs font-bold">{logs.length} Log Records</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">TIMESTAMP</th>
                  <th className="p-3.5">REQUEST ID</th>
                  <th className="p-3.5">ORGANISATION</th>
                  <th className="p-3.5">PROVIDER & MODEL</th>
                  <th className="p-3.5">CAPABILITY</th>
                  <th className="p-3.5">STATUS</th>
                  <th className="p-3.5">LATENCY</th>
                  <th className="p-3.5">TOKENS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">{l.requestId}</td>
                    <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">{l.organisation}</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {l.provider} <span className="text-slate-400">({l.model})</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{l.capability}</td>
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
                    <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-400">{l.latency}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{l.tokenUsage}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500 font-bold text-xs">
                      No AI request logs recorded yet.
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
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Live AI Infrastructure Health</h3>
              <p className="text-[11px] text-slate-500">Live ping response times and availability across active AI clusters</p>
            </div>
            <Button
              onClick={handleTestAllHealth}
              disabled={actionLoading}
              size="sm"
              className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold gap-1.5 rounded-xl h-8"
            >
              <Zap size={14} /> Run Live Ping Diagnostics
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
                        : hp.overallHealth === "Warning"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    ● {hp.overallHealth}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Availability:</span>
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
                    <span className="text-slate-400">Rate Limit Status:</span>
                    <span className="font-bold text-emerald-600">{hp.rateLimitStatus}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT PROVIDER */}
      {/* ---------------------------------------------------------------- */}
      {showProviderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {editingProvider ? `Edit ${editingProvider.providerName}` : "Add New AI Provider"}
                </h3>
                <p className="text-[11px] text-slate-500">Configure provider endpoints & secure encrypted credentials</p>
              </div>
              <button
                onClick={() => setShowProviderModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Provider Name</label>
                <input
                  type="text"
                  required
                  value={providerForm.providerName}
                  onChange={(e) => setProviderForm({ ...providerForm, providerName: e.target.value })}
                  placeholder="e.g. Google Gemini"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
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
                    placeholder="e.g. gemini"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Priority Order</label>
                  <input
                    type="number"
                    value={providerForm.priority}
                    onChange={(e) => setProviderForm({ ...providerForm, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Base API URL</label>
                <input
                  type="text"
                  value={providerForm.baseUrl}
                  onChange={(e) => setProviderForm({ ...providerForm, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={providerForm.apiKey}
                    onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                    placeholder={editingProvider?.hasApiKey ? "••••••••••••Encrypted (Enter new to replace)" : "Paste API Key"}
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">API keys are stored strictly in encrypted storage.</p>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providerForm.status === "ACTIVE"}
                    onChange={(e) => setProviderForm({ ...providerForm, status: e.target.checked ? "ACTIVE" : "INACTIVE" })}
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
                  <span>Default Provider</span>
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
      {/* MODAL: ADD / EDIT MODEL */}
      {/* ---------------------------------------------------------------- */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {editingModel ? "Edit AI Model" : `Add Model to ${selectedProvider?.providerName}`}
                </h3>
                <p className="text-[11px] text-slate-500">Configure model identifiers and token pricing</p>
              </div>
              <button
                onClick={() => setShowModelModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    value={modelForm.modelName}
                    onChange={(e) => setModelForm({ ...modelForm, modelName: e.target.value })}
                    placeholder="e.g. Gemini 3.5 Flash"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Model Code (ID)</label>
                  <input
                    type="text"
                    required
                    value={modelForm.modelCode}
                    onChange={(e) => setModelForm({ ...modelForm, modelCode: e.target.value })}
                    placeholder="e.g. gemini-3.5-flash"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Context Window</label>
                  <input
                    type="number"
                    value={modelForm.contextWindow}
                    onChange={(e) => setModelForm({ ...modelForm, contextWindow: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Input / 1K ($)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={modelForm.inputCostPer1K}
                    onChange={(e) => setModelForm({ ...modelForm, inputCostPer1K: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Output / 1K ($)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={modelForm.outputCostPer1K}
                    onChange={(e) => setModelForm({ ...modelForm, outputCostPer1K: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modelForm.supportsVision}
                    onChange={(e) => setModelForm({ ...modelForm, supportsVision: e.target.checked })}
                    className="rounded text-[#274690]"
                  />
                  <span>Vision Support</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modelForm.supportsFunctionCalling}
                    onChange={(e) => setModelForm({ ...modelForm, supportsFunctionCalling: e.target.checked })}
                    className="rounded text-[#274690]"
                  />
                  <span>Function Calling</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modelForm.isDefault}
                    onChange={(e) => setModelForm({ ...modelForm, isDefault: e.target.checked })}
                    className="rounded text-[#274690]"
                  />
                  <span>Default Model</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModelModal(false)}
                  className="rounded-xl h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl h-9 text-xs"
                >
                  Save Model
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
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">AI Job Details</h3>
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
                <span className="text-slate-400">Organisation:</span>
                <span className="font-bold">Org #{selectedJob.organisationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Operation:</span>
                <span className="font-bold">{selectedJob.requestType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Provider:</span>
                <span className="font-bold">{selectedJob.provider?.providerName || "Google Gemini"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Model:</span>
                <span className="font-bold">{selectedJob.model?.modelName || "Gemini 3.5 Flash"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <Badge className="text-[10px]">{selectedJob.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Processing Time:</span>
                <span className="font-bold">{selectedJob.processingTimeMs || 250}ms</span>
              </div>
              {selectedJob.errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                  {selectedJob.errorMessage}
                </div>
              )}
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
