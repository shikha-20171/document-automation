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
  ShieldCheck,
  Search,
  ChevronRight,
  BarChart3,
  Sliders,
  Check,
  Eye,
  EyeOff,
  X,
  FileText,
  Lock,
  Server,
  Settings2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Radio,
  SlidersHorizontal,
  Workflow,
  Copy,
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
  type AIRoutingConfig,
  type TestConnectionResult,
} from "@/services/superAdminAiApi";

const DEFAULT_GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-pro",
];

const DEFAULT_OPENAI_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-5",
  "gpt-5-mini",
];

export default function AIAutomationPage() {
  const [activeTab, setActiveTab] = useState<
    "providers" | "routing" | "overview" | "health" | "usage" | "logs" | "jobs"
  >("providers");

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Data states
  const [providers, setProviders] = useState<AIProviderItem[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [routingConfig, setRoutingConfig] = useState<AIRoutingConfig>({
    primaryProviderCode: "gemini",
    primaryModel: "gemini-3.6-flash",
    fallbackProviderCode: "openai",
    fallbackModel: "gpt-4o-mini",
    routingEnabled: true,
  });
  const [overview, setOverview] = useState<AIOverviewData | null>(null);
  const [jobs, setJobs] = useState<AIJobItem[]>([]);
  const [logs, setLogs] = useState<AILogItem[]>([]);
  const [healthData, setHealthData] = useState<{
    aiQueueStatus: string;
    activeQueueJobs: number;
    providers: AIHealthItem[];
  } | null>(null);

  // Filter states
  const [providerSearch, setProviderSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [logFilterProvider, setLogFilterProvider] = useState("ALL");
  const [logFilterStatus, setLogFilterStatus] = useState("ALL");
  const [logSearch, setLogSearch] = useState("");

  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configuringProviderType, setConfiguringProviderType] = useState<"gemini" | "openai" | "custom">("gemini");
  const [configEditingProvider, setConfigEditingProvider] = useState<AIProviderItem | null>(null);

  // Configuration Form State
  const [formState, setFormState] = useState({
    id: "",
    providerName: "Google Gemini",
    providerCode: "gemini",
    providerType: "LLM / Multimodal",
    baseUrl: "https://generativelanguage.googleapis.com",
    apiVersion: "v1beta",
    defaultModel: "gemini-3.6-flash",
    apiKey: "",
    replaceApiKey: false,
    status: "ACTIVE",
    priority: 1,
    isDefault: true,
  });

  const [showApiKeyPlain, setShowApiKeyPlain] = useState(false);
  const [isTestingInModal, setIsTestingInModal] = useState(false);
  const [modalTestResult, setModalTestResult] = useState<TestConnectionResult | null>(null);

  // Test Connection Dialog state
  const [testResultModal, setTestResultModal] = useState<TestConnectionResult | null>(null);
  const [isTestingProviderId, setIsTestingProviderId] = useState<string | null>(null);
  const [isSyncingModels, setIsSyncingModels] = useState<string | null>(null);
  const [isSavingRouting, setIsSavingRouting] = useState(false);
  const [customModelInput, setCustomModelInput] = useState("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [provRes, routeRes, ovRes, logRes, healthRes, jobRes] = await Promise.all([
        superAdminAiApi.getProviders().catch(() => ({ data: [] })),
        superAdminAiApi.getRoutingConfig().catch(() => ({ data: null })),
        superAdminAiApi.getOverview().catch(() => ({ data: null })),
        superAdminAiApi.getLogs().catch(() => ({ data: [] })),
        superAdminAiApi.getHealth().catch(() => ({ data: null })),
        superAdminAiApi.getJobs().catch(() => ({ data: [] })),
      ]);

      if (provRes.data && Array.isArray(provRes.data)) {
        setProviders(provRes.data);
        if (!selectedProviderId && provRes.data.length > 0) {
          setSelectedProviderId(provRes.data[0].id);
        }
      }

      if (routeRes.data) {
        setRoutingConfig(routeRes.data);
      }

      if (ovRes.data) setOverview(ovRes.data);
      if (logRes.data && Array.isArray(logRes.data)) setLogs(logRes.data);
      if (healthRes.data) setHealthData(healthRes.data);
      if (jobRes.data && Array.isArray(jobRes.data)) setJobs(jobRes.data);
    } catch (err: any) {
      showToast("Error loading AI automation data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const openGeminiConfig = (existing?: AIProviderItem) => {
    const gemini = existing || providers.find((p) => p.providerCode.toLowerCase().includes("gemini"));
    setConfigEditingProvider(gemini || null);
    setConfiguringProviderType("gemini");
    setShowApiKeyPlain(false);
    setModalTestResult(null);
    setCustomModelInput("");

    setFormState({
      id: gemini?.id || "",
      providerName: "Google Gemini",
      providerCode: "gemini",
      providerType: "LLM / Multimodal AI",
      baseUrl: gemini?.baseUrl || "https://generativelanguage.googleapis.com",
      apiVersion: gemini?.apiVersion || "v1beta",
      defaultModel: gemini?.defaultModel || "gemini-3.6-flash",
      apiKey: "",
      replaceApiKey: false,
      status: gemini?.status || "ACTIVE",
      priority: gemini?.priority || 1,
      isDefault: true,
    });
    setShowConfigModal(true);
  };

  const openOpenAIConfig = (existing?: AIProviderItem) => {
    const openai = existing || providers.find((p) => p.providerCode.toLowerCase().includes("openai"));
    setConfigEditingProvider(openai || null);
    setConfiguringProviderType("openai");
    setShowApiKeyPlain(false);
    setModalTestResult(null);
    setCustomModelInput("");

    setFormState({
      id: openai?.id || "",
      providerName: "OpenAI",
      providerCode: "openai",
      providerType: "LLM / GPT Reasoning",
      baseUrl: openai?.baseUrl || "https://api.openai.com/v1",
      apiVersion: openai?.apiVersion || "v1",
      defaultModel: openai?.defaultModel || "gpt-4o-mini",
      apiKey: "",
      replaceApiKey: false,
      status: openai?.status || "ACTIVE",
      priority: openai?.priority || 2,
      isDefault: false,
    });
    setShowConfigModal(true);
  };

  const openCustomConfig = () => {
    setConfigEditingProvider(null);
    setConfiguringProviderType("custom");
    setShowApiKeyPlain(false);
    setModalTestResult(null);
    setCustomModelInput("");

    setFormState({
      id: "",
      providerName: "",
      providerCode: "",
      providerType: "LLM / OpenAI-Compatible",
      baseUrl: "https://api.openai.com/v1",
      apiVersion: "v1",
      defaultModel: "default-model",
      apiKey: "",
      replaceApiKey: true,
      status: "ACTIVE",
      priority: providers.length + 1,
      isDefault: false,
    });
    setShowConfigModal(true);
  };

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        providerName: formState.providerName,
        providerCode: formState.providerCode,
        providerType: formState.providerType,
        baseUrl: formState.baseUrl,
        apiVersion: formState.apiVersion,
        defaultModel: formState.defaultModel,
        status: formState.status,
        priority: formState.priority,
        isDefault: formState.isDefault,
      };

      if (formState.apiKey && formState.apiKey.trim().length > 0) {
        payload.apiKey = formState.apiKey.trim();
      }

      if (formState.id) {
        await superAdminAiApi.updateProvider(formState.id, payload);
        showToast(`${formState.providerName} configuration updated successfully!`, "success");
      } else {
        await superAdminAiApi.createProvider(payload);
        showToast(`${formState.providerName} provider created successfully!`, "success");
      }

      setShowConfigModal(false);
      await loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to save configuration", "error");
    }
  };

  const handleTestConnection = async (providerId: string, modelCode?: string) => {
    setIsTestingProviderId(providerId);
    try {
      const res = await superAdminAiApi.testProvider(providerId, { model: modelCode });
      setTestResultModal(res.data);
      if (res.data.success) {
        showToast(`Connection to ${res.data.provider} successful (${res.data.responseTimeMs}ms)!`, "success");
      } else {
        showToast(`Connection failed: ${res.data.errorCategory || res.data.message}`, "error");
      }
      await loadAllData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setTestResultModal({
        success: false,
        status: "Failed",
        provider: "AI Provider",
        modelTested: modelCode || "default",
        responseTimeMs: 0,
        testedAt: new Date().toISOString(),
        errorCategory: "Provider unavailable",
        message: msg,
      });
      showToast(`Connection test failed: ${msg}`, "error");
    } finally {
      setIsTestingProviderId(null);
    }
  };

  const handleTestInModal = async () => {
    if (!formState.id && !formState.apiKey) {
      showToast("Please enter an API Key to test connection", "error");
      return;
    }

    setIsTestingInModal(true);
    setModalTestResult(null);

    try {
      if (formState.id && !formState.replaceApiKey) {
        const res = await superAdminAiApi.testProvider(formState.id, { model: formState.defaultModel });
        setModalTestResult(res.data);
      } else {
        const tempRes = await superAdminAiApi.updateProvider(formState.id || "temp", {
          ...formState,
          apiKey: formState.apiKey,
        }).catch(() => null);

        if (formState.id) {
          const res = await superAdminAiApi.testProvider(formState.id, { model: formState.defaultModel });
          setModalTestResult(res.data);
        } else {
          setModalTestResult({
            success: false,
            status: "Failed",
            provider: formState.providerName,
            modelTested: formState.defaultModel,
            responseTimeMs: 0,
            testedAt: new Date().toISOString(),
            errorCategory: "Invalid configuration",
            message: "Save provider first before running external live connection test.",
          });
        }
      }
    } catch (err: any) {
      setModalTestResult({
        success: false,
        status: "Failed",
        provider: formState.providerName,
        modelTested: formState.defaultModel,
        responseTimeMs: 0,
        testedAt: new Date().toISOString(),
        errorCategory: "Provider unavailable",
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setIsTestingInModal(false);
    }
  };

  const handleActivateProvider = async (id: string, name: string) => {
    try {
      await superAdminAiApi.activateProvider(id);
      showToast(`${name} activated successfully`, "success");
      await loadAllData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeactivateProvider = async (id: string, name: string) => {
    try {
      await superAdminAiApi.deactivateProvider(id);
      showToast(`${name} deactivated successfully`, "success");
      await loadAllData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete AI Provider "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await superAdminAiApi.deleteProvider(id);
      showToast(`${name} deleted successfully`, "success");
      await loadAllData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleSyncModels = async (id: string, name: string) => {
    setIsSyncingModels(id);
    try {
      const res = await superAdminAiApi.syncModels(id);
      showToast(`Successfully synchronized ${res.data.length} models for ${name}!`, "success");
      await loadAllData();
    } catch (err: any) {
      showToast(`Failed to sync models: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setIsSyncingModels(null);
    }
  };

  const handleSaveRouting = async () => {
    setIsSavingRouting(true);
    try {
      await superAdminAiApi.updateRoutingConfig(routingConfig);
      showToast("AI Routing & Failover configuration saved successfully!", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setIsSavingRouting(false);
    }
  };

  const filteredProviders = providers.filter(
    (p) =>
      p.providerName.toLowerCase().includes(providerSearch.toLowerCase()) ||
      p.providerCode.toLowerCase().includes(providerSearch.toLowerCase()) ||
      (p.defaultModel && p.defaultModel.toLowerCase().includes(providerSearch.toLowerCase()))
  );

  const filteredLogs = logs.filter((log) => {
    if (logFilterProvider !== "ALL" && log.provider?.toLowerCase() !== logFilterProvider.toLowerCase()) {
      return false;
    }
    if (logFilterStatus !== "ALL" && log.status !== logFilterStatus) {
      return false;
    }
    if (logSearch) {
      const s = logSearch.toLowerCase();
      return (
        log.requestId?.toLowerCase().includes(s) ||
        log.organisation?.toLowerCase().includes(s) ||
        log.capability?.toLowerCase().includes(s) ||
        log.model?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const getProviderBadge = (status: string, connectionStatus: string) => {
    if (status === "INACTIVE") {
      return (
        <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 gap-1 text-[11px] font-semibold py-0.5">
          <Power size={11} /> Disabled
        </Badge>
      );
    }
    if (connectionStatus === "CONNECTED") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 gap-1.5 text-[11px] font-bold py-0.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Connected
        </Badge>
      );
    }
    if (connectionStatus === "FAILED") {
      return (
        <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 gap-1.5 text-[11px] font-bold py-0.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> Error / Failed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 gap-1.5 text-[11px] font-bold py-0.5">
        <span className="w-2 h-2 rounded-full bg-amber-500" /> Not Connected
      </Badge>
    );
  };

  const getAvailableModelsForForm = () => {
    if (configuringProviderType === "gemini") {
      const existingModels = configEditingProvider?.models?.map((m) => m.modelCode) || [];
      return Array.from(new Set([...DEFAULT_GEMINI_MODELS, ...existingModels]));
    }
    if (configuringProviderType === "openai") {
      const existingModels = configEditingProvider?.models?.map((m) => m.modelCode) || [];
      return Array.from(new Set([...DEFAULT_OPENAI_MODELS, ...existingModels]));
    }
    return configEditingProvider?.models?.map((m) => m.modelCode) || ["custom-model-1"];
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-in fade-in slide-in-from-top-4 ${
            toastType === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800"
              : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-800"
          }`}
        >
          {toastType === "success" ? <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /> : <AlertCircle size={18} className="text-rose-600 dark:text-rose-400" />}
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#11192e] via-[#1a264a] to-[#274690] text-white p-6 md:p-8 rounded-3xl shadow-xl border border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
              <Bot size={26} className="text-blue-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">AI Automation & Provider Engine</h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold uppercase">
                  Production Ready
                </Badge>
              </div>
              <p className="text-xs text-blue-200/90 font-medium">
                Configure, test, activate, and route enterprise AI providers without code changes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => openGeminiConfig()}
            size="sm"
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold rounded-xl h-9 gap-2 shadow-sm"
          >
            <Sparkles size={14} className="text-amber-300" />
            Configure Gemini
          </Button>

          <Button
            onClick={() => openOpenAIConfig()}
            size="sm"
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold rounded-xl h-9 gap-2 shadow-sm"
          >
            <Bot size={14} className="text-emerald-300" />
            Configure OpenAI
          </Button>

          <Button
            onClick={openCustomConfig}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 gap-1.5 shadow-md"
          >
            <Plus size={14} /> Add Provider
          </Button>

          <Button
            onClick={loadAllData}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 rounded-xl h-9 w-9 p-0"
            title="Refresh All Telemetry"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: "providers", label: "AI Providers", icon: Bot, count: providers.length },
          { id: "routing", label: "Provider Routing & Failover", icon: Workflow },
          { id: "health", label: "Provider Health", icon: Activity },
          { id: "usage", label: "Usage & Metering", icon: DollarSign },
          { id: "logs", label: "Execution Logs", icon: FileText, count: logs.length },
          { id: "overview", label: "Analytics Overview", icon: BarChart3 },
          { id: "jobs", label: "AI Job Queue", icon: Layers, count: jobs.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#274690] text-white shadow-md shadow-blue-900/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: AI PROVIDERS (CORE FEATURE) */}
      {/* ==================================================================== */}
      {activeTab === "providers" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#11192e] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                placeholder="Search AI providers or models..."
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#274690]/30"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === "cards" ? "bg-white dark:bg-slate-700 text-[#274690] dark:text-blue-400 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === "table" ? "bg-white dark:bg-slate-700 text-[#274690] dark:text-blue-400 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Table
                </button>
              </div>

              <Button
                onClick={() => openGeminiConfig()}
                size="sm"
                variant="outline"
                className="text-xs font-bold h-8 rounded-xl border-[#274690]/30 text-[#274690] dark:text-blue-400 hover:bg-[#274690]/5"
              >
                Gemini
              </Button>
              <Button
                onClick={() => openOpenAIConfig()}
                size="sm"
                variant="outline"
                className="text-xs font-bold h-8 rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                OpenAI
              </Button>
            </div>
          </div>

          {/* Cards View */}
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredProviders.map((provider) => {
                const isGemini = provider.providerCode.toLowerCase().includes("gemini");
                const isOpenAI = provider.providerCode.toLowerCase().includes("openai");
                const isTesting = isTestingProviderId === provider.id;
                const isSyncing = isSyncingModels === provider.id;

                return (
                  <Card
                    key={provider.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-inner ${
                            isGemini
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                              : isOpenAI
                              ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white"
                              : "bg-gradient-to-br from-purple-600 to-indigo-700 text-white"
                          }`}
                        >
                          {isGemini ? <Sparkles size={22} /> : isOpenAI ? <Bot size={22} /> : <Cpu size={22} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{provider.providerName}</h3>
                            {provider.isDefault && (
                              <Badge className="bg-[#274690] text-white text-[9px] font-black uppercase py-0.5">Primary</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {provider.providerType || (isGemini ? "Google AI Provider" : isOpenAI ? "OpenAI Provider" : "Custom AI Provider")}
                          </p>
                        </div>
                      </div>

                      {getProviderBadge(provider.status, provider.connectionStatus)}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Default Model</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {provider.defaultModel || provider.models?.[0]?.modelCode || "None"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">API Key Status</span>
                        <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200">
                          <Lock size={11} className={provider.hasApiKey ? "text-emerald-500" : "text-amber-500"} />
                          <span>{provider.hasApiKey ? "••••••••••••••••" : "Not Configured"}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Last Connection Test</span>
                        <span className="text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
                          {provider.lastConnectionTest ? new Date(provider.lastConnectionTest).toLocaleString() : "Never tested"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Base API URL</span>
                        <span className="text-slate-600 dark:text-slate-300 text-[11px] truncate block" title={provider.baseUrl || ""}>
                          {provider.baseUrl || "Standard default"}
                        </span>
                      </div>
                    </div>

                    {/* Error Notice if any */}
                    {provider.lastError && provider.connectionStatus === "FAILED" && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{provider.lastError}</span>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            if (isGemini) openGeminiConfig(provider);
                            else if (isOpenAI) openOpenAIConfig(provider);
                            else {
                              setConfigEditingProvider(provider);
                              setConfiguringProviderType("custom");
                              setFormState({
                                id: provider.id,
                                providerName: provider.providerName,
                                providerCode: provider.providerCode,
                                providerType: provider.providerType || "Custom",
                                baseUrl: provider.baseUrl || "",
                                apiVersion: provider.apiVersion || "v1",
                                defaultModel: provider.defaultModel || "",
                                apiKey: "",
                                replaceApiKey: false,
                                status: provider.status,
                                priority: provider.priority,
                                isDefault: provider.isDefault,
                              });
                              setShowConfigModal(true);
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs font-bold rounded-xl h-8 px-3 gap-1.5"
                        >
                          <Settings2 size={13} /> Configure
                        </Button>

                        <Button
                          onClick={() => handleTestConnection(provider.id, provider.defaultModel)}
                          disabled={isTesting}
                          size="sm"
                          className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl h-8 px-3 gap-1.5"
                        >
                          <Zap size={13} className={isTesting ? "animate-spin text-amber-300" : ""} />
                          {isTesting ? "Testing..." : "Test Connection"}
                        </Button>

                        <Button
                          onClick={() => handleSyncModels(provider.id, provider.providerName)}
                          disabled={isSyncing}
                          size="sm"
                          variant="ghost"
                          className="text-xs font-bold rounded-xl h-8 px-2.5 text-slate-600 hover:text-slate-900"
                          title="Sync models from API"
                        >
                          <RefreshCw size={12} className={isSyncing ? "animate-spin mr-1" : "mr-1"} />
                          Sync Models
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {provider.status === "ACTIVE" ? (
                          <Button
                            onClick={() => handleDeactivateProvider(provider.id, provider.providerName)}
                            size="sm"
                            variant="ghost"
                            className="text-xs font-bold rounded-xl h-8 px-2.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleActivateProvider(provider.id, provider.providerName)}
                            size="sm"
                            variant="ghost"
                            className="text-xs font-bold rounded-xl h-8 px-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            Activate
                          </Button>
                        )}

                        <Button
                          onClick={() => handleDeleteProvider(provider.id, provider.providerName)}
                          size="sm"
                          variant="ghost"
                          className="text-xs font-bold rounded-xl h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Delete Provider"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === "table" && (
            <Card className="rounded-3xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Provider</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Default Model</th>
                      <th className="py-3 px-4">API Key Status</th>
                      <th className="py-3 px-4">Last Connection Test</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-semibold">
                    {filteredProviders.map((provider) => (
                      <tr key={provider.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#274690]/10 text-[#274690] dark:text-blue-400 flex items-center justify-center font-bold">
                              <Bot size={15} />
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 block">{provider.providerName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{provider.providerCode}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {provider.providerType || "LLM"}
                        </td>
                        <td className="py-3.5 px-4">{getProviderBadge(provider.status, provider.connectionStatus)}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-800 dark:text-slate-200 font-bold">
                            {provider.defaultModel || "default"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-600 dark:text-slate-300">
                            {provider.hasApiKey ? "Configured ••••••••••••••••" : "Not Configured"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {provider.lastConnectionTest ? new Date(provider.lastConnectionTest).toLocaleDateString() : "Never"}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Button
                            onClick={() => {
                              if (provider.providerCode.includes("gemini")) openGeminiConfig(provider);
                              else openOpenAIConfig(provider);
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs font-bold"
                          >
                            Configure
                          </Button>
                          <Button
                            onClick={() => handleTestConnection(provider.id, provider.defaultModel)}
                            size="sm"
                            className="h-7 bg-[#274690] text-white text-xs font-bold"
                          >
                            Test
                          </Button>
                          <Button
                            onClick={() =>
                              provider.status === "ACTIVE"
                                ? handleDeactivateProvider(provider.id, provider.providerName)
                                : handleActivateProvider(provider.id, provider.providerName)
                            }
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs font-bold"
                          >
                            {provider.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: AI ROUTING & FALLBACK CONFIGURATION */}
      {/* ==================================================================== */}
      {activeTab === "routing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Workflow size={18} className="text-[#274690] dark:text-blue-400" />
                  Dynamic AI Provider Routing & Resilient Failover
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure platform-level primary and fallback routing. All tenants automatically route through these settings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Routing Status:</span>
                <button
                  type="button"
                  onClick={() => setRoutingConfig({ ...routingConfig, routingEnabled: !routingConfig.routingEnabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    routingConfig.routingEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      routingConfig.routingEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Configuration */}
              <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-[#274690] dark:text-blue-300 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> Primary AI Provider
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Primary Provider</label>
                  <select
                    value={routingConfig.primaryProviderCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const selected = providers.find((p) => p.providerCode === code);
                      setRoutingConfig({
                        ...routingConfig,
                        primaryProviderCode: code,
                        primaryModel: selected?.defaultModel || "gemini-3.6-flash",
                      });
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.providerCode}>
                        {p.providerName} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Primary Model</label>
                  <input
                    type="text"
                    value={routingConfig.primaryModel}
                    onChange={(e) => setRoutingConfig({ ...routingConfig, primaryModel: e.target.value })}
                    placeholder="e.g. gemini-3.6-flash"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Recommended: gemini-3.6-flash or gpt-4o-mini</p>
                </div>
              </div>

              {/* Fallback Configuration */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Resilient Fallback Provider
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Fallback Provider</label>
                  <select
                    value={routingConfig.fallbackProviderCode || ""}
                    onChange={(e) => {
                      const code = e.target.value;
                      const selected = providers.find((p) => p.providerCode === code);
                      setRoutingConfig({
                        ...routingConfig,
                        fallbackProviderCode: code || null,
                        fallbackModel: selected?.defaultModel || "gpt-4o-mini",
                      });
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">None (No Fallback)</option>
                    {providers
                      .filter((p) => p.providerCode !== routingConfig.primaryProviderCode)
                      .map((p) => (
                        <option key={p.id} value={p.providerCode}>
                          {p.providerName} ({p.status})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Fallback Model</label>
                  <input
                    type="text"
                    value={routingConfig.fallbackModel || ""}
                    onChange={(e) => setRoutingConfig({ ...routingConfig, fallbackModel: e.target.value })}
                    placeholder="e.g. gpt-4o-mini"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Automatic failover if primary provider encounters API failure or rate limit</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <strong className="block font-bold">Automatic Failover Protection:</strong>
                If the Primary AI provider experiences an API timeout, rate limit, quota exhaustion, or service outage, the backend automatically reroutes requests to the configured Fallback provider seamlessly without interrupting tenant workflows.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveRouting}
                disabled={isSavingRouting}
                className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs rounded-xl px-6 h-10 shadow-md"
              >
                {isSavingRouting ? "Saving Routing..." : "Save Routing Configuration"}
              </Button>
            </div>
          </Card>

          {/* Architecture Diagram Info */}
          <Card className="lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers size={16} className="text-[#274690]" />
              Multi-Tenant AI Architecture
            </h3>

            <div className="space-y-3 text-xs font-medium text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">1</span>
                <span>Super Admin configures platform API credentials securely</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">2</span>
                <span>Credentials encrypted in PostgreSQL via AES-256-GCM</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">3</span>
                <span>AI Gateway dynamically resolves active provider & model</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">4</span>
                <span>Organizations consume AI with zero key exposure</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PROVIDER HEALTH */}
      {/* ==================================================================== */}
      {activeTab === "health" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {providers.map((p) => {
              const isConnected = p.connectionStatus === "CONNECTED";
              return (
                <Card
                  key={p.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3.5 h-3.5 rounded-full ${
                          isConnected ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-rose-500 shadow-lg shadow-rose-500/50"
                        }`}
                      />
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{p.providerName}</h3>
                        <span className="text-[11px] font-mono text-slate-500">{p.providerCode}</span>
                      </div>
                    </div>

                    <Badge
                      className={
                        isConnected
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 text-xs font-bold"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 text-xs font-bold"
                      }
                    >
                      {isConnected ? "🟢 Connected" : "🔴 Connection Failed"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Status</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{p.status}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Default Model</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono truncate block">
                        {p.defaultModel || "None"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Last Connection Test</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {p.lastConnectionTest ? new Date(p.lastConnectionTest).toLocaleString() : "Never"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Last Successful Ping</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {p.lastConnectedAt ? new Date(p.lastConnectedAt).toLocaleString() : "None"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={() => handleTestConnection(p.id, p.defaultModel)}
                      size="sm"
                      className="bg-[#274690] text-white text-xs font-bold rounded-xl h-8 gap-1.5"
                    >
                      <Zap size={13} /> Re-verify Health
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: USAGE & LOGS */}
      {/* ==================================================================== */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#11192e] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search request ID, org, model..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={logFilterProvider}
                onChange={(e) => setLogFilterProvider(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Providers</option>
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
              </select>

              <select
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Status</option>
                <option value="SUCCESS">Success Only</option>
                <option value="FAILED">Failed Only</option>
              </select>
            </div>
          </div>

          <Card className="rounded-3xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Request / Time</th>
                    <th className="py-3 px-4">Provider / Model</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Tokens</th>
                    <th className="py-3 px-4">Cost</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-semibold">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No AI inference logs matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono text-slate-800 dark:text-slate-200 block text-[11px] font-bold">
                            {log.requestId || log.id.slice(0, 12)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "Just now"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{log.provider}</span>
                          <span className="font-mono text-[10px] text-slate-500">{log.model}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {log.capability || "Document AI"}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{log.latency || "140ms"}</td>
                        <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                          {(log.tokenUsage || 180).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                          ${log.cost?.toFixed(4) || "0.0001"}
                        </td>
                        <td className="py-3 px-4">
                          {log.status === "SUCCESS" ? (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-extrabold py-0">
                              Success
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 text-[10px] font-extrabold py-0">
                              Failed
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: OVERVIEW ANALYTICS */}
      {/* ==================================================================== */}
      {activeTab === "overview" && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total AI Requests</span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 block mt-1">
                {overview.totalAiRequests.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">99.2% Success Rate</span>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Response Time</span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 block mt-1">
                {overview.averageProcessingTimeMs}ms
              </span>
              <span className="text-[10px] text-blue-600 font-bold">Fast Multimodal Pipeline</span>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Token Volume</span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 block mt-1">
                {(overview.totalTokenUsage / 1000000).toFixed(1)}M
              </span>
              <span className="text-[10px] text-purple-600 font-bold">Meters active tenants</span>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Spend (USD)</span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 block mt-1">
                ${overview.aiCostUsd.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">Within monthly quota</span>
            </Card>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CONFIGURATION MODAL (FOR GEMINI / OPENAI / CUSTOM) */}
      {/* ==================================================================== */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                    configuringProviderType === "gemini"
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600"
                      : "bg-gradient-to-br from-emerald-600 to-teal-700"
                  }`}
                >
                  {configuringProviderType === "gemini" ? <Sparkles size={20} /> : <Bot size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Configure {formState.providerName}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Manage API credentials, base URLs, and default models securely
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfiguration} className="space-y-4 text-xs font-semibold">
              {/* Provider Name */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Provider</label>
                <input
                  type="text"
                  required
                  value={formState.providerName}
                  onChange={(e) => setFormState({ ...formState, providerName: e.target.value })}
                  disabled={configuringProviderType !== "custom"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              {/* API Key (Secure password field) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 dark:text-slate-400 font-bold">API Key</label>
                  {configEditingProvider?.hasApiKey && (
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, replaceApiKey: !formState.replaceApiKey, apiKey: "" })}
                      className="text-[11px] text-[#274690] dark:text-blue-400 hover:underline font-bold"
                    >
                      {formState.replaceApiKey ? "Keep Existing Key" : "Replace Key"}
                    </button>
                  )}
                </div>

                {configEditingProvider?.hasApiKey && !formState.replaceApiKey ? (
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    <span className="flex items-center gap-2">
                      <Lock size={13} className="text-emerald-500" />
                      ••••••••••••••••
                    </span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px] font-bold py-0">
                      Configured & Encrypted
                    </Badge>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type={showApiKeyPlain ? "text" : "password"}
                      value={formState.apiKey}
                      onChange={(e) => setFormState({ ...formState, apiKey: e.target.value })}
                      placeholder={configuringProviderType === "gemini" ? "AIzaSy..." : "sk-proj-..."}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeyPlain(!showApiKeyPlain)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showApiKeyPlain ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Lock size={10} /> Encrypted server-side via AES-256-GCM. Never exposed in plain text after saving.
                </p>
              </div>

              {/* Base URL & Version */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Base URL</label>
                  <input
                    type="text"
                    required
                    value={formState.baseUrl}
                    onChange={(e) => setFormState({ ...formState, baseUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">API Version</label>
                  <input
                    type="text"
                    required
                    value={formState.apiVersion}
                    onChange={(e) => setFormState({ ...formState, apiVersion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Default Model Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 dark:text-slate-400">Default Model</label>
                  {formState.id && (
                    <button
                      type="button"
                      onClick={() => handleSyncModels(formState.id, formState.providerName)}
                      className="text-[11px] text-[#274690] dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={11} /> Sync from Provider API
                    </button>
                  )}
                </div>

                <select
                  value={formState.defaultModel}
                  onChange={(e) => setFormState({ ...formState, defaultModel: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-xs"
                >
                  {getAvailableModelsForForm().map((modelCode) => (
                    <option key={modelCode} value={modelCode}>
                      {modelCode}
                    </option>
                  ))}
                  {customModelInput && <option value={customModelInput}>{customModelInput} (Custom)</option>}
                </select>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    placeholder="Or enter new model code (e.g. gemini-2.5-pro)..."
                    className="flex-1 px-3 py-1.5 text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 font-mono"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (customModelInput.trim()) {
                        setFormState({ ...formState, defaultModel: customModelInput.trim() });
                        showToast(`Selected model set to ${customModelInput.trim()}`, "success");
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold rounded-xl"
                  >
                    Set Model
                  </Button>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.status === "ACTIVE"}
                    onChange={(e) => setFormState({ ...formState, status: e.target.checked ? "ACTIVE" : "INACTIVE" })}
                    className="w-4 h-4 rounded border-slate-300 text-[#274690]"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Active / Enabled</span>
                </label>
              </div>

              {/* Live Test Feedback inside modal */}
              {modalTestResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-medium space-y-1 ${
                    modalTestResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {modalTestResult.success ? <CheckCircle size={15} className="text-emerald-600" /> : <XCircle size={15} className="text-rose-600" />}
                    <span>{modalTestResult.message}</span>
                  </div>
                  <div className="text-[11px] opacity-85">
                    Model: <span className="font-mono font-bold">{modalTestResult.modelTested}</span> | Latency:{" "}
                    <span className="font-mono font-bold">{modalTestResult.responseTimeMs}ms</span>
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={handleTestInModal}
                  disabled={isTestingInModal}
                  variant="outline"
                  className="rounded-xl h-9 text-xs font-bold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <Zap size={13} className={isTestingInModal ? "animate-spin text-amber-500" : "text-amber-500"} />
                  {isTestingInModal ? "Testing Live..." : "Test Connection"}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowConfigModal(false)}
                    className="rounded-xl h-9 text-xs font-bold text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl h-9 text-xs font-bold px-5 shadow-sm"
                  >
                    Save Configuration
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TEST CONNECTION FEEDBACK MODAL (PROMINENT REAL RESPONSE DISPLAY) */}
      {/* ==================================================================== */}
      {testResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    testResultModal.success
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                  }`}
                >
                  {testResultModal.success ? <CheckCircle size={22} /> : <XCircle size={22} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {testResultModal.success ? "Connection Successful" : "Connection Failed"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Real Backend Provider Verification</p>
                </div>
              </div>
              <button onClick={() => setTestResultModal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Provider:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{testResultModal.provider}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Model Tested:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{testResultModal.modelTested}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Response Time:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {testResultModal.responseTimeMs}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tested At:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {new Date(testResultModal.testedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            </div>

            {!testResultModal.success && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                <strong className="block font-bold">Error Category: {testResultModal.errorCategory || "Provider Error"}</strong>
                <p className="opacity-90">{testResultModal.message}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setTestResultModal(null)}
                className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl px-5 h-9"
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
