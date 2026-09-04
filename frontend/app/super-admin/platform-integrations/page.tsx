"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Settings,
  RotateCw,
  Activity,
  Layers,
  Users,
  Eye,
  EyeOff,
  Cloud,
  Mail,
  Smartphone,
  Check,
  Copy,
  Info,
} from "lucide-react";
import integrationsApi, {
  type PlatformProviderMeta,
  DEFAULT_PLATFORM_INTEGRATIONS,
} from "@/services/integrationsApi";

export default function SuperAdminPlatformIntegrationsPage() {
  const [providers, setProviders] = useState<PlatformProviderMeta[]>(DEFAULT_PLATFORM_INTEGRATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Configuration Modal State
  const [selectedProvider, setSelectedProvider] = useState<PlatformProviderMeta | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [modalTestResult, setModalTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await integrationsApi.getPlatformIntegrations();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setProviders(res.data);
      }
    } catch (err: any) {
      console.warn("Notice loading platform integrations:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (provider: PlatformProviderMeta) => {
    setActionLoading(provider.id);
    try {
      const res = await integrationsApi.togglePlatformIntegration(provider.id, !provider.isEnabled);
      if (res.success) {
        showToast(`✓ ${provider.name} ${!provider.isEnabled ? "Enabled" : "Disabled"}`);
        loadData(true);
      }
    } catch (err: any) {
      showToast(err.message || "Toggle failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenConfigModal = (provider: PlatformProviderMeta) => {
    setSelectedProvider(provider);
    setModalTestResult(null);

    // Populate initial form state from existing configuration
    const initialData: Record<string, any> = {};

    if (provider.redirectUri) initialData.redirectUri = provider.redirectUri;

    // Structured settings
    if (provider.settings && typeof provider.settings === "object") {
      Object.entries(provider.settings).forEach(([k, v]) => {
        initialData[k] = v;
      });
    }

    // Set defaults from configFields
    if (provider.configFields) {
      provider.configFields.forEach((field) => {
        if (initialData[field.key] === undefined && field.default !== undefined) {
          initialData[field.key] = field.default;
        }
      });
    }

    setFormData(initialData);
    setVisibleSecrets({});
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSecretVisibility = (key: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast("✓ Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestInModal = async () => {
    if (!selectedProvider) return;
    setActionLoading("modal_test");
    setModalTestResult(null);
    try {
      const res = await integrationsApi.testPlatformIntegration(selectedProvider.id);
      if (res.success) {
        setModalTestResult({ success: true, message: res.message || "✓ Platform configuration test passed!" });
      } else {
        setModalTestResult({ success: false, message: res.message || "Connection test failed." });
      }
    } catch (err: any) {
      setModalTestResult({ success: false, message: err.message || "Connection test failed." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    setActionLoading("save_config");

    const topLevelPayload: any = {
      isEnabled: true,
    };

    const settingsPayload: Record<string, any> = {};

    if (selectedProvider.configFields) {
      selectedProvider.configFields.forEach((field) => {
        const val = formData[field.key];
        if (field.key === "clientId") {
          topLevelPayload.clientId = val || undefined;
        } else if (field.key === "clientSecret") {
          topLevelPayload.clientSecret = val || undefined;
        } else if (field.key === "redirectUri") {
          topLevelPayload.redirectUri = val || undefined;
        } else if (field.key === "tenantId") {
          topLevelPayload.tenantId = val || undefined;
        } else if (field.key === "allowedScopes") {
          topLevelPayload.allowedScopes = Array.isArray(val) ? val : [];
        } else {
          if (val !== undefined && val !== "") {
            settingsPayload[field.key] = val;
          }
        }
      });
    }

    if (Object.keys(settingsPayload).length > 0) {
      topLevelPayload.settings = settingsPayload;
    }

    try {
      const res = await integrationsApi.updatePlatformConfig(selectedProvider.id, topLevelPayload);

      if (res.success) {
        showToast(`✓ ${selectedProvider.name} platform credentials saved securely in AES-256 vault!`);
        setSelectedProvider(null);
        loadData(true);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save configuration");
    } finally {
      setActionLoading(null);
    }
  };

  const totalConnected = providers.reduce((acc, p) => acc + (p.connectedTenantsCount || 0), 0);
  const activeCount = providers.filter((p) => p.status === "ACTIVE" && p.isEnabled).length;

  const getProviderIcon = (provider: PlatformProviderMeta) => {
    if (provider.icon) {
      return (
        <img
          src={provider.icon}
          alt={provider.name}
          className="h-9 w-9 rounded-lg object-contain p-1 border border-slate-100 bg-slate-50"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      );
    }
    if (provider.id === "SMTP_EMAIL") return <Mail className="h-9 w-9 text-indigo-600 p-1.5 bg-indigo-50 rounded-lg" />;
    if (provider.id === "WHATSAPP_BUSINESS") return <Smartphone className="h-9 w-9 text-emerald-600 p-1.5 bg-emerald-50 rounded-lg" />;
    if (provider.id === "AWS_S3") return <Cloud className="h-9 w-9 text-amber-600 p-1.5 bg-amber-50 rounded-lg" />;
    return <Layers className="h-9 w-9 text-slate-600 p-1.5 bg-slate-50 rounded-lg" />;
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-all">
          {toastMessage}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-indigo-700">
                <Server size={13} /> Platform Integrations Control Plane
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <ShieldCheck size={11} /> AES-256 Vault
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              Platform OAuth & Provider Infrastructure
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadData();
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Sync & Refresh
          </button>
        </div>

        {/* Quick Metric Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Total Providers</p>
              <p className="text-xl font-black text-slate-900">{providers.length}</p>
            </div>
            <Layers className="text-slate-400" size={24} />
          </div>
          <div className="rounded-xl bg-emerald-50/60 p-3.5 border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Active & Configured</p>
              <p className="text-xl font-black text-emerald-900">{activeCount}</p>
            </div>
            <CheckCircle2 className="text-emerald-500" size={24} />
          </div>
          <div className="rounded-xl bg-blue-50/60 p-3.5 border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-700 uppercase">Connected Tenant Vaults</p>
              <p className="text-xl font-black text-blue-900">{totalConnected}</p>
            </div>
            <Users className="text-blue-500" size={24} />
          </div>
        </div>
      </div>

      {/* Providers Grid */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-xs text-slate-400">
          <RotateCw size={16} className="animate-spin text-indigo-600 mr-2" /> Loading platform integrations...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {providers.map((p) => {
            const isEnabled = p.isEnabled;
            const isLoadingThis = actionLoading === p.id;

            return (
              <div
                key={p.id}
                className={`rounded-2xl border bg-white p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isEnabled ? "border-slate-200" : "border-slate-200 bg-slate-50/50 opacity-70"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {getProviderIcon(p)}
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">{p.name}</h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {p.category} • {p.authType}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggle(p)}
                      disabled={isLoadingThis}
                      className={`text-xs transition-all ${
                        isEnabled ? "text-indigo-600 hover:text-indigo-700" : "text-slate-400 hover:text-slate-500"
                      }`}
                      title={isEnabled ? "Disable Provider" : "Enable Provider"}
                    >
                      {isEnabled ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600">{p.description}</p>

                  {/* Status Badges */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        p.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "DISABLED"
                          ? "bg-slate-100 text-slate-500"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.status === "ACTIVE" ? (
                        <>
                          <CheckCircle2 size={10} /> Configured & Live
                        </>
                      ) : p.status === "DISABLED" ? (
                        "Disabled"
                      ) : (
                        <>
                          <AlertCircle size={10} /> Setup Required
                        </>
                      )}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      <Users size={10} /> {p.connectedTenantsCount} Tenants
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      <Activity size={10} /> {p.healthStatus}
                    </span>
                  </div>

                  {/* Vault Indicator */}
                  <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Vault Status:</span>
                      <span className="font-semibold text-slate-700">
                        {p.hasClientSecret ? "Encrypted (AES-256)" : p.clientIdMasked ? "Partially Configured" : "Not Configured"}
                      </span>
                    </div>
                    {p.clientIdMasked && (
                      <div className="flex items-center justify-between text-slate-500">
                        <span>App ID / Client:</span>
                        <span className="font-mono text-[10px] text-slate-700">{p.clientIdMasked}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenConfigModal(p)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 shadow-xs"
                  >
                    <Settings size={12} /> Configure Credentials
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setActionLoading(`test_${p.id}`);
                      try {
                        const res = await integrationsApi.testPlatformIntegration(p.id);
                        showToast(res.success ? `✓ ${p.name} verified!` : res.message || "Test failed");
                      } catch (err: any) {
                        showToast(`Notice: ${err.message}`);
                      } finally {
                        setActionLoading(null);
                      }
                    }}
                    disabled={actionLoading === `test_${p.id}`}
                    className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {actionLoading === `test_${p.id}` ? "Testing..." : "Test"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DYNAMIC CONFIGURATION MODAL */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                {getProviderIcon(selectedProvider)}
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Configure {selectedProvider.name} Platform Credentials
                  </h3>
                  <p className="text-xs text-slate-500">
                    All credentials are encrypted with AES-256-GCM before being stored in PostgreSQL.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Setup Guide Callout */}
            {selectedProvider.setupGuide && (
              <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 text-xs text-blue-900 flex items-start gap-2">
                <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <span>{selectedProvider.setupGuide}</span>
              </div>
            )}

            {/* Test Connection Banner (if tested) */}
            {modalTestResult && (
              <div
                className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 border ${
                  modalTestResult.success
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-rose-50 text-rose-900 border-rose-200"
                }`}
              >
                {modalTestResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{modalTestResult.message}</span>
              </div>
            )}

            {/* Dynamic Form based on configFields */}
            <form onSubmit={handleSaveConfig} className="space-y-4">
              {selectedProvider.configFields && selectedProvider.configFields.length > 0 ? (
                selectedProvider.configFields.map((field) => {
                  const val = formData[field.key] !== undefined ? formData[field.key] : "";
                  const isSecret = field.type === "password";
                  const isVisible = visibleSecrets[field.key] || false;

                  return (
                    <div key={field.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-700">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        {isSecret && (
                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility(field.key)}
                            className="text-[10px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            {isVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                            {isVisible ? "Hide" : "Show"}
                          </button>
                        )}
                      </div>

                      {field.type === "readonly" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={val || field.default || ""}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-mono text-slate-700 select-all focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopyText(field.key, val || field.default || "")}
                            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            {copiedKey === field.key ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            {copiedKey === field.key ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ) : field.type === "select" ? (
                        <select
                          value={val || field.default || ""}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                        >
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "boolean" ? (
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                            className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-slate-700 font-medium">{field.label}</span>
                        </label>
                      ) : field.type === "tags" ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-1.5">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(val) && val.length > 0 ? (
                              val.map((scope: string) => (
                                <span
                                  key={scope}
                                  className="rounded-md bg-indigo-100/80 px-2 py-0.5 text-[10px] font-mono text-indigo-800 font-semibold"
                                >
                                  {scope}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400">Default scopes configured</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <input
                          type={isSecret && !isVisible ? "password" : "text"}
                          placeholder={field.placeholder || `Enter ${field.label}...`}
                          value={val}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono text-slate-900 focus:border-indigo-600 focus:outline-none"
                        />
                      )}

                      {field.helpText && <p className="text-[10px] text-slate-400">{field.helpText}</p>}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                  No configurable parameters required for this provider.
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestInModal}
                  disabled={actionLoading === "modal_test"}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RotateCw size={13} className={actionLoading === "modal_test" ? "animate-spin" : ""} />
                  {actionLoading === "modal_test" ? "Testing..." : "Test Connection"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === "save_config"}
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ShieldCheck size={14} />
                    {actionLoading === "save_config" ? "Saving..." : "Save & Encrypt"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
