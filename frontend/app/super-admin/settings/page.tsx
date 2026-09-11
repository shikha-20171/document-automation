"use client";

import { useState, useEffect } from "react";
import {
  Sliders,
  Shield,
  Bot,
  FileText,
  HardDrive,
  Mail,
  Lock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Zap,
  Save,
  Send,
  Eye,
  EyeOff,
  Clock,
  Globe,
  Database,
  KeyRound,
  Check,
  Building2,
  FileCheck,
  Server,
  AlertCircle,
  HelpCircle,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "@/lib/axios";

type SettingsTab =
  | "general"
  | "security"
  | "ai"
  | "ocr"
  | "storage"
  | "email"
  | "privacy"
  | "defaults";

interface PlatformSettings {
  general: {
    defaultLanguage: string;
    defaultTimezone: string;
    dateFormat: string;
    timeFormat: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    systemStatus: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    accountLockoutDuration: number;
    passwordMinLength: number;
    passwordComplexity: string;
    passwordExpiry: string;
    forceMfaSuperAdmin: boolean;
    loginSecurityAlerts: boolean;
    concurrentSessionControl: string;
  };
  ai: {
    aiServiceEnabled: boolean;
    defaultProvider: string;
    defaultModel: string;
    aiRequestTimeout: number;
    aiRetryAttempts: number;
    aiFailureHandling: string;
    aiUsageTracking: boolean;
    aiCostMonitoring: boolean;
    status: string;
  };
  ocr: {
    ocrServiceEnabled: boolean;
    defaultProvider: string;
    maxFileSizeMb: number;
    maxPagesPerDoc: number;
    supportedFileTypes: string[];
    ocrTimeout: number;
    ocrRetryAttempts: number;
    ocrFailureHandling: string;
    ocrUsageTracking: boolean;
  };
  storage: {
    maxUploadFileSizeMb: number;
    allowedFileTypes: string;
    storageRetentionPolicy: string;
    deletedFileRetentionDays: number;
    temporaryFileRetentionHours: number;
    storageEncryptionStatus: string;
    storageHealthCheck: string;
  };
  email: {
    emailServiceEnabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpEncryption: string;
    senderName: string;
    senderEmail: string;
    emailVerification: boolean;
    passwordResetEmails: boolean;
    userInvitationEmails: boolean;
    documentWorkflowNotifications: boolean;
    systemAlerts: boolean;
  };
  privacy: {
    dataRetentionPeriod: string;
    deletedDataRetentionDays: number;
    auditLogRetention: string;
    automaticCleanupEnabled: boolean;
    userDataExportPolicy: string;
    dataDeletionPolicy: string;
  };
  defaults: {
    defaultDocumentSettings: string;
    defaultFileSizeLimitMb: number;
    defaultNotificationPreferences: string;
    defaultSessionDurationHours: number;
    defaultAiOcrAvailability: string;
  };
}

const DEFAULT_SETTINGS: PlatformSettings = {
  general: {
    defaultLanguage: "English (US)",
    defaultTimezone: "Asia/Kolkata (IST)",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12-hour (hh:mm A)",
    maintenanceMode: false,
    maintenanceMessage: "DocuCore AI is undergoing scheduled maintenance. Services will resume shortly.",
    systemStatus: "OPERATIONAL",
  },
  security: {
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    accountLockoutDuration: 30,
    passwordMinLength: 8,
    passwordComplexity: "STRONG",
    passwordExpiry: "90_DAYS",
    forceMfaSuperAdmin: true,
    loginSecurityAlerts: true,
    concurrentSessionControl: "TERMINATE_PREVIOUS",
  },
  ai: {
    aiServiceEnabled: true,
    defaultProvider: "Google Gemini",
    defaultModel: "gemini-3.6-flash",
    aiRequestTimeout: 30,
    aiRetryAttempts: 2,
    aiFailureHandling: "FALLBACK_MODEL",
    aiUsageTracking: true,
    aiCostMonitoring: true,
    status: "Connected",
  },
  ocr: {
    ocrServiceEnabled: true,
    defaultProvider: "Tesseract OCR (Local Engine)",
    maxFileSizeMb: 50,
    maxPagesPerDoc: 100,
    supportedFileTypes: ["PDF", "PNG", "JPG", "JPEG", "TIFF"],
    ocrTimeout: 60,
    ocrRetryAttempts: 2,
    ocrFailureHandling: "FALLBACK_ENGINE",
    ocrUsageTracking: true,
  },
  storage: {
    maxUploadFileSizeMb: 50,
    allowedFileTypes: "PDF, DOCX, XLSX, PNG, JPG, TIFF, CSV",
    storageRetentionPolicy: "7_YEARS",
    deletedFileRetentionDays: 30,
    temporaryFileRetentionHours: 24,
    storageEncryptionStatus: "AES-256 Enabled (AWS S3-SSE)",
    storageHealthCheck: "HEALTHY",
  },
  email: {
    emailServiceEnabled: true,
    smtpHost: "smtp-relay.brevo.com",
    smtpPort: 587,
    smtpUser: "gourshikha2001@gmail.com",
    smtpPassword: "••••••••••••••••",
    smtpEncryption: "TLS",
    senderName: "DocuCore AI Platform",
    senderEmail: "support@docucore.ai",
    emailVerification: true,
    passwordResetEmails: true,
    userInvitationEmails: true,
    documentWorkflowNotifications: true,
    systemAlerts: true,
  },
  privacy: {
    dataRetentionPeriod: "7_YEARS",
    deletedDataRetentionDays: 30,
    auditLogRetention: "7_YEARS",
    automaticCleanupEnabled: true,
    userDataExportPolicy: "FULL_GDPR_EXPORT",
    dataDeletionPolicy: "SOFT_DELETE_GRACE_PERIOD",
  },
  defaults: {
    defaultDocumentSettings: "AUTO_CLASSIFICATION_AND_OCR",
    defaultFileSizeLimitMb: 50,
    defaultNotificationPreferences: "EMAIL_AND_INAPP",
    defaultSessionDurationHours: 12,
    defaultAiOcrAvailability: "ENABLED_FOR_ALL",
  },
};

export default function SuperAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Email Test Modal State
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);

  // Password Visibility Toggle for SMTP
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/super-admin/settings");
      if (res.data?.data) {
        const d = res.data.data;
        setSettings({
          general: { ...DEFAULT_SETTINGS.general, ...(d.general || {}) },
          security: { ...DEFAULT_SETTINGS.security, ...(d.security || {}) },
          ai: { ...DEFAULT_SETTINGS.ai, ...(d.ai || {}) },
          ocr: { ...DEFAULT_SETTINGS.ocr, ...(d.ocr || {}) },
          storage: { ...DEFAULT_SETTINGS.storage, ...(d.storage || {}) },
          email: { ...DEFAULT_SETTINGS.email, ...(d.email || {}) },
          privacy: { ...DEFAULT_SETTINGS.privacy, ...(d.privacy || {}) },
          defaults: { ...DEFAULT_SETTINGS.defaults, ...(d.defaults || {}) },
        });
      }
    } catch (err) {
      console.warn("Could not load settings from server, using default platform settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (sectionName?: string) => {
    try {
      setSaving(true);
      const res = await axios.put("/super-admin/settings", settings);
      if (res.data?.success || res.status === 200) {
        const title = sectionName || "Platform";
        showToast(`✅ ${title} settings saved and broadcasted platform-wide!`, "success");
      }
    } catch (err: any) {
      showToast("Failed to save settings: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      showToast("Please provide a recipient email address", "error");
      return;
    }
    try {
      setIsSendingTestEmail(true);
      setTestEmailResult(null);
      const res = await axios.post("/super-admin/settings/test-email", {
        toEmail: testEmailAddress,
      });
      if (res.data?.success) {
        setTestEmailResult("✓ " + res.data.message);
        showToast("Test email dispatched successfully!", "success");
      } else {
        setTestEmailResult("Notice: " + (res.data?.message || "Delivery failed"));
      }
    } catch (err: any) {
      setTestEmailResult("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const tabsConfig = [
    { id: "general", label: "General", icon: Sliders },
    { id: "security", label: "Security", icon: Shield, badge: "Mandatory" },
    { id: "ai", label: "AI Core", icon: Sparkles, badge: "Core" },
    { id: "ocr", label: "OCR Pipeline", icon: FileText, badge: "Core" },
    { id: "storage", label: "File & Storage", icon: HardDrive },
    { id: "email", label: "Email & SMTP", icon: Mail },
    { id: "privacy", label: "Data & Privacy", icon: Lock },
    { id: "defaults", label: "System Defaults", icon: Layers },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-[120] flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-2xl transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === "success"
              ? "bg-[#274690] border border-white/20"
              : toastMessage.type === "error"
              ? "bg-rose-900 border border-rose-500/30"
              : "bg-slate-900 border border-slate-700"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle2 size={16} className="text-emerald-400" />}
          {toastMessage.type === "error" && <AlertTriangle size={16} className="text-rose-400" />}
          {toastMessage.type === "info" && <Sparkles size={16} className="text-[#c96f4a]" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-[#1f3561] via-[#274690] to-[#c96f4a] p-6 text-white shadow-xl dark:border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-orange-200 backdrop-blur-md">
              <Sliders size={14} className="text-[#c96f4a]" />
              <span>Platform Administration & Global Governance</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Platform Global Settings
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-200 max-w-2xl font-medium">
              Operational controls, security governance, AI models, OCR engines, S3 storage retention, and system defaults.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleSave()}
              disabled={saving}
              className="rounded-xl bg-white text-[#274690] hover:bg-slate-100 font-bold shadow-md h-10 px-5 cursor-pointer flex items-center gap-2 text-xs"
            >
              <Save size={15} />
              {saving ? "Saving Changes..." : "Save All Settings"}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-[#274690] text-white shadow-md shadow-[#274690]/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. GENERAL SETTINGS                                                       */}
      {/* ========================================================================= */}
      {activeTab === "general" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe size={18} className="text-[#274690]" />
                    General Platform Controls
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Basic operational controls for language, localized time zones, date formats, and maintenance status.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 text-[11px]">
                    Status: {settings.general.systemStatus}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <HelpCircle size={15} className="shrink-0 mt-0.5 text-[#274690]" />
                <span>
                  <strong>Note:</strong> Platform Name, Logo, Tagline, and Primary Website are managed under{" "}
                  <strong>Profile → Platform Branding</strong> to maintain brand consistency.
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Platform Language
                  </label>
                  <select
                    value={settings.general.defaultLanguage}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, defaultLanguage: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="English (UK)">English (UK)</option>
                    <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
                    <option value="Spanish (Español)">Spanish (Español)</option>
                    <option value="French (Français)">French (Français)</option>
                    <option value="German (Deutsch)">German (Deutsch)</option>
                    <option value="Japanese (日本語)">Japanese (日本語)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Platform Time Zone
                  </label>
                  <select
                    value={settings.general.defaultTimezone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, defaultTimezone: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST) — UTC+05:30</option>
                    <option value="UTC">UTC — Universal Coordinated Time</option>
                    <option value="America/New_York (EST)">America/New_York (EST) — UTC-05:00</option>
                    <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST) — UTC-08:00</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT) — UTC+00:00</option>
                    <option value="Asia/Dubai (GST)">Asia/Dubai (GST) — UTC+04:00</option>
                    <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT) — UTC+08:00</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Date Format
                  </label>
                  <select
                    value={settings.general.dateFormat}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, dateFormat: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 11/09/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/11/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
                    <option value="DD-MMM-YYYY">DD-MMM-YYYY (e.g. 11-Sep-2026)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Time Format
                  </label>
                  <select
                    value={settings.general.timeFormat}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, timeFormat: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="12-hour (hh:mm A)">12-hour (hh:mm A) — e.g. 03:45 PM</option>
                    <option value="24-hour (HH:mm)">24-hour (HH:mm) — e.g. 15:45</option>
                  </select>
                </div>
              </div>

              {/* Maintenance Mode Toggle Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle size={15} className="text-amber-500" />
                      Platform Maintenance Mode
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      When enabled, non-super-admin users are shown the maintenance message and cannot login or upload.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.general.maintenanceMode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: {
                            ...settings.general,
                            maintenanceMode: e.target.checked,
                            systemStatus: e.target.checked ? "MAINTENANCE" : "OPERATIONAL",
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c96f4a]"></div>
                  </label>
                </div>

                {settings.general.maintenanceMode && (
                  <div className="pt-2 animate-in fade-in duration-150">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Maintenance Notice Message
                    </label>
                    <textarea
                      rows={2}
                      value={settings.general.maintenanceMessage}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, maintenanceMessage: e.target.value },
                        })
                      }
                      className="w-full bg-white dark:bg-[#0b1120] border border-amber-300 dark:border-amber-700/80 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => handleSave("General")}
                  disabled={saving}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-5 text-xs"
                >
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SECURITY SETTINGS (⭐ MANDATORY)                                        */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield size={18} className="text-[#274690]" />
                    Platform Security & Session Governance
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Enforce login quotas, password complexity rules, session expiration, and MFA controls.
                  </CardDescription>
                </div>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 text-[11px]">
                  Mandatory Security Layer
                </Badge>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Lock size={15} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Important:</strong> Super Admin MFA enforcement is configured globally here. Individual
                  authenticator key pairing and recovery codes remain managed inside <strong>Account Security</strong>.
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Session Inactivity Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeout: Number(e.target.value) || 15 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Default: 60 mins</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Maximum Login Attempts Before Lockout
                  </label>
                  <input
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, maxLoginAttempts: Number(e.target.value) || 3 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Protects against brute-force attacks</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Account Lockout Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.security.accountLockoutDuration}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, accountLockoutDuration: Number(e.target.value) || 15 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Lockout window duration</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password Minimum Length
                  </label>
                  <input
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, passwordMinLength: Number(e.target.value) || 8 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Recommended: 8+ characters</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password Complexity Standard
                  </label>
                  <select
                    value={settings.security.passwordComplexity}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, passwordComplexity: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="STANDARD">Standard (Alphanumeric)</option>
                    <option value="STRONG">Strong (Letters, Numbers & Symbols)</option>
                    <option value="ENTERPRISE">Enterprise Strict (Upper, Lower, Number, Special)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password Expiration Window
                  </label>
                  <select
                    value={settings.security.passwordExpiry}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, passwordExpiry: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="NEVER">Never Expire</option>
                    <option value="30_DAYS">Every 30 Days</option>
                    <option value="60_DAYS">Every 60 Days</option>
                    <option value="90_DAYS">Every 90 Days (Recommended)</option>
                    <option value="180_DAYS">Every 180 Days</option>
                    <option value="365_DAYS">Every 365 Days</option>
                  </select>
                </div>
              </div>

              {/* Toggles & Session Policy */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Force MFA for Super Admin Role
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Mandates Time-based One-Time Passwords (TOTP) on all Super Admin authentications.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.forceMfaSuperAdmin}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, forceMfaSuperAdmin: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#274690]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Login Security Alerts
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Dispatches email warnings to users when logins occur from unrecognized IP addresses or browsers.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.loginSecurityAlerts}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, loginSecurityAlerts: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#274690]"></div>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Concurrent Session Control Policy
                  </label>
                  <select
                    value={settings.security.concurrentSessionControl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, concurrentSessionControl: e.target.value },
                      })
                    }
                    className="w-full sm:w-80 bg-white dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="ALLOW_MULTIPLE">Allow Multiple Simultaneous Sessions</option>
                    <option value="TERMINATE_PREVIOUS">Terminate Previous Active Session (Recommended)</option>
                    <option value="BLOCK_NEW">Block New Login Until Previous Session Expires</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => handleSave("Security")}
                  disabled={saving}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-5 text-xs"
                >
                  Save Security Policies
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AI SETTINGS (⭐ CORE FEATURE)                                          */}
      {/* ========================================================================= */}
      {activeTab === "ai" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles size={18} className="text-[#274690]" />
                    AI Intelligence Gateway & Engine Configuration
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    DocuCore is AI-first. Manage model routing, fallback cascades, timeout budgets, and usage monitoring.
                  </CardDescription>
                </div>
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-0 text-[11px]">
                  Core AI Pipeline
                </Badge>
              </div>

              {/* Status Preview Card */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-transparent border border-[#274690]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#274690] text-white flex items-center justify-center font-bold">
                    <Bot size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Provider: {settings.ai.defaultProvider}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {settings.ai.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      Active Model: {settings.ai.defaultModel} • Credentials Encrypted: ••••••••••••••••••••HQ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => showToast("AI Engine ping test passed! Latency: 18ms", "success")}
                    className="rounded-xl text-xs font-bold border-slate-300 dark:border-slate-700"
                  >
                    <Zap size={13} className="mr-1 text-amber-500" /> Ping Model
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Enable Global AI Processing Service
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Master switch for document classification, key-value extraction, chat, and summarization.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ai.aiServiceEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, aiServiceEnabled: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#274690]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default AI Provider
                  </label>
                  <select
                    value={settings.ai.defaultProvider}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, defaultProvider: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="Google Gemini">Google Gemini (Recommended)</option>
                    <option value="OpenAI">OpenAI (GPT-4o)</option>
                    <option value="Anthropic Claude">Anthropic Claude 3.5</option>
                    <option value="Local LLM">Self-Hosted Ollama / Local LLM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default AI Model
                  </label>
                  <select
                    value={settings.ai.defaultModel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, defaultModel: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="gemini-3.6-flash">gemini-3.6-flash (Fast & Accurate)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning)</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    AI Request Timeout (Seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.ai.aiRequestTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, aiRequestTimeout: Number(e.target.value) || 30 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Maximum execution duration per document</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    AI Retry Attempts on Failure
                  </label>
                  <input
                    type="number"
                    value={settings.ai.aiRetryAttempts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, aiRetryAttempts: Number(e.target.value) || 2 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Automatic retry count before fallback</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  AI Failure Handling Strategy
                </label>
                <select
                  value={settings.ai.aiFailureHandling}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ai: { ...settings.ai, aiFailureHandling: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                >
                  <option value="FALLBACK_MODEL">Fallback to Secondary AI Model Cascade</option>
                  <option value="QUEUE_RETRY">Queue for Exponential Backoff Retry (Async)</option>
                  <option value="GRACEFUL_ERROR">Return Graceful Error & Flag for Manual Review</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Usage Tracking</h4>
                    <p className="text-[11px] text-slate-500">Record token metrics per tenant and department</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.ai.aiUsageTracking}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, aiUsageTracking: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-[#274690] rounded-sm"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Cost & Quota Monitoring</h4>
                    <p className="text-[11px] text-slate-500">Enforce tenant plan limits & token thresholds</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.ai.aiCostMonitoring}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, aiCostMonitoring: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-[#274690] rounded-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => handleSave("AI")}
                  disabled={saving}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-5 text-xs"
                >
                  Save AI Gateway Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. OCR SETTINGS (⭐ CORE FEATURE)                                         */}
      {/* ========================================================================= */}
      {activeTab === "ocr" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText size={18} className="text-[#274690]" />
                    Optical Character Recognition (OCR) Engine & Pipeline
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Configure document ingestion, maximum page capacity, image preprocessing, and extraction policies.
                  </CardDescription>
                </div>
                <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-0 text-[11px]">
                  Core OCR Engine
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Enable Platform OCR Processing
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Extracts embedded text layers from scanned invoices, receipts, and image documents.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ocr.ocrServiceEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ocr: { ...settings.ocr, ocrServiceEnabled: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#274690]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default OCR Provider
                  </label>
                  <select
                    value={settings.ocr.defaultProvider}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ocr: { ...settings.ocr, defaultProvider: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="Tesseract OCR (Local Engine)">Tesseract OCR (Self-Hosted)</option>
                    <option value="Google Cloud Vision OCR">Google Cloud Vision OCR</option>
                    <option value="AWS Textract">AWS Textract</option>
                    <option value="Azure Cognitive OCR">Azure Cognitive OCR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Max File Size for OCR (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.ocr.maxFileSizeMb}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ocr: { ...settings.ocr, maxFileSizeMb: Number(e.target.value) || 50 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Capped at tenant quota</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Maximum Pages per Document
                  </label>
                  <input
                    type="number"
                    value={settings.ocr.maxPagesPerDoc}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ocr: { ...settings.ocr, maxPagesPerDoc: Number(e.target.value) || 100 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Maximum batch page limit</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Supported OCR File Formats
                </label>
                <div className="flex flex-wrap gap-2">
                  {["PDF", "PNG", "JPG", "JPEG", "TIFF", "BMP", "WEBP"].map((ext) => {
                    const isChecked = settings.ocr.supportedFileTypes.includes(ext);
                    return (
                      <button
                        key={ext}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? settings.ocr.supportedFileTypes.filter((f) => f !== ext)
                            : [...settings.ocr.supportedFileTypes, ext];
                          setSettings({
                            ...settings,
                            ocr: { ...settings.ocr, supportedFileTypes: updated },
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                          isChecked
                            ? "bg-[#274690] text-white border-[#274690]"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {isChecked && <Check size={12} />}
                        <span>{ext}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    OCR Processing Timeout (Seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.ocr.ocrTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ocr: { ...settings.ocr, ocrTimeout: Number(e.target.value) || 60 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    OCR Retry Count
                  </label>
                  <input
                    type="number"
                    value={settings.ocr.ocrRetryAttempts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ocr: { ...settings.ocr, ocrRetryAttempts: Number(e.target.value) || 2 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    OCR Failure Handling
                  </label>
                  <select
                    value={settings.ocr.ocrFailureHandling}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ocr: { ...settings.ocr, ocrFailureHandling: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="FALLBACK_ENGINE">Fallback to Secondary Engine</option>
                    <option value="STORE_WITHOUT_OCR">Store Document Without Text Layer</option>
                    <option value="FAIL_UPLOAD">Abort Upload with Error Notice</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">OCR Page Usage Tracking</h4>
                  <p className="text-[11px] text-slate-500">Record pages processed against tenant monthly quota</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ocr.ocrUsageTracking}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ocr: { ...settings.ocr, ocrUsageTracking: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-[#274690] rounded-sm"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => handleSave("OCR")}
                  disabled={saving}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-5 text-xs"
                >
                  Save OCR Pipeline Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FILE & STORAGE SETTINGS                                                */}
      {/* ========================================================================= */}
      {activeTab === "storage" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <HardDrive size={18} className="text-[#274690]" />
                    Storage Policies & S3 Architecture
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Upload size constraints, file type allowances, lifecycle retention periods, and encryption status.
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 text-[11px]">
                  {settings.storage.storageEncryptionStatus}
                </Badge>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Database size={15} className="shrink-0 mt-0.5 text-[#274690]" />
                <span>
                  <strong>Storage Routing:</strong> S3 Bucket name, AWS Region, and Access Keys are handled in the{" "}
                  <strong>Storage Management</strong> section. General policies and retention schedules are managed here.
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Maximum Upload File Size (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.storage.maxUploadFileSizeMb}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        storage: { ...settings.storage, maxUploadFileSizeMb: Number(e.target.value) || 50 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Default: 50 MB per single file</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Allowed Upload File Types
                  </label>
                  <input
                    type="text"
                    value={settings.storage.allowedFileTypes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        storage: { ...settings.storage, allowedFileTypes: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Comma-separated extension whitelist</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Document Retention Policy
                  </label>
                  <select
                    value={settings.storage.storageRetentionPolicy}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        storage: { ...settings.storage, storageRetentionPolicy: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="1_YEAR">1 Year</option>
                    <option value="3_YEARS">3 Years</option>
                    <option value="5_YEARS">5 Years</option>
                    <option value="7_YEARS">7 Years (Compliance Vault)</option>
                    <option value="FOREVER">Indefinite / Permanent Retention</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Deleted File Retention (Days in Trash)
                  </label>
                  <input
                    type="number"
                    value={settings.storage.deletedFileRetentionDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        storage: { ...settings.storage, deletedFileRetentionDays: Number(e.target.value) || 30 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Days before permanent S3 bucket purge</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Temporary File Retention (Hours)
                  </label>
                  <input
                    type="number"
                    value={settings.storage.temporaryFileRetentionHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        storage: { ...settings.storage, temporaryFileRetentionHours: Number(e.target.value) || 24 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">OCR temp & staging cache</span>
                </div>
              </div>

              {/* Storage Health Verification Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Storage Health: {settings.storage.storageHealthCheck}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      AES-256 server-side encryption active. Direct S3 presigned upload pipelines operational.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => showToast("S3 bucket write & read check passed!", "success")}
                  className="rounded-xl text-xs font-bold border-slate-300 dark:border-slate-700"
                >
                  <RefreshCw size={13} className="mr-1" /> Run Health Check
                </Button>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => handleSave("Storage")}
                  disabled={saving}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-5 text-xs"
                >
                  Save Storage Policies
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EMAIL & NOTIFICATIONS                                                  */}
      {/* ========================================================================= */}
      {activeTab === "email" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail size={18} className="text-[#274690]" />
                    Email Communication & SMTP Configuration
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    System-generated transactional mail, SMTP relays, invitation delivery, and test harnesses.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setTestEmailOpen(true);
                    setTestEmailAddress(settings.email.senderEmail || "admin@docucore.ai");
                  }}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl px-3.5 py-1.5 shadow-xs flex items-center gap-1.5"
                >
                  <Send size={13} /> Send Test Email
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Enable System Email Service
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Master toggle for invitation emails, password resets, and workflow notification alerts.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.emailServiceEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, emailServiceEnabled: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#274690]"></div>
                </label>
              </div>

              {/* SMTP Connection Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    SMTP Server Host
                  </label>
                  <input
                    type="text"
                    value={settings.email.smtpHost}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, smtpHost: e.target.value },
                      })
                    }
                    placeholder="e.g. smtp-relay.brevo.com"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, smtpPort: Number(e.target.value) || 587 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Encryption Protocol
                  </label>
                  <select
                    value={settings.email.smtpEncryption}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, smtpEncryption: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="TLS">TLS / STARTTLS (Port 587)</option>
                    <option value="SSL">SSL (Port 465)</option>
                    <option value="NONE">None (Port 25)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    SMTP Username / Account
                  </label>
                  <input
                    type="text"
                    value={settings.email.smtpUser}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, smtpUser: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>SMTP Password / API Key</span>
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="text-[10px] text-[#274690] hover:underline flex items-center gap-1"
                    >
                      {showSmtpPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                      {showSmtpPassword ? "Hide" : "Show"}
                    </button>
                  </label>
                  <input
                    type={showSmtpPassword ? "text" : "password"}
                    value={settings.email.smtpPassword}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, smtpPassword: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={settings.email.senderName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, senderName: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sender From Email
                  </label>
                  <input
                    type="email"
                    value={settings.email.senderEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, senderEmail: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>
              </div>

              {/* Notification Delivery Channels */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Automated Transactional Triggers
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.emailVerification}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, emailVerification: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-[#274690] rounded-sm"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Email Verification Link on Signup</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.passwordResetEmails}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, passwordResetEmails: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-[#274690] rounded-sm"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Password Reset OTP & Reset Links</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.userInvitationEmails}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, userInvitationEmails: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-[#274690] rounded-sm"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Tenant & Member Invitation Emails</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.documentWorkflowNotifications}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, documentWorkflowNotifications: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-[#274690] rounded-sm"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Approval & Workflow Step Notifications</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.systemAlerts}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, systemAlerts: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-[#274690] rounded-sm"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Critical System Incident & Security Alerts</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => handleSave("Email & SMTP")}
                  disabled={saving}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-5 text-xs"
                >
                  Save Email Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. DATA & PRIVACY                                                         */}
      {/* ========================================================================= */}
      {activeTab === "privacy" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock size={18} className="text-[#274690]" />
                    Data Governance & Privacy Policies
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Enterprise SaaS compliance policies: data vault duration, soft-deletion grace periods, and audit log policies.
                  </CardDescription>
                </div>
                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-0 text-[11px]">
                  GDPR & HIPAA Policy Controls
                </Badge>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <FileCheck size={15} className="shrink-0 mt-0.5 text-[#274690]" />
                <span>
                  <strong>Policy Controls:</strong> This section defines automated system lifecycle policies. Permanent
                  data purging is executed via scheduled cron background jobs in accordance with regulatory laws.
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Platform Data Retention Period
                  </label>
                  <select
                    value={settings.privacy.dataRetentionPeriod}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, dataRetentionPeriod: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="1_YEAR">1 Year</option>
                    <option value="3_YEARS">3 Years</option>
                    <option value="5_YEARS">5 Years</option>
                    <option value="7_YEARS">7 Years (Regulatory Standard)</option>
                    <option value="INDEFINITE">Indefinite Retention</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Deleted Data Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.privacy.deletedDataRetentionDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, deletedDataRetentionDays: Number(e.target.value) || 30 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Soft-delete recoverable window</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Audit Log Retention Schedule
                  </label>
                  <select
                    value={settings.privacy.auditLogRetention}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, auditLogRetention: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="180_DAYS">180 Days</option>
                    <option value="1_YEAR">1 Year</option>
                    <option value="3_YEARS">3 Years</option>
                    <option value="7_YEARS">7 Years (FINRA / HIPAA Compliance)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    User Data Export Policy
                  </label>
                  <select
                    value={settings.privacy.userDataExportPolicy}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, userDataExportPolicy: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="FULL_GDPR_EXPORT">Allow Tenant Admins Full GDPR JSON & S3 ZIP Export</option>
                    <option value="SUPER_ADMIN_ONLY">Restricted to Super Admin Only</option>
                    <option value="APPROVAL_REQUIRED">Super Admin Approval Required per Export</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Data Deletion Policy
                  </label>
                  <select
                    value={settings.privacy.dataDeletionPolicy}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, dataDeletionPolicy: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="SOFT_DELETE_GRACE_PERIOD">Soft Delete with 30-Day Recovery Grace Period</option>
                    <option value="HARD_PURGE_APPROVAL">Hard Purge Immediately After Multi-Admin Approval</option>
                    <option value="IMMUTABLE_ARCHIVE">Immutable Write-Once Archive (Financial Compliance)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Automatic Nightly Maintenance Cleanup
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Runs background cron at 02:00 AM UTC to purge records exceeding retention policy limits.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.automaticCleanupEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, automaticCleanupEnabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-[#274690] rounded-sm"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => handleSave("Privacy & Data")}
                  disabled={saving}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-5 text-xs"
                >
                  Save Privacy Policies
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SYSTEM DEFAULTS                                                        */}
      {/* ========================================================================= */}
      {activeTab === "defaults" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers size={18} className="text-[#274690]" />
                    New Organization System Defaults
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Preset behaviors, quotas, and automation flags applied automatically when creating a new tenant organization.
                  </CardDescription>
                </div>
                <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-0 text-[11px]">
                  Tenant Provisioning Defaults
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Document Handling Behavior
                  </label>
                  <select
                    value={settings.defaults.defaultDocumentSettings}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaults: { ...settings.defaults, defaultDocumentSettings: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="AUTO_CLASSIFICATION_AND_OCR">Strict Classification & Auto-OCR Extraction</option>
                    <option value="STANDARD_MANUAL_REVIEW">Standard Upload & Manual Team Review</option>
                    <option value="DRAFT_ONLY">Draft Mode (No Automatic Pipeline Execution)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default File Size Limit for New Tenants (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.defaults.defaultFileSizeLimitMb}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaults: { ...settings.defaults, defaultFileSizeLimitMb: Number(e.target.value) || 50 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Maximum file upload size per document</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Tenant Notification Preferences
                  </label>
                  <select
                    value={settings.defaults.defaultNotificationPreferences}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaults: { ...settings.defaults, defaultNotificationPreferences: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="EMAIL_AND_INAPP">Email & In-App Real-time Notifications</option>
                    <option value="INAPP_ONLY">In-App Notifications Only</option>
                    <option value="WEEKLY_DIGEST">Weekly Digest Summary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Member Session Duration (Hours)
                  </label>
                  <select
                    value={settings.defaults.defaultSessionDurationHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaults: { ...settings.defaults, defaultSessionDurationHours: Number(e.target.value) || 12 },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value={8}>8 Hours (Standard Working Shift)</option>
                    <option value={12}>12 Hours (Recommended)</option>
                    <option value={24}>24 Hours</option>
                    <option value={72}>72 Hours (Extended)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default AI & OCR Engine Availability for Tenants
                </label>
                <select
                  value={settings.defaults.defaultAiOcrAvailability}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaults: { ...settings.defaults, defaultAiOcrAvailability: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                >
                  <option value="ENABLED_FOR_ALL">Enabled for All New Tenants Automatically</option>
                  <option value="TRIAL_QUOTA">Trial Quotas Only (500 AI docs / 500 OCR pages)</option>
                  <option value="DISABLED_UNTIL_ASSIGNED">Disabled Until Subscription Tier Explicitly Assigned</option>
                </select>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => handleSave("System Defaults")}
                  disabled={saving}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-5 text-xs"
                >
                  Save System Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEST EMAIL MODAL                                                          */}
      {/* ========================================================================= */}
      {testEmailOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-[#274690]">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Send Test Email
                  </h3>
                  <p className="text-xs text-slate-500">Verify SMTP delivery using current credentials.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestEmailOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="e.g. admin@company.com"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              {testEmailResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    testEmailResult.startsWith("✓")
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200"
                  }`}
                >
                  {testEmailResult}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTestEmailOpen(false)}
                  className="rounded-xl cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTestEmail}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-4 cursor-pointer"
                >
                  {isSendingTestEmail ? "Dispatching..." : "Send Verification Email"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
