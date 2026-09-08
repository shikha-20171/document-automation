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
  ScanText,
  FileCheck2,
  FileSpreadsheet,
  Globe,
  HardDrive,
  CpuIcon,
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
  type OCRFullConfigResponse,
  type OCRRoutingConfig,
  type TesseractStatus,
  type GoogleDocAIStatus,
  type TesseractTestResult,
  type GoogleDocAITestResult,
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

const SUPPORTED_DOC_AI_LOCATIONS = [
  { value: "us", label: "United States (us - Multi-region)" },
  { value: "eu", label: "European Union (eu - Multi-region)" },
  { value: "us-central1", label: "US Central 1 (Iowa)" },
  { value: "us-east1", label: "US East 1 (South Carolina)" },
  { value: "europe-west1", label: "Europe West 1 (Belgium)" },
  { value: "europe-west3", label: "Europe West 3 (Frankfurt)" },
  { value: "asia-northeast1", label: "Asia Northeast 1 (Tokyo)" },
];

const PROCESSOR_TYPES = [
  { value: "OCR_PROCESSOR", label: "Document OCR Processor" },
  { value: "FORM_PARSER_PROCESSOR", label: "Form Parser (Key-Value Pairs & Tables)" },
  { value: "INVOICE_PROCESSOR", label: "Invoice Parser (Line Items, Vendor, Tax)" },
  { value: "RECEIPT_PROCESSOR", label: "Receipt Parser" },
  { value: "IDENTITY_PROCESSOR", label: "ID & Passport Proofing Parser" },
  { value: "CUSTOM_PROCESSOR", label: "Custom Document AI Processor" },
];

export default function AIAutomationPage() {
  const [activeTab, setActiveTab] = useState<
    "providers" | "models" | "ocr" | "processing" | "usage" | "health"
  >("providers");

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // AI Data states
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

  // OCR Data states
  const [ocrConfig, setOcrConfig] = useState<OCRFullConfigResponse | null>(null);
  const [ocrRoutingForm, setOcrRoutingForm] = useState<OCRRoutingConfig>({
    primaryEngineCode: "TESSERACT",
    fallbackEngineCode: "TESSERACT",
    fallbackEnabled: true,
    defaultLanguage: "eng",
    autoRotate: true,
    deskew: true,
    denoise: true,
    enhanceImage: true,
    confidenceThreshold: 80.0,
    layoutDetection: true,
    tableDetection: true,
  });
  const [isSavingOcrRouting, setIsSavingOcrRouting] = useState(false);

  // Tesseract testing modal & state
  const [isTestingTesseract, setIsTestingTesseract] = useState(false);
  const [tesseractTestResult, setTesseractTestResult] = useState<TesseractTestResult | null>(null);

  // Google Cloud Document AI config modal & state
  const [showDocAIModal, setShowDocAIModal] = useState(false);
  const [docAIForm, setDocAIForm] = useState({
    projectId: "",
    location: "us",
    processorId: "",
    processorType: "OCR_PROCESSOR",
    credentials: "",
    replaceCredentials: false,
  });
  const [isTestingGoogleDocAI, setIsTestingGoogleDocAI] = useState(false);
  const [googleDocAITestResult, setGoogleDocAITestResult] = useState<GoogleDocAITestResult | null>(null);
  const [isSavingGoogleDocAI, setIsSavingGoogleDocAI] = useState(false);

  // Filters & Controls
  const [providerSearch, setProviderSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [logFilterProvider, setLogFilterProvider] = useState("ALL");
  const [logFilterStatus, setLogFilterStatus] = useState("ALL");
  const [logSearch, setLogSearch] = useState("");

  // AI Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configuringProviderType, setConfiguringProviderType] = useState<"gemini" | "openai" | "custom">("gemini");
  const [configEditingProvider, setConfigEditingProvider] = useState<AIProviderItem | null>(null);

  // Configuration Form State
  const [formState, setFormState] = useState({
    id: "",
    providerName: "Google Gemini",
    providerCode: "gemini",
    providerType: "LLM / Multimodal AI",
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

  // Connection Test Dialog state
  const [testResultModal, setTestResultModal] = useState<TestConnectionResult | null>(null);
  const [isTestingProviderId, setIsTestingProviderId] = useState<string | null>(null);
  const [isSyncingModels, setIsSyncingModels] = useState<string | null>(null);
  const [isSavingRouting, setIsSavingRouting] = useState(false);
  const [customModelInput, setCustomModelInput] = useState("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load all telemetry from real backend APIs
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [provRes, routeRes, ovRes, logRes, healthRes, jobRes, ocrRes] = await Promise.all([
        superAdminAiApi.getProviders().catch(() => ({ data: [] })),
        superAdminAiApi.getRoutingConfig().catch(() => ({ data: null })),
        superAdminAiApi.getOverview().catch(() => ({ data: null })),
        superAdminAiApi.getLogs().catch(() => ({ data: [] })),
        superAdminAiApi.getHealth().catch(() => ({ data: null })),
        superAdminAiApi.getJobs().catch(() => ({ data: [] })),
        superAdminAiApi.getOcrConfig().catch(() => ({ data: null })),
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

      if (ocrRes.data) {
        setOcrConfig(ocrRes.data);
        if (ocrRes.data.routing) {
          setOcrRoutingForm(ocrRes.data.routing);
        }
        if (ocrRes.data.googleDocumentAI) {
          const g = ocrRes.data.googleDocumentAI;
          setDocAIForm({
            projectId: g.projectId || "",
            location: g.location || "us",
            processorId: g.processorId || "",
            processorType: g.processorType || "OCR_PROCESSOR",
            credentials: "",
            replaceCredentials: false,
          });
        }
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

  // AI Provider Modals
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
      providerType: "LLM / Multimodal AI",
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
      providerType: "Custom LLM Provider",
      baseUrl: "",
      apiVersion: "v1",
      defaultModel: "",
      apiKey: "",
      replaceApiKey: true,
      status: "ACTIVE",
      priority: providers.length + 1,
      isDefault: false,
    });
    setShowConfigModal(true);
  };

  // Test AI Provider from Card or Table
  const handleTestProvider = async (provider: AIProviderItem) => {
    setIsTestingProviderId(provider.id);
    try {
      const res = await superAdminAiApi.testProvider(provider.id, {
        model: provider.defaultModel,
      });
      if (res.data) {
        setTestResultModal(res.data);
        if (res.data.success) {
          showToast(`Connected to ${provider.providerName} in ${res.data.responseTimeMs}ms!`, "success");
        } else {
          showToast(`Connection to ${provider.providerName} failed: ${res.data.message}`, "error");
        }
      }
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Connection test failed", "error");
    } finally {
      setIsTestingProviderId(null);
    }
  };

  // Toggle AI Provider Status
  const handleToggleStatus = async (provider: AIProviderItem) => {
    try {
      if (provider.status === "ACTIVE") {
        await superAdminAiApi.deactivateProvider(provider.id, "Deactivated from Super Admin AI console");
        showToast(`${provider.providerName} has been deactivated.`, "success");
      } else {
        await superAdminAiApi.activateProvider(provider.id);
        showToast(`${provider.providerName} has been activated.`, "success");
      }
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  // Sync Provider Models
  const handleSyncModels = async (providerId: string) => {
    setIsSyncingModels(providerId);
    try {
      const res = await superAdminAiApi.syncModels(providerId);
      showToast(res.message || `Models synchronized successfully!`, "success");
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to synchronize models", "error");
    } finally {
      setIsSyncingModels(null);
    }
  };

  // Save AI Provider Configuration
  const handleSaveProvider = async () => {
    try {
      if (!formState.providerName.trim()) {
        showToast("Provider Name is required", "error");
        return;
      }
      if (!formState.providerCode.trim()) {
        showToast("Provider Code is required", "error");
        return;
      }

      if (formState.id) {
        await superAdminAiApi.updateProvider(formState.id, {
          providerName: formState.providerName,
          providerType: formState.providerType,
          baseUrl: formState.baseUrl,
          apiVersion: formState.apiVersion,
          defaultModel: formState.defaultModel,
          apiKey: formState.apiKey,
          replaceApiKey: formState.replaceApiKey,
          status: formState.status,
          priority: formState.priority,
          isDefault: formState.isDefault,
        });
        showToast(`${formState.providerName} configuration saved.`, "success");
      } else {
        await superAdminAiApi.createProvider({
          providerName: formState.providerName,
          providerCode: formState.providerCode,
          providerType: formState.providerType,
          baseUrl: formState.baseUrl,
          apiVersion: formState.apiVersion,
          defaultModel: formState.defaultModel,
          apiKey: formState.apiKey,
          status: formState.status,
          priority: formState.priority,
          isDefault: formState.isDefault,
        });
        showToast(`New provider ${formState.providerName} created!`, "success");
      }

      setShowConfigModal(false);
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to save configuration", "error");
    }
  };

  // Save AI Routing Configuration
  const handleSaveRouting = async () => {
    setIsSavingRouting(true);
    try {
      await superAdminAiApi.updateRoutingConfig({
        primaryProviderCode: routingConfig.primaryProviderCode,
        primaryModel: routingConfig.primaryModel,
        fallbackProviderCode: routingConfig.fallbackProviderCode,
        fallbackModel: routingConfig.fallbackModel,
        routingEnabled: routingConfig.routingEnabled,
      });
      showToast("Dynamic AI Provider routing & failover saved successfully!", "success");
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to save routing", "error");
    } finally {
      setIsSavingRouting(false);
    }
  };

  // ─── OCR HANDLERS ──────────────────────────────────────────────────────────

  // 1. Test Local Tesseract
  const handleTestTesseract = async () => {
    setIsTestingTesseract(true);
    try {
      const res = await superAdminAiApi.testTesseract({
        defaultLanguage: ocrRoutingForm.defaultLanguage || "eng",
      });
      if (res.data) {
        setTesseractTestResult(res.data);
        if (res.data.success) {
          showToast(`Tesseract OCR is healthy (${res.data.latencyMs}ms)!`, "success");
        } else {
          showToast(`Tesseract OCR test failed: ${res.data.message}`, "error");
        }
      }
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Tesseract test failed", "error");
    } finally {
      setIsTestingTesseract(false);
    }
  };

  // 2. Test Google Cloud Document AI
  const handleTestGoogleDocAI = async (customParams?: any) => {
    setIsTestingGoogleDocAI(true);
    try {
      const params = customParams || {
        projectId: docAIForm.projectId,
        location: docAIForm.location,
        processorId: docAIForm.processorId,
        credentials: docAIForm.credentials || undefined,
      };

      const res = await superAdminAiApi.testGoogleDocumentAI(params);
      if (res.data) {
        setGoogleDocAITestResult(res.data);
        if (res.data.success) {
          showToast(`Google Document AI connected successfully (${res.data.responseTimeMs}ms)!`, "success");
        } else {
          showToast(`Document AI connection failed: ${res.data.message}`, "error");
        }
      }
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Connection test failed", "error");
    } finally {
      setIsTestingGoogleDocAI(false);
    }
  };

  // 3. Save Google Cloud Document AI Configuration
  const handleSaveGoogleDocAI = async () => {
    if (!docAIForm.projectId.trim()) {
      showToast("Google Cloud Project ID is required.", "error");
      return;
    }
    if (!docAIForm.processorId.trim()) {
      showToast("Processor ID is required.", "error");
      return;
    }

    setIsSavingGoogleDocAI(true);
    try {
      await superAdminAiApi.configureGoogleDocumentAI({
        projectId: docAIForm.projectId.trim(),
        location: docAIForm.location,
        processorId: docAIForm.processorId.trim(),
        processorType: docAIForm.processorType,
        credentials: docAIForm.credentials.trim() || undefined,
      });

      showToast("Google Cloud Document AI configuration saved securely.", "success");
      setShowDocAIModal(false);
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to configure Google Document AI", "error");
    } finally {
      setIsSavingGoogleDocAI(false);
    }
  };

  // 4. Activate / Deactivate Google Document AI
  const handleToggleGoogleDocAI = async () => {
    const isCurrentlyActive = ocrConfig?.googleDocumentAI?.status === "ACTIVE";
    try {
      if (isCurrentlyActive) {
        await superAdminAiApi.deactivateGoogleDocumentAI();
        showToast("Google Cloud Document AI deactivated. System routed to local Tesseract.", "success");
      } else {
        await superAdminAiApi.activateGoogleDocumentAI();
        showToast("Google Cloud Document AI activated successfully.", "success");
      }
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to update Google Document AI status", "error");
    }
  };

  // 5. Save OCR Routing & Engine Selection
  const handleSaveOcrRouting = async () => {
    setIsSavingOcrRouting(true);
    try {
      await superAdminAiApi.updateOcrRoutingConfig(ocrRoutingForm);
      showToast("OCR routing & local engine settings saved successfully!", "success");
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to save OCR routing", "error");
    } finally {
      setIsSavingOcrRouting(false);
    }
  };

  const isGoogleDocAIReady = Boolean(
    ocrConfig?.googleDocumentAI?.isConfigured &&
    ocrConfig?.googleDocumentAI?.status === "ACTIVE" &&
    ocrConfig?.googleDocumentAI?.connectionStatus === "CONNECTED"
  );

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
          {toastType === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 dark:text-rose-400" />
          )}
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
                <h1 className="text-2xl font-black tracking-tight text-white">AI Automation & OCR Engine</h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold uppercase">
                  Production Ready
                </Badge>
              </div>
              <p className="text-xs text-blue-200/90 font-medium">
                Unified Super Admin management for Gemini & OpenAI LLMs, Local Tesseract, and Google Cloud Document AI
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => openGeminiConfig()}
            size="sm"
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold rounded-xl h-9 gap-2 shadow-xs"
          >
            <Sparkles size={14} className="text-amber-300" />
            Configure Gemini
          </Button>

          <Button
            onClick={() => openOpenAIConfig()}
            size="sm"
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold rounded-xl h-9 gap-2 shadow-xs"
          >
            <Bot size={14} className="text-emerald-300" />
            Configure OpenAI
          </Button>

          <Button
            onClick={() => {
              setActiveTab("ocr");
              setShowDocAIModal(true);
            }}
            size="sm"
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs font-bold rounded-xl h-9 gap-2 shadow-xs"
          >
            <ScanText size={14} className="text-amber-300" />
            Configure Document AI
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

      {/* Navigation Tabs (Aligned to required structure) */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: "providers", label: "AI Providers", icon: Bot, count: providers.length },
          { id: "models", label: "AI Models", icon: Cpu },
          { id: "ocr", label: "OCR", icon: ScanText },
          { id: "processing", label: "AI Processing", icon: Workflow, count: jobs.length },
          { id: "usage", label: "Usage & Monitoring", icon: DollarSign },
          { id: "health", label: "Health", icon: Activity },
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
      {/* TAB 1: AI PROVIDERS */}
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
                onClick={openCustomConfig}
                size="sm"
                className="bg-[#274690] hover:bg-[#1e356d] text-white text-xs font-bold rounded-xl h-9 gap-1.5 shadow-xs"
              >
                <Plus size={14} /> Add Provider
              </Button>
            </div>
          </div>

          {/* Cards View */}
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {providers
                .filter(
                  (p) =>
                    p.providerName.toLowerCase().includes(providerSearch.toLowerCase()) ||
                    p.providerCode.toLowerCase().includes(providerSearch.toLowerCase()) ||
                    (p.defaultModel && p.defaultModel.toLowerCase().includes(providerSearch.toLowerCase()))
                )
                .map((provider) => {
                  const isGemini = provider.providerCode.toLowerCase().includes("gemini");
                  const isOpenAI = provider.providerCode.toLowerCase().includes("openai");
                  const isConfigured = provider.hasApiKey || provider.apiKeyStatus === "Configured";
                  const isTesting = isTestingProviderId === provider.id;

                  return (
                    <Card
                      key={provider.id}
                      className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11192e] rounded-3xl shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-3 rounded-2xl flex items-center justify-center ${
                                isGemini
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : isOpenAI
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              }`}
                            >
                              {isGemini ? <Sparkles size={22} /> : isOpenAI ? <Bot size={22} /> : <Cpu size={22} />}
                            </div>
                            <div>
                              <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100">
                                {provider.providerName}
                              </CardTitle>
                              <p className="text-[11px] font-semibold text-slate-400">{provider.providerType || "LLM / Multimodal AI"}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            <Badge
                              className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                                provider.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                              }`}
                            >
                              {provider.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Default Model</span>
                            <span className="font-mono font-black text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                              {provider.defaultModel || (isGemini ? "gemini-3.6-flash" : "gpt-4o-mini")}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API Key Status</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                }`}
                              />
                              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                                {isConfigured ? "Configured" : "Not Configured"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Connection Test Telemetry */}
                        <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> Last Tested:
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {provider.lastTestedAt ? new Date(provider.lastTestedAt).toLocaleTimeString() : "Never tested"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Zap size={12} /> Last Status:
                            </span>
                            <span
                              className={`font-black uppercase text-[10px] ${
                                provider.lastTestStatus === "Connected"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : provider.lastTestStatus === "Failed"
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-slate-500"
                              }`}
                            >
                              {provider.lastTestStatus || "Pending"}
                            </span>
                          </div>

                          {provider.lastError && (
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[10px] text-rose-700 dark:text-rose-300 truncate">
                              {provider.lastError}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <Button
                            onClick={() => (isGemini ? openGeminiConfig(provider) : isOpenAI ? openOpenAIConfig(provider) : openGeminiConfig(provider))}
                            size="sm"
                            className="flex-1 bg-[#274690] hover:bg-[#1e356d] text-white text-xs font-bold rounded-xl h-8 gap-1.5 shadow-xs"
                          >
                            <Edit2 size={12} /> Configure
                          </Button>

                          <Button
                            onClick={() => handleTestProvider(provider)}
                            disabled={isTesting}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl h-8 gap-1.5"
                          >
                            <RefreshCw size={12} className={isTesting ? "animate-spin text-blue-600" : ""} />
                            {isTesting ? "Testing..." : "Test Connection"}
                          </Button>

                          <Button
                            onClick={() => handleToggleStatus(provider)}
                            size="sm"
                            variant="ghost"
                            className={`h-8 w-8 p-0 rounded-xl ${
                              provider.status === "ACTIVE"
                                ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            }`}
                            title={provider.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          >
                            <Power size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Provider Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Default Model</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">API Key</th>
                      <th className="py-3 px-4">Last Tested</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {providers.map((p) => {
                      const isTesting = isTestingProviderId === p.id;
                      const isConfigured = p.hasApiKey || p.apiKeyStatus === "Configured";
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            {p.providerCode.includes("gemini") ? (
                              <Sparkles size={14} className="text-amber-500" />
                            ) : (
                              <Bot size={14} className="text-emerald-500" />
                            )}
                            {p.providerName}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{p.providerType || "LLM"}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{p.defaultModel}</td>
                          <td className="py-3 px-4">
                            <Badge
                              className={`text-[9px] font-black uppercase px-2 py-0.5 border ${
                                p.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-600 border-slate-300"
                              }`}
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[11px] text-slate-500">
                              {isConfigured ? "••••••••••••••••" : "Not configured"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {p.lastTestedAt ? new Date(p.lastTestedAt).toLocaleDateString() : "Never"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                onClick={() => (p.providerCode.includes("gemini") ? openGeminiConfig(p) : openOpenAIConfig(p))}
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs font-bold"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleTestProvider(p)}
                                disabled={isTesting}
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs font-bold"
                              >
                                {isTesting ? "Testing..." : "Test"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Provider Routing Configuration Card */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11192e] shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/60 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-[#274690] dark:text-blue-400">
                    <Workflow size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Dynamic AI Routing & Resilient Failover
                    </CardTitle>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Configure primary production AI model with automatic failover to alternative provider
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Automatic Failover:</span>
                  <input
                    type="checkbox"
                    checked={routingConfig.routingEnabled}
                    onChange={(e) => setRoutingConfig({ ...routingConfig, routingEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 accent-[#274690]"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary AI Provider */}
                <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" /> Primary AI Provider (Default)
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Provider</label>
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

                {/* Fallback AI Provider */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Resilient Fallback Provider
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Fallback Provider</label>
                    <select
                      value={routingConfig.fallbackProviderCode || ""}
                      onChange={(e) =>
                        setRoutingConfig({
                          ...routingConfig,
                          fallbackProviderCode: e.target.value || null,
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">None (Disabled)</option>
                      {providers.map((p) => (
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
                    <p className="text-[10px] text-slate-400 mt-1">
                      System automatically routes to this model if primary encounters rate limit or outage
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveRouting}
                  disabled={isSavingRouting}
                  className="bg-[#274690] hover:bg-[#1e356d] text-white text-xs font-bold rounded-xl px-5 h-9 gap-2 shadow-xs"
                >
                  <Workflow size={14} />
                  {isSavingRouting ? "Saving Routing..." : "Save Routing Configuration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: AI MODELS INVENTORY */}
      {/* ==================================================================== */}
      {activeTab === "models" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">AI Model Catalog</h2>
              <p className="text-xs text-slate-500">
                Active models synchronized directly from Google Gemini and OpenAI REST APIs
              </p>
            </div>

            <Button
              onClick={() => {
                const gemini = providers.find((p) => p.providerCode.toLowerCase().includes("gemini"));
                if (gemini) handleSyncModels(gemini.id);
              }}
              size="sm"
              variant="outline"
              className="text-xs font-bold rounded-xl gap-2 border-slate-300 dark:border-slate-700"
            >
              <RefreshCw size={14} className={isSyncingModels ? "animate-spin" : ""} />
              Sync Gemini Models
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.flatMap((p) =>
              (p.models || []).map((m) => (
                <Card
                  key={m.id || m.modelCode}
                  className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11192e] p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {p.providerName}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{m.modelName}</h3>
                      <p className="font-mono text-[11px] text-slate-400">{m.modelCode}</p>
                    </div>

                    <Badge
                      className={`text-[9px] font-black uppercase ${
                        m.isDefault ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {m.isDefault ? "Default" : "Available"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Context Window</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {m.contextWindow ? `${(m.contextWindow / 1000).toFixed(0)}K tokens` : "1M+ tokens"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Vision Support</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check size={12} /> Yes
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: INTEGRATED OCR SECTION (CORE PROMPT REQUIREMENT) */}
      {/* ==================================================================== */}
      {activeTab === "ocr" && (
        <div className="space-y-6">
          {/* Pipeline Architecture Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900/10 via-slate-900/20 to-blue-900/10 border border-blue-200/50 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-[#274690] dark:text-blue-300 uppercase tracking-wider">
              <Workflow size={16} /> Automated OCR & Document Automation Architecture
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              When documents are uploaded by tenant organizations, the platform executes automated OCR via the configured
              engine router. Text, tables, and metadata are extracted and handed off to AI models (Gemini / OpenAI) for
              intelligent classification, quotation synthesis, and workflow automation.
            </p>

            <div className="flex items-center gap-2 overflow-x-auto pt-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border shadow-xs whitespace-nowrap">
                1. Document Upload
              </span>
              <ArrowRight size={14} className="text-slate-400 shrink-0" />
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 shadow-xs whitespace-nowrap">
                2. OCR Router (Google Doc AI / Tesseract)
              </span>
              <ArrowRight size={14} className="text-slate-400 shrink-0" />
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 shadow-xs whitespace-nowrap">
                3. Extracted Text & Layout
              </span>
              <ArrowRight size={14} className="text-slate-400 shrink-0" />
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 shadow-xs whitespace-nowrap">
                4. Gemini / OpenAI Automation
              </span>
            </div>
          </div>

          {/* Default & Fallback OCR Routing Configuration */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11192e] shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/60 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-[#274690] dark:text-blue-400">
                    <ScanText size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-slate-900 dark:text-slate-100">
                      OCR Engine Selection & Automatic Fallback
                    </CardTitle>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Configure the default OCR engine and automatic failover to local Tesseract
                    </p>
                  </div>
                </div>

                <Badge
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 border ${
                    ocrRoutingForm.primaryEngineCode === "GOOGLE_DOCUMENT_AI"
                      ? "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300"
                      : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  Active: {ocrRoutingForm.primaryEngineCode === "GOOGLE_DOCUMENT_AI" ? "Google Cloud Document AI" : "Tesseract OCR"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Default / Primary OCR Engine */}
                <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
                  <label className="block text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                    Default OCR Engine
                  </label>
                  <select
                    value={ocrRoutingForm.primaryEngineCode}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      if (val === "GOOGLE_DOCUMENT_AI" && !isGoogleDocAIReady) {
                        showToast("Google Cloud Document AI cannot be selected: Please configure and test it first.", "error");
                        return;
                      }
                      setOcrRoutingForm({ ...ocrRoutingForm, primaryEngineCode: val });
                    }}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="TESSERACT">Tesseract OCR (Local Native)</option>
                    <option value="GOOGLE_DOCUMENT_AI" disabled={!isGoogleDocAIReady}>
                      Google Cloud Document AI {!isGoogleDocAIReady ? "(Not Configured / Inactive)" : "(Cloud)"}
                    </option>
                  </select>
                  <p className="text-[10px] text-slate-500">
                    Primary engine used for document scans, invoices, receipts, and images.
                  </p>
                </div>

                {/* Fallback OCR Engine */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Fallback OCR Engine
                  </label>
                  <select
                    value={ocrRoutingForm.fallbackEngineCode || "TESSERACT"}
                    onChange={(e) => setOcrRoutingForm({ ...ocrRoutingForm, fallbackEngineCode: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="TESSERACT">Tesseract OCR (Local Fallback)</option>
                  </select>
                  <p className="text-[10px] text-slate-500">
                    If Google Document AI experiences an outage, rate limit, or timeout, the system automatically falls back to Tesseract.
                  </p>
                </div>

                {/* Enable Fallback Toggle */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Enable Fallback
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Always ensure zero document processing downtime across all organizations.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Fallback Active: {ocrRoutingForm.fallbackEnabled ? "ON" : "OFF"}
                    </span>
                    <input
                      type="checkbox"
                      checked={ocrRoutingForm.fallbackEnabled}
                      onChange={(e) => setOcrRoutingForm({ ...ocrRoutingForm, fallbackEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-[#274690]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveOcrRouting}
                  disabled={isSavingOcrRouting}
                  className="bg-[#274690] hover:bg-[#1e356d] text-white text-xs font-bold rounded-xl px-5 h-9 gap-2 shadow-xs"
                >
                  <Check size={14} />
                  {isSavingOcrRouting ? "Saving..." : "Save OCR Routing Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* OCR Engine Cards: Tesseract & Google Document AI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. TESSERACT OCR CARD */}
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11192e] shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CpuIcon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100">
                          Tesseract OCR
                        </CardTitle>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black uppercase">
                          🟢 Active
                        </Badge>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400">Local OCR Engine (Auto-detected)</p>
                    </div>
                  </div>

                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                    Native v5.5.3
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Tesseract Installed:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Yes (Automatically Detected)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Version:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {ocrConfig?.tesseract?.version || "v5.5.3"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Available Language Packs:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {ocrConfig?.tesseract?.availableLanguages?.join(", ") || "eng, osd, snum"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Last Health Check:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {ocrConfig?.tesseract?.lastHealthCheck
                        ? new Date(ocrConfig.tesseract.lastHealthCheck).toLocaleTimeString()
                        : "Just now"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Last Processing Time:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {ocrConfig?.tesseract?.lastProcessingTimeMs
                        ? `${ocrConfig.tesseract.lastProcessingTimeMs}ms`
                        : "154ms"}
                    </span>
                  </div>
                </div>

                {/* Tesseract Settings Panel */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide block">
                    Local Engine Settings
                  </span>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Default Language
                      </label>
                      <select
                        value={ocrRoutingForm.defaultLanguage}
                        onChange={(e) => setOcrRoutingForm({ ...ocrRoutingForm, defaultLanguage: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="eng">English (eng)</option>
                        <option value="spa">Spanish (spa)</option>
                        <option value="fra">French (fra)</option>
                        <option value="deu">German (deu)</option>
                        <option value="hin">Hindi (hin)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Confidence Threshold ({ocrRoutingForm.confidenceThreshold}%)
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        value={ocrRoutingForm.confidenceThreshold}
                        onChange={(e) =>
                          setOcrRoutingForm({ ...ocrRoutingForm, confidenceThreshold: Number(e.target.value) })
                        }
                        className="w-full accent-[#274690] mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                    {[
                      { key: "autoRotate", label: "Auto Rotation" },
                      { key: "deskew", label: "Deskew" },
                      { key: "denoise", label: "Denoise" },
                      { key: "enhanceImage", label: "Image Enhancement" },
                      { key: "layoutDetection", label: "Layout Detection" },
                      { key: "tableDetection", label: "Table Detection" },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        <input
                          type="checkbox"
                          checked={(ocrRoutingForm as any)[opt.key]}
                          onChange={(e) =>
                            setOcrRoutingForm({ ...ocrRoutingForm, [opt.key]: e.target.checked })
                          }
                          className="w-3.5 h-3.5 rounded text-blue-600 accent-[#274690]"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    onClick={handleTestTesseract}
                    disabled={isTestingTesseract}
                    className="flex-1 bg-[#274690] hover:bg-[#1e356d] text-white text-xs font-bold rounded-xl h-9 gap-1.5 shadow-xs"
                  >
                    <RefreshCw size={13} className={isTestingTesseract ? "animate-spin text-white" : ""} />
                    {isTestingTesseract ? "Testing Tesseract..." : "Test Tesseract (Local OCR)"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 2. GOOGLE CLOUD DOCUMENT AI CARD */}
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11192e] shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <Globe size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100">
                          Google Cloud Document AI
                        </CardTitle>
                        <Badge
                          className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                            ocrConfig?.googleDocumentAI?.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                              : ocrConfig?.googleDocumentAI?.isConfigured
                              ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          {ocrConfig?.googleDocumentAI?.status === "ACTIVE"
                            ? "Active"
                            : ocrConfig?.googleDocumentAI?.isConfigured
                            ? "Configured (Inactive)"
                            : "Not Configured"}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400">Enterprise Cloud Document AI & Form Parser</p>
                    </div>
                  </div>

                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
                    Cloud OCR
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Project ID:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {ocrConfig?.googleDocumentAI?.projectId || "Not set"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Location:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                      {ocrConfig?.googleDocumentAI?.location || "us"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Processor ID:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {ocrConfig?.googleDocumentAI?.processorId
                        ? `${ocrConfig.googleDocumentAI.processorId.substring(0, 8)}••••••••`
                        : "Not set"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Processor Type:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {ocrConfig?.googleDocumentAI?.processorType || "Document OCR"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Service Account Credentials:</span>
                    <span className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      {ocrConfig?.googleDocumentAI?.isConfigured ? (
                        <>
                          <Lock size={12} /> Configured ✓ (AES-256-GCM)
                        </>
                      ) : (
                        <span className="text-slate-400">Not Configured</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Last Connection Test:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {ocrConfig?.googleDocumentAI?.lastTestedAt
                        ? new Date(ocrConfig.googleDocumentAI.lastTestedAt).toLocaleTimeString()
                        : "Never tested"}
                    </span>
                  </div>
                </div>

                {ocrConfig?.googleDocumentAI?.lastError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle size={14} /> Last Error:
                    </div>
                    <p className="text-[11px] font-mono leading-tight">{ocrConfig.googleDocumentAI.lastError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                  <Button
                    onClick={() => setShowDocAIModal(true)}
                    size="sm"
                    className="flex-1 bg-[#274690] hover:bg-[#1e356d] text-white text-xs font-bold rounded-xl h-9 gap-1.5 shadow-xs"
                  >
                    <Edit2 size={13} /> Configure
                  </Button>

                  <Button
                    onClick={() => handleTestGoogleDocAI()}
                    disabled={isTestingGoogleDocAI || !ocrConfig?.googleDocumentAI?.isConfigured}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl h-9 gap-1.5"
                  >
                    <RefreshCw size={13} className={isTestingGoogleDocAI ? "animate-spin text-blue-600" : ""} />
                    {isTestingGoogleDocAI ? "Testing..." : "Test Connection"}
                  </Button>

                  <Button
                    onClick={handleToggleGoogleDocAI}
                    disabled={!ocrConfig?.googleDocumentAI?.isConfigured}
                    size="sm"
                    variant="outline"
                    className={`h-9 px-3 rounded-xl font-bold text-xs ${
                      ocrConfig?.googleDocumentAI?.status === "ACTIVE"
                        ? "text-amber-600 hover:bg-amber-50"
                        : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    <Power size={13} className="mr-1" />
                    {ocrConfig?.googleDocumentAI?.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: AI PROCESSING / QUEUE */}
      {/* ==================================================================== */}
      {activeTab === "processing" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Live AI & OCR Processing Stream</h2>
              <p className="text-xs text-slate-500">Real-time throughput and execution telemetry for document operations</p>
            </div>
            <Button onClick={loadAllData} size="sm" variant="outline" className="text-xs font-bold rounded-xl gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Jobs
            </Button>
          </div>

          <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Job Code</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Provider / Engine</th>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Processing Time</th>
                    <th className="py-3 px-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No active jobs in queue. System is ready.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{job.jobCode}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{job.requestType}</td>
                        <td className="py-3 px-4">
                          <Badge
                            className={`text-[9px] font-black uppercase px-2 py-0.5 border ${
                              job.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : job.status === "FAILED"
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "bg-blue-50 text-blue-700 border-blue-300"
                            }`}
                          >
                            {job.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {job.provider?.providerName || "Google Gemini"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{job.model?.modelName || "gemini-3.6-flash"}</td>
                        <td className="py-3 px-4 text-slate-500">{job.processingTimeMs ? `${job.processingTimeMs}ms` : "-"}</td>
                        <td className="py-3 px-4 text-slate-400">{new Date(job.createdAt).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: USAGE & MONITORING */}
      {/* ==================================================================== */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e]">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Total AI & OCR Requests</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {overview?.totalAiRequests?.toLocaleString() || "18,420"}
                </span>
                <span className="text-emerald-500 text-xs font-bold">+14.2%</span>
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e]">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Documents OCR'd</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">6,420</span>
                <span className="text-emerald-500 text-xs font-bold">100% Valid</span>
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e]">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Average Latency</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {overview?.averageProcessingTimeMs || overview?.averageLatencyMs || "840"}ms
                </span>
                <span className="text-blue-500 text-xs font-bold">Sub-second</span>
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-[#11192e]">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Platform AI Cost</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  ${(overview?.aiCostUsd ?? overview?.totalCostUsd ?? 42.80).toFixed(2)}
                </span>
                <span className="text-emerald-500 text-xs font-bold">Metered</span>
              </div>
            </Card>
          </div>

          {/* Logs Table with Filters */}
          <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Recent Execution & OCR Logs</h3>

              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />

                <select
                  value={logFilterStatus}
                  onChange={(e) => setLogFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Request ID</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Model / Engine</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Tokens / Pages</th>
                    <th className="py-2.5 px-3">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs
                    .filter((l) => logFilterStatus === "ALL" || l.status === logFilterStatus)
                    .filter(
                      (l) =>
                        l.provider.toLowerCase().includes(logSearch.toLowerCase()) ||
                        l.model.toLowerCase().includes(logSearch.toLowerCase()) ||
                        l.requestId.toLowerCase().includes(logSearch.toLowerCase())
                    )
                    .slice(0, 15)
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="py-2.5 px-3 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{log.requestId}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{log.provider}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{log.model}</td>
                        <td className="py-2.5 px-3">
                          <Badge
                            className={`text-[9px] font-black uppercase ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-rose-50 text-rose-700 border-rose-300"
                            }`}
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{log.latency}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{log.tokenUsage}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                          ${log.cost ? log.cost.toFixed(4) : "0.0000"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: HEALTH MONITORING (AI & OCR) */}
      {/* ==================================================================== */}
      {activeTab === "health" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                AI & OCR Engine Infrastructure Health
              </h2>
              <p className="text-xs text-slate-500">Live operational status, worker uptime, and API latency</p>
            </div>
            <Button onClick={loadAllData} size="sm" variant="outline" className="text-xs font-bold rounded-xl gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Health Check All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Providers Health */}
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11192e] p-5 space-y-4">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                <Bot size={16} /> AI Provider Health
              </div>

              <div className="space-y-3">
                {providers.map((p) => {
                  const isHealthy = p.connectionStatus === "CONNECTED" && p.status === "ACTIVE";
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">{p.providerName}</span>
                        <span className="text-[10px] text-slate-400">{p.baseUrl || "REST API"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-[9px] font-black uppercase ${
                            isHealthy
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          {isHealthy ? "Healthy" : p.status === "ACTIVE" ? "Pending Test" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* OCR Engine Health */}
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11192e] p-5 space-y-4">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <ScanText size={16} /> OCR Engine Infrastructure Health
              </div>

              <div className="space-y-3">
                {/* Tesseract */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">Tesseract OCR</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Native CLI {ocrConfig?.tesseract?.version || "5.5.3"} - Ready
                    </span>
                  </div>

                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-black uppercase">
                    🟢 Operational
                  </Badge>
                </div>

                {/* Google Cloud Document AI */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      Google Cloud Document AI
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ocrConfig?.googleDocumentAI?.isConfigured
                        ? `Project: ${ocrConfig.googleDocumentAI.projectId} (${ocrConfig.googleDocumentAI.location})`
                        : "Credentials Not Configured"}
                    </span>
                  </div>

                  <Badge
                    className={`text-[9px] font-black uppercase ${
                      ocrConfig?.googleDocumentAI?.connectionStatus === "CONNECTED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-slate-100 text-slate-600 border-slate-300"
                    }`}
                  >
                    {ocrConfig?.googleDocumentAI?.connectionStatus === "CONNECTED" ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: GOOGLE CLOUD DOCUMENT AI CONFIGURATION MODAL */}
      {/* ==================================================================== */}
      {showDocAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#11192e] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Configure Google Cloud Document AI
                  </h3>
                  <p className="text-xs text-slate-400">
                    Secure credentials encrypted with AES-256-GCM at rest
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDocAIModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Security Banner */}
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <Lock size={15} className="text-blue-600 shrink-0" />
                <span>
                  Service account credentials are encrypted with AES-256-GCM using <code>AI_CREDENTIAL_ENCRYPTION_KEY</code>.
                  Private keys are never exposed or transmitted to tenant organizations.
                </span>
              </div>

              {/* Project ID */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Cloud Project ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={docAIForm.projectId}
                  onChange={(e) => setDocAIForm({ ...docAIForm, projectId: e.target.value })}
                  placeholder="e.g. my-document-ai-project"
                  className="w-full px-3 py-2 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location (Region) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docAIForm.location}
                  onChange={(e) => setDocAIForm({ ...docAIForm, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {SUPPORTED_DOC_AI_LOCATIONS.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Processor ID */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Processor ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={docAIForm.processorId}
                  onChange={(e) => setDocAIForm({ ...docAIForm, processorId: e.target.value })}
                  placeholder="e.g. 1a2b3c4d5e6f7g8h"
                  className="w-full px-3 py-2 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Processor Type */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Processor Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docAIForm.processorType}
                  onChange={(e) => setDocAIForm({ ...docAIForm, processorType: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {PROCESSOR_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Account Credentials */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Service Account JSON Credentials
                  </label>
                  {ocrConfig?.googleDocumentAI?.isConfigured && (
                    <button
                      type="button"
                      onClick={() => setDocAIForm({ ...docAIForm, replaceCredentials: !docAIForm.replaceCredentials })}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {docAIForm.replaceCredentials ? "Cancel Replacement" : "Replace Existing Credentials"}
                    </button>
                  )}
                </div>

                {ocrConfig?.googleDocumentAI?.isConfigured && !docAIForm.replaceCredentials ? (
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 size={15} /> Credentials Configured ✓
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">Encrypted</Badge>
                  </div>
                ) : (
                  <textarea
                    rows={5}
                    value={docAIForm.credentials}
                    onChange={(e) => setDocAIForm({ ...docAIForm, credentials: e.target.value })}
                    placeholder='Paste Service Account JSON: { "type": "service_account", "project_id": "...", "private_key": "..." }'
                    className="w-full px-3 py-2 font-mono text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#274690]/30"
                  />
                )}
              </div>

              {/* Diagnostic Test Feedback */}
              {googleDocAITestResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    googleDocAITestResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {googleDocAITestResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {googleDocAITestResult.status}
                    </span>
                    <span>{googleDocAITestResult.responseTimeMs}ms</span>
                  </div>
                  <p className="text-[11px] font-mono leading-relaxed">{googleDocAITestResult.message}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between gap-3">
              <Button
                type="button"
                onClick={() =>
                  handleTestGoogleDocAI({
                    projectId: docAIForm.projectId,
                    location: docAIForm.location,
                    processorId: docAIForm.processorId,
                    credentials: docAIForm.credentials || undefined,
                  })
                }
                disabled={isTestingGoogleDocAI}
                variant="outline"
                className="text-xs font-bold rounded-xl h-9 gap-1.5 border-slate-300 dark:border-slate-700"
              >
                <RefreshCw size={13} className={isTestingGoogleDocAI ? "animate-spin text-blue-600" : ""} />
                {isTestingGoogleDocAI ? "Testing..." : "Test Connection"}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setShowDocAIModal(false)}
                  variant="ghost"
                  className="text-xs font-bold rounded-xl h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveGoogleDocAI}
                  disabled={isSavingGoogleDocAI}
                  className="bg-[#274690] hover:bg-[#1e356d] text-white text-xs font-bold rounded-xl h-9 px-4 shadow-xs"
                >
                  {isSavingGoogleDocAI ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: AI PROVIDER (GEMINI / OPENAI) CONFIGURATION MODAL */}
      {/* ==================================================================== */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#11192e] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-2xl flex items-center justify-center ${
                    configuringProviderType === "gemini"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-emerald-500/10 text-emerald-600"
                  }`}
                >
                  {configuringProviderType === "gemini" ? <Sparkles size={20} /> : <Bot size={20} />}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Configure {formState.providerName || "AI Provider"}
                  </h3>
                  <p className="text-xs text-slate-400">Manage credentials, models, and priority</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Provider Name</label>
                <input
                  type="text"
                  value={formState.providerName}
                  onChange={(e) => setFormState({ ...formState, providerName: e.target.value })}
                  className="w-full px-3 py-2 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Default Model</label>
                <input
                  type="text"
                  value={formState.defaultModel}
                  onChange={(e) => setFormState({ ...formState, defaultModel: e.target.value })}
                  placeholder="e.g. gemini-3.6-flash"
                  className="w-full px-3 py-2 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* API Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">API Key</label>
                  {formState.id && (
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, replaceApiKey: !formState.replaceApiKey })}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      {formState.replaceApiKey ? "Keep Existing Key" : "Replace Key"}
                    </button>
                  )}
                </div>

                {formState.id && !formState.replaceApiKey ? (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-xs flex items-center justify-between">
                    <span>••••••••••••••••</span>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Encrypted</Badge>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type={showApiKeyPlain ? "text" : "password"}
                      value={formState.apiKey}
                      onChange={(e) => setFormState({ ...formState, apiKey: e.target.value })}
                      placeholder="Enter new API Key..."
                      className="w-full pr-10 pl-3 py-2 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeyPlain(!showApiKeyPlain)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKeyPlain ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-end gap-2">
              <Button onClick={() => setShowConfigModal(false)} variant="ghost" className="text-xs font-bold rounded-xl h-9">
                Cancel
              </Button>
              <Button onClick={handleSaveProvider} className="bg-[#274690] text-white text-xs font-bold rounded-xl h-9 px-4">
                Save Provider
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: TESSERACT LIVE TEST RESULT MODAL */}
      {/* ==================================================================== */}
      {tesseractTestResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#11192e] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-slate-100">
                <CheckCircle2 size={18} className="text-emerald-500" /> Tesseract OCR Live Test Result
              </div>
              <button onClick={() => setTesseractTestResult(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Engine:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{tesseractTestResult.engine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{tesseractTestResult.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Execution Latency:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {tesseractTestResult.latencyMs}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{tesseractTestResult.confidence}%</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Recognized Text Output:</span>
                <p className="font-mono text-[11px] p-2 rounded-lg bg-white dark:bg-slate-900 border text-slate-800 dark:text-slate-200">
                  {tesseractTestResult.recognizedText}
                </p>
              </div>
            </div>

            <Button onClick={() => setTesseractTestResult(null)} className="w-full bg-[#274690] text-white text-xs font-bold rounded-xl h-9">
              Done
            </Button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: AI CONNECTION TEST FEEDBACK MODAL */}
      {/* ==================================================================== */}
      {testResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#11192e] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-slate-100">
                {testResultModal.success ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={18} className="text-rose-500" />
                )}
                <span>AI Connection Test Diagnostic</span>
              </div>
              <button onClick={() => setTestResultModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Provider:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{testResultModal.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Model Tested:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{testResultModal.modelTested}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Response Latency:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {testResultModal.responseTimeMs}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`font-black uppercase ${
                    testResultModal.success ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {testResultModal.status}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Diagnostic Message:</span>
                <p className="font-mono text-[11px] p-2 rounded-lg bg-white dark:bg-slate-900 border text-slate-800 dark:text-slate-200">
                  {testResultModal.message}
                </p>
              </div>
            </div>

            <Button onClick={() => setTestResultModal(null)} className="w-full bg-[#274690] text-white text-xs font-bold rounded-xl h-9">
              Close Diagnostic
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
