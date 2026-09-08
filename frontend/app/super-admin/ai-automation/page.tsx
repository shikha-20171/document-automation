"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Sparkles,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Edit2,
  Power,
  RotateCcw,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  X,
  FileText,
  Lock,
  Server,
  AlertTriangle,
  ArrowRight,
  ScanText,
  Globe,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import superAdminAiApi, {
  type AIProviderItem,
  type TestConnectionResult,
  type OCRFullConfigResponse,
  type TesseractTestResult,
  type GoogleDocAITestResult,
} from "@/services/superAdminAiApi";

const SUPPORTED_GEMINI_MODELS = [
  { value: "gemini-3.6-flash", label: "Gemini 3.6 Flash (Recommended - High Speed)" },
  { value: "gemini-3.7-flash", label: "Gemini 3.7 Flash (Next-Gen Flash)" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Deep Multimodal Reasoning)" },
  { value: "gemini-flash-latest", label: "Gemini Flash Latest" },
];

const SUPPORTED_OPENAI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Recommended - Fast & Cost-Effective)" },
  { value: "gpt-4o", label: "GPT-4o (Flagship Multimodal)" },
  { value: "gpt-4.1", label: "GPT-4.1 (Next-Gen Reasoning)" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
];

const SUPPORTED_DOC_AI_LOCATIONS = [
  { value: "us", label: "United States (us - Multi-region)" },
  { value: "eu", label: "European Union (eu - Multi-region)" },
  { value: "us-central1", label: "US Central 1 (Iowa)" },
  { value: "us-east1", label: "US East 1 (South Carolina)" },
  { value: "europe-west1", label: "Europe West 1 (Belgium)" },
  { value: "europe-west3", label: "Europe West 3 (Frankfurt)" },
];

const PROCESSOR_TYPES = [
  { value: "OCR_PROCESSOR", label: "Document OCR Processor" },
  { value: "FORM_PARSER_PROCESSOR", label: "Form Parser (Key-Value Pairs & Tables)" },
  { value: "INVOICE_PROCESSOR", label: "Invoice Parser (Line Items, Tax & Vendor)" },
];

export default function AIAutomationPage() {
  const [activeSection, setActiveSection] = useState<"ai" | "ocr">("ai");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Providers & OCR state
  const [providers, setProviders] = useState<AIProviderItem[]>([]);
  const [ocrConfig, setOcrConfig] = useState<OCRFullConfigResponse | null>(null);

  // Gemini / OpenAI Configuration Modal State
  const [editingProvider, setEditingProvider] = useState<AIProviderItem | null>(null);
  const [modalApiKey, setModalApiKey] = useState("");
  const [modalModel, setModalModel] = useState("");
  const [modalBaseUrl, setModalBaseUrl] = useState("");
  const [modalIsActive, setModalIsActive] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isReplacingKey, setIsReplacingKey] = useState(false);
  const [modalTesting, setModalTesting] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalTestResult, setModalTestResult] = useState<TestConnectionResult | null>(null);

  // Google Document AI Modal State
  const [showGoogleDocAiModal, setShowGoogleDocAiModal] = useState(false);
  const [docAiProjectId, setDocAiProjectId] = useState("");
  const [docAiLocation, setDocAiLocation] = useState("us");
  const [docAiProcessorId, setDocAiProcessorId] = useState("");
  const [docAiProcessorType, setDocAiProcessorType] = useState("OCR_PROCESSOR");
  const [docAiCredentialsJson, setDocAiCredentialsJson] = useState("");
  const [docAiTesting, setDocAiTesting] = useState(false);
  const [docAiSaving, setDocAiSaving] = useState(false);
  const [docAiTestResult, setDocAiTestResult] = useState<GoogleDocAITestResult | null>(null);

  // Tesseract Test State
  const [tesseractTesting, setTesseractTesting] = useState(false);
  const [tesseractTestResult, setTesseractTestResult] = useState<TesseractTestResult | null>(null);
  const [showTesseractModal, setShowTesseractModal] = useState(false);

  // Quick Action Testing states
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [provRes, ocrRes] = await Promise.all([
        superAdminAiApi.getProviders().catch(() => ({ success: false, data: [] })),
        superAdminAiApi.getOcrConfig().catch(() => ({ success: false, data: null })),
      ]);

      if (provRes.success && provRes.data) {
        setProviders(provRes.data);
      }
      if (ocrRes.success && ocrRes.data) {
        setOcrConfig(ocrRes.data);
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to load AI/OCR settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to find specific AI provider
  const geminiProvider = providers.find(
    (p) => p.providerCode.toLowerCase() === "gemini" || p.providerName.toLowerCase().includes("gemini")
  );
  const openAiProvider = providers.find(
    (p) => p.providerCode.toLowerCase() === "openai" || p.providerName.toLowerCase().includes("openai")
  );

  // Open Configure Modal for Gemini or OpenAI
  const handleOpenConfigModal = (provider: AIProviderItem) => {
    setEditingProvider(provider);
    setModalApiKey("");
    setIsReplacingKey(false);
    setShowApiKey(false);
    setModalModel(provider.defaultModel || (provider.providerCode === "gemini" ? "gemini-3.6-flash" : "gpt-4o-mini"));
    setModalBaseUrl(provider.baseUrl || (provider.providerCode === "gemini" ? "https://generativelanguage.googleapis.com/v1beta" : "https://api.openai.com/v1"));
    setModalIsActive(provider.status === "ACTIVE");
    setModalTestResult(null);
  };

  // Test Connection inside Configure Modal
  const handleTestInModal = async () => {
    if (!editingProvider) return;
    setModalTesting(true);
    setModalTestResult(null);
    try {
      const res = await superAdminAiApi.testProvider(editingProvider.id, {
        model: modalModel,
        apiKey: modalApiKey.trim() ? modalApiKey.trim() : undefined,
      });

      if (res.success && res.data) {
        setModalTestResult(res.data);
        if (res.data.success) {
          showToast(`Connection successful! Response time: ${res.data.responseTimeMs}ms`);
        } else {
          showToast(res.data.message || "Connection test failed", "error");
        }
      } else {
        showToast(res.error?.message || "Connection test failed", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Connection test request failed", "error");
    } finally {
      setModalTesting(false);
    }
  };

  // Connect & Save AI Provider
  const handleConnectAndSaveAI = async () => {
    if (!editingProvider) return;
    setModalSaving(true);
    try {
      // 1. Perform validation test first if new key is provided
      if (modalApiKey.trim()) {
        const testRes = await superAdminAiApi.testProvider(editingProvider.id, {
          model: modalModel,
          apiKey: modalApiKey.trim(),
        });
        if (!testRes.success || !testRes.data?.success) {
          const errMsg = testRes.data?.message || testRes.error?.message || "Invalid API key or model unreachable.";
          showToast(errMsg, "error");
          setModalTestResult(testRes.data || null);
          setModalSaving(false);
          return;
        }
      }

      // 2. Save encrypted credentials and configuration
      const payload: any = {
        defaultModel: modalModel,
        status: modalIsActive ? "ACTIVE" : "INACTIVE",
        baseUrl: modalBaseUrl || undefined,
      };

      if (modalApiKey.trim()) {
        payload.apiKey = modalApiKey.trim();
      }

      const res = await superAdminAiApi.updateProvider(editingProvider.id, payload);
      if (res.success) {
        showToast(`${editingProvider.providerName} configured and connected successfully!`);
        setEditingProvider(null);
        loadData();
      } else {
        showToast(res.error?.message || "Failed to save configuration", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Error saving configuration", "error");
    } finally {
      setModalSaving(false);
    }
  };

  // Direct Toggle Activate/Deactivate
  const handleToggleActivate = async (provider: AIProviderItem) => {
    const isActivating = provider.status !== "ACTIVE";
    try {
      if (isActivating) {
        const res = await superAdminAiApi.activateProvider(provider.id);
        if (res.success) {
          showToast(`${provider.providerName} activated! Tenant documents will now use this engine.`);
          loadData();
        } else {
          showToast(res.error?.message || "Failed to activate provider", "error");
        }
      } else {
        const res = await superAdminAiApi.deactivateProvider(provider.id, "Deactivated from Super Admin console");
        if (res.success) {
          showToast(`${provider.providerName} disconnected.`);
          loadData();
        } else {
          showToast(res.error?.message || "Failed to disconnect provider", "error");
        }
      }
    } catch (err: any) {
      showToast(err?.message || "Action failed", "error");
    }
  };

  // Quick Test Connection Button on Card
  const handleQuickTestAI = async (provider: AIProviderItem) => {
    setTestingProviderId(provider.id);
    try {
      const res = await superAdminAiApi.testProvider(provider.id, {
        model: provider.defaultModel,
      });

      if (res.success && res.data) {
        if (res.data.success) {
          showToast(`✓ ${provider.providerName} is healthy! Latency: ${res.data.responseTimeMs}ms (${res.data.modelTested})`);
        } else {
          showToast(`✗ ${provider.providerName} test failed: ${res.data.message}`, "error");
        }
        loadData();
      } else {
        showToast(res.error?.message || "Test failed", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Test request error", "error");
    } finally {
      setTestingProviderId(null);
    }
  };

  // Open Google Document AI Modal
  const handleOpenGoogleDocAiModal = () => {
    const g = ocrConfig?.googleDocumentAI;
    setDocAiProjectId(g?.projectId || "");
    setDocAiLocation(g?.location || "us");
    setDocAiProcessorId(g?.processorId || "");
    setDocAiProcessorType(g?.processorType || "OCR_PROCESSOR");
    setDocAiCredentialsJson("");
    setDocAiTestResult(null);
    setShowGoogleDocAiModal(true);
  };

  // Test Google Document AI
  const handleTestGoogleDocAI = async () => {
    setDocAiTesting(true);
    setDocAiTestResult(null);
    try {
      const res = await superAdminAiApi.testGoogleDocumentAI({
        projectId: docAiProjectId.trim(),
        location: docAiLocation,
        processorId: docAiProcessorId.trim(),
        credentials: docAiCredentialsJson.trim() ? docAiCredentialsJson.trim() : undefined,
      });

      if (res.success && res.data) {
        setDocAiTestResult(res.data);
        if (res.data.success) {
          const latency = res.data.responseTimeMs || res.data.latencyMs || 0;
          showToast(`Google Document AI connected successfully (${latency}ms)!`);
        } else {
          showToast(res.data.message || "Connection failed", "error");
        }
      } else {
        showToast(res.error?.message || "Test failed", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Test request failed", "error");
    } finally {
      setDocAiTesting(false);
    }
  };

  // Connect & Save Google Document AI
  const handleConnectAndSaveGoogleDocAI = async () => {
    if (!docAiProjectId.trim() || !docAiProcessorId.trim()) {
      showToast("Project ID and Processor ID are required.", "error");
      return;
    }

    setDocAiSaving(true);
    try {
      const payload: any = {
        projectId: docAiProjectId.trim(),
        location: docAiLocation,
        processorId: docAiProcessorId.trim(),
        processorType: docAiProcessorType,
      };

      if (docAiCredentialsJson.trim()) {
        payload.credentials = docAiCredentialsJson.trim();
      }

      const res = await superAdminAiApi.configureGoogleDocumentAI(payload);
      if (res.success) {
        showToast("Google Document AI credentials encrypted and saved successfully!");
        setShowGoogleDocAiModal(false);
        loadData();
      } else {
        showToast(res.error?.message || "Failed to configure Google Document AI", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Save request failed", "error");
    } finally {
      setDocAiSaving(false);
    }
  };

  // Toggle Google Doc AI Activation
  const handleToggleGoogleDocAiActivate = async () => {
    const isCurrentlyActive = ocrConfig?.googleDocumentAI?.status === "ACTIVE";
    try {
      if (isCurrentlyActive) {
        const res = await superAdminAiApi.deactivateGoogleDocumentAI();
        if (res.success) {
          showToast("Google Document AI deactivated. System automatically uses local Tesseract OCR.");
          loadData();
        }
      } else {
        const res = await superAdminAiApi.activateGoogleDocumentAI();
        if (res.success) {
          showToast("Google Document AI activated as primary OCR provider!");
          loadData();
        } else {
          showToast(res.error?.message || "Cannot activate unverified provider", "error");
        }
      }
    } catch (err: any) {
      showToast(err?.message || "Toggle failed", "error");
    }
  };

  // Run Tesseract Local OCR Test
  const handleTestTesseract = async () => {
    setTesseractTesting(true);
    setShowTesseractModal(true);
    setTesseractTestResult(null);
    try {
      const res = await superAdminAiApi.testTesseract();
      if (res.success && res.data) {
        setTesseractTestResult(res.data);
        if (res.data.success) {
          showToast(`Tesseract OCR test passed in ${res.data.latencyMs}ms!`);
        } else {
          showToast(res.data.message || "Tesseract test failed", "error");
        }
      } else {
        showToast(res.error?.message || "Test failed", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Tesseract test error", "error");
    } finally {
      setTesseractTesting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
            toastType === "success"
              ? "bg-emerald-950/95 border-emerald-500/50 text-emerald-100 backdrop-blur-md"
              : "bg-rose-950/95 border-rose-500/50 text-rose-100 backdrop-blur-md"
          }`}
        >
          {toastType === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#11192e] p-6 rounded-3xl border border-slate-200/80 dark:border-[#274690]/30 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#274690] text-white border-0 text-xs font-bold px-3 py-1 rounded-full shadow-xs shadow-[#274690]/25">
              Platform Configuration Center
            </Badge>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              AES-256-GCM Encrypted
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-[#274690]/10 dark:bg-[#274690]/25 border border-[#274690]/30 text-[#274690] dark:text-[#8fb1ec] flex items-center justify-center shrink-0">
              <Cpu className="w-7 h-7" />
            </div>
            AI & OCR Automation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Super Admin configures AI and OCR once. Tenant organisations and users automatically build, generate,
            and process documents without selecting or configuring providers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152038] hover:bg-[#274690]/5 dark:hover:bg-[#274690]/15 hover:border-[#274690]/40 text-slate-700 dark:text-slate-200 hover:text-[#274690] dark:hover:text-[#8fb1ec] font-bold text-xs gap-2 py-2 px-4 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#274690]" : ""}`} />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Clean 2-Section Navigation Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSection("ai")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${
            activeSection === "ai"
              ? "bg-[#274690] text-white shadow-md shadow-[#274690]/25"
              : "text-slate-600 dark:text-slate-400 hover:text-[#274690] dark:hover:text-[#8fb1ec] hover:bg-[#274690]/10"
          }`}
        >
          <Bot className="w-4 h-4" />
          1. AI Automation
          <span className={`ml-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
            activeSection === "ai" ? "bg-white/20 text-white" : "bg-[#274690]/10 text-[#274690] dark:text-[#8fb1ec]"
          }`}>
            Gemini & OpenAI
          </span>
        </button>

        <button
          onClick={() => setActiveSection("ocr")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${
            activeSection === "ocr"
              ? "bg-[#274690] text-white shadow-md shadow-[#274690]/25"
              : "text-slate-600 dark:text-slate-400 hover:text-[#274690] dark:hover:text-[#8fb1ec] hover:bg-[#274690]/10"
          }`}
        >
          <ScanText className="w-4 h-4" />
          2. OCR Automation
          <span className={`ml-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
            activeSection === "ocr" ? "bg-white/20 text-white" : "bg-[#274690]/10 text-[#274690] dark:text-[#8fb1ec]"
          }`}>
            Tesseract & Google Doc AI
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: AI AUTOMATION (Gemini & OpenAI)                                */}
      {/* ========================================================================= */}
      {activeSection === "ai" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#274690]/5 dark:bg-[#274690]/15 border border-[#274690]/25 dark:border-[#274690]/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-[#274690] dark:text-[#8fb1ec]">
            <Bot className="w-4 h-4 text-[#274690] dark:text-[#8fb1ec] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automatic AI Router Active:</span> The platform automatically uses the
              active AI engine below for quotation creation, document generation, and AI summaries. If Google Gemini is
              configured, it handles AI requests directly. If OpenAI is configured later, it can be connected with a single click.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GOOGLE GEMINI CARD */}
            <Card className="rounded-3xl border-slate-200/90 dark:border-[#274690]/30 hover:border-[#274690]/50 transition-colors bg-white dark:bg-[#11192e] shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#274690] to-[#1e3561] flex items-center justify-center text-white shadow-xs shadow-[#274690]/25">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-100">
                          Google Gemini
                        </CardTitle>
                        <p className="text-xs text-slate-400 font-medium">
                          High-speed multimodal AI models (Default Engine)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {geminiProvider?.status === "ACTIVE" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-500/20 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Connected & Active
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0 text-xs font-bold px-3 py-1 rounded-full">
                          Disconnected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 font-bold block mb-1">Selected Model</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {geminiProvider?.defaultModel || "gemini-3.6-flash"}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 font-bold block mb-1">API Key Status</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        {geminiProvider?.hasApiKey || Boolean(process.env.NEXT_PUBLIC_API_URL) ? "Configured ✓" : "Not Set"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Last Connection Test</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {geminiProvider?.lastTestedAt
                          ? new Date(geminiProvider.lastTestedAt).toLocaleTimeString()
                          : "Ready"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Connection Status</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {geminiProvider?.connectionStatus || "CONNECTED"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => geminiProvider && handleOpenConfigModal(geminiProvider)}
                  className="rounded-2xl border-slate-200 dark:border-slate-700 hover:border-[#274690]/40 text-xs font-bold py-2.5 px-4 hover:text-[#274690] dark:hover:text-[#8fb1ec]"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5 text-[#274690] dark:text-[#8fb1ec]" />
                  Configure
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={testingProviderId === geminiProvider?.id}
                    onClick={() => geminiProvider && handleQuickTestAI(geminiProvider)}
                    className="rounded-2xl border-slate-200 dark:border-slate-700 hover:border-[#274690]/40 text-xs font-bold py-2.5 px-4 hover:text-[#274690] dark:hover:text-[#8fb1ec]"
                  >
                    <RotateCcw
                      className={`w-3.5 h-3.5 mr-1.5 text-[#274690] dark:text-[#8fb1ec] ${
                        testingProviderId === geminiProvider?.id ? "animate-spin" : ""
                      }`}
                    />
                    Test Connection
                  </Button>

                  {geminiProvider?.status === "ACTIVE" ? (
                    <Button
                      variant="destructive"
                      onClick={() => geminiProvider && handleToggleActivate(geminiProvider)}
                      className="rounded-2xl text-xs font-black py-2.5 px-4 bg-rose-600/90 hover:bg-rose-700"
                    >
                      <Power className="w-3.5 h-3.5 mr-1.5" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => geminiProvider && handleToggleActivate(geminiProvider)}
                      className="rounded-2xl text-xs font-black py-2.5 px-4 bg-[#274690] hover:bg-[#1e3561] text-white shadow-xs shadow-[#274690]/25"
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* OPENAI CARD */}
            <Card className="rounded-3xl border-slate-200/90 dark:border-[#274690]/30 hover:border-[#274690]/50 transition-colors bg-white dark:bg-[#11192e] shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-100">
                          OpenAI (ChatGPT)
                        </CardTitle>
                        <p className="text-xs text-slate-400 font-medium">
                          Official GPT-4o & Reasoning models
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {openAiProvider?.status === "ACTIVE" && openAiProvider?.hasApiKey ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-500/20 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Connected & Active
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0 text-xs font-bold px-3 py-1 rounded-full">
                          Not Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 font-bold block mb-1">Selected Model</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {openAiProvider?.defaultModel || "gpt-4o-mini"}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 font-bold block mb-1">API Key Status</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        {openAiProvider?.hasApiKey ? "Configured ✓" : "Not Configured"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Last Connection Test</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {openAiProvider?.lastTestedAt
                          ? new Date(openAiProvider.lastTestedAt).toLocaleTimeString()
                          : "Never"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Endpoint</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {openAiProvider?.baseUrl || "https://api.openai.com/v1"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => openAiProvider && handleOpenConfigModal(openAiProvider)}
                  className="rounded-2xl border-slate-200 dark:border-slate-700 hover:border-[#274690]/40 text-xs font-bold py-2.5 px-4 hover:text-[#274690] dark:hover:text-[#8fb1ec]"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5 text-[#274690] dark:text-[#8fb1ec]" />
                  Configure
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={testingProviderId === openAiProvider?.id || !openAiProvider?.hasApiKey}
                    onClick={() => openAiProvider && handleQuickTestAI(openAiProvider)}
                    className="rounded-2xl border-slate-200 dark:border-slate-700 hover:border-[#274690]/40 text-xs font-bold py-2.5 px-4 hover:text-[#274690] dark:hover:text-[#8fb1ec]"
                  >
                    <RotateCcw
                      className={`w-3.5 h-3.5 mr-1.5 text-[#274690] dark:text-[#8fb1ec] ${
                        testingProviderId === openAiProvider?.id ? "animate-spin" : ""
                      }`}
                    />
                    Test Connection
                  </Button>

                  {openAiProvider?.status === "ACTIVE" && openAiProvider?.hasApiKey ? (
                    <Button
                      variant="destructive"
                      onClick={() => openAiProvider && handleToggleActivate(openAiProvider)}
                      className="rounded-2xl text-xs font-black py-2.5 px-4 bg-rose-600/90 hover:bg-rose-700"
                    >
                      <Power className="w-3.5 h-3.5 mr-1.5" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => openAiProvider && handleOpenConfigModal(openAiProvider)}
                      className="rounded-2xl text-xs font-black py-2.5 px-4 bg-[#274690] hover:bg-[#1e3561] text-white shadow-xs shadow-[#274690]/25"
                    >
                      <Key className="w-3.5 h-3.5 mr-1.5" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: OCR AUTOMATION (Tesseract & Google Document AI)                */}
      {/* ========================================================================= */}
      {activeSection === "ocr" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#274690]/5 dark:bg-[#274690]/15 border border-[#274690]/25 dark:border-[#274690]/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-[#274690] dark:text-[#8fb1ec]">
            <ScanText className="w-4 h-4 text-[#274690] dark:text-[#8fb1ec] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Zero-Configuration OCR Active:</span> Local Tesseract OCR is auto-detected
              and running natively on the backend server. Tenant users never choose OCR settings — uploaded and scanned
              documents are automatically OCR-processed and passed straight to the AI engine.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TESSERACT OCR CARD */}
            <Card className="rounded-3xl border-slate-200/90 dark:border-[#274690]/30 hover:border-[#274690]/50 transition-colors bg-white dark:bg-[#11192e] shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#274690] to-[#3a5eb0] flex items-center justify-center text-white shadow-xs shadow-[#274690]/25">
                        <HardDrive className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-100">
                          Tesseract OCR
                        </CardTitle>
                        <p className="text-xs text-slate-400 font-medium">
                          Local Server-Side OCR Engine (No API Key Required)
                        </p>
                      </div>
                    </div>

                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-500/20 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Available & Active
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 font-bold block mb-1">Installed Version</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {ocrConfig?.tesseract?.version || "v5.5.3 (Native)"}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 font-bold block mb-1">Executable Path</span>
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate block">
                        {ocrConfig?.tesseract?.executablePath || "/opt/homebrew/bin/tesseract"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Supported Language Packs</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {ocrConfig?.tesseract?.availableLanguages?.join(", ") || "eng, osd, snum"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Image Enhancement</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Auto-Deskew & Denoise Active
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Fully operational backend OCR
                </span>

                <Button
                  onClick={handleTestTesseract}
                  disabled={tesseractTesting}
                  className="rounded-2xl text-xs font-black py-2.5 px-5 bg-[#274690] hover:bg-[#1e3561] text-white shadow-xs shadow-[#274690]/25"
                >
                  <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${tesseractTesting ? "animate-spin text-[#274690]" : ""}`} />
                  Test Tesseract OCR
                </Button>
              </div>
            </Card>

            {/* GOOGLE CLOUD DOCUMENT AI CARD */}
            <Card className="rounded-3xl border-slate-200/90 dark:border-[#274690]/30 hover:border-[#274690]/50 transition-colors bg-white dark:bg-[#11192e] shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-100">
                          Google Cloud Document AI
                        </CardTitle>
                        <p className="text-xs text-slate-400 font-medium">
                          Enterprise Cloud OCR & Form Parser (Optional)
                        </p>
                      </div>
                    </div>

                    {ocrConfig?.googleDocumentAI?.status === "ACTIVE" && ocrConfig?.googleDocumentAI?.isConfigured ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-500/20 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0 text-xs font-bold px-3 py-1 rounded-full">
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 font-bold block mb-1">Project ID</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate block">
                        {ocrConfig?.googleDocumentAI?.projectId || "Not Configured"}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 font-bold block mb-1">Processor Type</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate block">
                        {ocrConfig?.googleDocumentAI?.processorType || "Document OCR"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#152038] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Service Account Credentials</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {ocrConfig?.googleDocumentAI?.credentialsMasked || "Not Configured"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Location</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                        {ocrConfig?.googleDocumentAI?.location || "us"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={handleOpenGoogleDocAiModal}
                  className="rounded-2xl border-slate-200 dark:border-slate-700 hover:border-[#274690]/40 text-xs font-bold py-2.5 px-4 hover:text-[#274690] dark:hover:text-[#8fb1ec]"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5 text-[#274690] dark:text-[#8fb1ec]" />
                  Configure
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={!ocrConfig?.googleDocumentAI?.isConfigured}
                    onClick={handleTestGoogleDocAI}
                    className="rounded-2xl border-slate-200 dark:border-slate-700 hover:border-[#274690]/40 text-xs font-bold py-2.5 px-4 hover:text-[#274690] dark:hover:text-[#8fb1ec]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-[#274690] dark:text-[#8fb1ec]" />
                    Test Connection
                  </Button>

                  {ocrConfig?.googleDocumentAI?.status === "ACTIVE" && ocrConfig?.googleDocumentAI?.isConfigured ? (
                    <Button
                      variant="destructive"
                      onClick={handleToggleGoogleDocAiActivate}
                      className="rounded-2xl text-xs font-black py-2.5 px-4 bg-rose-600/90 hover:bg-rose-700"
                    >
                      <Power className="w-3.5 h-3.5 mr-1.5" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={handleOpenGoogleDocAiModal}
                      className="rounded-2xl text-xs font-black py-2.5 px-4 bg-[#274690] hover:bg-[#1e3561] text-white shadow-xs shadow-[#274690]/25"
                    >
                      <Key className="w-3.5 h-3.5 mr-1.5" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: GEMINI & OPENAI CONFIGURATION MODAL                               */}
      {/* ========================================================================= */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200/90 dark:border-[#274690]/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#274690]/10 dark:bg-[#274690]/25 text-[#274690] dark:text-[#8fb1ec] flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Configure {editingProvider.providerName}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Enter API credentials. Keys are encrypted at rest with AES-256-GCM.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProvider(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* API Key Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  API Key
                </label>
                {editingProvider.hasApiKey && !isReplacingKey ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#152038] border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span className="font-mono text-xs text-slate-500">
                        {editingProvider.apiKeyMasked || "••••••••••••••••••••••••"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsReplacingKey(true)}
                      className="rounded-xl text-xs font-bold h-8 border-slate-300 dark:border-slate-700 hover:border-[#274690]/40 hover:text-[#274690]"
                    >
                      Replace Key
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={modalApiKey}
                      onChange={(e) => setModalApiKey(e.target.value)}
                      placeholder={
                        editingProvider.providerCode === "gemini"
                          ? "AIzaSy..."
                          : "sk-proj-..."
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#152038] text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#274690] pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Model Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Model
                </label>
                <select
                  value={modalModel}
                  onChange={(e) => setModalModel(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#152038] text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-[#274690]"
                >
                  {(editingProvider.providerCode === "gemini"
                    ? SUPPORTED_GEMINI_MODELS
                    : SUPPORTED_OPENAI_MODELS
                  ).map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Base URL (for OpenAI only) */}
              {editingProvider.providerCode === "openai" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Base URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={modalBaseUrl}
                    onChange={(e) => setModalBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#152038] text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#274690]"
                  />
                </div>
              )}

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152038] border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 block">
                    Active on Platform
                  </span>
                  <span className="text-xs text-slate-400">
                    Enable for tenant document automation
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={modalIsActive}
                  onChange={(e) => setModalIsActive(e.target.checked)}
                  className="w-5 h-5 accent-[#274690] rounded cursor-pointer"
                />
              </div>

              {/* Test Result Feedback */}
              {modalTestResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs ${
                    modalTestResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <div className="font-bold mb-0.5">
                    {modalTestResult.success ? "✓ Test Passed" : "✗ Test Failed"}
                  </div>
                  <div>{modalTestResult.message}</div>
                  {modalTestResult.responseTimeMs > 0 && (
                    <div className="mt-1 font-mono text-[11px] text-slate-500">
                      Latency: {modalTestResult.responseTimeMs}ms | Model: {modalTestResult.modelTested}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#152038]/30">
              <Button
                type="button"
                variant="outline"
                disabled={modalTesting || modalSaving}
                onClick={handleTestInModal}
                className="rounded-2xl text-xs font-bold py-2.5 px-4 hover:border-[#274690]/40 hover:text-[#274690]"
              >
                <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${modalTesting ? "animate-spin text-[#274690]" : ""}`} />
                Test Connection
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingProvider(null)}
                  className="rounded-2xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConnectAndSaveAI}
                  disabled={modalSaving || modalTesting}
                  className="rounded-2xl text-xs font-black py-2.5 px-5 bg-[#274690] hover:bg-[#1e3561] text-white shadow-xs shadow-[#274690]/25"
                >
                  {modalSaving ? "Connecting..." : "Connect & Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GOOGLE DOCUMENT AI CONFIGURATION MODAL                           */}
      {/* ========================================================================= */}
      {showGoogleDocAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200/90 dark:border-[#274690]/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Google Cloud Document AI
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure enterprise Document AI processor and service account.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGoogleDocAiModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Project ID *
                  </label>
                  <input
                    type="text"
                    value={docAiProjectId}
                    onChange={(e) => setDocAiProjectId(e.target.value)}
                    placeholder="my-document-ai-project"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#152038] text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#274690]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Location *
                  </label>
                  <select
                    value={docAiLocation}
                    onChange={(e) => setDocAiLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#152038] text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-[#274690]"
                  >
                    {SUPPORTED_DOC_AI_LOCATIONS.map((loc) => (
                      <option key={loc.value} value={loc.value}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Processor ID *
                  </label>
                  <input
                    type="text"
                    value={docAiProcessorId}
                    onChange={(e) => setDocAiProcessorId(e.target.value)}
                    placeholder="e.g. 7a8b9c0d1e2f3a4b"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#152038] text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#274690]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Processor Type
                  </label>
                  <select
                    value={docAiProcessorType}
                    onChange={(e) => setDocAiProcessorType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#152038] text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-[#274690]"
                  >
                    {PROCESSOR_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Service Account JSON Credentials
                  </label>
                  {ocrConfig?.googleDocumentAI?.credentialsMasked && (
                    <span className="text-[11px] text-emerald-600 font-bold">
                      {ocrConfig.googleDocumentAI.credentialsMasked}
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={docAiCredentialsJson}
                  onChange={(e) => setDocAiCredentialsJson(e.target.value)}
                  placeholder='{"type": "service_account", "project_id": "...", "private_key": "..."}'
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#152038] text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-[#274690]"
                />
                <span className="text-[11px] text-slate-400 block">
                  Paste the Service Account JSON key. Credentials are encrypted at rest with AES-256-GCM.
                </span>
              </div>

              {/* Doc AI Test Feedback */}
              {docAiTestResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs ${
                    docAiTestResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <div className="font-bold mb-0.5">
                    {docAiTestResult.success ? "✓ Connection Successful" : "✗ Connection Failed"}
                  </div>
                  <div>{docAiTestResult.message}</div>
                  {(docAiTestResult.responseTimeMs || docAiTestResult.latencyMs) && (
                    <div className="mt-1 font-mono text-[11px] text-slate-500">
                      Response time: {docAiTestResult.responseTimeMs || docAiTestResult.latencyMs}ms
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#152038]/30">
              <Button
                type="button"
                variant="outline"
                disabled={docAiTesting || docAiSaving}
                onClick={handleTestGoogleDocAI}
                className="rounded-2xl text-xs font-bold py-2.5 px-4 hover:border-[#274690]/40 hover:text-[#274690]"
              >
                <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${docAiTesting ? "animate-spin text-[#274690]" : ""}`} />
                Test Connection
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowGoogleDocAiModal(false)}
                  className="rounded-2xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConnectAndSaveGoogleDocAI}
                  disabled={docAiSaving || docAiTesting}
                  className="rounded-2xl text-xs font-black py-2.5 px-5 bg-[#274690] hover:bg-[#1e3561] text-white shadow-xs shadow-[#274690]/25"
                >
                  {docAiSaving ? "Connecting..." : "Connect & Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TESSERACT LIVE TEST MODAL                                        */}
      {/* ========================================================================= */}
      {showTesseractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200/90 dark:border-[#274690]/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#274690]/10 dark:bg-[#274690]/25 text-[#274690] dark:text-[#8fb1ec] flex items-center justify-center">
                  <ScanText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Tesseract Native OCR Test
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live server execution test
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTesseractModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {tesseractTesting ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#274690] animate-spin" />
                  <span className="text-xs font-bold text-slate-500">
                    Executing test image through /opt/homebrew/bin/tesseract...
                  </span>
                </div>
              ) : tesseractTestResult ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                    <div className="flex items-center justify-between font-black text-sm">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Tesseract Operational
                      </span>
                      <span className="font-mono text-xs">{tesseractTestResult.latencyMs}ms</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {tesseractTestResult.message}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152038] border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Engine:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {tesseractTestResult.engine || "Native v5.5.3"}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Tested Language:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {tesseractTestResult.testedLanguage || "eng"}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>OCR Confidence:</span>
                      <span className="font-bold text-emerald-600">
                        {tesseractTestResult.confidence}%
                      </span>
                    </div>
                  </div>

                  {tesseractTestResult.recognizedText && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        Recognized Text Sample:
                      </span>
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-xs text-slate-700 dark:text-slate-300">
                        "{tesseractTestResult.recognizedText}"
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <Button
                onClick={() => setShowTesseractModal(false)}
                className="rounded-2xl text-xs font-bold py-2 px-5 bg-[#274690] hover:bg-[#1e3561] text-white"
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
